# MDTool · 双机传输

一个纯前端的点对点传输工具，两台设备通过 WebRTC 直连，实时同步文字、互发图片与文件，**无需登录、无需后端、无需中转服务器**。内置一个 Markdown 编辑器作为次要工具，可一键切换。

🔗 在线体验：<https://katrina55553.github.io/MDTool/>

## 功能特性

### 核心功能：双机传输

- **P2P 直连** —— 基于 PeerJS / WebRTC，握手后两台设备直接传输数据，不经过任何自建服务器
- **共享笔记** —— 底部文本框双方实时同步编辑，适合快速共享一段文字、URL、代码片段
- **图片传输** —— 图片发送后接收方**直接内联显示**在消息流里，点击可下载；不强制保存到本地
- **文件传输** —— 任意类型文件，单文件 ≤ 200MB，分片 + 背压控制保证大文件稳定
- **消息流** —— 聊天式布局，发送方右对齐、接收方左对齐，传输进度实时可见
- **接收无需确认** —— 文件/图片到达即接收，不弹确认窗，类似同房间设备间的「AirDrop」体验
- **可取消** —— 传输过程中任一方可点「×」中断，对方会同步停止

### 次要功能：Markdown 工具

- **实时预览** —— 左侧编辑器输入，右侧即时渲染
- **GFM 支持** —— 表格、任务列表、删除线、自动链接
- **代码高亮** —— 基于 highlight.js
- **数学公式** —— KaTeX 渲染，兼容 LaTeX 语法
- **Mermaid 图表** —— 流程图、时序图、类图等

### 通用特性

- **主题切换** —— 深色 / 浅色双主题，跟随系统首选项
- **本地缓存** —— 共享笔记与 Markdown 内容自动保存到 localStorage
- **响应式布局** —— 桌面端左右分栏，移动端自动堆叠
- **零后端依赖** —— 纯前端部署，可直接托管到任何静态站点服务

## 技术栈

| 维度 | 技术 |
|------|------|
| 构建工具 | Vite 5 |
| 框架 | React 18 + TypeScript |
| P2P 传输 | PeerJS（WebRTC 数据通道 + 公共信令服务器） |
| 编辑器 | CodeMirror 6（`@uiw/react-codemirror`） |
| Markdown 解析 | react-markdown + remark-gfm + remark-math |
| 代码高亮 | rehype-highlight + highlight.js |
| 数学公式 | rehype-katex + KaTeX |
| 图表 | Mermaid |
| 样式 | 原生 CSS + CSS 变量（主题切换） |
| 部署 | GitHub Actions + GitHub Pages |

## 本地开发

### 环境要求

- Node.js 18+（推荐 20，Vite 5 强制要求）
- npm 9+

### 启动步骤

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 双机传输使用说明

### 建立连接

顶部工具栏中部的「我的 ID / 输入对方 ID」面板用于建立 P2P 连接。ID 由用户手动设置，范围为 1-99 的整数，便于口述与交换。

1. **A 与 B 两台设备**同时打开本工具（需能访问公网，建议同一局域网更稳定）
2. 双方各自在「设置我的 ID (1-99)」框中输入一个数字（**两人不能相同**），点「设置」。若提示 ID 已被占用，换一个数字重试
3. A 在「对方 ID (1-99)」框中输入 B 的数字 → 点「连接」，A 进入「等待对方确认…」
4. B 的工具栏会弹出「A 的 ID 请求连接 [接受][拒绝]」提示，点「接受」
5. 状态指示灯变绿即表示连接成功

若 B 点「拒绝」，A 会收到「对方拒绝连接」提示并自动回到待机状态。

### 传输文字

连接成功后，主界面底部的「共享笔记」文本框可双方实时同步编辑：

- 任一方输入文字，另一方文本框内容实时同步
- 内容会自动保存到 localStorage，刷新不丢失
- 同步策略：每次按键即发送当前全文给对方，对方直接覆盖本地内容
- 适合「一人主笔 + 另一人补充」的场景；两人同时编辑同一段会互相覆盖

