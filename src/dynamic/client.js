return {
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    styles.insert(`
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
      .bw-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; max-height: 66vh; overflow-y: auto; }
      .bw-tabrow { display: flex; align-items: center; gap: 8px; }
      .bw-tab { font-size: 13px; padding: 4px 12px; border-radius: 999px; background: rgba(255,255,255,.06); color: #c9d1d9; border: 1px solid rgba(255,255,255,.1); }
      .bw-tab-active { background: #fb7299; border-color: #fb7299; color: #fff; }
      .bw-refresh { margin-left: auto; font-size: 12px; padding: 4px 10px; }
      .bw-refresh + .bw-refresh { margin-left: 0; }
      .bw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .bw-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; overflow: hidden; cursor: pointer; text-align: left; padding: 0; color: #fff; display: block; }
      .bw-card:hover { border-color: rgba(251,114,153,.55); }
      .bw-card-pic { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #000; }
      .bw-card-title { font-size: 12px; line-height: 1.35; padding: 6px 8px 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px; }
      .bw-card-meta { font-size: 11px; color: #8b949e; padding: 0 8px 8px; }
      .bw-loading { color: #8b949e; font-size: 13px; text-align: center; padding: 24px 0; }
      .bw-error { color: #ff7b72; font-size: 12px; padding: 12px; background: rgba(248,81,73,.08); border-radius: 8px; }
      .bw-open { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border-top: 1px solid rgba(255,255,255,.08); }
      .bw-input { flex: 1; min-width: 160px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.14); color: #fff; border-radius: 8px; padding: 8px 10px; font-size: 13px; outline: none; }
      .bw-input:focus { border-color: #fb7299; }
      .bw-site-wrap { display: flex; flex-direction: column; }
      .bw-site-zoom { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: #fff; }
      .bw-site-zoom iframe { position: absolute; top: 0; left: 0; width: calc(100% / var(--bw-zoom, 1)); height: calc(100% / var(--bw-zoom, 1)); transform: scale(var(--bw-zoom, 1)); transform-origin: 0 0; border: 0; background: #fff; }
      .bw-site-stopped { width: 100%; aspect-ratio: 16 / 9; display: flex; align-items: center; justify-content: center; color: #8b949e; font-size: 13px; background: rgba(0,0,0,.35); }
      .bw-vtool { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
      .bw-vmeta { font-size: 11px; color: #8b949e; flex: 1; }
      .bw-site-zoomctl { display: flex; align-items: center; gap: 6px; }
      .bw-mask { position: absolute; inset: 0; background: rgba(18,20,26,.55); z-index: 5; display: flex; flex-direction: column; gap: 10px; justify-content: center; align-items: center; padding: 16px; text-align: center; backdrop-filter: blur(2px); }
      .bw-mask-text { font-size: 15px; font-weight: 600; color: #ff7b72; }
      .bw-mask-sub { font-size: 12px; color: #c9d1d9; }
      .bw-row { display: flex; gap: 8px; }
      @keyframes bwPop { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      @keyframes bwBlink { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
    `)

    const REASON_TEXT = {
      approval: 'agent 正在请求权限审批',
      question: 'agent 正在向你提问',
      'plan-review': 'agent 正在等待方案确认',
      blocked: 'agent 任务阻塞，需要你介入',
      error: 'agent 执行出错',
      ended: 'agent 已停止工作，需要你处理',
    }

    async function biliApi(url) {
      return host.call('bili-api', { url: String(url) })
    }

    function https(u) {
      return u && typeof u === 'string' && u.indexOf('http://') === 0 ? 'https://' + u.slice(7) : u
    }

    function fmtCount(n) {
      if (n == null) return ''
      return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '万' : String(n)
    }

    function parseBili(input) {
      const s = String(input == null ? '' : input).trim()
      const m = s.match(/BV[0-9A-Za-z]{8,14}/)
      if (!m) return null
      const pageMatch = s.match(/[?&#](?:p|page)=(\d+)/)
      return { bvid: m[0], page: pageMatch ? Math.max(1, Number(pageMatch[1])) : 1 }
    }

    function normalizeItem(it) {
      return {
        bvid: it.bvid,
        title: it.title,
        pic: https(it.pic),
        up: it.owner && it.owner.name,
        view: it.stat && it.stat.view,
      }
    }

    function clampZoom(z) {
      return Math.min(1.2, Math.max(0.3, Math.round(z * 100) / 100))
    }

    const RCMD = 'https://api.bilibili.com/x/web-interface/index/top/rcmd?fresh_type=3&ps=10&fresh_idx='

    function BiliWatch(props) {
      const useSessions = props.useSessions
      const [open, setOpen] = React.useState(true)
      const [view, setView] = React.useState('feed')
      const [videoUrl, setVideoUrl] = React.useState(null)
      const [zoom, setZoom] = React.useState(0.6)
      const [feed, setFeed] = React.useState(null)
      const [feedError, setFeedError] = React.useState('')
      const [freshIdx, setFreshIdx] = React.useState(1)
      const [reload, setReload] = React.useState(0)
      const [input, setInput] = React.useState('')
      const [attention, setAttention] = React.useState(null)
      const [toast, setToast] = React.useState(null)
      const [hostAtt, setHostAtt] = React.useState(null)

      const prevRunning = React.useRef(false)
      const firedKey = React.useRef(null)
      const videoBaseRef = React.useRef(null) // 视频页基础 URL（不带 ?t=）
      const videoOpenAtRef = React.useRef(null) // 打开视频的时刻（估算播放时长）
      const resumeAtRef = React.useRef(null) // 提醒时记录的位置（秒）

      const sessions = useSessions((s) => s)
      const currentId = sessions ? sessions.current : undefined
      const summary = currentId && sessions ? sessions.byId[currentId] : undefined

      // 轮询 Host：当前会话的 阻塞/出错 提醒
      React.useEffect(() => {
        const check = async () => {
          try {
            const res = await host.call('get-attention', { sessionId: currentId || null })
            setHostAtt(res ? { reason: res.reason, message: res.message, at: res.at } : null)
          } catch (e) { /* Host 半区尚未就绪 */ }
        }
        check()
        return ctx.interval(check, 1200)
      }, [currentId])

      // toast 自动消失
      React.useEffect(() => {
        if (!toast) return undefined
        return ctx.timeout(() => setToast(null), 8000)
      }, [toast])

      // 加载首页推荐
      React.useEffect(() => {
        let alive = true
        setFeed(null)
        setFeedError('')
        biliApi(RCMD + freshIdx).then((res) => {
          if (!alive) return
          const list = res && res.code === 0 && res.data && res.data.item
          if (Array.isArray(list)) setFeed(list.map(normalizeItem))
          else setFeedError('首页推荐加载失败')
        }).catch((e) => {
          if (alive) setFeedError('首页推荐加载失败：' + String(e && e.message || e))
        })
        return () => { alive = false }
      }, [freshIdx, reload])

      const openVideo = (bvid) => {
        const base = 'https://www.bilibili.com/video/' + bvid + '/'
        videoBaseRef.current = base
        videoOpenAtRef.current = Date.now()
        resumeAtRef.current = null
        setVideoUrl(base)
        setView('video')
      }

      const openVideoByInput = () => {
        const p = parseBili(input)
        if (!p) return
        openVideo(p.bvid)
      }

      // 推导当前会话的注意力状态
      const wasRunning = prevRunning.current
      const running = summary ? summary.running : false
      prevRunning.current = running
      const pending = summary ? summary.pendingInteraction : undefined

      let derived = null
      if (pending) {
        derived = { reason: pending, at: 'pending', message: null, source: 'session' }
      } else if (hostAtt) {
        derived = { reason: hostAtt.reason, at: String(hostAtt.at), message: hostAtt.message || null, source: 'host' }
      } else if (wasRunning && !running) {
        derived = { reason: 'ended', at: 'ended:' + Date.now(), message: null, source: 'session' }
      }
      const key = derived ? derived.reason + '|' + derived.at : null

      React.useEffect(() => {
        if (!key || firedKey.current === key) return
        firedKey.current = key
        setAttention({ reason: derived.reason, message: derived.message, source: derived.source })
        setToast({ reason: derived.reason })
        // 记录当前播放位置（近似：按打开至今的时长估算）
        if (view === 'video' && videoBaseRef.current && videoOpenAtRef.current) {
          resumeAtRef.current = Math.max(0, Math.floor((Date.now() - videoOpenAtRef.current) / 1000))
        }
      }, [key])

      const dismissAttention = () => {
        if (attention && attention.source === 'host' && currentId) {
          host.call('ack-attention', { sessionId: currentId }).catch(() => {})
        }
        setAttention(null)
        // 在视频页：用 ?t= 从之前断开的位置附近继续
        if (view === 'video' && videoBaseRef.current && resumeAtRef.current != null) {
          const t = resumeAtRef.current
          resumeAtRef.current = null
          if (t > 2) {
            videoOpenAtRef.current = Date.now()
            setVideoUrl(videoBaseRef.current + '?t=' + t)
          }
        }
      }
      const goBack = () => setOpen(false)

      const el = React.createElement
      const badgeText = attention ? '⚠ 需要你' : (running ? '● 工作中' : '○ 空闲')
      const badgeCls = attention ? 'bw-badge-warn' : (running ? 'bw-badge-run' : 'bw-badge-idle')

      // ---- body content ----
      let content
      if (view === 'video' && videoUrl) {
        // attention 时卸载 iframe 停止声音；sandbox 禁止弹窗/顶层跳转
        const page = attention
          ? el('div', { className: 'bw-site-stopped' }, '⏸ 页面已停止 · 已记住播放位置')
          : el('div', { className: 'bw-site-zoom', style: { '--bw-zoom': String(zoom) } },
              el('iframe', {
                key: videoUrl,
                className: 'bw-site-frame',
                src: videoUrl,
                title: 'Bilibili',
                sandbox: 'allow-scripts allow-same-origin allow-forms allow-modals allow-downloads',
              }),
            )
        content = el('div', { className: 'bw-site-wrap' },
          page,
          el('div', { className: 'bw-vtool' },
            el('button', { className: 'bw-btn', onClick: () => setView('feed') }, '← 首页'),
            el('span', { className: 'bw-vmeta' }, '在小窗内登录 B站可同步账号 / 弹幕 / 高清'),
            el('span', { className: 'bw-site-zoomctl' },
              el('button', { className: 'bw-btn', onClick: () => setZoom(clampZoom(zoom - 0.15)) }, '−'),
              el('span', { style: { minWidth: '38px', textAlign: 'center' } }, Math.round(zoom * 100) + '%'),
              el('button', { className: 'bw-btn', onClick: () => setZoom(clampZoom(zoom + 0.15)) }, '+'),
            ),
          ),
        )
      } else {
        let grid
        if (feedError) {
          grid = el('div', { className: 'bw-error' }, feedError,
            el('button', { className: 'bw-btn', onClick: () => setReload((r) => r + 1) }, '重试'),
          )
        } else if (!feed) {
          grid = el('div', { className: 'bw-loading' }, '正在加载首页推荐…')
        } else if (!feed.length) {
          grid = el('div', { className: 'bw-loading' }, '暂无推荐')
        } else {
          grid = el('div', { className: 'bw-grid' },
            feed.map((it) =>
              el('button', { key: it.bvid, className: 'bw-card', onClick: () => openVideo(it.bvid) },
                el('img', { className: 'bw-card-pic', src: it.pic, loading: 'lazy' }),
                el('div', { className: 'bw-card-title' }, it.title),
                el('div', { className: 'bw-card-meta' }, (it.up || '') + (it.view ? ' · ' + fmtCount(it.view) + '播放' : '')),
              ),
            ),
          )
        }
        content = el('div', { className: 'bw-body' },
          el('div', { className: 'bw-tabrow' },
            el('span', { className: 'bw-tab bw-tab-active' }, '🏠 首页推荐'),
            el('button', { className: 'bw-btn bw-refresh', onClick: () => setFreshIdx((i) => i + 1) }, '换一批'),
            el('button', { className: 'bw-btn bw-refresh', onClick: () => setReload((r) => r + 1) }, '刷新'),
          ),
          grid,
        )
      }

      // ---- 半透明蒙版：agent 需要你时 ----
      let mask = null
      if (attention) {
        const text = REASON_TEXT[attention.reason] || 'agent 需要你的注意'
        const msg = attention.message ? el('div', { className: 'bw-mask-sub' }, String(attention.message)) : null
        mask = el('div', { className: 'bw-mask' },
          el('div', { className: 'bw-mask-text' }, '🔔 ' + text),
          msg,
          el('div', { className: 'bw-mask-sub' }, 'agent 已停止，请在对话中完成额外操作；回来后可继续浏览'),
          el('div', { className: 'bw-row' },
            el('button', { className: 'bw-btn bw-btn-primary', onClick: goBack }, '回到对话'),
            el('button', { className: 'bw-btn', onClick: dismissAttention }, '继续浏览'),
          ),
        )
      }

      const header = el('div', { className: 'bw-header' },
        el('div', { className: 'bw-title' }, '边看边等 · B站'),
        el('span', { className: 'bw-badge ' + badgeCls }, badgeText),
        el('button', { className: 'bw-btn bw-btn-ghost', onClick: goBack }, '—'),
      )

      const bottom = el('div', { className: 'bw-open' },
        el('input', {
          className: 'bw-input',
          placeholder: '粘贴 BV 号或 B站视频链接，回车打开',
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: (e) => { if (e.key === 'Enter') openVideoByInput() },
        }),
        el('button', { className: 'bw-btn bw-btn-primary', onClick: openVideoByInput, disabled: !parseBili(input) }, '打开'),
      )

      const panel = el('div', { className: 'bw-panel bw-panel-site' + (open ? '' : ' bw-panel-hidden') },
        header,
        el('div', { className: 'bw-wrap' }, content, mask),
        bottom,
      )
      const pill = el('div', { className: 'bw-pill', onClick: () => setOpen(true) },
        el('span', { className: 'bw-dot ' + badgeCls }),
        '边看边等 · ' + badgeText,
      )
      const toastNode = toast
        ? el('div', { className: 'bw-toast', onClick: () => { setOpen(true); setToast(null) } },
            el('span', null, '🔔 ' + (REASON_TEXT[toast.reason] || 'agent 需要你的注意')),
            el('span', { className: 'bw-toast-cta' }, '查看'),
          )
        : null

      return el('div', { className: 'bw-layer' },
        toastNode,
        panel,
        open ? null : pill,
      )
    }

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'bili-watch', order: 100 },
      (props) => React.createElement(BiliWatch, props),
    ))
  },
}
