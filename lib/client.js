/**
 * dsh-client-bili-watch — client bundle
 *
 * Served by the DSH web server from the package's `./client` export and
 * loaded through `window.__ModuleLoader__`. The factory is plain CJS-style
 * JavaScript (no build step): it receives the app's require and returns the
 * plugin module `{ inject, apply }`.
 *
 * Behavior: a floating bottom-right Bilibili player for the DeepSeek
 * conversation. While the current session's agent is running you can watch;
 * when the agent needs you (approval / question / plan review) or stops
 * (completed / blocked / errored) the video is stopped and a reminder is
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
      .bw-panel { position: fixed; right: 18px; bottom: 18px; width: 400px; pointer-events: auto; background: rgba(24,26,32,.97); color: #fff; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,.55); z-index: 10001; overflow: hidden; backdrop-filter: blur(10px); }
      .bw-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.08); }
      .bw-title { font-weight: 600; font-size: 14px; flex: 1; }
      .bw-badge { font-size: 12px; padding: 2px 8px; border-radius: 999px; }
      .bw-badge-run { background: rgba(63,185,80,.18); color: #56d364; }
      .bw-badge-idle { background: rgba(139,148,158,.18); color: #a7b0ba; }
      .bw-badge-warn { background: rgba(248,81,73,.2); color: #ff7b72; animation: bwBlink 1.2s infinite; }
      .bw-btn { background: rgba(255,255,255,.08); color: #fff; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
      .bw-btn:hover { background: rgba(255,255,255,.14); }
      .bw-btn-primary { background: #fb7299; border-color: #fb7299; color: #fff; }
      .bw-btn-primary:hover { background: #ff8aa8; }
      .bw-btn-ghost { border: none; background: transparent; color: #8b949e; padding: 2px 8px; font-size: 14px; }
      .bw-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
      .bw-player { width: 100%; aspect-ratio: 16 / 9; border-radius: 8px; border: 0; background: #000; }
      .bw-open { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      .bw-input { flex: 1; min-width: 180px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.14); color: #fff; border-radius: 8px; padding: 8px 10px; font-size: 13px; outline: none; }
      .bw-input:focus { border-color: #fb7299; }
      .bw-hint { width: 100%; color: #8b949e; font-size: 12px; }
      .bw-cur { width: 100%; color: #a7b0ba; font-size: 12px; }
      .bw-attention { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
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

    /** Extract { bvid, page } from a BV id or a Bilibili video URL. */
    function parseBili(input) {
      const s = String(input == null ? "" : input).trim();
      const m = s.match(/BV[0-9A-Za-z]{8,14}/);
      if (!m) return null;
      const pageMatch = s.match(/[?&#](?:p|page)=(\d+)/);
      return {
        bvid: m[0],
        page: pageMatch ? Math.max(1, Number(pageMatch[1])) : 1,
      };
    }

    function playerSrc(video) {
      return (
        "https://player.bilibili.com/player.html?bvid=" + video.bvid +
        "&page=" + video.page + "&high_quality=1&danmaku=1&autoplay=1"
      );
    }

    function BiliWatch(props) {
      const useSessions = props.useSessions;
      const [open, setOpen] = React.useState(true);
      const [input, setInput] = React.useState("");
      const [video, setVideo] = React.useState(null);
      const [attention, setAttention] = React.useState(null);
      const [toast, setToast] = React.useState(null);

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
      }, [key]);

      const dismissAttention = () => setAttention(null);
      const goBack = () => {
        dismissAttention();
        setOpen(false);
      };
      const resumeVideo = () => {
        dismissAttention();
      };
      const openVideo = () => {
        const parsed = parseBili(input);
        if (!parsed) return;
        setVideo(parsed);
      };

      const el = React.createElement;
      const badgeText = attention ? "⚠ 需要你" : running ? "● 工作中" : "○ 空闲";
      const badgeCls = attention ? "bw-badge-warn" : running ? "bw-badge-run" : "bw-badge-idle";

      let body;
      if (attention) {
        const text = REASON_TEXT[attention.reason] || "agent 需要你的注意";
        const placeholder = video
          ? el("div", { className: "bw-stopped" },
              el("div", { className: "bw-stopped-title" }, "⏸ 视频已暂停"),
              el("div", { className: "bw-stopped-hint" }, "agent 需要你处理，视频已停止播放（重新打开后从头开始）"),
            )
          : null;
        body = el("div", { className: "bw-attention" },
          el("div", { className: "bw-attn-text" }, "🔔 " + text),
          placeholder,
          el("div", { className: "bw-row" },
            el("button", { className: "bw-btn bw-btn-primary", onClick: goBack }, "回到对话"),
            el("button", { className: "bw-btn", onClick: resumeVideo }, "继续看视频"),
          ),
        );
      } else {
        const player = video
          ? el("iframe", {
              className: "bw-player",
              src: playerSrc(video),
              frameBorder: "0",
              allowFullScreen: true,
              allow: "autoplay; fullscreen",
              title: "Bilibili player",
            })
          : null;
        body = el("div", { className: "bw-body" },
          player,
          el("div", { className: "bw-open" },
            el("input", {
              className: "bw-input",
              placeholder: "粘贴 BV 号或 B站视频链接",
              value: input,
              onChange: (e) => setInput(e.target.value),
              onKeyDown: (e) => { if (e.key === "Enter") openVideo(); },
            }),
            el("button", {
              className: "bw-btn bw-btn-primary",
              onClick: openVideo,
              disabled: !parseBili(input),
            }, "打开"),
            el("div", { className: "bw-hint" }, "示例：BV1xx411c7mD 或 https://www.bilibili.com/video/BV1xx411c7mD"),
            video
              ? el("div", { className: "bw-cur" }, "当前：" + video.bvid + (video.page > 1 ? " · P" + video.page : ""))
              : null,
          ),
        );
      }

      const header = el("div", { className: "bw-header" },
        el("div", { className: "bw-title" }, "边看边等 · B站"),
        el("span", { className: "bw-badge " + badgeCls }, badgeText),
        el("button", { className: "bw-btn bw-btn-ghost", onClick: () => setOpen(false) }, "—"),
      );

      const panel = el("div", { className: "bw-panel" }, header, body);
      const pill = el("div", { className: "bw-pill", onClick: () => setOpen(true) },
        el("span", { className: "bw-dot " + badgeCls }),
        "边看边等 · " + badgeText,
      );
      const toastNode = toast
        ? el("div", { className: "bw-toast", onClick: () => { setOpen(true); setToast(null); } },
            el("span", null, "🔔 " + (REASON_TEXT[toast.reason] || "agent 需要你的注意")),
            el("span", { className: "bw-toast-cta" }, "查看"),
          )
        : null;

      return el("div", { className: "bw-layer" },
        toastNode,
        open ? panel : pill,
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