### 传输图片与文件

连接成功后工具栏会出现「发送文件」按钮（绿色描边）。

1. 任一方点「发送文件」→ 系统文件选择对话框 → 选中文件（≤ 200MB）即开始传输
2. 主界面上方的消息流会出现一张传输卡片，显示文件名、大小、进度条、百分比与「取消」按钮
3. 接收方**无需确认**，卡片自动出现在其消息流，进度同步推进
4. 传输完成时：
   - **图片**：直接在消息流里内联显示，点击可下载
   - **其他文件**：浏览器自动触发下载，消息流留一条记录（可点击再次下载）
5. 传输过程中任一方可点「×」取消，对方会收到 `file-cancel` 消息并停止

### 切换到 Markdown 工具

工具栏左侧有「Markdown 工具」按钮，点击切换到原 Markdown 编辑器 + 预览布局。Markdown 内容仅本地使用，不参与 P2P 同步。点「返回传输」回到主界面。

## 协作机制

- **ID 分配**：用户在工具栏手动输入 1-99 的整数作为 PeerJS 客户端 ID。由于 PeerJS 公共信令服务器上的 ID 全局唯一，100 以内的数字极易冲突，被占用时会提示并允许换号重试
- **连接确认**：主动方发起连接后先发送 `hello` 控制消息，被动方收到 `connection` 事件后进入 `incoming` 状态并在 UI 上显示接受/拒绝按钮。被动方接受则回 `accept`，双方进入已连接状态；拒绝则回 `reject` 并关闭，主动方收到明确反馈后回到待机
- **传输方式**：PeerJS 默认走官方公共信令服务器（`0.peerjs.com`）完成一次握手，握手成功后两台设备之间建立 WebRTC 数据通道直连，数据在浏览器之间点对点传输，不经过任何自建后端
- **文字同步粒度**：每次本地编辑（按键触发）即发送当前全文给对方，对方直接覆盖本地内容
- **文字冲突策略**：简单覆盖，不合并、不锁定
- **首次同步**：连接刚建立（双方都进入 connected）时各推送一次当前笔记内容给对方，后到者覆盖先到者
- **文件传输协议**：在原有连接控制消息（`hello`/`accept`/`reject`）之上扩展四类消息：
  - `file-meta`：文件元数据（id、文件名、大小、MIME）
  - `file-chunk`：单分片（16KB ArrayBuffer + 序号）
  - `file-end`：所有分片发送完毕
  - `file-cancel`：任一方主动取消
- **分片与背压**：单条 WebRTC DataChannel 消息有大小限制，文件按 16KB 切片顺序发送；通过监控底层 `RTCDataChannel.bufferedAmount`，达到 4MB 阈值时暂停发送、降到 1MB 以下再继续，避免大文件爆浏览器缓冲区
- **图片接收策略**：图片 MIME 收齐分片后转 `data URL`，作为消息卡片内联显示在消息流，**不自动下载**；非图片文件仍触发浏览器下载，并在消息流留一条带 `blobUrl` 的记录供再次下载
- **单文件限制**：当前一次只能发送一个文件，正在发送时按钮置灰；接收不受此限
- **断开重连**：点「断开」或关闭页面即结束会话；再次连接需重新输入对方 ID 并重新确认。连接中断时所有进行中的传输标记为失败
- **同网络优势**：同 Wi-Fi/局域网下走局域网 IP 直连，延迟最低、最稳定；跨网络可能受 NAT 类型限制无法直连

## 项目结构

