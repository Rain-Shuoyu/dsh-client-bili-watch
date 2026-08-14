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
  },
}
