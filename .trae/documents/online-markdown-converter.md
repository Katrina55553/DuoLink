# DuoLink · 双机传输 - 实施计划

## 一、需求摘要

构建一个纯前端的**双机点对点传输工具**，两台设备通过 WebRTC 直连，实时同步文字、互发图片与文件。Markdown 转换器作为次要工具保留，可一键切换。

**核心场景：**
- 两台设备（同房间 / 同局域网 / 跨网络）需要快速共享一段文字、几张图片或一个文件
- 不想登录任何账号，不想经过云盘中转，不想暴露内容给第三方
- 类似「网页版 AirDrop」的体验：打开网页 → 输入数字 ID → 互连 → 直接传输

**已确认范围：**
- 文字同步：共享文本框，双方实时同步编辑（简单覆盖策略，不合并）
- 图片传输：接收方**直接内联显示**在消息流里，不强制下载
- 文件传输：任意类型文件，单文件 ≤ 200MB，分片 + 背压控制
- 接收策略：**无需确认**，文件/图片到达即接收
- 单文件限制：当前一次只能发送一个文件，后续可扩展多文件
- Markdown 工具：降级为次要入口，工具栏切换按钮进入

**不包含：**
- 用户账号、登录、好友列表
- 自建信令服务器（使用 PeerJS 公共服务器）
- 文件永久存储（页面刷新即丢失，仅在内存中）
- 断点续传（连接中断即传输失败）
- 多人传输（仅 1 对 1）

## 二、现状分析

项目从「Markdown 转换器」演化而来。原有能力：

- React 18 + Vite 5 + TypeScript 脚手架
- CodeMirror 6 编辑器 + react-markdown 预览（GFM / KaTeX / highlight.js / Mermaid）
- 深色 / 浅色主题切换 + localStorage 缓存
- 已有 PeerJS 双机实时同步文字能力（1-99 数字 ID + 接受/拒绝确认）
- 已有文件传输能力（分片 + 背压 + 取消）

本次重构在上述基础上：

1. 主界面从「Markdown 编辑器 + 预览」改为「消息流 + 共享笔记」
2. 图片接收后改为内联显示而非自动下载
3. 新增 `MessageStream` 组件承载消息流 UI
4. 工具栏增加视图切换按钮，Markdown 降级为次要入口

## 三、技术选型与决策

| 维度 | 选型 | 理由 |
|------|------|------|
| 构建工具 | Vite 5 | 启动快，React 官方推荐 |
| 框架 | React 18 + TypeScript | 用户指定 |
| P2P 传输 | PeerJS | 封装 WebRTC，自带公共信令服务器，零后端 |
| 编辑器 | `@uiw/react-codemirror` + `@codemirror/lang-markdown` | CodeMirror 6 的 React 封装 |
| Markdown 解析 | `react-markdown` + `remark-gfm` + `rehype-katex` + `rehype-highlight` | React 生态原生，组件化渲染 |
| 数学公式 | `katex` + `rehype-katex` | 渲染快，兼容 LaTeX 语法 |
| 代码高亮 | `highlight.js` + `rehype-highlight` | 与 react-markdown 集成简单 |
| 图表 | `mermaid` | 自定义 code 组件渲染 |
| 样式方案 | 原生 CSS + CSS 变量 | 主题切换通过 `data-theme` 属性控制，零额外依赖 |

**关键决策：**
- **图片用 data URL 内联**：图片接收完成后转 `data URL` 直接 `<img src>` 显示，不触发下载。data URL 会占用内存，但单图片 ≤ 200MB 的限制下可接受；超大图片失败时降级为下载
- **非图片文件仍触发下载**：保留原下载行为，同时在消息流留一条带 `blobUrl` 的记录供再次下载
- **共享笔记用 `<textarea>` 而非 CodeMirror**：传输场景下文字同步是核心，CodeMirror 的复杂度不必要；用原生 `<textarea>` 即可，简单可靠
- **消息流独立于传输卡片**：transfer 视图用 `MessageStream`，markdown 视图仍显示原 `.transfers-bar` 横条卡片，两套 UI 独立但共享 `transfers` 状态
- **发送方也加入消息流**：发送完成后把文件加到自己的 `messages`，这样双方看到的消息流是对称的
- **不实现拖拽发送**：避免 over-engineering，后续可扩展

