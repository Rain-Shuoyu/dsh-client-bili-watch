/**
 * dsh-client-bili-watch — client bundle
 *
 * Served by the DSH web server from the package's `./client` export and
 * loaded through `window.__ModuleLoader__`. The factory is plain CJS-style
 * JavaScript (no build step): it receives the app's require and returns the
 * plugin module `{ inject, apply }`.
 *
 * Behavior: a floating bottom-right Bilibili panel for the DeepSeek
 * conversation, with two modes:
 *
 * - 「网页」site mode (default): embeds the full www.bilibili.com site in an
 *   iframe, so you can log in with your own account and use your
 *   personalized home feed, search, danmaku and HD playback. Cross-origin
 *   means the page cannot be paused programmatically — when the agent needs
 *   you the iframe is stopped (unmounted) and restored when you continue.
 *
 * - 「播放器」player mode: native <video> playback through the host's stream
 *   proxy (/dsh-bili/media), with a ranking home feed, related videos and
 *   exact pause/resume at the current position.
 *
 * When the agent needs you (approval / question / plan review) or stops
 * (completed / blocked / errored) the media pauses/stops and a reminder is
 * shown so you can return to the chat.
 */
window.__ModuleLoader__.load({
  id: "dsh-client-bili-watch",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");

    /** Cordis client services this plugin needs. */
    const inject = ["slots"];

    const CSS = `
      .bw-layer { position: fixed; inset: 0; pointer-events: none; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
      .bw-toast { position: fixed; top: 18px; left: 50%; transform: translateX(-50%); pointer-events: auto; background: rgba(24,26,32,.95); color: #fff; border: 1px solid rgba(255,255,255,.16); border-radius: 12px; padding: 10px 16px; font-size: 13px; box-shadow: 0 10px 34px rgba(0,0,0,.5); display: flex; align-items: center; gap: 12px; cursor: pointer; z-index: 10001; animation: bwPop .25s ease; backdrop-filter: blur(10px); }
      .bw-toast-cta { color: #7aa2ff; font-weight: 600; }
      .bw-pill { position: fixed; right: 18px; bottom: 18px; pointer-events: auto; background: rgba(24,26,32,.95); color: #fff; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; padding: 9px 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 8px 28px rgba(0,0,0,.4); z-index: 10001; backdrop-filter: blur(10px); }
      .bw-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      .bw-dot.bw-badge-run { background: #3fb950; box-shadow: 0 0 6px #3fb950; }
      .bw-dot.bw-badge-idle { background: #8b949e; }
      .bw-dot.bw-badge-warn { background: #f85149; box-shadow: 0 0 8px #f85149; animation: bwBlink 1s infinite; }
      .bw-panel { position: fixed; right: 18px; bottom: 18px; width: 430px; pointer-events: auto; background: rgba(24,26,32,.97); color: #fff; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,.55); z-index: 10001; overflow: hidden; backdrop-filter: blur(10px); display: flex; flex-direction: column; }
      .bw-panel-site { width: max(300px, min(720px, calc(100vw - 36px), calc((100vh - 150px) * 1.7778))); }
      .bw-panel-hidden { display: none; }
      .bw-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.08); }
      .bw-title { font-weight: 600; font-size: 14px; flex: 1; white-space: nowrap; }
      .bw-modes { display: flex; gap: 6px; }
      .bw-badge { font-size: 12px; padding: 2px 8px; border-radius: 999px; }
      .bw-badge-run { background: rgba(63,185,80,.18); color: #56d364; }
      .bw-badge-idle { background: rgba(139,148,158,.18); color: #a7b0ba; }
      .bw-badge-warn { background: rgba(248,81,73,.2); color: #ff7b72; animation: bwBlink 1.2s infinite; }
      .bw-btn { background: rgba(255,255,255,.08); color: #fff; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
      .bw-btn:hover { background: rgba(255,255,255,.14); }
      .bw-btn-primary { background: #fb7299; border-color: #fb7299; color: #fff; }
      .bw-btn-primary:hover { background: #ff8aa8; }
      .bw-btn-ghost { border: none; background: transparent; color: #8b949e; padding: 2px 8px; font-size: 14px; }
      .bw-wrap { position: relative; }
      .bw-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; max-height: 62vh; overflow-y: auto; }
      .bw-tabrow { display: flex; align-items: center; gap: 8px; }
      .bw-tab { font-size: 13px; padding: 4px 12px; border-radius: 999px; background: rgba(255,255,255,.06); color: #c9d1d9; border: 1px solid rgba(255,255,255,.1); }
      .bw-tab-active { background: #fb7299; border-color: #fb7299; color: #fff; }
      .bw-refresh { margin-left: auto; font-size: 12px; padding: 4px 10px; }
      .bw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .bw-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; overflow: hidden; cursor: pointer; text-align: left; padding: 0; color: #fff; display: block; }
      .bw-card:hover { border-color: rgba(255,255,255,.25); }
      .bw-card-pic { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #000; }
      .bw-card-title { font-size: 12px; line-height: 1.35; padding: 6px 8px 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px; }
      .bw-card-meta { font-size: 11px; color: #8b949e; padding: 0 8px 8px; }
      .bw-player { width: 100%; aspect-ratio: 16/9; border-radius: 8px; background: #000; }
      .bw-vtitle { font-size: 13px; font-weight: 600; line-height: 1.4; }
      .bw-vmeta { font-size: 11px; color: #8b949e; }
      .bw-related { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
      .bw-rel { width: 132px; flex: none; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 8px; overflow: hidden; cursor: pointer; padding: 0; color: #fff; text-align: left; }
      .bw-rel:hover { border-color: rgba(255,255,255,.25); }
      .bw-rel-pic { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
      .bw-rel-title { font-size: 11px; line-height: 1.3; padding: 4px 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .bw-loading { color: #8b949e; font-size: 13px; text-align: center; padding: 24px 0; }
      .bw-error { color: #ff7b72; font-size: 12px; padding: 12px; background: rgba(248,81,73,.08); border-radius: 8px; }
      .bw-open { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border-top: 1px solid rgba(255,255,255,.08); }
      .bw-input { flex: 1; min-width: 160px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.14); color: #fff; border-radius: 8px; padding: 8px 10px; font-size: 13px; outline: none; }
      .bw-input:focus { border-color: #fb7299; }
      .bw-site-wrap { display: flex; flex-direction: column; }
      .bw-site { width: 100%; aspect-ratio: 16 / 9; border: 0; background: #fff; display: block; }
      .bw-site-stopped { width: 100%; aspect-ratio: 16 / 9; display: flex; align-items: center; justify-content: center; color: #8b949e; font-size: 13px; background: rgba(0,0,0,.3); }
      .bw-site-hint { font-size: 11px; color: #8b949e; padding: 8px 12px; }
      .bw-attention { position: absolute; inset: 0; background: rgba(18,20,26,.93); z-index: 5; display: flex; flex-direction: column; gap: 10px; justify-content: center; padding: 16px; backdrop-filter: blur(6px); }
      .bw-attn-text { font-size: 14px; font-weight: 600; color: #ff7b72; }
      .bw-msg { font-size: 12px; color: #c9d1d9; background: rgba(255,255,255,.05); border-radius: 8px; padding: 8px 10px; word-break: break-all; }
      .bw-stopped { background: rgba(0,0,0,.4); border: 1px dashed rgba(255,255,255,.2); border-radius: 8px; padding: 14px; text-align: center; }
      .bw-stopped-title { font-size: 13px; font-weight: 600; }
      .bw-stopped-hint { font-size: 12px; color: #8b949e; margin-top: 4px; }
      .bw-row { display: flex; gap: 8px; }
      @keyframes bwPop { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      @keyframes bwBlink { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
    `;

    const REASON_TEXT = {
      approval: "agent 正在请求权限审批",
      question: "agent 正在向你提问",
      "plan-review": "agent 正在等待方案确认",
      ended: "agent 任务已结束（完成 / 阻塞 / 出错），请回到对话查看",
    };

    /** JSON proxy call: same-origin, host fetches api.bilibili.com server-side. */
    async function biliApi(url) {
      const r = await fetch("/dsh-bili/api?u=" + encodeURIComponent(String(url)));
      return r.json();
    }

    function https(u) {
      return u && typeof u === "string" && u.indexOf("http://") === 0 ? "https://" + u.slice(7) : u;
    }

    function fmtCount(n) {
      if (n == null) return "";
      return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "万" : String(n);
    }

    function parseBili(input) {
      const s = String(input == null ? "" : input).trim();
      const m = s.match(/BV[0-9A-Za-z]{8,14}/);
      if (!m) return null;
      const pageMatch = s.match(/[?&#](?:p|page)=(\d+)/);
      return { bvid: m[0], page: pageMatch ? Math.max(1, Number(pageMatch[1])) : 1 };
    }

    function normalizeItem(it) {
      return {
        bvid: it.bvid,
        title: it.title,
        pic: https(it.pic),
        up: it.owner && it.owner.name,
        view: it.stat && it.stat.view,
        duration: it.duration,
      };
    }

    function BiliWatch(props) {
      const useSessions = props.useSessions;
      const [open, setOpen] = React.useState(true);
      const [mode, setMode] = React.useState("site");
      const [siteUrl, setSiteUrl] = React.useState("https://www.bilibili.com/");
      const [tab, setTab] = React.useState("feed");
      const [feed, setFeed] = React.useState(null);
      const [feedError, setFeedError] = React.useState("");
      const [video, setVideo] = React.useState(null);
      const [related, setRelated] = React.useState([]);
      const [input, setInput] = React.useState("");
      const [attention, setAttention] = React.useState(null);
      const [toast, setToast] = React.useState(null);

      const videoRef = React.useRef(null);
      const prevRunning = React.useRef(false);
      const firedKey = React.useRef(null);

      const sessions = useSessions((s) => s);
      const currentId = sessions ? sessions.current : undefined;
      const summary = currentId && sessions ? sessions.byId[currentId] : undefined;

      // Toast auto-hide.
      React.useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 8000);
        return () => clearTimeout(t);
      }, [toast]);

      // Load the home feed (player mode).
      const loadFeed = React.useCallback(() => {
        let alive = true;
        setFeed(null);
        setFeedError("");
        biliApi("https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all")
          .then((res) => {
            if (!alive) return;
            const list = res && res.code === 0 && res.data && res.data.list;
            if (Array.isArray(list)) setFeed(list.map(normalizeItem));
            else setFeedError("推荐加载失败");
          })
          .catch((e) => {
            if (alive) setFeedError("推荐加载失败：" + String((e && e.message) || e));
          });
        return () => {
          alive = false;
        };
      }, []);

      React.useEffect(() => loadFeed(), [loadFeed]);

      const loadVideo = React.useCallback(async (bvid, page) => {
        try {
          const view = await biliApi("https://api.bilibili.com/x/web-interface/view?bvid=" + bvid);
          if (!view || view.code !== 0 || !view.data) throw new Error("视频信息获取失败");
          const d = view.data;
          const cid = page && d.pages && d.pages.length ? (d.pages[page - 1] || d.pages[0]).cid : d.cid;
          const pl = await biliApi(
            "https://api.bilibili.com/x/player/playurl?bvid=" + bvid + "&cid=" + cid + "&qn=64&fnval=0",
          );
          const du = pl && pl.code === 0 && pl.data && pl.data.durl && pl.data.durl[0];
          if (!du || !du.url) throw new Error("播放地址获取失败");
          setVideo({
            bvid,
            title: d.title,
            pic: https(d.pic),
            up: d.owner && d.owner.name,
            src: "/dsh-bili/media?u=" + encodeURIComponent(du.url),
          });
          setTab("player");
          setAttention(null);
          const rel = await biliApi("https://api.bilibili.com/x/web-interface/archive/related?bvid=" + bvid);
          if (rel && rel.code === 0 && Array.isArray(rel.data)) setRelated(rel.data.map(normalizeItem));
        } catch (e) {
          setToast({ reason: "error", text: String((e && e.message) || e) });
        }
      }, []);

      const openVideo = () => {
        const p = parseBili(input);
        if (!p) return;
        if (mode === "site") {
          setSiteUrl("https://www.bilibili.com/video/" + p.bvid + (p.page > 1 ? "?p=" + p.page : ""));
        } else {
          loadVideo(p.bvid, p.page);
        }
      };

      // Derive the attention state of the current session.
      const wasRunning = prevRunning.current;
      const running = summary ? summary.running : false;
      prevRunning.current = running;
      const pending = summary ? summary.pendingInteraction : undefined;

      let derived = null;
      if (pending) {
        derived = { reason: pending, at: "pending" };
      } else if (wasRunning && !running) {
        derived = { reason: "ended", at: "ended:" + Date.now() };
      }
      const key = derived ? derived.reason + "|" + derived.at : null;

      React.useEffect(() => {
        if (!key || firedKey.current === key) return;
        firedKey.current = key;
        setAttention({ reason: derived.reason });
        setToast({ reason: derived.reason });
        const v = videoRef.current;
        if (v && !v.paused) v.pause();
      }, [key]);

      const dismissAttention = () => setAttention(null);
      const resumeVideo = () => {
        dismissAttention();
        const v = videoRef.current;
        if (v && v.paused) v.play().catch(() => {});
      };
      const goBack = () => setOpen(false);

      const el = React.createElement;
      const badgeText = attention ? "⚠ 需要你" : running ? "● 工作中" : "○ 空闲";
      const badgeCls = attention ? "bw-badge-warn" : running ? "bw-badge-run" : "bw-badge-idle";

      // ---- body content ----
      let content;
      if (mode === "site") {
        const page = attention
          ? el("div", { className: "bw-site-stopped" }, "⏸ 页面已停止（agent 需要你处理）")
          : el("iframe", { key: siteUrl, className: "bw-site", src: siteUrl, allowFullScreen: true, title: "Bilibili" });
        content = el("div", { className: "bw-site-wrap" },
          page,
          el("div", { className: "bw-site-hint" }, "在窗口内登录 B站即可使用你的账号（个性化首页 / 弹幕 / 高清 / 搜索）。提醒时页面会停止，继续后回到此页面。"),
        );
      } else if (tab === "player" && video) {
        const relItems = related.map((it) =>
          el("button", { key: it.bvid, className: "bw-rel", onClick: () => loadVideo(it.bvid, 1) },
            el("img", { className: "bw-rel-pic", src: it.pic, loading: "lazy" }),
            el("div", { className: "bw-rel-title" }, it.title),
          ),
        );
        content = el("div", { className: "bw-body" },
          el("video", {
            key: video.src,
            ref: videoRef,
            className: "bw-player",
            src: video.src,
            controls: true,
            autoPlay: true,
            playsInline: true,
          }),
          el("div", { className: "bw-vtitle" }, video.title),
          el("div", { className: "bw-vmeta" }, (video.up || "") + " · " + video.bvid),
          el("div", { className: "bw-tabrow" },
            el("button", { className: "bw-tab", onClick: () => setTab("feed") }, "← 首页"),
            el("span", { className: "bw-vmeta" }, "相关推荐"),
          ),
          relItems.length ? el("div", { className: "bw-related" }, relItems) : null,
        );
      } else {
        let grid;
        if (feedError) {
          grid = el("div", { className: "bw-error" }, feedError,
            el("button", { className: "bw-btn", onClick: loadFeed }, "重试"),
          );
        } else if (!feed) {
          grid = el("div", { className: "bw-loading" }, "正在加载推荐…");
        } else if (!feed.length) {
          grid = el("div", { className: "bw-loading" }, "暂无推荐");
        } else {
          grid = el("div", { className: "bw-grid" },
            feed.map((it) =>
              el("button", { key: it.bvid, className: "bw-card", onClick: () => loadVideo(it.bvid, 1) },
                el("img", { className: "bw-card-pic", src: it.pic, loading: "lazy" }),
                el("div", { className: "bw-card-title" }, it.title),
                el("div", { className: "bw-card-meta" }, (it.up || "") + (it.view ? " · " + fmtCount(it.view) + "播放" : "")),
              ),
            ),
          );
        }
        content = el("div", { className: "bw-body" },
          el("div", { className: "bw-tabrow" },
            el("span", { className: "bw-tab bw-tab-active" }, "🏠 首页推荐"),
            el("button", { className: "bw-btn bw-refresh", onClick: loadFeed }, "刷新"),
          ),
          grid,
        );
      }

      // ---- attention overlay ----
      let overlay = null;
      if (attention) {
        const text = REASON_TEXT[attention.reason] || "agent 需要你的注意";
        const stopped = mode === "site" || video
          ? el("div", { className: "bw-stopped" },
              el("div", { className: "bw-stopped-title" }, "⏸ 已暂停 / 已停止"),
              el("div", { className: "bw-stopped-hint" },
                mode === "site"
                  ? "页面已停止播放声音；继续后回到之前打开的页面"
                  : "已记住播放进度，点「继续看视频」从当前位置续播",
              ),
            )
          : null;
        overlay = el("div", { className: "bw-attention" },
          el("div", { className: "bw-attn-text" }, "🔔 " + text),
          stopped,
          el("div", { className: "bw-row" },
            el("button", { className: "bw-btn bw-btn-primary", onClick: goBack }, "回到对话"),
            el("button", { className: "bw-btn", onClick: resumeVideo }, "继续看视频"),
          ),
        );
      }

      const header = el("div", { className: "bw-header" },
        el("div", { className: "bw-title" }, "边看边等 · B站"),
        el("div", { className: "bw-modes" },
          el("button", { className: "bw-tab " + (mode === "site" ? "bw-tab-active" : ""), onClick: () => setMode("site") }, "🌐 网页"),
          el("button", { className: "bw-tab " + (mode === "player" ? "bw-tab-active" : ""), onClick: () => setMode("player") }, "🎬 播放器"),
        ),
        el("span", { className: "bw-badge " + badgeCls }, badgeText),
        el("button", { className: "bw-btn bw-btn-ghost", onClick: goBack }, "—"),
      );

      const bottom = el("div", { className: "bw-open" },
        el("input", {
          className: "bw-input",
          placeholder: "粘贴 BV 号或 B站视频链接，回车打开",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: (e) => { if (e.key === "Enter") openVideo(); },
        }),
        el("button", { className: "bw-btn bw-btn-primary", onClick: openVideo, disabled: !parseBili(input) }, "打开"),
        mode === "site"
          ? el("button", { className: "bw-btn", onClick: () => setSiteUrl("https://www.bilibili.com/") }, "首页")
          : null,
      );

      const panel = el("div", { className: "bw-panel" + (mode === "site" ? " bw-panel-site" : "") + (open ? "" : " bw-panel-hidden") },
        header,
        el("div", { className: "bw-wrap" }, content, overlay),
        bottom,
      );
      const pill = el("div", { className: "bw-pill", onClick: () => setOpen(true) },
        el("span", { className: "bw-dot " + badgeCls }),
        "边看边等 · " + badgeText,
      );
      const toastNode = toast
        ? el("div", { className: "bw-toast", onClick: () => { setOpen(true); setToast(null); } },
            el("span", null, "🔔 " + (REASON_TEXT[toast.reason] || toast.text || "agent 需要你的注意")),
            el("span", { className: "bw-toast-cta" }, "查看"),
          )
        : null;

      return el("div", { className: "bw-layer" },
        toastNode,
        panel,
        open ? null : pill,
      );
    }

    function apply(ctx) {
      // Package-owned stylesheet, removed with the plugin.
      ctx.effect(() => {
        const style = document.createElement("style");
        style.setAttribute("data-plugin", "dsh-client-bili-watch");
        style.textContent = CSS;
        document.head.append(style);
        return () => style.remove();
      }, "bili-watch: styles");

      const slots = ctx.get("slots");
      if (slots === undefined) return;

      slots.inject("shell.overlay", () => slots.register(
        { name: "shell.overlay", id: "bili-watch", order: 100 },
        (props) => React.createElement(BiliWatch, props),
      ));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
