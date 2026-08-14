# 边看边等 · B站悬浮播放器（dsh-client-bili-watch）

> DeepSeek Harness (DSH) 的摸鱼神器：让 agent 干活，你在右下角看 B站。
> agent **完成 / 阻塞 / 请求权限 / 提问** 时，自动暂停/停止视频并提醒你回到对话。

![plugin](https://img.shields.io/badge/DSH-web%20client%20plugin-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## 功能

- 🌐 **网页模式（默认）**：内嵌完整的 `www.bilibili.com` 网页——**在窗口内登录自己的 B站账号**，用你的个性化首页、搜索、弹幕、高画质，就像在浏览器里逛 B站
- 🎬 **播放器模式**：原生播放器（首页推荐 + 相关推荐），暂停后点「继续看视频」**从原位置续播**
- 🔎 **BV 号快速打开**：底部输入框粘贴 BV 号或链接（含 `?p=2` 分P），网页模式跳到对应视频页、播放器模式直接原生播放
- 🔔 **智能暂停提醒**：当前会话的 agent 需要你时，自动暂停/停止媒体并在顶部弹出提醒：
  | 场景 | 提示 |
  | --- | --- |
  | 请求权限（approval） | `agent 正在请求权限审批` |
  | 提问（question / ask_user_question） | `agent 正在向你提问` |
  | 方案确认（plan-review） | `agent 正在等待方案确认` |
  | 完成 / 阻塞 / 出错 | `agent 任务已结束…`（静态版）/ 精确区分 `任务阻塞`、`执行出错`（动态版，见下） |
- 🖥 **回到对话**：提醒时一键收起播放窗，随时点开继续
- 🟢 **状态徽标**：标题栏与最小化 pill 实时显示 agent 状态（🟢 工作中 / ⚪ 空闲 / 🔴 需要你）

## 安装

> 插件 = **Host 半区（B站 API/流代理）+ Client 半区（UI）**。零 npm 依赖、无需构建。

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

刷新页面后，右下角即出现「边看边等 · B站」面板（默认网页模式）。

## 使用

1. **网页模式（默认）**：面板内就是 B站网页——直接搜索/点视频/看弹幕；首次使用请**在窗口内登录**你的 B站账号（登录态保存在这个窗口内）
2. **播放器模式**：点标题栏「🎬 播放器」切换——首页推荐列表点卡片即播，暂停后从原位置续播
3. 让 agent 开始干活，一边看一边等
4. agent 需要你时：**媒体自动暂停/停止** + 顶部 Toast 提醒 + 面板变红
   - **回到对话**：收起面板去处理 agent 的请求
   - **继续看视频**：播放器模式从暂停位置续播；网页模式回到之前打开的页面

## 工作原理

- **网页模式**：直接 iframe 嵌入 `www.bilibili.com`（B站未设置 `X-Frame-Options`，允许嵌入）。跨域 iframe **无法程序化暂停**，因此提醒时卸载 iframe（停止声音），「继续看」重新加载之前打开的页面；登录态在窗内独立保存
- **Host 半区**（`lib/index.js`）注册两个同源代理路由（供播放器模式使用；浏览器无法直连 B站——API 对跨域返回 403，CDN 校验 Referer/UA）：
  - `GET /dsh-bili/api?u=<url>` — 代理 `api.bilibili.com` 的 JSON 接口（首页推荐、视频信息、播放地址、相关推荐）
  - `GET /dsh-bili/media?u=<url>` — 代理 B站 CDN 视频流，**转发 Range 请求**（播放器可拖动/续播），只放行 B站 CDN 域名
- **Client 半区**（`lib/client.js`）注册在 `shell.overlay` 插槽：
  - 通过 `useSessions` 快照实时跟踪当前会话：`pendingInteraction`（approval/question/plan-review）+ `running` 转换（完成/阻塞/出错 → 任务结束）
  - 面板收起时**仅 CSS 隐藏**、video/iframe 元素不卸载 → 播放器模式进度始终保留

## 目录结构

```
├── lib/
│   ├── index.js      # Host 半区：/dsh-bili/api + /dsh-bili/media 代理路由
│   └── client.js     # Client bundle（__ModuleLoader__ 格式，手写源码，无需构建）
├── src/dynamic/      # 动态 Cordis 插件原型（bili-1/pkg-4）源码归档：
│   │                 #   Host 半区含 goal/changed 阻塞 + agent/error 出错的精确检测
│   │                 #   （动态版经 harness RPC 通信，静态版走 webServer 路由）
├── package.json      # dsh.client 声明：platform=web, inject=@deepseek-ai/dsh-client-runtime
└── README.md
```

## 已知限制

- **网页模式**：跨域 iframe 无法暂停/续播，提醒时页面被停止，「继续看」回到之前打开的页面（视频从头播放）；登录态独立于浏览器主窗口保存
- **播放器模式**：无登录画质上限 720p、无弹幕（B站对未登录 API 的限制）
- 部分 UP 主限制外链的视频在播放器模式可能无法获取播放地址（网页模式不受影响）
- 网页模式采用 16:9 横屏比例，宽度随窗口大小自适应（上限 720px，同时受视口宽高约束）

## License

[MIT](LICENSE)
