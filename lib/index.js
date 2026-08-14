/**
 * dsh-client-bili-watch — host half.
 *
 * Two same-origin proxy routes for the client bundle:
 *
 * - GET /dsh-bili/api?u=<encoded api url>   JSON proxy to api.bilibili.com
 *   (the browser cannot call it directly — it answers 403 to cross-origin
 *   requests, so JSON and video requests must go through the host).
 *
 * - GET /dsh-bili/media?u=<encoded stream> Video stream proxy to the
 *   Bilibili CDN. The CDN requires a bilibili Referer and a real browser
 *   User-Agent; a <video> element cannot set headers, so the host fetches
 *   with the right headers and streams back, forwarding Range so the player
 *   can seek and resume from an exact position.
 *
 * The stream proxy only forwards to known Bilibili CDN hosts to avoid
 * turning the plugin into an open HTTP proxy.
 */
import { Readable } from "node:stream";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const BILI_HEADERS = {
  "User-Agent": UA,
  Referer: "https://www.bilibili.com",
};

/** Hostname markers of Bilibili CDN hosts the stream proxy will forward. */
const CDN_MARKERS = ["bilivideo", "mountaintoys", "hdslb"];

function queryOf(reqUrl) {
  try {
    const u = new URL(reqUrl, "http://localhost");
    return u.searchParams;
  } catch {
    return null;
  }
}

function isCdnUrl(url) {
  try {
    const host = new URL(url).host;
    return CDN_MARKERS.some((m) => host.includes(m));
  } catch {
    return false;
  }
}

export const inject = ["webServer"];

export function apply(ctx) {
  const webServer = ctx.webServer;
  if (webServer === undefined) return;

  // JSON API proxy.
  webServer.register({
    kind: "prefix",
    path: "/dsh-bili/api",
    handler: async (req, res) => {
      try {
        const u = queryOf(req.url)?.get("u");
        if (!u) {
          res.writeHead(400);
          res.end("missing u");
          return;
        }
        const r = await fetch(u, { headers: BILI_HEADERS, redirect: "follow" });
        const text = await r.text();
        res.writeHead(r.status, { "content-type": "application/json; charset=utf-8" });
        res.end(text);
      } catch (e) {
        res.writeHead(502);
        res.end("proxy error: " + String((e && e.message) || e));
      }
    },
  });

  // Video stream proxy (Range-aware).
  webServer.register({
    kind: "prefix",
    path: "/dsh-bili/media",
    handler: async (req, res) => {
      try {
        const u = queryOf(req.url)?.get("u");
        if (!u) {
          res.writeHead(400);
          res.end("missing u");
          return;
        }
        if (!isCdnUrl(u)) {
          res.writeHead(403);
          res.end("forbidden host");
          return;
        }
        const headers = { ...BILI_HEADERS };
        if (req.headers.range) headers.Range = String(req.headers.range);
        const r = await fetch(u, { headers, redirect: "follow" });
        const out = {
          "content-type": r.headers.get("content-type") || "video/mp4",
          "accept-ranges": "bytes",
        };
        const cl = r.headers.get("content-length");
        if (cl) out["content-length"] = cl;
        const cr = r.headers.get("content-range");
        if (cr) out["content-range"] = cr;
        res.writeHead(r.status, out);
        if (r.body) {
          for await (const chunk of Readable.fromWeb(r.body)) res.write(chunk);
        }
        res.end();
      } catch (e) {
        try {
          if (!res.writableEnded) {
            res.writeHead(502);
            res.end("stream error");
          }
        } catch {
          /* response already gone */
        }
      }
    },
  });
}