```
MDTool/
├── .github/workflows/
│   └── deploy.yml                  # GitHub Pages 自动部署工作流
├── src/
│   ├── components/
│   │   ├── Editor.tsx              # CodeMirror 编辑器封装（Markdown 视图）
│   │   ├── Preview.tsx             # react-markdown 渲染与插件配置
│   │   ├── MermaidBlock.tsx        # Mermaid 代码块自定义渲染
│   │   ├── MessageStream.tsx       # 消息流组件（图片/文件卡片 + 进度）
│   │   └── Toolbar.tsx             # 顶部工具栏（视图切换 + P2P 面板 + 主题）
│   ├── context/
│   │   └── ThemeContext.tsx        # 主题 Context + Provider
│   ├── hooks/
│   │   ├── useLocalStorage.ts      # localStorage 持久化 Hook
│   │   └── usePeer.ts              # PeerJS 连接、文件传输、消息流封装
│   ├── utils/
│   │   └── sampleContent.ts        # Markdown 视图初始示例内容
│   ├── App.tsx                     # 根组件（视图切换 + 状态编排）
│   ├── main.tsx                    # 应用入口
│   └── index.css                   # 全局样式 + CSS 变量主题
├── index.html
├── vite.config.ts                  # Vite 配置（含 base 路径）
├── tsconfig.json
└── package.json
```

## 部署说明

项目通过 GitHub Actions 自动部署到 GitHub Pages。

### 自动部署流程

1. 推送到 `main` 分支即触发 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
2. 工作流执行 `npm ci` → `npm run build` → 上传 `dist/` 产物
3. 自动部署到 GitHub Pages

### 一次性配置

首次部署需在仓库 **Settings → Pages** 中将 **Source** 设为 **GitHub Actions**。

### 自定义域名

如需使用自定义域名，在 `public/` 目录下添加 `CNAME` 文件（内容为你的域名），并修改 `vite.config.ts` 中的 `base` 为 `'/'`。

## 实现要点

### 视图切换

`App.tsx` 维护一个 `view: 'transfer' | 'markdown'` 状态，默认 `transfer`：

- **transfer 视图**：上方 `<MessageStream>`（flex:1）+ 下方「共享笔记」`<textarea>`（200px 固定高度）
- **markdown 视图**：原 `<Editor>` + `<Preview>` 左右分栏

工具栏左侧的「Markdown 工具 / 返回传输」按钮切换视图。两种视图共享同一个 `usePeer` 实例，意味着在 Markdown 视图下连接与传输照常进行，传输条仍会出现在工具栏下方。

### 主题切换

通过 `data-theme` 属性切换 CSS 变量集，覆盖背景、前景、边框、代码块、消息气泡等颜色。`index.html` 内联脚本在 React 加载前应用主题，避免首屏闪烁。CodeMirror 与 highlight.js 主题通过动态切换 `<link>` 标签实现。

### Mermaid 渲染

`MermaidBlock` 组件在 `useEffect` 中调用 `mermaid.render()` 生成 SVG，通过 React state 管理渲染结果。主题切换时重新 `initialize` mermaid 并触发重渲染，确保图表配色与全局主题一致。

### 本地缓存

`useLocalStorage` Hook 通用化封装 localStorage 读写，JSON 序列化 + try-catch 容错。用于持久化：

- 共享笔记内容（key: `note-content`）
- Markdown 编辑器内容（key: `md-content`）
- 主题选择（key: `md-theme`）

### P2P 连接

`usePeer` Hook 封装 PeerJS 客户端：用户在工具栏输入 1-99 的数字 ID 后调用 `init(id)` 实例化 `Peer` 并以此 ID 注册到公共信令服务器（ID 被占用会回到 idle 允许重试，并显示中文友好错误提示）。被动方监听 `connection` 事件，收到请求后进入 `incoming` 状态并暴露 `acceptConn` / `rejectConn`；主动方调用 `peer.connect(remoteId)` 发起连接，连接 open 后先发 `hello` 控制消息进入等待确认。

连接确认采用最小应用层协议：

| 消息 | 方向 | 含义 |
|------|------|------|
| `hello` | 主动方 → 被动方 | 请求连接 |
| `accept` | 被动方 → 主动方 | 接受连接，双方进入 connected |
| `reject` | 被动方 → 主动方 | 拒绝连接，主动方收到反馈并回到待机 |

