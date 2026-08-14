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
    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    const CURL = '/usr/bin/curl'

    const genBuvid = () => {
      const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      const uuid = (hex(8) + '-' + hex(4) + '-' + hex(4) + '-' + hex(4) + '-' + hex(12)).toUpperCase()
      return 'buvid3=' + uuid + 'infoc'
    }

    if (sub !== undefined) {
      harness.handle('bili-api', async (args) => {
        const url = args && args.url ? String(args.url) : ''
        if (!url) return { code: -1, message: 'missing url' }
        try {
          const h = sub.spawn({
            argv: [CURL, '-sS', '--max-time', '20', '--http1.1', '-H', 'User-Agent: ' + UA, '-H', 'Referer: https://www.bilibili.com/', '-H', 'Cookie: ' + genBuvid(), url],
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
  },
}
