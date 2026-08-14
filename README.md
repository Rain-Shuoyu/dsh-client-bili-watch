# 边看边等 · B站悬浮播放器（dsh-client-bili-watch）

> DeepSeek Harness (DSH) 的摸鱼神器：让 agent 干活，你在右下角看 B站。
> agent **完成 / 阻塞 / 请求权限 / 提问** 时，自动停止视频并提醒你回到对话。

![plugin](https://img.shields.io/badge/DSH-web%20client%20plugin-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## 功能

- 🎬 **悬浮播放窗**：右下角浮动 B站播放器（官方 `player.bilibili.com` 嵌入，高清 + 弹幕 + 自动播放），支持输入 **BV 号** 或 **完整链接**（含 `?p=2` 分P）
- 🔔 **智能暂停提醒**：当前会话的 agent 需要你时，自动停止视频并在顶部弹出提醒：
  | 场景 | 提示 |
  | --- | --- |
  | 请求权限（approval） | `agent 正在请求权限审批` |
  | 提问（question / ask_user_question） | `agent 正在向你提问` |
  | 方案确认（plan-review） | `agent 正在等待方案确认` |
  | 完成 / 阻塞 / 出错 | `agent 任务已结束（完成 / 阻塞 / 出错）` |
- 🖥 **回到对话**：提醒时一键收起播放窗回到聊天界面，也可点「继续看视频」重新打开播放器
- 🟢 **状态徽标**：窗口标题栏与最小化 pill 实时显示 agent 状态（🟢 工作中 / ⚪ 空闲 / 🔴 需要你）

## 安装

> 插件是**纯浏览器端**的 DSH client plugin（`dsh.client` 声明），零依赖、无需构建。

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

1. 在输入框粘贴 **BV 号**（如 `BV1GJ411x7h7`）或 **视频链接**（如 `https://www.bilibili.com/video/BV1GJ411x7h7?p=2`），回车或点「打开」
2. 让 agent 开始干活，一边看视频一边等
3. agent 需要你时：视频停止 + 顶部 Toast 提醒 + 面板变红
   - **回到对话**：收起播放窗，处理 agent 的请求
   - **继续看视频**：重新打开播放器（从开头播放）
4. 点标题栏「—」可最小化为右下角 pill，随时点开

## 工作原理

- 注册在 DSH 客户端 `shell.overlay` 插槽（全屏浮动层，additive id，不遮挡其它 UI）
- 通过插槽标准 prop `useSessions` 实时订阅当前会话快照：
  - `pendingInteraction`（`approval` / `question` / `plan-review`）→ 精确区分「请求权限 / 提问 / 方案确认」
  - `running` 由 `true → false` 转换 → 「任务已结束」（完成 / 阻塞 / 出错时 agent 都会停止）
- **暂停策略**：B站跨域 iframe 没有公开的 postMessage 控制协议，无法程序化暂停，因此提醒时直接卸载 iframe（彻底停止音视频），重新打开后从头播放

## 目录结构

```
├── lib/
│   ├── index.js      # Host loader 入口（浏览器专属插件，无 Host 行为）
│   └── client.js     # 客户端 bundle（__ModuleLoader__ 格式，手写源码，无需构建）
├── src/dynamic/      # 早期动态 Cordis 插件原型（bili-1）源码归档，含 Host 半区的阻塞/出错精确检测
├── package.json      # dsh.client 声明：platform=web, inject=@deepseek-ai/dsh-client-runtime
└── README.md
```

## 限制与路线图

- [ ] 重新打开视频后从头播放（跨域 iframe 无法读取进度；若 B站开放播放器 API 可改进）
- [ ] 精确区分「阻塞」与「出错」原因（当前合并为「任务已结束」；`src/dynamic/` 中的 Host 半区方案可在后续版本通过 host remote 服务接入）
- [ ] 部分 UP 主禁止嵌入的视频无法播放（显示 B站错误页，属正常现象）

## License

[MIT](LICENSE)
