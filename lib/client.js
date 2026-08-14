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
 *   position.
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
  id: "dsh-client-bili-watch",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");

    /** Cordis client services this plugin needs. */
    const inject = ["slots"];

    const CSS = `
      .bw-layer { --bw-panel: #ffffff; --bw-panel-bd: rgba(31,35,40,.12); --bw-panel-shadow: rgba(0,0,0,.18); --bw-head-bd: rgba(31,35,40,.08); --bw-text: #1f2328; --bw-text2: #57606a; --bw-text3: #6e7781; --bw-soft: rgba(31,35,40,.05); --bw-soft-h: rgba(31,35,40,.1); --bw-soft2: rgba(31,35,40,.06); --bw-bd: rgba(31,35,40,.15); --bw-bd-soft: rgba(31,35,40,.09); --bw-err: #cf222e; --bw-err-bg: rgba(207,34,46,.08); --bw-pink: #fb7299; --bw-accent: #ffffff; --bw-mask: rgba(24,26,32,.5); position: fixed; inset: 0; pointer-events: none; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
      .bw-layer.bw-dark { --bw-panel: rgba(24,26,32,.97); --bw-panel-bd: rgba(255,255,255,.14); --bw-panel-shadow: rgba(0,0,0,.55); --bw-head-bd: rgba(255,255,255,.08); --bw-text: #ffffff; --bw-text2: #c9d1d9; --bw-text3: #8b949e; --bw-soft: rgba(255,255,255,.08); --bw-soft-h: rgba(255,255,255,.14); --bw-soft2: rgba(255,255,255,.06); --bw-bd: rgba(255,255,255,.12); --bw-bd-soft: rgba(255,255,255,.09); --bw-err: #ff7b72; --bw-err-bg: rgba(248,81,73,.1); --bw-mask: rgba(18,20,26,.55); }
      .bw-toast { position: fixed; top: 18px; left: 50%; transform: translateX(-50%); pointer-events: auto; background: var(--bw-panel); color: var(--bw-text); border: 1px solid var(--bw-panel-bd); border-radius: 12px; padding: 10px 16px; font-size: 13px; box-shadow: 0 10px 34px var(--bw-panel-shadow); display: flex; align-items: center; gap: 12px; cursor: pointer; z-index: 10001; animation: bwPop .25s ease; backdrop-filter: blur(10px); }
      .bw-toast-cta { color: #7aa2ff; font-weight: 600; }
      .bw-pill { position: fixed; right: 18px; bottom: 18px; pointer-events: auto; background: var(--bw-panel); color: var(--bw-text); border: 1px solid var(--bw-panel-bd); border-radius: 999px; padding: 9px 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 8px 28px var(--bw-panel-shadow); z-index: 10001; backdrop-filter: blur(10px); }
      .bw-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      .bw-dot.bw-badge-run { background: #3fb950; box-shadow: 0 0 6px #3fb950; }
      .bw-dot.bw-badge-idle { background: #8b949e; }
      .bw-dot.bw-badge-warn { background: #f85149; box-shadow: 0 0 8px #f85149; animation: bwBlink 1s infinite; }
      .bw-panel { position: fixed; right: 18px; bottom: 18px; width: 430px; pointer-events: auto; background: var(--bw-panel); color: var(--bw-text); border: 1px solid var(--bw-panel-bd); border-radius: 14px; box-shadow: 0 16px 48px var(--bw-panel-shadow); z-index: 10001; overflow: hidden; backdrop-filter: blur(10px); display: flex; flex-direction: column; }
      .bw-panel-hidden { display: none; }
      .bw-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--bw-head-bd); }
      .bw-title { font-weight: 600; font-size: 14px; flex: 1; white-space: nowrap; }
      .bw-badge { font-size: 12px; padding: 2px 8px; border-radius: 999px; }
      .bw-badge-run { background: rgba(63,185,80,.18); color: #3fb950; }
      .bw-badge-idle { background: rgba(139,148,158,.18); color: var(--bw-text3); }
      .bw-badge-warn { background: rgba(248,81,73,.2); color: #f85149; animation: bwBlink 1.2s infinite; }
      .bw-btn { background: var(--bw-soft); color: var(--bw-text); border: 1px solid var(--bw-bd); border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
      .bw-btn:hover { background: var(--bw-soft-h); }
      .bw-btn-primary { background: var(--bw-pink); border-color: var(--bw-pink); color: var(--bw-accent); }
      .bw-btn-primary:hover { background: #ff8aa8; }
      .bw-btn-ghost { border: none; background: transparent; color: var(--bw-text3); padding: 2px 8px; font-size: 14px; }
      .bw-wrap { position: relative; }
      .bw-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; max-height: 66vh; overflow-y: auto; }
      .bw-tabrow { display: flex; align-items: center; gap: 8px; }
      .bw-tab { font-size: 13px; padding: 4px 12px; border-radius: 999px; background: var(--bw-soft); color: var(--bw-text2); border: 1px solid var(--bw-bd); }
      .bw-tab-active { background: var(--bw-pink); border-color: var(--bw-pink); color: var(--bw-accent); }
      .bw-refresh { margin-left: auto; font-size: 12px; padding: 4px 10px; }
      .bw-refresh + .bw-refresh { margin-left: 0; }
      .bw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .bw-card { background: var(--bw-soft); border: 1px solid var(--bw-bd-soft); border-radius: 10px; overflow: hidden; cursor: pointer; text-align: left; padding: 0; color: var(--bw-text); display: block; }
      .bw-card:hover { border-color: var(--bw-pink); }
      .bw-card-pic { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #000; }
      .bw-card-title { font-size: 12px; line-height: 1.35; padding: 6px 8px 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px; }
      .bw-card-meta { font-size: 11px; color: var(--bw-text3); padding: 0 8px 8px; }
      .bw-loading { color: var(--bw-text3); font-size: 13px; text-align: center; padding: 24px 0; }
      .bw-error { color: var(--bw-err); font-size: 12px; padding: 12px; background: var(--bw-err-bg); border-radius: 8px; }
      .bw-player { width: 100%; aspect-ratio: 16/9; border-radius: 8px; background: #000; }
      .bw-vtitle { font-size: 13px; font-weight: 600; line-height: 1.4; }
      .bw-vmeta { font-size: 11px; color: var(--bw-text3); }
      .bw-vtool { display: flex; align-items: center; gap: 10px; }
      .bw-related { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
      .bw-rel { width: 118px; flex: none; background: var(--bw-soft); border: 1px solid var(--bw-bd-soft); border-radius: 8px; overflow: hidden; cursor: pointer; padding: 0; color: var(--bw-text); text-align: left; }
      .bw-rel:hover { border-color: var(--bw-pink); }
      .bw-rel-pic { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
      .bw-rel-title { font-size: 11px; line-height: 1.3; padding: 4px 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .bw-open { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border-top: 1px solid var(--bw-head-bd); }
      .bw-input { flex: 1; min-width: 160px; background: var(--bw-soft2); border: 1px solid var(--bw-bd); color: var(--bw-text); border-radius: 8px; padding: 8px 10px; font-size: 13px; outline: none; }
      .bw-input:focus { border-color: var(--bw-pink); }
      .bw-input::placeholder { color: var(--bw-text3); }
      .bw-mask { position: absolute; inset: 0; background: var(--bw-mask); z-index: 5; display: flex; flex-direction: column; gap: 10px; justify-content: center; align-items: center; padding: 16px; text-align: center; backdrop-filter: blur(2px); }
      .bw-mask-text { font-size: 15px; font-weight: 600; color: #ff7b72; }
      .bw-mask-sub { font-size: 12px; color: #c9d1d9; }
      .bw-row { display: flex; gap: 8px; }
      .bw-stats { position: absolute; inset: 0; background: var(--bw-panel); z-index: 4; padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
      .bw-stats-title { font-size: 15px; font-weight: 600; }
      .bw-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .bw-stats-item { background: var(--bw-soft); border-radius: 10px; padding: 10px; text-align: center; }
      .bw-stats-num { font-size: 16px; font-weight: 600; color: var(--bw-pink); }
      .bw-stats-label { font-size: 11px; color: var(--bw-text3); margin-top: 2px; }
      .bw-stats-7d { display: flex; flex-direction: column; gap: 6px; }
      .bw-stats-day { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--bw-text2); }
      .bw-stats-daylabel { width: 42px; flex: none; }
      .bw-stats-barwrap { flex: 1; background: var(--bw-soft); border-radius: 3px; height: 6px; overflow: hidden; }
      .bw-stats-bar { height: 6px; border-radius: 3px; background: var(--bw-pink); }
      .bw-stats-dayval { width: 62px; text-align: right; flex: none; }
      @keyframes bwPop { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      @keyframes bwBlink { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
    `;

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
      };
    }

    // ---- 摸鱼统计：localStorage 持久化 ----
    const STORE_KEY = "dsh-bili-watch.stats.v1";
    const THEME_KEY = "dsh-bili-watch.theme";

    function dayKey(d) {
      const x = d instanceof Date ? d : new Date(d);
      return (
        x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0")
      );
    }

    function loadStats() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
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
      const [attention, setAttention] = React.useState(null);
      const [toast, setToast] = React.useState(null);
      const [statsOpen, setStatsOpen] = React.useState(false);
      const [theme, setTheme] = React.useState(() => {
        try {
          return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
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
            title: d.title,
            pic: https(d.pic),
            up: d.owner && d.owner.name,
            src: "/dsh-bili/media?u=" + encodeURIComponent(du.url),
          });
          setView("player");
          setAttention(null);
          const rel = await biliApi("https://api.bilibili.com/x/web-interface/archive/related?bvid=" + bvid);
          if (rel && rel.code === 0 && Array.isArray(rel.data)) setRelated(rel.data.map(normalizeItem));
        } catch (e) {
          setToast({ reason: "error", text: String((e && e.message) || e) });
        }
      }, []);

      const openVideoByInput = () => {
        const p = parseBili(input);
        if (!p) return;
        loadVideo(p.bvid, p.page);
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
      const badgeText = attention ? "⚠ 需要你" : running ? "● 工作中" : "○ 空闲";
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
        content = el("div", { className: "bw-body" },
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
          el("div", { className: "bw-vtitle" }, video.title),
          el("div", { className: "bw-vmeta" }, (video.up || "") + " · " + video.bvid),
          el("div", { className: "bw-vtool" },
            el("button", { className: "bw-btn", onClick: () => setView("feed") }, "← 首页"),
            el("span", { className: "bw-vmeta" }, "相关推荐"),
          ),
          relItems.length ? el("div", { className: "bw-related" }, relItems) : null,
        );
      } else {
        let grid;
        if (feedError) {
          grid = el("div", { className: "bw-error" }, feedError,
            el("button", { className: "bw-btn", onClick: () => setReload((r) => r + 1) }, "重试"),
          );
        } else if (!feed) {
          grid = el("div", { className: "bw-loading" }, "正在加载首页推荐…");
        } else if (!feed.length) {
          grid = el("div", { className: "bw-loading" }, "暂无推荐");
        } else {
          grid = el("div", { className: "bw-grid" },
            feed.map((it) =>
              el("button", { key: it.bvid, className: "bw-card", onClick: () => loadVideo(it.bvid, 1) },
                el("img", { className: "bw-card-pic", src: it.pic, loading: "lazy", referrerPolicy: "no-referrer" }),
                el("div", { className: "bw-card-title" }, it.title),
                el("div", { className: "bw-card-meta" }, (it.up || "") + (it.view ? " · " + fmtCount(it.view) + "播放" : "")),
              ),
            ),
          );
        }
        content = el("div", { className: "bw-body" },
          el("div", { className: "bw-tabrow" },
            el("span", { className: "bw-tab bw-tab-active" }, "🏠 首页推荐"),
            el("button", { className: "bw-btn bw-refresh", onClick: () => setFreshIdx((i) => i + 1) }, "换一批"),
            el("button", { className: "bw-btn bw-refresh", onClick: () => setReload((r) => r + 1) }, "刷新"),
          ),
          grid,
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
        el("div", { className: "bw-title" }, "边看边等 · B站"),
        el("span", { className: "bw-badge " + badgeCls }, badgeText),
        el("button", { className: "bw-btn bw-btn-ghost", onClick: toggleTheme, title: theme === "dark" ? "切换白天模式" : "切换黑夜模式" }, theme === "dark" ? "☀️" : "🌙"),
        el("button", {
          className: "bw-btn bw-btn-ghost",
          onClick: () => {
            bankWatch();
            const v = videoRef.current;
            if (v && !v.paused) v.pause();
            setStatsOpen(true);
          },
        }, "📊"),
        el("button", { className: "bw-btn bw-btn-ghost", onClick: goBack }, "—"),
      );

      const bottom = el("div", { className: "bw-open" },
        el("input", {
          className: "bw-input",
          placeholder: "粘贴 BV 号或 B站视频链接，回车打开",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: (e) => { if (e.key === "Enter") openVideoByInput(); },
        }),
        el("button", { className: "bw-btn bw-btn-primary", onClick: openVideoByInput, disabled: !parseBili(input) }, "打开"),
      );

      const panel = el("div", { className: "bw-panel" + (open ? "" : " bw-panel-hidden") },
        header,
        el("div", { className: "bw-wrap" }, content, mask, statsOverlay),
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
