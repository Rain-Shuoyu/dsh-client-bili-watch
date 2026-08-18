<p align="center">
  <img src="https://img.shields.io/badge/DeepSneak-v0.12.0-%23fb7299?style=for-the-badge" alt="DeepSneak" />
</p>

<h1 align="center">🐟 DeepSneak</h1>

<p align="center">
  <b>Let DeepSeek work while you watch Bilibili.</b><br/>
  A floating mini-window Bilibili player for DeepSeek Harness — auto-pauses and reminds you when the agent needs you, resumes at the exact position when you're back.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.12.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
  <img src="https://img.shields.io/badge/platform-DSH%20Web-blueviolet" alt="platform" />
  <img src="https://img.shields.io/badge/type-web%20client%20plugin-ff69b4" alt="type" />
  <a href="https://awesome-dsh-plugin.com"><img src="https://awesome-dsh-plugin.com/badge.svg" alt="Awesome DSH Plugin" /></a>
</p>

---

## ✨ Features

|  |  |  |
|---|---|---|
| 🏠 **Home feed**<br/>Real Bilibili recommendations, no login | ▶️ **Native player**<br/>Seek / speed control | ⏸️ **Exact resume**<br/>Continue from the exact position |
| 💬 **Danmaku**<br/>Bullet comments synced to playback | 📝 **Comments**<br/>Browse comments under the player | 🔗 **Related videos**<br/>Swipe to switch without stopping |
| ☀️/🌙 **Light & dark themes**<br/>One-click switch | 📊 **Slack stats**<br/>Today / week / total watch time | 🔔 **Smart alerts**<br/>approval / question / done / blocked |
| 🟢 **Status badge**<br/>working / idle / needs you | 🔎 **Video search**<br/>Search by keyword, paginated | 🕘 **Watch history**<br/>Local records, resume unfinished videos |

## 📦 Install

### One-command install (recommended)

```bash
# In your DSH deployment profile (the dir containing cordis.yml)
dsh plugin --profile web add dsh-client-deep-sneak
```

Or install [dsh-market](https://github.com/dsh-market/dsh-market) and search for **DeepSneak** in Settings → Plugin Marketplace.

### Manual install

```bash
# 1. In your DSH deployment profile (the dir containing cordis.yml)
cd ~/.dsh/profiles/web
npm install dsh-client-deep-sneak
```

```yaml
# 2. Append to cordis.patch.yml:
- insert:
    - id: deep-sneak
      name: dsh-client-deep-sneak
```

```bash
# 3. Restart
npx @deepseek-ai/dsh web
```

Refresh the page — the DeepSneak mini-window appears bottom-right.

## 🚀 Quick start

1. Click a card in the home feed → native player plays with danmaku
2. Search Bilibili from the top box (or the 🔍 Search tab); results are paginated
3. Let the agent work while you watch
4. When the agent needs you: video auto-pauses + a mask reminds you
5. "Continue watching" resumes **from the exact position**
6. Toggle ☀️/🌙 theme, check 📊 stats anytime
7. Open **🕘 Watch history** for the last 50 videos — unfinished ones resume, completed ones start from the beginning

## ❓ FAQ

**Why only 720p?** Bilibili's quality limit for unauthenticated APIs; use the Bilibili web site for HD.
**Why not Douyin?** douyin.com sends `X-Frame-Options: DENY` — embedding is impossible; its web APIs require signed auth.
**Where is my data?** Everything stays in your browser (localStorage): theme, danmaku/comments toggles, slack stats, and watch history. Nothing is uploaded.

## 🗺 Roadmap

- [x] Home feed (no login)
- [x] Native player + exact resume
- [x] Danmaku / comments
- [x] Light & dark themes
- [x] Slack stats
- [x] Watch history & continue watching (local-only, 50 items)
- [ ] Slack-time goal reminders
- [ ] Danmaku density / size / speed settings

## 📄 License

[MIT](LICENSE)
