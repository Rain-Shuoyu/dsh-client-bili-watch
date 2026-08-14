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

    const genBuvid = () => {
      const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      const uuid = (hex(8) + '-' + hex(4) + '-' + hex(4) + '-' + hex(4) + '-' + hex(12)).toUpperCase()
      return 'buvid3=' + uuid + 'infoc'
    }

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

      // ---- 弹幕 XML 代理（host.call('bili-danmaku', {url})，--compressed 解压 gzip）----
      harness.handle('bili-danmaku', async (args) => {
        const url = args && args.url ? String(args.url) : ''
        if (!url) return { code: -1, message: 'missing url' }
        try {
          const h = sub.spawn({
            argv: [CURL, '-sS', '--compressed', '--max-time', '20', '--http1.1', '-H', 'User-Agent: ' + UA, '-H', 'Referer: https://www.bilibili.com/', '-H', 'Cookie: ' + genBuvid(), url],
            cwd: '/',
            stdio: { stdin: 'ignore', stdout: 'pipe', stderr: 'ignore' },
            graceMs: 5000,
          })
          let out = ''
          for await (const chunk of h.stdout) out += chunk.toString('utf8')
          const outcome = await h.done
          if (outcome.exitCode !== 0) return { code: -1, message: 'upstream exit ' + outcome.exitCode }
          return { code: 0, xml: out }
        } catch (e) {
          return { code: -1, message: String(e && e.message || e) }
        }
      })

      // ---- wbi 签名搜索（host.call('bili-search', {kw, page})）----
      // 沙箱内没有 crypto/fetch，用纯 JS MD5 + curl 实现
      const MIXIN_TABLE = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]

      const md5 = (str) => {
        const bytes = new TextEncoder().encode(str)
        const bitLen = bytes.length * 8
        const padded = new Uint8Array((((bytes.length + 8) >> 6) + 1) * 64)
        padded.set(bytes)
        padded[bytes.length] = 0x80
        const dv = new DataView(padded.buffer)
        dv.setUint32(padded.length - 8, bitLen >>> 0, true)
        dv.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true)
        const rot = (x, c) => (x << c) | (x >>> (32 - c))
        const K = [0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391]
        let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476
        const S = [7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21]
        const F = (x, y, z) => (x & y) | (~x & z)
        const G = (x, y, z) => (x & z) | (y & ~z)
        const H = (x, y, z) => x ^ y ^ z
        const I = (x, y, z) => y ^ (x | ~z)
        for (let off = 0; off < padded.length; off += 64) {
          const M = []
          for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true)
          let A = a0, B = b0, C = c0, D = d0
          for (let i = 0; i < 64; i++) {
            let f, g
            if (i < 16) { f = F(B, C, D); g = i }
            else if (i < 32) { f = G(B, C, D); g = (5 * i + 1) % 16 }
            else if (i < 48) { f = H(B, C, D); g = (3 * i + 5) % 16 }
            else { f = I(B, C, D); g = (7 * i) % 16 }
            const tmp = D
            D = C
            C = B
            B = (B + rot((A + f + K[i] + M[g]) >>> 0, S[(i % 4) + Math.floor(i / 16) * 4])) >>> 0
            A = tmp
          }
          a0 = (a0 + A) >>> 0
          b0 = (b0 + B) >>> 0
          c0 = (c0 + C) >>> 0
          d0 = (d0 + D) >>> 0
        }
        const hexLE = (n) => {
          let s = ''
          for (let i = 0; i < 4; i++) s += ('0' + ((n >>> (i * 8)) & 0xff).toString(16)).slice(-2)
          return s
        }
        return hexLE(a0) + hexLE(b0) + hexLE(c0) + hexLE(d0)
      }

      const wbiEnc = (v) => encodeURIComponent(v).replace(/%20/g, '+').replace(/~/g, '%7E').replace(/[!()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())

      const getMixinKey = (orig) => MIXIN_TABLE.map((n) => orig[n]).join('').slice(0, 32)

      const curlText = async (url, extra) => {
        const argv = [CURL, '-sS', '--max-time', '20', '--http1.1', '-H', 'User-Agent: ' + UA, '-H', 'Referer: https://www.bilibili.com/', '-H', 'Cookie: ' + genBuvid()]
        if (extra) argv.push(...extra)
        argv.push(url)
        const h = sub.spawn({ argv, cwd: '/', stdio: { stdin: 'ignore', stdout: 'pipe', stderr: 'ignore' }, graceMs: 5000 })
        let out = ''
        for await (const chunk of h.stdout) out += chunk.toString('utf8')
        const outcome = await h.done
        if (outcome.exitCode !== 0) throw new Error('upstream exit ' + outcome.exitCode)
        return out
      }

      let wbiCache = null
      const wbiKeys = async () => {
        const now = Date.now()
        if (wbiCache && now - wbiCache.at < 6 * 3600 * 1000) return wbiCache
        const text = await curlText('https://api.bilibili.com/x/web-interface/nav')
        let j
        try { j = JSON.parse(text) } catch (e) { throw new Error('nav bad json') }
        const key = (u) => (u || '').split('/').pop().split('.')[0]
        wbiCache = { img: key(j.data && j.data.wbi_img && j.data.wbi_img.img_url), sub: key(j.data && j.data.wbi_img && j.data.wbi_img.sub_url), at: now }
        return wbiCache
      }

      harness.handle('bili-search', async (args) => {
        const kw = args && args.kw ? String(args.kw).trim() : ''
        const page = Math.max(1, Math.floor(Number(args && args.page) || 1))
        if (!kw) return { code: -1, message: 'missing kw' }
        try {
          const keys = await wbiKeys()
          const params = { search_type: 'video', keyword: kw, page, page_size: 20 }
          params.wts = Math.round(Date.now() / 1000)
          const clean = {}
          for (const k of Object.keys(params).sort()) {
            if (/^w_/.test(k)) continue
            clean[k] = String(params[k]).replace(/[!'()*]/g, '')
          }
          const query = Object.keys(clean).sort().map((k) => k + '=' + wbiEnc(clean[k])).join('&')
          const wRid = md5(query + getMixinKey(keys.img + keys.sub))
          const text = await curlText('https://api.bilibili.com/x/web-interface/wbi/search/type?' + query + '&w_rid=' + wRid)
          return JSON.parse(text)
        } catch (e) {
          return { code: -1, message: String(e && e.message || e) }
        }
      })
    }

    // ---- 视频流代理（<video src=/dsh-bili/media?u=...>，支持 Range 续传/拖动）----
    // 注意：必须用 ctx.effect 包住 register，否则路由在插件更新/停止时泄漏
    if (webServer !== undefined && sub !== undefined) {
      ctx.effect(() => webServer.register({
        kind: 'prefix',
        path: '/dsh-bili/media',
        handler: async (req, res) => {
          let h = null
          try {
            const params = parseQuery(req.url)
            const u = params && params.u
            if (!u) { res.writeHead(400); res.end('missing u'); return }
            const args = [CURL, '-sS', '--max-time', '7200', '--http1.1', '-D', '-', '-H', 'User-Agent: ' + UA, '-H', 'Referer: https://www.bilibili.com/']
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
      }), 'bili-watch: media route')
    }
  },
}
