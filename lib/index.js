/**
 * dsh-client-bili-watch — host half.
 *
 * One same-origin JSON proxy route for the client bundle:
 *
 * - GET /dsh-bili/api?u=<encoded api url>   JSON proxy to api.bilibili.com
 *   (the browser cannot call it directly — it answers 403 to cross-origin
 *   requests). Used to load the real homepage recommendation feed (rcmd),
 *   which needs a buvid3 cookie: a fresh one is minted per request.
 */
import { randomUUID } from "node:crypto";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function buvid3() {
  return `buvid3=${randomUUID().toUpperCase()}infoc`;
}

export const inject = ["webServer"];

export function apply(ctx) {
  const webServer = ctx.webServer;
  if (webServer === undefined) return;

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
        const r = await fetch(u, {
          headers: {
            "User-Agent": UA,
            Referer: "https://www.bilibili.com/",
            Cookie: buvid3(),
          },
          redirect: "follow",
        });
        const text = await r.text();
        res.writeHead(r.status, { "content-type": "application/json; charset=utf-8" });
        res.end(text);
      } catch (e) {
        res.writeHead(502);
        res.end("proxy error: " + String((e && e.message) || e));
      }
    },
  });
}