## 四、项目结构

```
DuoLink/
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
│   └── index.css                   # 全局样式 + CSS 变量主题定义
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 五、核心数据结构

### `usePeer` Hook 对外暴露

```typescript
interface UsePeerReturn {
  myId: string | null
  status: PeerStatus  // 'idle' | 'connecting' | 'awaiting' | 'incoming' | 'connected'
  error: string
  incomingFrom: string | null
  awaitingAccept: boolean
  transfers: FileTransfer[]      // 进行中 + 最近完成的传输（3 秒后自动移除）
  messages: Message[]            // 已完成的传输沉淀为消息，持久展示
  init: (id: string) => void
  acceptConn: () => void
  rejectConn: () => void
  connect: (remoteId: string) => void
  disconnect: () => void
  send: (text: string) => void   // 共享笔记同步
  sendFile: (file: File) => Promise<void>
  cancelTransfer: (id: string) => void
  clearMessages: () => void      // 清空消息流 + 释放 blobUrl
}
```

### `FileTransfer`（进行中状态）

```typescript
interface FileTransfer {
  id: string
  direction: 'send' | 'receive'
  name: string
  size: number
  mime: string
  transferred: number
  status: 'active' | 'done' | 'error' | 'canceled'
  error?: string
}
```

### `Message`（完成后沉淀）

```typescript
interface Message {
  id: string
  direction: 'send' | 'receive'
  kind: 'image' | 'file'
  name: string
  size: number
  mime: string
  dataUrl?: string   // 图片:data URL,直接 <img src>
  blobUrl?: string   // 文件:Blob URL,供下载按钮
  timestamp: number
}
```

## 六、应用层协议

### 连接控制

| 消息 | 方向 | 含义 |
|------|------|------|
| `hello` | 主动方 → 被动方 | 请求连接 |
| `accept` | 被动方 → 主动方 | 接受连接，双方进入 connected |
| `reject` | 被动方 → 主动方 | 拒绝连接，主动方收到反馈并回到待机 |

### 文件传输

| 消息 | 方向 | 含义 |
|------|------|------|
| `file-meta` | 发送方 → 接收方 | 文件元数据（id / 名称 / 大小 / MIME） |
| `file-chunk` | 发送方 → 接收方 | 单分片（16KB ArrayBuffer + 序号） |
| `file-end` | 发送方 → 接收方 | 所有分片发送完毕，触发接收方拼接处理 |
| `file-cancel` | 双向 | 任一方主动取消 |

### 文字同步

字符串直接走 `conn.send(text)`，`usePeer` 通过 `typeof data === 'string'` 区分控制消息与文本内容。

## 七、实施步骤

### 步骤 1：usePeer 扩展消息流状态

- 新增 `Message` 接口与 `messages` state
- 新增 `blobToDataUrl` / `assembleBlob` / `isImageMime` 辅助函数
- `file-end` 处理改为 `finalizeReceivedFile`：图片转 dataUrl 加入 messages，非图片触发下载 + 保留 blobUrl
- `sendFile` 发送完成后也把文件加到自己的 messages
- 新增 `clearMessages` 方法（释放 blobUrl）
- Hook 返回值新增 `messages` 与 `clearMessages`

### 步骤 2：MessageStream 组件

- 接收 `messages` / `transfers` / `connected` / `onClear` props
- 聊天式布局：发送方右对齐蓝色气泡，接收方左对齐灰色气泡
- 图片消息：`<img>` 内联显示，`max-height: 320px`，点击 `<a download>` 下载
- 文件消息：横向卡片（📎 + 文件名 + 大小 + 下载图标）
- 进行中传输：从 `transfers` 过滤 `status === 'active'`，以进度条形式追加在消息流末尾
- 新消息自动滚到底部（`useEffect` + `scrollTop = scrollHeight`）
- 空状态引导文案

### 步骤 3：App.tsx 视图切换

- 新增 `view: 'transfer' | 'markdown'` 状态，默认 `transfer`
- transfer 视图：上方 `<MessageStream>`（flex:1）+ 下方共享笔记 `<textarea>`（200px）
- markdown 视图：原 `<Editor>` + `<Preview>` 左右分栏
- 共享笔记内容用 `useLocalStorage('note-content', '')` 持久化
- 笔记 onChange 时 `send(value)` 同步给对方
- 连接刚建立时主动 `send(noteRef.current)` 做首次同步

### 步骤 4：Toolbar 视图切换按钮

- 新增 `view` / `onSwitchView` props
- 标题改为「DuoLink」
- 新增「Markdown 工具 / 返回传输」切换按钮
- markdown 视图下才显示 `.transfers-bar`（transfer 视图由 MessageStream 接管）

### 步骤 5：CSS 调整

- 新增 `.transfer-view` / `.transfer-stream` / `.transfer-note` 布局
- 新增 `.note-header` / `.note-textarea` 共享笔记样式
- 新增 `.stream-wrap` / `.stream-header` / `.stream-scroll` / `.stream-empty` 消息流容器
- 新增 `.msg` / `.msg-bubble` / `.msg-image` / `.msg-file` / `.msg-meta` 消息气泡
- 新增 `.msg-transferring` / `.msg-transfer-progress` / `.msg-transfer-bar` 传输中进度
- 深色主题适配
- 移动端响应式（笔记区缩小、气泡加宽）

## 八、关键风险与处理

| 风险 | 处理方式 |
|------|----------|
| 大图片 data URL 占用内存 | 单文件 200MB 上限已限制；`readAsDataURL` 失败时降级为下载 |
| blobUrl 内存泄漏 | `clearMessages` 时 `revokeObjectURL` 释放；页面卸载时浏览器自动回收 |
| 消息流无限增长 | 提供「清空」按钮；后续可加分页或虚拟滚动 |
| PeerJS 公共信令服务器不稳定 | 错误翻译为中文提示；后续可支持自建信令服务器配置 |
| 跨网络 NAT 穿透失败 | 提示「同局域网更稳定」；后续可加 STUN/TURN 配置 |
| 双方同时编辑共享笔记互相覆盖 | 文档说明「适合一人主笔 + 另一人补充」；后续可加 OT/CRDT |
| 单文件限制 | 当前按钮置灰；后续可放开为多文件队列 |

## 九、验证步骤

1. `npm run dev` 启动开发服务器，浏览器打开预览
2. 默认进入 transfer 视图，显示空消息流 + 共享笔记
3. 两台设备（或两个浏览器窗口）分别设置 ID 1 和 2，连接并接受
4. 在共享笔记输入文字，另一方实时同步
5. 点击「发送文件」选择一张图片，观察：
   - 双方消息流出现进度条卡片
   - 进度同步推进至 100%
   - 接收方消息流出现内联图片，点击可下载
   - 发送方消息流也出现图片（带「我发送」标记）
6. 选择一个非图片文件，观察：
   - 接收方浏览器自动下载
   - 双方消息流出现文件卡片，点击可再次下载
7. 传输过程中点「×」取消，双方卡片变为 canceled 状态
8. 点「清空」按钮，消息流清空
9. 点「Markdown 工具」切换到 Markdown 视图，编辑器与预览正常工作
10. Markdown 视图下传输文件，工具栏下方仍出现传输卡片
11. 点「返回传输」回到主界面，消息流仍保留之前的记录
12. 切换深色/浅色主题，所有元素（消息气泡、进度条、笔记区）正确变色
13. 移动端窗口宽度下，笔记区缩小、气泡加宽
14. `npm run build` 构建成功

## 十、不在范围内（明确排除）

- 用户账号、登录、好友列表
- 自建信令服务器
- 文件永久存储 / 历史记录持久化
- 断点续传
- 多人传输（>2 方）
- 拖拽发送文件
- 图片预览放大（点击仅下载）
- OT/CRDT 协同编辑（共享笔记用简单覆盖）
- 自定义 STUN/TURN 服务器配置
