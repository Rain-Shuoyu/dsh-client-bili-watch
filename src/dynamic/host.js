return {
  apply(ctx) {
    // sessionId -> { reason, message?, at }
    const attention = new Map()

    const setAttention = (sessionId, reason, message) => {
      attention.set(sessionId, {
        reason,
        message: message ? String(message) : undefined,
        at: Date.now(),
      })
    }

    // 目标被标记阻塞（goal/changed operation === 'block'）
    ctx.on('goal/changed', (payload) => {
      if (!payload || !payload.agent) return
      const change = payload.change
      if (!change || change.operation !== 'block') return
      let message
      try {
        const goal = change.goal
        if (goal && goal.blockedReason) message = goal.blockedReason.message
      } catch (e) { message = undefined }
      setAttention(payload.agent.id, 'blocked', message)
    })

    // agent 步骤/回合出错
    ctx.on('agent/error', (payload) => {
      if (!payload || !payload.agent) return
      let message
      try {
        const err = payload.error
        if (err && typeof err === 'object' && 'message' in err) message = String(err.message)
        else if (err != null) message = String(err)
      } catch (e) { message = undefined }
      setAttention(payload.agent.id, 'error', message)
    })

    // 重新开始工作时清除该会话的待提醒状态
    ctx.on('agent/status', (payload) => {
      if (payload && payload.agent && payload.status === 'running') {
        attention.delete(payload.agent.id)
      }
    })

    // Client 轮询：当前会话是否有 阻塞/出错 提醒
    harness.handle('get-attention', (args) => {
      const sessionId = args && args.sessionId ? String(args.sessionId) : undefined
      if (!sessionId) return null
      const entry = attention.get(sessionId)
      if (!entry) return null
      return { reason: entry.reason, message: entry.message, at: entry.at }
    })

    // Client 确认后清除提醒
    harness.handle('ack-attention', (args) => {
      const sessionId = args && args.sessionId ? String(args.sessionId) : undefined
      if (sessionId) attention.delete(sessionId)
      return null
    })

    // ---- B站 API JSON 代理（host.call('bili-api', {url})）----
    const sub = ctx.get('subprocess')
    const webServer = ctx.get('webServer')
    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    const CURL = '/usr/bin/curl'

    const parseQuery = (url) => {
      const q = url.indexOf('?')
      if (q < 0) return null
      const params = {}
      for (const pair of url.slice(q + 1).split('&')) {
        if (!pair) continue
        const i = pair.indexOf('=')
        params[i < 0 ? pair : pair.slice(0, i)] = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1))
      }
      return params
    }

    if (sub !== undefined) {
      harness.handle('bili-api', async (args) => {
        const url = args && args.url ? String(args.url) : ''
        if (!url) return { code: -1, message: 'missing url' }
        try {
          const h = sub.spawn({
            argv: [CURL, '-sS', '--max-time', '20', '--http1.1', '-H', 'User-Agent: ' + UA, '-H', 'Referer: https://www.bilibili.com', url],
            cwd: '/',
            stdio: { stdin: 'ignore', stdout: 'pipe', stderr: 'ignore' },
            graceMs: 5000,
          })
          let out = ''
          for await (const chunk of h.stdout) out += chunk.toString('utf8')
          const outcome = await h.done
          if (outcome.exitCode !== 0) return { code: -1, message: 'upstream exit ' + outcome.exitCode }
          try {
            return JSON.parse(out)
          } catch (e) {
            return { code: -1, message: 'bad json', raw: out.slice(0, 200) }
          }
        } catch (e) {
          return { code: -1, message: String(e && e.message || e) }
        }
      })
    }

    // ---- 视频流代理（<video src=/dsh-bili/stream?u=...>，支持 Range 续传/拖动）----
    if (webServer !== undefined && sub !== undefined) {
      webServer.register({
        kind: 'prefix',
        path: '/dsh-bili/stream',
        handler: async (req, res) => {
          let h = null
          try {
            const params = parseQuery(req.url)
            const u = params && params.u
            if (!u) { res.writeHead(400); res.end('missing u'); return }
            const args = [CURL, '-sS', '--max-time', '7200', '--http1.1', '-D', '-', '-H', 'User-Agent: ' + UA, '-H', 'Referer: https://www.bilibili.com']
            if (req.headers.range) args.push('-H', 'Range: ' + String(req.headers.range))
            args.push(u)
            h = sub.spawn({
              argv: args,
              cwd: '/',
              stdio: { stdin: 'ignore', stdout: 'pipe', stderr: 'ignore' },
              graceMs: 5000,
            })
            let head = ''
            let started = false
            for await (const chunk of h.stdout) {
              if (!started) {
                head += chunk.toString('latin1')
                const idx = head.indexOf('\r\n\r\n')
                if (idx === -1) continue
                const headerText = head.slice(0, idx)
                const rest = head.slice(idx + 4)
                const lines = headerText.split('\r\n')
                const status = Number((lines[0] || '').split(' ')[1]) || 200
                const hdrs = {}
                for (let i = 1; i < lines.length; i++) {
                  const c = lines[i].indexOf(':')
                  if (c > 0) hdrs[lines[i].slice(0, c).trim().toLowerCase()] = lines[i].slice(c + 1).trim()
                }
                const out = { 'content-type': hdrs['content-type'] || 'video/mp4', 'accept-ranges': 'bytes' }
                if (hdrs['content-length']) out['content-length'] = hdrs['content-length']
                if (hdrs['content-range']) out['content-range'] = hdrs['content-range']
                res.writeHead(status, out)
                started = true
                if (rest) res.write(Uint8Array.from(Array.from(rest, (ch) => ch.charCodeAt(0))))
              } else {
                res.write(chunk)
              }
            }
            res.end()
          } catch (e) {
            if (h) { try { h.terminate() } catch (e2) {} }
            try { if (!res.writableEnded) { res.writeHead(502); res.end('stream error') } } catch (e2) {}
          }
        },
      })
    }
  },
}
