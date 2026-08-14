/**
 * dsh-client-bili-watch — client bundle
 *
 * Served by the DSH web server from the package's `./client` export and
 * loaded through `window.__ModuleLoader__`. The factory is plain CJS-style
 * JavaScript (no build step): it receives the app's require and returns the
 * plugin module `{ inject, apply }`.
 *
 * Behavior: a floating bottom-right mini window for the DeepSeek
 * conversation.
 *
 * - 「首页」view (default): the REAL Bilibili homepage recommendation feed
 *   (rcmd API, proxied through the host) as a card grid — no login needed.
 * - Click a card → the video plays in a NATIVE <video> fed by the host's
 *   stream proxy (/dsh-bili/media, Range-aware): full playback control, so
 *   when the agent needs you the video pauses and resumes at the EXACT
 *   position. Danmaku (bullet comments) are overlaid and synced to
 *   playback time; the comment section is rendered below the player.
 * - ☀️/🌙 light & dark themes (light by default, persisted).
 * - 「📊」statistics: watch time is accumulated while the video plays and
 *   persisted in localStorage — today / this week / total slack time, videos
 *   watched today, and a 7-day breakdown.
 *
 * When the current session's agent needs you (approval / question / plan
 * review) or stops (completed / blocked / errored) a semi-transparent mask
 * appears over the window; the video is paused behind it and resumes exactly
 * when you continue.
 */