字符串内容（共享笔记同步）仍走同一 `DataConnection` 传输，`usePeer` 通过 `typeof data === 'string'` 区分控制消息与文本内容。

### 文件传输

文件传输复用 PeerJS 同一条 `DataConnection`，扩展四类应用层消息：

| 消息 | 方向 | 含义 |
|------|------|------|
| `file-meta` | 发送方 → 接收方 | 文件元数据（id / 名称 / 大小 / MIME） |
| `file-chunk` | 发送方 → 接收方 | 单分片（16KB ArrayBuffer + 序号） |
| `file-end` | 发送方 → 接收方 | 所有分片发送完毕，触发接收方拼接处理 |
| `file-cancel` | 双向 | 任一方主动取消 |

**发送端**（`usePeer.sendFile`）：

- 200MB 上限 + 空文件校验，超限直接报错
- 生成 `crypto.randomUUID()` 作为本次传输 ID
- 文件按 16KB 切片，`file.slice(offset, end).arrayBuffer()` 异步读取
- 通过 `(conn as any).dataChannel ?? _dc` 拿到底层 `RTCDataChannel`，循环检测 `bufferedAmount`，超过 4MB 暂停发送、降到 1MB 以下再继续 —— 这是大文件不爆浏览器的关键
- 每个 chunk 发送后更新 `transfers` 状态，UI 进度条随之推进
- 取消标记用 `useRef<Set<string>>` 维护，发送循环每片检查；连接断开时整体标记为 `error`
- 发送完成后也把文件加到自己的消息流（图片转 dataUrl 内联，其他文件保留 blobUrl）

**接收端**（`handleData` 内 `file-meta` / `file-chunk` / `file-end` / `file-cancel` 分支）：

- `file-meta` 到达时新建 `ReceiverState { meta, chunks: Map<index, ArrayBuffer>, received }` 并插入 `transfers` 列表，UI 立即显示一张接收卡片
- `file-chunk` 到达时写入对应槽位、累加 `received` 字节、增量更新进度
- `file-end` 到达时按 `index` 升序取出所有 `ArrayBuffer` → `new Blob(arr, { type: mime })` → 根据 MIME 分流：
  - **图片**：`FileReader.readAsDataURL` 转 data URL，作为 `kind: 'image'` 消息加入 `messages`，UI 内联渲染 `<img>`，不触发下载
  - **其他文件**：触发浏览器下载 + 保留 `blobUrl` 作为 `kind: 'file'` 消息加入 `messages`，供用户点击再次下载
- `file-cancel` 到达时清理本地状态、标记为 `canceled`

### 消息流 UI

`MessageStream` 组件渲染聊天式消息流：

- **左右对齐**：发送方（`direction: 'send'`）气泡右对齐、蓝色背景；接收方左对齐、灰色背景
- **图片消息**：`<img>` 直接内联显示，`max-height: 320px`，点击触发下载
- **文件消息**：横向卡片（📎 图标 + 文件名 + 大小 + 下载图标），点击下载
- **传输中状态**：`transfers` 中 `status: 'active'` 的项目以进度条形式追加在消息流末尾
- **自动滚动**：新消息或进度变化时 `scrollTop = scrollHeight`
- **清空记录**：右上角「清空」按钮调用 `clearMessages`，同时 `revokeObjectURL` 释放 blobUrl 避免内存泄漏
- **空状态**：未连接或无消息时显示引导文案

### 传输卡片（Markdown 视图下）

在 Markdown 视图下，工具栏下方仍会显示 `.transfers-bar` 横条卡片（与 transfer 视图的消息流独立），保证用户切到 Markdown 视图时也能看到传输进度。每张卡片包含方向徽章（↑ 发送蓝 / ↓ 接收紫）+ 文件名 + 大小 + 4px 进度条 + 状态文案 + 取消按钮。已完成 / 失败 / 取消的卡片 3 秒后自动消失。

## 许可证

MIT
