/**
 * dsh-client-bili-watch — host half.
 *
 * Two same-origin proxy routes for the client bundle (the browser cannot
 * call Bilibili directly — its API answers 403 to cross-origin requests and
 * the video CDN requires a bilibili Referer):
 *
 * - GET /dsh-bili/api?u=<encoded api url>   JSON proxy to api.bilibili.com
 *   (homepage recommend feed, video info, playurl, related). A fresh buvid3
 *   cookie is minted per request so the rcmd feed works without login.
 *
 * - GET /dsh-bili/media?u=<encoded stream>  Video stream proxy to the
 *   Bilibili CDN, forwarding Range so the native player can seek and resume
 *   at an exact position. Only known Bilibili CDN hosts are forwarded.
 */
import { Readable } from "node:stream";
import { randomUUID, createHash } from "node:crypto";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const BILI_HEADERS = {
  "User-Agent": UA,
  Referer: "https://www.bilibili.com/",
};

/** Hostname markers of Bilibili CDN hosts the stream proxy will forward. */
const CDN_MARKERS = ["bilivideo", "mountaintoys", "hdslb"];

function buvid3() {
  return `buvid3=${randomUUID().toUpperCase()}infoc`;
}

// ---- wbi 签名（搜索接口需要）----
const MIXIN_TABLE = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];

function getMixinKey(orig) {
  return MIXIN_TABLE.map((n) => orig[n]).join("").slice(0, 32);
}

let wbiKeysCache = null;

async function wbiKeys() {
  const now = Date.now();
  if (wbiKeysCache && now - wbiKeysCache.at < 6 * 3600 * 1000) return wbiKeysCache;
  const r = await fetch("https://api.bilibili.com/x/web-interface/nav", {
    headers: { ...BILI_HEADERS, Cookie: buvid3() },
  });
  const j = await r.json();
  const imgUrl = j.data && j.data.wbi_img && j.data.wbi_img.img_url;
  const subUrl = j.data && j.data.wbi_img && j.data.wbi_img.sub_url;
  const key = (u) => (u || "").split("/").pop().split(".")[0];
  wbiKeysCache = { img: key(imgUrl), sub: key(subUrl), at: now };
  return wbiKeysCache;
}

/** 与 URLSearchParams 完全一致的编码（space -> +, ~ ! ( ) -> %XX, * 保留） */
function wbiEnc(v) {
  return encodeURIComponent(v)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/[!()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function wbiSign(params, img, sub) {
  const mixin = getMixinKey(img + sub);
  params.wts = Math.round(Date.now() / 1000);
  const clean = {};
  for (const k of Object.keys(params).sort()) {
    if (/^w_/.test(k)) continue;
    clean[k] = String(params[k]).replace(/[!'()*]/g, "");
  }
  const query = Object.keys(clean)
    .sort()
    .map((k) => k + "=" + wbiEnc(clean[k]))
    .join("&");
  const wRid = createHash("md5").update(query + mixin).digest("hex");
  return query + "&w_rid=" + wRid;
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
        const u = new URL(req.url, "http://localhost").searchParams.get("u");
        if (!u) {
          res.writeHead(400);
          res.end("missing u");
          return;
        }
        const r = await fetch(u, { headers: { ...BILI_HEADERS, Cookie: buvid3() }, redirect: "follow" });
        const text = await r.text();
        res.writeHead(r.status, { "content-type": "application/json; charset=utf-8" });
        res.end(text);
      } catch (e) {
        res.writeHead(502);
        res.end("proxy error: " + String((e && e.message) || e));
      }
    },
  });

  // Danmaku proxy: list.so returns gzip-compressed XML; fetch() auto-decompresses.
  webServer.register({
    kind: "prefix",
    path: "/dsh-bili/dm",
    handler: async (req, res) => {
      try {
        const u = new URL(req.url, "http://localhost").searchParams.get("u");
        if (!u) {
          res.writeHead(400);
          res.end("missing u");
          return;
        }
        const r = await fetch(u, { headers: { ...BILI_HEADERS, Cookie: buvid3() }, redirect: "follow" });
        const text = await r.text();
        res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ code: 0, xml: text }));
      } catch (e) {
        res.writeHead(502);
        res.end("dm error: " + String((e && e.message) || e));
      }
    },
  });

  // wbi 签名搜索。
  webServer.register({
    kind: "prefix",
    path: "/dsh-bili/search",
    handler: async (req, res) => {
      try {
        const p = new URL(req.url, "http://localhost").searchParams;
        const kw = String(p.get("kw") || "").trim();
        const page = Math.max(1, Math.floor(Number(p.get("page")) || 1));
        if (!kw) {
          res.writeHead(400);
          res.end("missing kw");
          return;
        }
        const keys = await wbiKeys();
        const query = wbiSign(
          { search_type: "video", keyword: kw, page, page_size: 20 },
          keys.img,
          keys.sub
        );
        const url = "https://api.bilibili.com/x/web-interface/wbi/search/type?" + query;
        const r = await fetch(url, {
          headers: { ...BILI_HEADERS, Cookie: buvid3() },
          redirect: "follow",
        });
        const text = await r.text();
        res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        res.end(text);
      } catch (e) {
        res.writeHead(502);
        res.end("search error: " + String((e && e.message) || e));
      }
    },
  });

  // Video stream proxy (Range-aware).
  webServer.register({
    kind: "prefix",
    path: "/dsh-bili/media",
    handler: async (req, res) => {
      try {
        const u = new URL(req.url, "http://localhost").searchParams.get("u");
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
