# 边看边等 · B站悬浮播放器

DeepSeek agent 工作时的右下角悬浮 B站播放窗口：agent 完成 / 阻塞 / 请求权限 / 提问时，停止视频并回到对话界面提醒用户。

- **插件身份**：动态 Cordis 插件 `bili-1` / `pkg-1`（运行于 DSH 进程，本目录为源码归档）
- **Host 半区**（`host.js`）：监听 `goal/changed`（block → 阻塞）、`agent/error`（出错）、`agent/status`（running 时清除提醒）；通过 `get-attention` / `ack-attention` 两个 Package-private RPC 与 Client 通信
- **Client 半区**（`client.js`）：注册在 `shell.overlay` 插槽；右下角播放窗 + 顶部 Toast；通过 `useSessions` 快照实时跟踪当前会话的 `running` / `pendingInteraction`（approval / question / plan-review）
- **视频暂停策略**：原生 `<video>`。提醒时 `pause()`，元素保持挂载，进度不丢；继续时从当前位置 `play()`。观看历史另外把进度持久化到 localStorage，未看完可续播，看完后下次从头播放

## 提醒触发源

| 场景 | 检测来源 |
| --- | --- |
| 请求权限 | 会话 `pendingInteraction === 'approval'` |
| 提问 | 会话 `pendingInteraction === 'question'` |
| 方案确认 | 会话 `pendingInteraction === 'plan-review'` |
| 任务阻塞 | Host `goal/changed` operation === 'block' |
| 执行出错 | Host `agent/error` |
| 任务完成 | 会话 `running` 由 true → false 转换 |

## 使用

1. 首页推荐 / 搜索 / 观看历史点卡片打开原生播放器
2. 标题栏「—」最小化为右下角 pill（状态圆点：🟢 工作中 / ⚪ 空闲 / 🔴 需要你）
3. 提醒出现后：「回到对话」收起播放窗 / 「继续看视频」从暂停位置继续
