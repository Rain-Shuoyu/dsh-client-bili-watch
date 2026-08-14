# 边看边等 · B站悬浮播放器（dsh-client-bili-watch）

> DeepSeek Harness (DSH) 的摸鱼神器：让 agent 干活，你在右下角看 B站。
> agent **完成 / 阻塞 / 请求权限 / 提问** 时，自动暂停视频并提醒你回到对话；点「继续看视频」**从暂停位置续播**。

![plugin](https://img.shields.io/badge/DSH-web%20client%20plugin-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## 功能

- 🏠 **首页推荐**：像正常网页一样浏览 B站综合热门榜（封面/标题/UP主/播放量），点击即播，无需记 BV 号
- ▶️ **原生播放器**：支持播放/暂停/进度条拖动/倍速；暂停后续播**从原位置继续**（不再是重头播放）
- 🔗 **相关推荐**：播放页下方展示当前视频的相关推荐，随时换片
- 🔎 **BV 号快速打开**：底部输入框仍支持粘贴 BV 号或链接（含 `?p=2` 分P）
- 🔔 **智能暂停提醒**：当前会话的 agent 需要你时，自动暂停视频并在顶部弹出提醒：
  | 场景 | 提示 |
  | --- | --- |
  | 请求权限（approval） | `agent 正在请求权限审批` |
  | 提问（question / ask_user_question） | `agent 正在向你提问` |
  | 方案确认（plan-review） | `agent 正在等待方案确认` |
  | 完成 / 阻塞 / 出错 | `agent 任务已结束…`（静态版）/ 精确区分 `任务阻塞`、`执行出错`（动态版，见下） |
- 🖥 **回到对话**：提醒时一键收起播放窗（视频保持暂停、进度保留），随时点开继续
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

刷新页面后，右下角即出现「边看边等 · B站」播放窗。

## 使用

1. 打开后自动加载**首页推荐**，点任意视频卡片即可播放；或粘贴 **BV 号/链接** 到下方输入框回车打开
2. 让 agent 开始干活，一边看视频一边等
3. agent 需要你时：**视频自动暂停（进度保留）** + 顶部 Toast 提醒 + 面板变红
   - **回到对话**：收起播放窗去处理 agent 的请求（回来点开，进度还在）
   - **继续看视频**：从暂停位置继续播放

## 工作原理

- **Host 半区**（`lib/index.js`）注册两个同源代理路由（浏览器无法直连 B站：API 对跨域返回 403，CDN 校验 Referer/UA）：
  - `GET /dsh-bili/api?u=<url>` — 代理 `api.bilibili.com` 的 JSON 接口（首页推荐、视频信息、播放地址、相关推荐）
  - `GET /dsh-bili/stream?u=<url>` — 代理 B站 CDN 视频流，**转发 Range 请求**（播放器可拖动/续播），只放行 B站 CDN 域名
- **Client 半区**（`lib/client.js`）注册在 `shell.overlay` 插槽：
  - 原生 `<video>` 播放代理流 → **暂停/续播/拖动完全可控**
  - 通过 `useSessions` 快照实时跟踪当前会话：`pendingInteraction`（approval/question/plan-review）+ `running` 转换（完成/阻塞/出错 → 任务结束）
  - 面板收起时**仅 CSS 隐藏**、video 元素不卸载 → 播放进度始终保留

## 目录结构

```
├── lib/
│   ├── index.js      # Host 半区：/dsh-bili/api + /dsh-bili/stream 代理路由
│   └── client.js     # Client bundle（__ModuleLoader__ 格式，手写源码，无需构建）
├── src/dynamic/      # 动态 Cordis 插件原型（bili-1/pkg-2）源码归档：
│   │                 #   Host 半区含 goal/changed 阻塞 + agent/error 出错的精确检测
│   │                 #   （动态版经 harness RPC 通信，静态版走 webServer 路由）
├── package.json      # dsh.client 声明：platform=web, inject=@deepseek-ai/dsh-client-runtime
└── README.md
```

## 已知限制

- 无登录画质上限 720p（B站对未登录用户的限制；需更高画质请自行登录后在网页端看）
- 无弹幕（原生播放器不带弹幕层）
- 搜索接口需要 B站登录态，故 v2 以「首页推荐 + 相关推荐」代替搜索
- 部分 UP 主禁止嵌入/限制外链的视频可能无法获取播放地址（B站侧限制，属正常现象）

## License

[MIT](LICENSE)
