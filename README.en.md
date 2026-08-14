<p align="center">
  <img src="https://img.shields.io/badge/DeepSneak-v0.11.0-%23fb7299?style=for-the-badge" alt="DeepSneak" />
</p>

<h1 align="center">🐟 DeepSneak</h1>

<p align="center">
  <b>Let DeepSeek work while you watch Bilibili.</b><br/>
  A floating mini-window Bilibili player for DeepSeek Harness — auto-pauses and reminds you when the agent needs you, resumes at the exact position when you're back.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.11.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
  <img src="https://img.shields.io/badge/platform-DSH%20Web-blueviolet" alt="platform" />
  <img src="https://img.shields.io/badge/type-web%20client%20plugin-ff69b4" alt="type" />
</p>

---

## ✨ Features

|  |  |  |
|---|---|---|
| 🏠 **Home feed**<br/>Real Bilibili recommendations, no login | ▶️ **Native player**<br/>Seek / speed control | ⏸️ **Exact resume**<br/>Continue from the exact position |
| 💬 **Danmaku**<br/>Bullet comments synced to playback | 📝 **Comments**<br/>Browse comments under the player | 🔗 **Related videos**<br/>Swipe to switch without stopping |
| ☀️/🌙 **Light & dark themes**<br/>One-click switch | 📊 **Slack stats**<br/>Today / week / total watch time | 🔔 **Smart alerts**<br/>approval / question / done / blocked |
| 🟢 **Status badge**<br/>working / idle / needs you | 🔎 **Video search**<br/>Search by keyword, paginated | 🎯 **Zero config**<br/>Install and go |

## 📦 Install

```bash
# 1. In your DSH deployment profile (the dir containing cordis.yml)
cd ~/.dsh/profiles/web
npm install github:Rain-Shuoyu/dsh-client-deep-sneak
```

```yaml
# 2. Append to cordis.patch.yml:
- insert:
    - id: dsh-client-deep-sneak
      name: dsh-client-deep-sneak
```

```bash
# 3. Restart
npx @deepseek-ai/dsh web
```

Refresh the page — the DeepSneak mini-window appears bottom-right.

## 🚀 Quick start

1. Click a card in the home feed → native player plays with danmaku
2. Let the agent work while you watch
3. When the agent needs you: video auto-pauses + a mask reminds you
4. "Continue watching" resumes **from the exact position**
5. Toggle ☀️/🌙 theme, check 📊 stats anytime

## ❓ FAQ

**Why only 720p?** Bilibili's quality limit for unauthenticated APIs; use the Bilibili web site for HD.
**Why not Douyin?** douyin.com sends `X-Frame-Options: DENY` — embedding is impossible; its web APIs require signed auth.
**Where is my data?** Everything stays in your browser (localStorage). No data is uploaded.

## 🗺 Roadmap

- [x] Home feed (no login)
- [x] Native player + exact resume
- [x] Danmaku / comments
- [x] Light & dark themes
- [x] Slack stats
- [ ] Slack-time goal reminders
- [ ] Danmaku density / size / speed settings
- [ ] Watch history & "continue watching"

## 📄 License

[MIT](LICENSE)
