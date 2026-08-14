# 边看边等 · B站悬浮播放器（dsh-client-bili-watch）

DeepSeek Harness 的摸鱼插件：右下角小窗看 B站，agent 干活时视频自动暂停提醒你，处理完回来**从原位置精确续播**。

## 功能

- 🏠 **首页推荐**：B站真实首页推荐流（免登录），封面卡片浏览，点卡片即播
- ▶️ **原生播放器**：支持进度条拖动、倍速；agent 需要你时**原位置暂停**，点「继续看视频」**精确续播**
- 💬 **弹幕**：原生播放器叠加滚动弹幕（与播放进度同步，可开关）
- 📝 **评论区**：播放页下方浏览评论，可加载更多
- 🔗 **相关推荐**：播放页下方横滑换片；底部输入框可粘贴 BV 号直接打开
- 📊 **摸鱼统计**：标题栏「📊」查看今日 / 本周 / 累计摸鱼时长、今日视频数、近 7 天分布（本地持久化）
- 🔔 **智能提醒**：agent 完成 / 阻塞 / 请求权限 / 提问时，半透明蒙版提示，一键回到对话
- 🟢 **状态徽标**：实时显示 agent 状态（工作中 / 空闲 / 需要你）

## 安装

```bash
# 1. 在 DSH 部署目录（含 cordis.yml 的 profile，如 ~/.dsh/profiles/web）安装
npm install github:Rain-Shuoyu/dsh-client-bili-watch

# 2. cordis.patch.yml 追加：
#    - insert:
#        - id: dsh-client-bili-watch
#          name: dsh-client-bili-watch

# 3. 重启
npx @deepseek-ai/dsh web
```

刷新页面后右下角即出现播放器。

## 说明

- 免登录画质最高 720p（B站 API 限制）；弹幕/评论经 Host 代理获取
- 抖音因 `X-Frame-Options: DENY` 无法嵌入，故聚焦 B站

## License

[MIT](LICENSE)
