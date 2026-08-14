# 边看边等 · B站悬浮播放器（dsh-client-bili-watch）

> DeepSeek Harness (DSH) 的摸鱼神器：让 agent 干活，你在右下角的**小窗**里逛 B站。
> agent **完成 / 阻塞 / 请求权限 / 提问** 时，页面停止并在小窗上盖一层**半透明蒙版**提醒你回到对话。

![plugin](https://img.shields.io/badge/DSH-web%20client%20plugin-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## 功能

- 🏠 **首页推荐流**：小窗渲染 **B站真实首页推荐**（rcmd 接口，免登录、支持"换一批"），卡片式浏览
- ▶️ **点击卡片 → 获取 BV → 小窗跳转播放**：点推荐卡片（或输入 BV 号），iframe 跳到该视频页在小窗内播放（可登录账号看弹幕/高清）
- 🔒 **sandbox 硬性防跳转**：iframe 以沙箱运行（禁弹窗/禁顶层跳转），**绝不可能跳出小窗**
- 📐 **横屏 16:9 + 内容缩放**：视频页默认 **60%** 缩放（−/+/百分比可调，30%–120%）
- 🔔 **半透明蒙版提醒**：agent 需要你时（请求权限 / 提问 / 方案确认 / 完成 / 阻塞 / 出错），页面停止（静音）并盖上半透明蒙版提示，点「回到对话」去处理，点「继续浏览」回到页面
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

1. 打开后默认显示**首页推荐**——点任意卡片，或粘贴 **BV 号/链接** 到下方输入框，小窗内跳到视频页播放
2. 视频页内可**登录自己的 B站账号**（登录态保存在小窗内），看弹幕/高清
3. 让 agent 开始干活，一边看一边等
4. agent 需要你时：**页面停止（静音）+ 顶部 Toast + 小窗上半透明蒙版**
   - **回到对话**：收起小窗去处理 agent 的请求
   - **继续浏览**：重新加载之前打开的页面

## 工作原理

- 注册在 DSH 客户端 `shell.overlay` 插槽（全屏浮动层，additive id）
- **Host 半区**（`lib/index.js`）注册同源 JSON 代理 `GET /dsh-bili/api?u=<url>`：浏览器无法直连 B站 API（跨域 403），由 Host 服务端请求；为 rcmd 首页推荐接口注入随机 `buvid3` cookie（免登录）
- **Client 半区**渲染 B站真实首页推荐流（`x/web-interface/index/top/rcmd`），点击卡片拿到该视频的 **BV 号** → 设置 iframe 的 src 为对应视频页 → 在小窗内播放
- 视频页 iframe 以 `sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads"` 运行：保留登录/播放/表单，**禁止弹窗与顶层跳转**；内容缩放通过「布局宽度 ÷ 缩放比 + `transform: scale`」实现
- 通过 `useSessions` 快照实时跟踪当前会话：`pendingInteraction`（approval / question / plan-review）+ `running` 转换（完成 / 阻塞 / 出错 → 任务结束）
- 跨域 iframe 无法程序化暂停，因此提醒时**卸载 iframe**（彻底静音），「继续浏览」重新加载之前打开的页面
- 动态插件原型（`src/dynamic/`）另含 Host 半区：`goal/changed` 阻塞 + `agent/error` 出错的精确检测（经 harness RPC）

## 目录结构

```
├── lib/
│   ├── index.js      # Host 半区：/dsh-bili/api JSON 代理（buvid3）
│   └── client.js     # Client bundle（__ModuleLoader__ 格式，手写源码，无需构建）
├── src/dynamic/      # 动态 Cordis 插件原型（bili-1/pkg-9）源码归档（含阻塞/出错精确检测）
├── package.json      # dsh.client 声明：platform=web, inject=@deepseek-ai/dsh-client-runtime
└── README.md
```

## 已知限制

- 跨域 iframe 无法暂停/续播：提醒时页面停止，「继续浏览」回到之前打开的页面（视频从头播放）
- 视频页内的相关推荐/搜索若使用「新标签打开」会被 sandbox 拦截（点了不跳转，也无效果）——请用「← 首页」返回推荐流或下方输入框打开视频
- 抖音等站点因 `X-Frame-Options: DENY` 无法嵌入（见 FAQ）
- 视频页缩放后文字较小（60% 默认），可按需用 −/+ 调节

## FAQ：为什么不做抖音？

- `www.douyin.com` 响应头为 `x-frame-options: DENY` + CSP `frame-ancestors` 白名单（仅字节系内部域名），**任何站点都无法 iframe 嵌入抖音网页**
- 抖音网页版推荐 feed API（`aweme/v1/web/recommend/feed` 等）需要签名参数（a_bogus）与登录 Cookie，无公开免登录接口，原生「刷抖音」feed 不可行
- 因此插件聚焦 B站（可嵌入、免登录浏览、可登录账号），已在 sandbox 约束下做到全程小窗

## License

[MIT](LICENSE)