window.__ModuleLoader__.load({
  id: "dsh-client-deep-sneak",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");

    /** Cordis client services this plugin needs. */
    const inject = ["slots"];

    const CSS = `.bw-layer { --bw-panel: rgba(255,255,255,.72); --bw-card-bg: #ffffff; --bw-panel-bd: rgba(31,35,40,.1); --bw-panel-shadow: 0 24px 64px rgba(20,22,28,.16), 0 4px 16px rgba(20,22,28,.07); --bw-head-bd: rgba(31,35,40,.07); --bw-text: #18191c; --bw-text2: #57606a; --bw-text3: #8a919c; --bw-soft: rgba(31,35,40,.045); --bw-soft-h: rgba(31,35,40,.09); --bw-soft2: rgba(31,35,40,.06); --bw-bd: rgba(31,35,40,.14); --bw-bd-soft: rgba(31,35,40,.08); --bw-err: #cf222e; --bw-err-bg: rgba(207,34,46,.08); --bw-pink: #4d6bfe; --bw-pink2: #7da0ff; --bw-accent: #ffffff; --bw-mask: rgba(24,26,32,.5); --bw-glass-hi: rgba(255,255,255,.6); position: fixed; inset: 0; pointer-events: none; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.bw-layer.bw-dark { --bw-panel: rgba(22,27,40,.6); --bw-card-bg: rgba(255,255,255,.05); --bw-panel-bd: rgba(255,255,255,.12); --bw-panel-shadow: 0 24px 64px rgba(0,0,0,.6), 0 4px 16px rgba(0,0,0,.3); --bw-head-bd: rgba(255,255,255,.07); --bw-text: #f5f6f7; --bw-text2: #c9d1d9; --bw-text3: #8b949e; --bw-soft: rgba(255,255,255,.07); --bw-soft-h: rgba(255,255,255,.13); --bw-soft2: rgba(255,255,255,.06); --bw-bd: rgba(255,255,255,.14); --bw-bd-soft: rgba(255,255,255,.09); --bw-err: #ff7b72; --bw-err-bg: rgba(248,81,73,.1); --bw-mask: rgba(18,20,26,.55); --bw-glass-hi: rgba(255,255,255,.08); }
.bw-toast { position: fixed; top: 18px; left: 50%; transform: translateX(-50%); pointer-events: auto; background: var(--bw-panel); color: var(--bw-text); border: 1px solid var(--bw-panel-bd); border-radius: 14px; padding: 10px 16px; font-size: 13px; box-shadow: var(--bw-panel-shadow), inset 0 1px 0 var(--bw-glass-hi); display: flex; align-items: center; gap: 12px; cursor: pointer; z-index: 10001; animation: bwPop .25s ease; backdrop-filter: blur(18px) saturate(180%); }
.bw-toast-cta { color: #7aa2ff; font-weight: 600; }
.bw-pill { position: fixed; right: 18px; bottom: 18px; pointer-events: auto; background: var(--bw-panel); color: var(--bw-text); border: 1px solid var(--bw-panel-bd); border-radius: 999px; padding: 10px 18px; font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: var(--bw-panel-shadow), inset 0 1px 0 var(--bw-glass-hi); z-index: 10001; backdrop-filter: blur(22px) saturate(180%); font-weight: 600; }
.bw-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }
.bw-dot.bw-badge-run { background: #3fb950; box-shadow: 0 0 6px #3fb950; }
.bw-dot.bw-badge-idle { background: #9aa3ad; }
.bw-dot.bw-badge-warn { background: #f85149; box-shadow: 0 0 8px #f85149; animation: bwBlink 1s infinite; }
.bw-panel { position: fixed; right: 18px; bottom: 18px; width: 460px; pointer-events: auto; background: var(--bw-panel); color: var(--bw-text); border: 1px solid var(--bw-panel-bd); border-radius: 18px; box-shadow: var(--bw-panel-shadow), inset 0 1px 0 var(--bw-glass-hi); z-index: 10001; overflow: hidden; backdrop-filter: blur(22px) saturate(180%); display: flex; flex-direction: column; }
.bw-panel-hidden { display: none; }
.bw-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--bw-head-bd); background: linear-gradient(135deg, rgba(77,107,254,.1), rgba(77,107,254,0) 55%); }
.bw-brand { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.bw-logo { width: 24px; height: 24px; border-radius: 8px; background: linear-gradient(135deg, var(--bw-pink), var(--bw-pink2)); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 2px 6px rgba(77,107,254,.4); flex: none; }
.bw-brand-name { font-weight: 800; font-size: 15px; letter-spacing: .2px; background: linear-gradient(90deg, var(--bw-pink), var(--bw-pink2)); -webkit-background-clip: text; background-clip: text; color: transparent; white-space: nowrap; }
.bw-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
.bw-badge-run { background: rgba(63,185,80,.16); color: #2ea043; }
.bw-badge-idle { background: rgba(139,148,158,.14); color: var(--bw-text3); }
.bw-badge-warn { background: rgba(248,81,73,.18); color: #f85149; animation: bwBlink 1.2s infinite; }
.bw-icobtn { background: transparent; border: none; color: var(--bw-text3); width: 30px; height: 30px; border-radius: 9px; font-size: 15px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background .15s, color .15s; flex: none; }
.bw-icobtn:hover { background: var(--bw-soft-h); color: var(--bw-text); }
.bw-btn { background: var(--bw-soft); color: var(--bw-text); border: 1px solid var(--bw-bd); border-radius: 999px; padding: 7px 16px; font-size: 13px; cursor: pointer; transition: background .15s, box-shadow .15s; }
.bw-btn:hover { background: var(--bw-soft-h); }
.bw-btn:disabled { opacity: .45; cursor: default; }
.bw-btn-primary { background: linear-gradient(135deg, var(--bw-pink), var(--bw-pink2)); border-color: transparent; color: var(--bw-accent); font-weight: 600; box-shadow: 0 2px 8px rgba(77,107,254,.35); }
.bw-btn-primary:hover { background: linear-gradient(135deg, #6a8bff, #8fa9ff); box-shadow: 0 4px 12px rgba(77,107,254,.45); }
.bw-btn-ghost { border: none; background: transparent; color: var(--bw-text3); padding: 2px 8px; font-size: 14px; }
.bw-wrap { position: relative; }
.bw-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 12px; max-height: 66vh; overflow-y: auto; }
.bw-body::-webkit-scrollbar { width: 6px; }
.bw-body::-webkit-scrollbar-thumb { background: var(--bw-bd); border-radius: 3px; }
.bw-body::-webkit-scrollbar-track { background: transparent; }
.bw-tabrow { display: flex; align-items: center; gap: 8px; }
.bw-tab { font-size: 13px; padding: 5px 14px; border-radius: 999px; background: var(--bw-soft); color: var(--bw-text2); border: 1px solid transparent; cursor: pointer; transition: background .15s, color .15s, box-shadow .15s; font-weight: 500; }
.bw-tab:hover { background: var(--bw-soft-h); color: var(--bw-text); }
.bw-tab-active { background: linear-gradient(135deg, var(--bw-pink), var(--bw-pink2)); border-color: transparent; color: var(--bw-accent); font-weight: 600; box-shadow: 0 2px 8px rgba(77,107,254,.35); }
.bw-tab-active:hover { background: linear-gradient(135deg, #6a8bff, #8fa9ff); color: #fff; }
.bw-refresh { margin-left: auto; font-size: 12px; padding: 5px 12px; }
.bw-refresh + .bw-refresh { margin-left: 0; }
.bw-spacer { margin-left: auto; display: flex; gap: 8px; }
.bw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bw-card { background: var(--bw-card-bg); border: 1px solid var(--bw-bd-soft); border-radius: 12px; overflow: hidden; cursor: pointer; text-align: left; padding: 0; color: var(--bw-text); display: block; transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.bw-card:hover { border-color: rgba(77,107,254,.45); transform: translateY(-4px); box-shadow: 0 12px 28px rgba(20,22,28,.14); }
.bw-card-picwrap { position: relative; overflow: hidden; background: #000; }
.bw-card-pic { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; transition: transform .3s ease; }
.bw-card:hover .bw-card-pic { transform: scale(1.07); }
.bw-card-covermask { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.35)); opacity: 0; transition: opacity .18s; pointer-events: none; }
.bw-card:hover .bw-card-covermask { opacity: 1; }
.bw-card-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(.7); width: 38px; height: 38px; border-radius: 50%; background: rgba(0,0,0,.55); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; padding-left: 3px; opacity: 0; transition: opacity .18s, transform .18s; pointer-events: none; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,.35); }
.bw-card:hover .bw-card-play { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.bw-card-dur { position: absolute; right: 6px; bottom: 6px; background: rgba(0,0,0,.72); color: #fff; font-size: 10px; line-height: 1; padding: 3px 6px; border-radius: 5px; font-weight: 600; letter-spacing: .3px; }
.bw-card-title { font-size: 13px; font-weight: 500; line-height: 1.4; padding: 8px 10px 3px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 38px; }
.bw-card-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--bw-text3); padding: 0 10px 10px; }
.bw-card-meta .bw-up { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.bw-card-meta .bw-stat { display: inline-flex; align-items: center; gap: 2px; flex: none; }
.bw-search { display: flex; gap: 8px; position: relative; align-items: center; }
.bw-search .bw-input { flex: 1; min-width: 0; padding-left: 34px; border-radius: 999px; }
.bw-search-icon { position: absolute; left: 11px; font-size: 12px; color: var(--bw-text3); pointer-events: none; z-index: 1; }
.bw-search .bw-btn { border-radius: 999px; }
.bw-pager { display: flex; align-items: center; gap: 10px; justify-content: center; }
.bw-pager-info { font-size: 12px; color: var(--bw-text3); }
.bw-loading { color: var(--bw-text3); font-size: 13px; text-align: center; padding: 26px 0; }
.bw-error { color: var(--bw-err); font-size: 12px; padding: 12px 14px; background: var(--bw-err-bg); border-radius: 10px; }
.bw-player-wrap { position: relative; }
.bw-player { width: 100%; aspect-ratio: 16/9; border-radius: 10px; background: #000; display: block; }
.bw-dm-layer { position: absolute; left: 0; right: 0; top: 0; bottom: 48px; overflow: hidden; pointer-events: none; z-index: 2; }
.bw-vtitle { font-size: 14px; font-weight: 600; line-height: 1.4; }
.bw-vmeta { font-size: 11px; color: var(--bw-text3); }
.bw-vtool { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.bw-comments { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--bw-head-bd); padding-top: 10px; }
.bw-comments-title { font-size: 13px; font-weight: 600; }
.bw-comment { background: var(--bw-soft); border-radius: 10px; padding: 8px 10px; }
.bw-comment-head { font-size: 11px; color: var(--bw-text3); }
.bw-comment-text { font-size: 12px; color: var(--bw-text); margin-top: 3px; word-break: break-all; white-space: pre-wrap; }
.bw-comment-meta { font-size: 11px; color: var(--bw-text3); margin-top: 4px; }
.bw-related { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.bw-related::-webkit-scrollbar { height: 5px; }
.bw-related::-webkit-scrollbar-thumb { background: var(--bw-bd); border-radius: 3px; }
.bw-rel { width: 120px; flex: none; background: var(--bw-card-bg); border: 1px solid var(--bw-bd-soft); border-radius: 10px; overflow: hidden; cursor: pointer; padding: 0; color: var(--bw-text); text-align: left; transition: transform .15s, border-color .15s; }
.bw-rel:hover { border-color: var(--bw-pink); transform: translateY(-2px); }
.bw-rel-pic { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
.bw-rel-title { font-size: 11px; line-height: 1.3; padding: 5px 7px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.bw-input { flex: 1; min-width: 160px; background: var(--bw-soft); border: 1px solid var(--bw-bd); color: var(--bw-text); border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; transition: border-color .15s, box-shadow .15s; }
.bw-input:focus { border-color: var(--bw-pink); box-shadow: 0 0 0 3px rgba(77,107,254,.18); }
.bw-input::placeholder { color: var(--bw-text3); }
.bw-mask { position: absolute; inset: 0; background: var(--bw-mask); z-index: 5; display: flex; flex-direction: column; gap: 10px; justify-content: center; align-items: center; padding: 16px; text-align: center; backdrop-filter: blur(3px); }
.bw-mask-text { font-size: 15px; font-weight: 600; color: #ff7b72; }
.bw-mask-sub { font-size: 12px; color: #c9d1d9; }
.bw-mask .bw-btn { background: rgba(255,255,255,.16); color: #ffffff; border: 1px solid rgba(255,255,255,.28); }
.bw-mask .bw-btn:hover { background: rgba(255,255,255,.26); }
.bw-mask .bw-btn-primary { background: linear-gradient(135deg, var(--bw-pink), var(--bw-pink2)); border-color: transparent; color: #ffffff; }
.bw-row { display: flex; gap: 8px; }
.bw-stats { position: absolute; inset: 0; background: var(--bw-panel); z-index: 4; padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; backdrop-filter: blur(22px) saturate(180%); }
.bw-stats-title { font-size: 15px; font-weight: 700; }
.bw-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.bw-stats-item { background: var(--bw-soft); border-radius: 12px; padding: 12px 10px; text-align: center; }
.bw-stats-num { font-size: 17px; font-weight: 700; color: var(--bw-pink); }
.bw-stats-label { font-size: 11px; color: var(--bw-text3); margin-top: 2px; }
.bw-stats-7d { display: flex; flex-direction: column; gap: 6px; }
.bw-stats-day { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--bw-text2); }
.bw-stats-daylabel { width: 42px; flex: none; }
.bw-stats-barwrap { flex: 1; background: var(--bw-soft); border-radius: 3px; height: 6px; overflow: hidden; }
.bw-stats-bar { height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--bw-pink), var(--bw-pink2)); }
.bw-stats-dayval { width: 62px; text-align: right; flex: none; }
@keyframes bwPop { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@keyframes bwBlink { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
@keyframes bwDmFade { from { opacity: 1; } to { opacity: 1; } }`;

    const REASON_TEXT = {
      approval: "agent 正在请求权限审批",
      question: "agent 正在向你提问",
      "plan-review": "agent 正在等待方案确认",
      ended: "agent 已停止工作，需要你处理",
    };

    /** JSON proxy call: same-origin, host fetches api.bilibili.com server-side. */
    async function biliApi(url) {
      const r = await fetch("/dsh-bili/api?u=" + encodeURIComponent(String(url)));
      return r.json();
    }

    /** Danmaku proxy call: returns { code, xml }. */
    async function biliDanmaku(url) {
      const r = await fetch("/dsh-bili/dm?u=" + encodeURIComponent(String(url)));
      return r.json();
    }

    /** wbi 签名搜索（host 端签名 + 代理，返回 B站原始 JSON）。 */
    async function biliSearch(kw, page) {
      const r = await fetch("/dsh-bili/search?kw=" + encodeURIComponent(kw) + "&page=" + page);
      return r.json();
    }

    function https(u) {
      return u && typeof u === "string" && u.indexOf("http://") === 0 ? "https://" + u.slice(7) : u;
    }

    function fmtCount(n) {
      if (n == null) return "";
      return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "万" : String(n);
    }

    function fmtTime(ts) {
      const d = new Date(ts * 1000);
      const pad = (n) => String(n).padStart(2, "0");
      return pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }

    /** 时长角标：秒数 -> "m:ss"（搜索接口直接给字符串则原样保留）。 */
    function fmtDur(sec) {
      if (sec == null || sec === "") return null;
      if (typeof sec === "string") return sec;
      const s = Math.max(0, Math.floor(Number(sec)));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const x = s % 60;
      const mm = String(m).padStart(2, "0");
      const ss = String(x).padStart(2, "0");
      return h > 0 ? h + ":" + mm + ":" + ss : m + ":" + ss;
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
        danmaku: it.stat && it.stat.danmaku,
        duration: fmtDur(it.duration),
      };
    }

    /** 搜索结果字段与首页推荐不同：title 带 <em> 高亮标签、author/play/video_review。 */
    function normalizeSearchItem(it) {
      return {
        bvid: it.bvid,
        title: String(it.title || "").replace(/<[^>]+>/g, ""),
        pic: https(it.pic),
        up: it.author,
        view: it.play,
        danmaku: it.video_review,
        duration: fmtDur(it.duration),
      };
    }

    /** Parse the list.so XML into a sorted danmaku array. */
    function parseDanmakuXml(xml) {
      const items = [];
      try {
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const nodes = doc.getElementsByTagName("d");
        for (let i = 0; i < nodes.length; i++) {
          const p = (nodes[i].getAttribute("p") || "").split(",");
          items.push({
            t: Math.round((parseFloat(p[0]) || 0) * 1000),
            text: nodes[i].textContent || "",
            mode: parseInt(p[1], 10) || 1,
            size: parseInt(p[2], 10) || 25,
            color: parseInt(p[3], 10) || 16777215,
          });
        }
      } catch {
        /* ignore */
      }
      items.sort((a, b) => a.t - b.t);
      return items;
    }

    // ---- 摸鱼统计：localStorage 持久化 ----
    const STORE_KEY = "deep-sneak.stats.v1";
    const THEME_KEY = "deep-sneak.theme";
    const LEGACY_STORE_KEY = "dsh-bili-watch.stats.v1";
    const LEGACY_THEME_KEY = "dsh-bili-watch.theme";

    function dayKey(d) {
      const x = d instanceof Date ? d : new Date(d);
      return (
        x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0")
      );
    }

    function loadStats() {
      try {
        let raw = localStorage.getItem(STORE_KEY);
        if (!raw) {
          // 从旧名称迁移历史统计
          raw = localStorage.getItem(LEGACY_STORE_KEY);
          if (raw) localStorage.setItem(STORE_KEY, raw);
        }
        if (raw) {
          const d = JSON.parse(raw);
          if (d && d.daily) return d;
        }
      } catch {
        /* localStorage unavailable */
      }
      return { daily: {} };
    }

    function saveStats(stats) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(stats));
      } catch {
        /* ignore */
      }
    }

    function fmtMs(ms) {
      const s = Math.max(0, Math.round(ms / 1000));
      if (s < 60) return s + " 秒";
      const m = Math.floor(s / 60);
      if (m < 60) return m + " 分钟";
      return Math.floor(m / 60) + " 小时 " + (m % 60) + " 分";
    }

    const RCMD =
      "https://api.bilibili.com/x/web-interface/index/top/rcmd?fresh_type=3&ps=10&fresh_idx=";

    function BiliWatch(props) {
      const useSessions = props.useSessions;
      const [open, setOpen] = React.useState(true);
      const [view, setView] = React.useState("feed"); // 'feed' | 'player'
      const [video, setVideo] = React.useState(null);
      const [related, setRelated] = React.useState([]);
      const [feed, setFeed] = React.useState(null);
      const [feedError, setFeedError] = React.useState("");
      const [freshIdx, setFreshIdx] = React.useState(1);
      const [reload, setReload] = React.useState(0);
      const [input, setInput] = React.useState("");
      const [tab, setTab] = React.useState("home"); // 'home' | 'search'
      const [searchInput, setSearchInput] = React.useState("");
      const [searchKw, setSearchKw] = React.useState("");
      const [searchResults, setSearchResults] = React.useState(null); // null=加载中
      const [searchPage, setSearchPage] = React.useState(1);
      const [searchTotal, setSearchTotal] = React.useState(0);
      const [searching, setSearching] = React.useState(false);
      const [attention, setAttention] = React.useState(null);
      const [toast, setToast] = React.useState(null);
      const [statsOpen, setStatsOpen] = React.useState(false);
      const [dmOn, setDmOn] = React.useState(true);
      const [commentsOpen, setCommentsOpen] = React.useState(false);
      const [comments, setComments] = React.useState([]);
      const [commentPn, setCommentPn] = React.useState(0);
      const [commentsLoading, setCommentsLoading] = React.useState(false);
      const [theme, setTheme] = React.useState(() => {
        try {
          let v = localStorage.getItem(THEME_KEY);
          if (v == null) {
            v = localStorage.getItem(LEGACY_THEME_KEY);
            if (v) localStorage.setItem(THEME_KEY, v);
          }
          return v === "dark" ? "dark" : "light";
        } catch {
          return "light";
        }
      });

      const videoRef = React.useRef(null);
      const prevRunning = React.useRef(false);
      const firedKey = React.useRef(null);
      const statsRef = React.useRef(loadStats());
      const playingSinceRef = React.useRef(null);
      const countedSrcRef = React.useRef(null);
      const dmListRef = React.useRef([]);
      const dmIdxRef = React.useRef(0);
      const dmLayerRef = React.useRef(null);
      const dmLaneNextRef = React.useRef(0);
      const dmOnRef = React.useRef(true);
      const commentsOpenRef = React.useRef(false);
      dmOnRef.current = dmOn;

      const sessions = useSessions((s) => s);
      const currentId = sessions ? sessions.current : undefined;
      const summary = currentId && sessions ? sessions.byId[currentId] : undefined;

      const toggleTheme = () => {
        setTheme((t) => {
          const next = t === "dark" ? "light" : "dark";
          try {
            localStorage.setItem(THEME_KEY, next);
          } catch {
            /* ignore */
          }
          return next;
        });
      };

      // Toast auto-hide.
      React.useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 8000);
        return () => clearTimeout(t);
      }, [toast]);

      // 累计一段播放时长并持久化（不停止计时）
      const bankWatch = React.useCallback(() => {
        const now = Date.now();
        if (playingSinceRef.current == null) return;
        const ms = now - playingSinceRef.current;
        playingSinceRef.current = now;
        if (ms <= 0) return;
        const k = dayKey(now);
        const day = statsRef.current.daily[k] || (statsRef.current.daily[k] = { ms: 0, videos: 0 });
        day.ms += ms;
        saveStats(statsRef.current);
      }, []);

      // 停止计时并结算（pause/ended/卸载）
      const stopWatch = React.useCallback(() => {
        if (playingSinceRef.current == null) return;
        bankWatch();
        playingSinceRef.current = null;
      }, [bankWatch]);

      // 定时落盘 + 页面关闭落盘 + 卸载结算
      React.useEffect(() => {
        const flush = () => bankWatch();
        const id = setInterval(flush, 30000);
        window.addEventListener("beforeunload", flush);
        return () => {
          clearInterval(id);
          window.removeEventListener("beforeunload", flush);
          stopWatch();
        };
      }, [bankWatch, stopWatch]);

      // Load the homepage recommendation feed.
      React.useEffect(() => {
        let alive = true;
        setFeed(null);
        setFeedError("");
        biliApi(RCMD + freshIdx)
          .then((res) => {
            if (!alive) return;
            const list = res && res.code === 0 && res.data && res.data.item;
            if (Array.isArray(list)) setFeed(list.map(normalizeItem));
            else setFeedError("首页推荐加载失败");
          })
          .catch((e) => {
            if (alive) setFeedError("首页推荐加载失败：" + String((e && e.message) || e));
          });
        return () => {
          alive = false;
        };
      }, [freshIdx, reload]);

      // 加载弹幕（cid）并重置播放游标
      const loadDanmaku = React.useCallback(async (cid) => {
        try {
          const res = await biliDanmaku("https://api.bilibili.com/x/v1/dm/list.so?oid=" + cid);
          const list = res && res.code === 0 && res.xml ? parseDanmakuXml(res.xml) : [];
          dmListRef.current = list;
          dmIdxRef.current = 0;
        } catch {
          dmListRef.current = [];
        }
      }, []);

      // 加载评论区（aid + 页码）
      const loadComments = React.useCallback(async (aid, pn) => {
        setCommentsLoading(true);
        try {
          const res = await biliApi(
            "https://api.bilibili.com/x/v2/reply?type=1&oid=" + aid + "&pn=" + pn + "&ps=20&sort=2",
          );
          const reps = res && res.code === 0 && res.data && res.data.replies;
          if (Array.isArray(reps)) {
            setComments((prev) => (pn === 1 ? reps : [...prev, ...reps]));
            setCommentPn(pn);
          }
        } catch {
          /* ignore */
        }
        setCommentsLoading(false);
      }, []);

      const loadVideo = React.useCallback(async (bvid, page) => {
        try {
          const viewRes = await biliApi("https://api.bilibili.com/x/web-interface/view?bvid=" + bvid);
          if (!viewRes || viewRes.code !== 0 || !viewRes.data) throw new Error("视频信息获取失败");
          const d = viewRes.data;
          const cid = page && d.pages && d.pages.length ? (d.pages[page - 1] || d.pages[0]).cid : d.cid;
          const pl = await biliApi(
            "https://api.bilibili.com/x/player/playurl?bvid=" + bvid + "&cid=" + cid + "&qn=64&fnval=0",
          );
          const du = pl && pl.code === 0 && pl.data && pl.data.durl && pl.data.durl[0];
          if (!du || !du.url) throw new Error("播放地址获取失败");
          setVideo({
            bvid,
            aid: d.aid,
            cid,
            title: d.title,
            pic: https(d.pic),
            up: d.owner && d.owner.name,
            src: "/dsh-bili/media?u=" + encodeURIComponent(du.url),
          });
          setView("player");
          setAttention(null);
          loadDanmaku(cid);
          setComments([]);
          setCommentPn(0);
          if (commentsOpenRef.current) loadComments(d.aid, 1);
          const rel = await biliApi("https://api.bilibili.com/x/web-interface/archive/related?bvid=" + bvid);
          if (rel && rel.code === 0 && Array.isArray(rel.data)) setRelated(rel.data.map(normalizeItem));
        } catch (e) {
          setToast({ reason: "error", text: String((e && e.message) || e) });
        }
      }, [loadDanmaku, loadComments]);

      const openVideoByInput = () => {
        const p = parseBili(input);
        if (!p) return;
        loadVideo(p.bvid, p.page);
      };

      // 搜索：切到搜索 tab 并拉取结果（过滤空 bvid）
      const doSearch = React.useCallback(async (kw, page) => {
        const k = String(kw || "").trim();
        if (!k) return;
        setSearchKw(k);
        setSearchPage(page);
        setTab("search");
        setSearching(true);
        setSearchResults(null);
        try {
          const res = await biliSearch(k, page);
          const list = res && res.code === 0 && res.data && res.data.result;
          if (Array.isArray(list)) {
            setSearchResults(list.map(normalizeSearchItem).filter((it) => it.bvid));
            setSearchTotal(Number((res.data && res.data.numResults) || 0));
          } else {
            setSearchResults([]);
            setSearchTotal(0);
          }
        } catch {
          setSearchResults([]);
          setSearchTotal(0);
        }
        setSearching(false);
      }, []);

      const submitSearch = () => {
        if (String(searchInput || "").trim()) doSearch(searchInput, 1);
      };

      // 弹幕开关
      const toggleDm = () => {
        setDmOn((o) => {
          if (o && dmLayerRef.current) dmLayerRef.current.innerHTML = "";
          return !o;
        });
      };

      // 评论开关
      const toggleComments = () => {
        const next = !commentsOpenRef.current;
        commentsOpenRef.current = next;
        setCommentsOpen(next);
        if (next && video && comments.length === 0) loadComments(video.aid, 1);
      };

      // 视频开始播放：开始计时 + 计数（每个视频只计一次）
      const handlePlaying = React.useCallback(() => {
        playingSinceRef.current = Date.now();
        if (video && countedSrcRef.current !== video.src) {
          countedSrcRef.current = video.src;
          const k = dayKey(Date.now());
          const day = statsRef.current.daily[k] || (statsRef.current.daily[k] = { ms: 0, videos: 0 });
          day.videos += 1;
          saveStats(statsRef.current);
        }
      }, [video]);

      // 弹幕引擎：rAF 每帧检查，按播放时间生成弹幕
      const spawnDanmaku = (layer, item) => {
        const h = layer.clientHeight || 240;
        const laneH = 28;
        const laneCount = Math.max(3, Math.floor(h / laneH));
        const lane = dmLaneNextRef.current % laneCount;
        dmLaneNextRef.current = lane + 1;
        const el = document.createElement("div");
        el.textContent = item.text;
        el.style.cssText =
          "position:absolute;left:0;top:" + (lane * laneH + 2) + "px;white-space:nowrap;" +
          "font-size:" + (item.size > 25 ? 34 : 18) + "px;font-weight:600;" +
          "color:" + (item.color ? "#" + item.color.toString(16).padStart(6, "0") : "#ffffff") + ";" +
          "text-shadow:0 1px 2px #000,0 0 2px #000;pointer-events:none;";
        if (item.mode === 4 || item.mode === 5) {
          // 底部 / 顶部固定弹幕
          el.style.left = "50%";
          el.style.transform = "translateX(-50%)";
          el.style.top = (item.mode === 5 ? lane * laneH + 2 : h - laneH * (lane + 1) + 2) + "px";
          el.style.animation = "bwDmFade 4s linear forwards";
          el.addEventListener("animationend", () => el.remove());
          layer.appendChild(el);
          return;
        }
        layer.appendChild(el);
        const w = layer.clientWidth || 400;
        const dist = w + el.offsetWidth + 40;
        const dur = Math.max(2, dist / 100);
        void el.offsetWidth;
        el.style.transition = "transform " + dur + "s linear";
        el.style.transform = "translateX(" + w + "px)";
        requestAnimationFrame(() => {
          el.style.transition = "transform " + dur + "s linear";
          el.style.transform = "translateX(-" + (el.offsetWidth + 40) + "px)";
        });
        el.addEventListener("transitionend", () => el.remove());
      };

      React.useEffect(() => {
        let raf = 0;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          const v = videoRef.current;
          const layer = dmLayerRef.current;
          if (!v || !layer || v.paused || !dmOnRef.current) return;
          const nowMs = v.currentTime * 1000;
          const list = dmListRef.current;
          let i = dmIdxRef.current;
          while (i < list.length && list[i].t <= nowMs) {
            if (list[i].t >= nowMs - 1200) spawnDanmaku(layer, list[i]);
            i++;
          }
          dmIdxRef.current = i;
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      }, []);

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
        // 精确暂停：video 元素保持挂载，进度不丢失
        const v = videoRef.current;
        if (v && !v.paused) v.pause();
      }, [key]);

      const dismissAttention = () => {
        setAttention(null);
        // 精确续播：从暂停位置继续
        const v = videoRef.current;
        if (v && v.paused) v.play().catch(() => {});
      };
      const goBack = () => setOpen(false);

      const el = React.createElement;
      const badgeText = attention ? "需要你" : running ? "工作中" : "空闲";
      const badgeCls = attention ? "bw-badge-warn" : running ? "bw-badge-run" : "bw-badge-idle";

      // ---- body content ----
      let content;
      if (view === "player" && video) {
        const relItems = related.map((it) =>
          el("button", { key: it.bvid, className: "bw-rel", onClick: () => loadVideo(it.bvid, 1) },
            el("img", { className: "bw-rel-pic", src: it.pic, loading: "lazy", referrerPolicy: "no-referrer" }),
            el("div", { className: "bw-rel-title" }, it.title),
          ),
        );
        const commentItems = comments.map((c) =>
          el("div", { key: c.rpid, className: "bw-comment" },
            el("div", { className: "bw-comment-head" }, ((c.member && c.member.uname) || "匿名") + " · " + fmtTime(c.ctime)),
            el("div", { className: "bw-comment-text" }, (c.content && c.content.message) || ""),
            el("div", { className: "bw-comment-meta" }, "👍 " + fmtCount(c.like)),
          ),
        );
        content = el("div", { className: "bw-body" },
          el("div", { className: "bw-player-wrap" },
            el("video", {
              key: video.src,
              ref: videoRef,
              className: "bw-player",
              src: video.src,
              controls: true,
              autoPlay: true,
              playsInline: true,
              onPlaying: handlePlaying,
              onPause: stopWatch,
              onEnded: stopWatch,
            }),
            el("div", { ref: dmLayerRef, className: "bw-dm-layer" }),
          ),
          el("div", { className: "bw-vtitle" }, video.title),
          el("div", { className: "bw-vmeta" }, (video.up || "") + " · " + video.bvid),
          el("div", { className: "bw-vtool" },
            el("button", { className: "bw-btn", onClick: () => setView("feed") }, "← 首页"),
            el("button", { className: "bw-btn" + (dmOn ? " bw-tab-active" : ""), onClick: toggleDm }, "💬 弹幕"),
            el("button", { className: "bw-btn" + (commentsOpen ? " bw-tab-active" : ""), onClick: toggleComments }, "📝 评论"),
            el("span", { className: "bw-vmeta" }, "相关推荐"),
          ),
          commentsOpen
            ? el("div", { className: "bw-comments" },
                el("div", { className: "bw-comments-title" }, "评论区"),
                commentsLoading && comments.length === 0
                  ? el("div", { className: "bw-loading" }, "加载评论…")
                  : commentItems,
                comments.length
                  ? el("button", { className: "bw-btn", onClick: () => loadComments(video.aid, commentPn + 1), disabled: commentsLoading }, "加载更多")
                  : null,
              )
            : null,
          relItems.length ? el("div", { className: "bw-related" }, relItems) : null,
        );
      } else {
        // ---- 首页推荐 / 搜索 feed view ----
        const renderCard = (it) =>
          el("button", { key: it.bvid, className: "bw-card", onClick: () => loadVideo(it.bvid, 1) },
            el("div", { className: "bw-card-picwrap" },
              el("img", { className: "bw-card-pic", src: it.pic, loading: "lazy", referrerPolicy: "no-referrer" }),
              el("div", { className: "bw-card-covermask" }),
              el("span", { className: "bw-card-play" }, "▶"),
              it.duration ? el("span", { className: "bw-card-dur" }, it.duration) : null,
            ),
            el("div", { className: "bw-card-title" }, it.title),
            el("div", { className: "bw-card-meta" },
              el("span", { className: "bw-up" }, it.up || "未知UP"),
              it.view ? el("span", { className: "bw-stat" }, "▶", fmtCount(it.view)) : null,
              it.danmaku ? el("span", { className: "bw-stat" }, "💬", fmtCount(it.danmaku)) : null,
            ),
          );

        let grid;
        if (tab === "search") {
          if (searching && !searchResults) {
            grid = el("div", { className: "bw-loading" }, "正在搜索「" + searchKw + "」…");
          } else if (!searchKw) {
            grid = el("div", { className: "bw-loading" }, "输入关键词，搜索 B站视频");
          } else if (!searchResults || !searchResults.length) {
            grid = el("div", { className: "bw-error" }, "没有找到「" + searchKw + "」相关视频");
          } else {
            grid = el("div", { className: "bw-grid" }, searchResults.map(renderCard));
          }
        } else if (feedError) {
          grid = el("div", { className: "bw-error" }, feedError,
            el("button", { className: "bw-btn", onClick: () => setReload((r) => r + 1) }, "重试"),
          );
        } else if (!feed) {
          grid = el("div", { className: "bw-loading" }, "正在加载首页推荐…");
        } else if (!feed.length) {
          grid = el("div", { className: "bw-loading" }, "暂无推荐");
        } else {
          grid = el("div", { className: "bw-grid" }, feed.map(renderCard));
        }

        const pager =
          tab === "search" && searchResults && searchResults.length
            ? el("div", { className: "bw-pager" },
                el("button", { className: "bw-btn", disabled: searchPage <= 1 || searching, onClick: () => doSearch(searchKw, searchPage - 1) }, "← 上一页"),
                el("span", { className: "bw-pager-info" }, "第 " + searchPage + " 页 · 共 " + fmtCount(searchTotal) + " 条"),
                el("button", { className: "bw-btn", disabled: searchPage * 20 >= searchTotal || searching, onClick: () => doSearch(searchKw, searchPage + 1) }, "下一页 →"),
              )
            : null;

        content = el("div", { className: "bw-body" },
          el("div", { className: "bw-search" },
            el("span", { className: "bw-search-icon" }, "🔍"),
            el("input", {
              className: "bw-input",
              placeholder: "搜索 B站视频，回车搜索",
              value: searchInput,
              onChange: (e) => setSearchInput(e.target.value),
              onKeyDown: (e) => { if (e.key === "Enter") submitSearch(); },
            }),
            el("button", { className: "bw-btn bw-btn-primary", onClick: submitSearch, disabled: !String(searchInput || "").trim() }, "搜索"),
          ),
          el("div", { className: "bw-tabrow" },
            el("button", { className: "bw-tab" + (tab === "home" ? " bw-tab-active" : ""), onClick: () => setTab("home") }, "🏠 首页推荐"),
            el("button", { className: "bw-tab" + (tab === "search" ? " bw-tab-active" : ""), onClick: () => setTab("search") }, "🔍 " + (searchKw || "搜索")),
            tab === "search"
              ? el("button", { className: "bw-btn bw-refresh", onClick: submitSearch, disabled: searching }, "重搜")
              : el("span", { className: "bw-spacer" },
                  el("button", { className: "bw-btn bw-refresh", onClick: () => setFreshIdx((i) => i + 1) }, "换一批"),
                  el("button", { className: "bw-btn bw-refresh", onClick: () => setReload((r) => r + 1) }, "刷新"),
                ),
          ),
          grid,
          pager,
        );
      }

      // ---- 半透明蒙版：agent 需要你时 ----
      let mask = null;
      if (attention) {
        const text = REASON_TEXT[attention.reason] || "agent 需要你的注意";
        const stopped = video
          ? el("div", { className: "bw-mask-sub" }, "⏸ 视频已暂停，点「继续看」从原位置续播")
          : null;
        mask = el("div", { className: "bw-mask" },
          el("div", { className: "bw-mask-text" }, "🔔 " + text),
          stopped,
          el("div", { className: "bw-mask-sub" }, "agent 已停止，请在对话中完成额外操作"),
          el("div", { className: "bw-row" },
            el("button", { className: "bw-btn bw-btn-primary", onClick: goBack }, "回到对话"),
            el("button", { className: "bw-btn", onClick: dismissAttention }, "继续看视频"),
          ),
        );
      }

      // ---- 摸鱼统计 ----
      let statsOverlay = null;
      if (statsOpen) {
        const daily = statsRef.current.daily;
        const now = new Date();
        const today = dayKey(now);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = dayKey(weekStart);
        let todayMs = 0;
        let todayVideos = 0;
        let weekMs = 0;
        let totalMs = 0;
        for (const k of Object.keys(daily)) {
          const v = daily[k];
          totalMs += v.ms;
          if (k === today) {
            todayMs = v.ms;
            todayVideos = v.videos;
          }
          if (k >= weekKey && k <= today) weekMs += v.ms;
        }
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const k = dayKey(d);
          last7.push({ label: k.slice(5), ms: (daily[k] || {}).ms || 0 });
        }
        const max7 = Math.max(1, ...last7.map((x) => x.ms));
        statsOverlay = el("div", { className: "bw-stats" },
          el("div", { className: "bw-stats-title" }, "📊 摸鱼统计"),
          el("div", { className: "bw-stats-grid" },
            el("div", { className: "bw-stats-item" }, el("div", { className: "bw-stats-num" }, fmtMs(todayMs)), el("div", { className: "bw-stats-label" }, "今日摸鱼")),
            el("div", { className: "bw-stats-item" }, el("div", { className: "bw-stats-num" }, String(todayVideos)), el("div", { className: "bw-stats-label" }, "今日视频")),
            el("div", { className: "bw-stats-item" }, el("div", { className: "bw-stats-num" }, fmtMs(weekMs)), el("div", { className: "bw-stats-label" }, "本周摸鱼")),
            el("div", { className: "bw-stats-item" }, el("div", { className: "bw-stats-num" }, fmtMs(totalMs)), el("div", { className: "bw-stats-label" }, "累计摸鱼")),
          ),
          el("div", { className: "bw-stats-title" }, "近 7 天"),
          el("div", { className: "bw-stats-7d" },
            last7.map((x) =>
              el("div", { key: x.label, className: "bw-stats-day" },
                el("span", { className: "bw-stats-daylabel" }, x.label),
                el("span", { className: "bw-stats-barwrap" },
                  el("span", { className: "bw-stats-bar", style: { display: "block", width: Math.max(2, (x.ms / max7) * 100) + "%" } }),
                ),
                el("span", { className: "bw-stats-dayval" }, x.ms >= 60000 ? Math.round(x.ms / 60000) + " 分" : "—"),
              ),
            ),
          ),
          el("div", { className: "bw-row" },
            el("button", { className: "bw-btn bw-btn-primary", onClick: () => setStatsOpen(false) }, "返回"),
          ),
        );
      }

      const header = el("div", { className: "bw-header" },
        el("div", { className: "bw-brand" },
          el("span", { className: "bw-logo" }, "▶"),
          el("span", { className: "bw-brand-name" }, "DeepSneak"),
        ),
        el("span", { className: "bw-badge " + badgeCls },
          el("span", { className: "bw-dot " + badgeCls }),
          badgeText,
        ),
        el("button", { className: "bw-icobtn", onClick: toggleTheme, title: theme === "dark" ? "切换白天模式" : "切换黑夜模式" }, theme === "dark" ? "☀️" : "🌙"),
        el("button", {
          className: "bw-icobtn",
          onClick: () => {
            bankWatch();
            const v = videoRef.current;
            if (v && !v.paused) v.pause();
            setStatsOpen(true);
          },
        }, "📊"),
        el("button", { className: "bw-icobtn", onClick: goBack, title: "收起" }, "—"),
      );

      const panel = el("div", { className: "bw-panel" + (open ? "" : " bw-panel-hidden") },
        header,
        el("div", { className: "bw-wrap" }, content, mask, statsOverlay),
      );
      const pill = el("div", { className: "bw-pill", onClick: () => setOpen(true) },
        el("span", { className: "bw-dot " + badgeCls }),
        "DeepSneak · " + badgeText,
      );
      const toastNode = toast
        ? el("div", { className: "bw-toast", onClick: () => { setOpen(true); setToast(null); } },
            el("span", null, "🔔 " + (REASON_TEXT[toast.reason] || toast.text || "agent 需要你的注意")),
            el("span", { className: "bw-toast-cta" }, "查看"),
          )
        : null;

      return el("div", { className: "bw-layer" + (theme === "dark" ? " bw-dark" : "") },
        toastNode,
        panel,
        open ? null : pill,
      );
    }

    function apply(ctx) {
      // Package-owned stylesheet, removed with the plugin.
      ctx.effect(() => {
        const style = document.createElement("style");
        style.setAttribute("data-plugin", "dsh-client-deep-sneak");
        style.textContent = CSS;
        document.head.append(style);
        return () => style.remove();
      }, "bili-watch: styles");

      const slots = ctx.get("slots");
      if (slots === undefined) return;

      slots.inject("shell.overlay", () => slots.register(
        { name: "shell.overlay", id: "deep-sneak", order: 100 },
        (props) => React.createElement(BiliWatch, props),
      ));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
