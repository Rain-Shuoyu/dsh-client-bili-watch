# 边看边等 · B站悬浮播放器（dsh-client-bili-watch）

> DeepSeek Harness (DSH) 的摸鱼神器：让 agent 干活，你在右下角的**小窗**里逛 B站。
> agent **完成 / 阻塞 / 请求权限 / 提问** 时，页面停止并在小窗上盖一层**半透明蒙版**提醒你回到对话。

![plugin](https://img.shields.io/badge/DSH-web%20client%20plugin-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## 功能

- 🏠 **首页推荐流**：小窗渲染 **B站真实首页推荐**（rcmd 接口，免登录、支持"换一批"），卡片式浏览，封面完整显示
- ▶️ **原生播放器**：点卡片（或输入 BV 号）→ **原生 `<video>` 播放**（经 Host 流代理，支持进度条拖动/倍速）
- ⏸️ **精确暂停续播**：agent 需要你时视频**原位置暂停**（元素保持挂载、进度不丢），点「继续看视频」**从暂停处精确续播**
- 🔗 **相关推荐**：播放页下方横滑列表，随时换片
- 🔔 **半透明蒙版提醒**：agent 需要你时（请求权限 / 提问 / 方案确认 / 完成 / 阻塞 / 出错）盖上蒙版提示，回到对话去处理
- 🟢 **状态徽标**：标题栏与最小化 pill 实时显示 agent 状态（🟢 工作中 / ⚪ 空闲 / 🔴 需要你）

## 安装

> Host 半区（B站 API 代理）+ Client 半区（UI）。**零 npm 依赖、无需构建**。

### 1. 安装到 DSH 部署目录

在运行 DSH Web 的部署/profile 目录（例如 `~/.dsh/profiles/web`，即包含 `cordis.yml` 的那个目录）执行：

```bash
npm install github:Rain-Shuoyu/dsh-client-bili-watch
```

### 2. 注册到组合配置

编辑该目录下的 `cordis.patch.yml`，追加：

```yaml
- insert:
    - id: dsh-client-bili-watch
      name: dsh-client-bili-watch
```

> 若你的部署用其它组合文件（如 `cordis.yml`），把这一行加到对应 loader entries 即可。

### 3. 重启

```bash
npx @deepseek-ai/dsh web
```

刷新页面后，右下角即出现「边看边等 · B站」小窗。

## 使用

1. 打开后默认显示**首页推荐**——点任意卡片，或粘贴 **BV 号/链接** 到下方输入框，原生播放器开始播放（支持拖动/倍速）
2. 让 agent 开始干活，一边看一边等
3. agent 需要你时：**视频原位置暂停 + 顶部 Toast + 小窗上半透明蒙版**
   - **回到对话**：收起小窗去处理 agent 的请求
   - **继续看视频**：从暂停处**精确续播**

## 工作原理

- 注册在 DSH 客户端 `shell.overlay` 插槽（全屏浮动层，additive id）
- **Host 半区**（`lib/index.js`）注册两个同源代理路由（浏览器无法直连 B站：API 跨域 403、视频 CDN 校验 Referer）：
  - `GET /dsh-bili/api?u=<url>` — JSON 代理（首页推荐 rcmd / 视频信息 / 播放地址 / 相关推荐），注入随机 `buvid3`（免登录）
  - `GET /dsh-bili/media?u=<url>` — 视频流代理，**转发 Range**（原生播放器可拖动/续播），只放行 B站 CDN 域名
- **Client 半区**渲染首页推荐流，点击卡片 → 取 BV → `view` + `playurl` 接口拿播放地址 → **原生 `<video>`** 播放
- 封面图加 `referrerPolicy="no-referrer"`：B站图片 CDN 对带外部 Referer 的请求返回 403（反盗链），去掉 Referer 即可正常加载
- 通过 `useSessions` 快照实时跟踪当前会话：`pendingInteraction`（approval / question / plan-review）+ `running` 转换（完成 / 阻塞 / 出错 → 任务结束）
- 提醒时对 `<video>` 执行 `pause()`（元素保持挂载 → 进度精确保留），「继续看视频」执行 `play()` 精确续播
- 动态插件原型（`src/dynamic/`）另含 Host 半区：`goal/changed` 阻塞 + `agent/error` 出错的精确检测（经 harness RPC）

## 目录结构

```
├── lib/
│   ├── index.js      # Host 半区：/dsh-bili/api JSON 代理（buvid3）+ /dsh-bili/media 流代理（Range）
│   └── client.js     # Client bundle（__ModuleLoader__ 格式，手写源码，无需构建）
├── src/dynamic/      # 动态 Cordis 插件原型（bili-1/pkg-12）源码归档（含阻塞/出错精确检测）
├── package.json      # dsh.client 声明：platform=web, inject=@deepseek-ai/dsh-client-runtime
└── README.md
```

## 已知限制

- 原生播放器为未登录画质（最高 720p），无弹幕（B站对免登录 API 的限制）
- 播放器模式下相关推荐/搜索等使用 B站网页的能力不可用——换片请用「← 首页」返回推荐流或下方输入框
- 抖音等站点因 `X-Frame-Options: DENY` 无法嵌入（见 FAQ）

## FAQ：为什么不做抖音？

- `www.douyin.com` 响应头为 `x-frame-options: DENY` + CSP `frame-ancestors` 白名单（仅字节系内部域名），**任何站点都无法 iframe 嵌入抖音网页**
- 抖音网页版推荐 feed API（`aweme/v1/web/recommend/feed` 等）需要签名参数（a_bogus）与登录 Cookie，无公开免登录接口，原生「刷抖音」feed 不可行
- 因此插件聚焦 B站（可嵌入、免登录浏览、可登录账号），已在 sandbox 约束下做到全程小窗

## License

[MIT](LICENSE)
