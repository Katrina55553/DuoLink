# Markdown 转换器

一个纯前端的在线 Markdown 渲染工具，左侧编辑右侧实时预览，支持 GitHub 风格 Markdown、代码高亮、数学公式与 Mermaid 图表，并支持两台设备通过 WebRTC 实时同步文字。

🔗 在线体验：<https://katrina55553.github.io/MDTool/>

## 功能特性

- **实时预览** —— 左侧编辑器输入，右侧即时渲染，零延迟
- **GFM 支持** —— 表格、任务列表、删除线、自动链接
- **代码高亮** —— 基于 highlight.js，支持常见语言语法高亮
- **数学公式** —— KaTeX 渲染，兼容 LaTeX 语法（行内 `$...$` 与块级 `$$...$$`）
- **Mermaid 图表** —— 流程图、时序图、类图等多种图表类型
- **主题切换** —— 深色 / 浅色双主题，跟随系统首选项，一键切换
- **本地缓存** —— 编辑内容与主题选择自动保存到 localStorage，刷新不丢失
- **响应式布局** —— 桌面端左右分栏，移动端自动堆叠
- **零后端依赖** —— 纯前端部署，可直接托管到任何静态站点服务
- **双机协作** —— 基于 PeerJS 的 P2P 实时同步，两台设备各设一个 1-99 的数字 ID，发起连接后由被动方确认接受/拒绝，确认通过即可双向编辑同一份内容，无需自建后端
- **文件传输** —— 连接建立后可点对点发送任意类型文件（单文件 ≤ 200MB），分片 + 背压控制保证大文件稳定传输，接收方自动触发浏览器下载，无需登录或中转服务器

## 技术栈

| 维度 | 技术 |
|------|------|
| 构建工具 | Vite 5 |
| 框架 | React 18 + TypeScript |
| 编辑器 | CodeMirror 6（`@uiw/react-codemirror`） |
| Markdown 解析 | react-markdown + remark-gfm + remark-math |
| 代码高亮 | rehype-highlight + highlight.js |
| 数学公式 | rehype-katex + KaTeX |
| 图表 | Mermaid |
| 样式 | 原生 CSS + CSS 变量（主题切换） |
| 双机协作 | PeerJS（WebRTC 数据通道 + 公共信令服务器） |
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

## 双机协作使用说明

顶部工具栏中部的「我的 ID / 输入对方 ID」面板用于实时同步。ID 由用户手动设置，范围为 1-99 的整数，便于口述与交换。

1. **A 与 B 两台设备**同时打开本工具（需能访问公网，建议同一局域网更稳定）
2. 双方各自在「设置我的 ID (1-99)」框中输入一个数字（**两人不能相同**），点「设置」。若提示 ID 已被占用，换一个数字重试
3. A 在「对方 ID (1-99)」框中输入 B 的数字 → 点「连接」，A 进入「等待对方确认…」
4. B 的工具栏会弹出「A 的 ID 请求连接 [接受][拒绝]」提示，点「接受」
5. 状态指示灯变绿即表示连接成功。**任一方编辑，另一方编辑器内容实时同步**

若 B 点「拒绝」，A 会收到「对方拒绝连接」提示并自动回到待机状态。

### 文件传输

连接成功后工具栏会出现「发送文件」按钮（绿色描边）。

1. 任一方点「发送文件」→ 系统文件选择对话框 → 选中文件（≤ 200MB）即开始传输
2. 工具栏下方会出现一张传输卡片，显示文件名、大小、进度条、百分比与「取消」按钮
3. 接收方**无需确认**，卡片自动出现在其工具栏下方，进度同步推进
4. 传输完成时接收方浏览器自动触发文件下载（保存到默认下载目录），双方卡片在 3 秒后自动消失
5. 传输过程中任一方可点「×」取消，对方会收到 `file-cancel` 消息并停止；已发送/已接收的分片不会拼接成文件

### 协作机制

- **ID 分配**：用户在工具栏手动输入 1-99 的整数作为 PeerJS 客户端 ID。由于 PeerJS 公共信令服务器上的 ID 全局唯一，100 以内的数字极易冲突，被占用时会提示并允许换号重试
- **连接确认**：主动方发起连接后先发送 `hello` 控制消息，被动方收到 `connection` 事件后进入 `incoming` 状态并在 UI 上显示接受/拒绝按钮。被动方接受则回 `accept`，双方进入已连接状态；拒绝则回 `reject` 并关闭，主动方收到明确反馈后回到待机
- **传输方式**：PeerJS 默认走官方公共信令服务器（`0.peerjs.com`）完成一次握手，握手成功后两台设备之间建立 WebRTC 数据通道直连，文字在浏览器之间点对点传输，不经过任何自建后端
- **同步粒度**：每次本地编辑（按键触发）即发送当前全文给对方，对方直接覆盖本地内容
- **冲突策略**：简单覆盖，不合并、不锁定。两人同时编辑同一段会互相覆盖，适合"一人主笔 + 另一人补充"的场景
- **首次同步**：连接刚建立（双方都进入 connected）时各推送一次当前内容给对方，后到者覆盖先到者
- **文件传输协议**：在原有连接控制消息（`hello`/`accept`/`reject`）之上扩展四类消息：
  - `file-meta`：文件元数据（id、文件名、大小、MIME）
  - `file-chunk`：单分片（16KB ArrayBuffer + 序号）
  - `file-end`：所有分片发送完毕
  - `file-cancel`：任一方主动取消
- **分片与背压**：单条 WebRTC DataChannel 消息有大小限制，文件按 16KB 切片顺序发送；通过监控底层 `RTCDataChannel.bufferedAmount`，达到 4MB 阈值时暂停发送、降到 1MB 以下再继续，避免大文件爆浏览器缓冲区
- **接收端策略**：默认直接接收（不弹确认窗），用 `Map<index, ArrayBuffer>` 暂存所有分片，收到 `file-end` 时按序拼接为 `Blob` 并通过 `<a download>` 触发下载
- **单文件限制**：当前一次只能发送一个文件，正在发送时按钮置灰；接收不受此限（理论上可同时收多个，但 UI 仍按一条卡片展示一个文件）
- **断开重连**：点「断开」或关闭页面即结束会话；再次连接需重新输入对方 ID 并重新确认。连接中断时所有进行中的传输标记为失败
- **同网络优势**：同 Wi-Fi/局域网下走局域网 IP 直连，延迟最低、最稳定；跨网络可能受 NAT 类型限制无法直连

## 项目结构

```
MDTool/
├── .github/workflows/
│   └── deploy.yml                  # GitHub Pages 自动部署工作流
├── src/
│   ├── components/
│   │   ├── Editor.tsx              # CodeMirror 编辑器封装
│   │   ├── Preview.tsx             # react-markdown 渲染与插件配置
│   │   ├── MermaidBlock.tsx        # Mermaid 代码块自定义渲染
│   │   └── Toolbar.tsx             # 顶部工具栏（标题 + 主题切换 + 双机协作面板）
│   ├── context/
│   │   └── ThemeContext.tsx        # 主题 Context + Provider
│   ├── hooks/
│   │   ├── useLocalStorage.ts      # localStorage 持久化 Hook
│   │   └── usePeer.ts              # PeerJS 连接与收发封装
│   ├── utils/
│   │   └── sampleContent.ts        # 初始示例 Markdown 内容
│   ├── App.tsx                     # 根组件（布局 + 状态编排）
│   ├── main.tsx                    # 应用入口
│   └── index.css                   # 全局样式 + CSS 变量主题
├── index.html
├── vite.config.ts                  # Vite 配置（含 base 路径）
├── tsconfig.json
└── package.json
```

## Markdown 语法支持示例

### 表格

```markdown
| 语法       | 支持 | 说明       |
| ---------- | ---- | ---------- |
| GFM 表格   | ✅   | 管道符语法 |
| 任务列表   | ✅   | `- [x]`    |
```

### 任务列表

```markdown
- [x] 已完成项
- [ ] 待办项
```

### 代码高亮

\`\`\`ts
function greet(name: string): string {
  return `Hello, ${name}!`
}
\`\`\`

### 数学公式

```markdown
行内公式：$E = mc^2$

块级公式：

$$
\int_{a}^{b} f(x)\, dx = F(b) - F(a)
$$
```

### Mermaid 图表

\`\`\`mermaid
flowchart LR
    A[输入] --> B[解析] --> C[渲染]
\`\`\`

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

### 主题切换

通过 `data-theme` 属性切换 CSS 变量集，覆盖背景、前景、边框、代码块等颜色。`index.html` 内联脚本在 React 加载前应用主题，避免首屏闪烁。CodeMirror 与 highlight.js 主题通过动态切换 `<link>` 标签实现。

### Mermaid 渲染

`MermaidBlock` 组件在 `useEffect` 中调用 `mermaid.render()` 生成 SVG，通过 React state 管理渲染结果。主题切换时重新 `initialize` mermaid 并触发重渲染，确保图表配色与全局主题一致。

### 本地缓存

`useLocalStorage` Hook 通用化封装 localStorage 读写，JSON 序列化 + try-catch 容错。用于持久化编辑器内容（key: `md-content`）与主题选择（key: `md-theme`）。

### 双机实时同步

`usePeer` Hook 封装 PeerJS 客户端：用户在工具栏输入 1-99 的数字 ID 后调用 `init(id)` 实例化 `Peer` 并以此 ID 注册到公共信令服务器（ID 被占用会回到 idle 允许重试）。被动方监听 `connection` 事件，收到请求后进入 `incoming` 状态并暴露 `acceptConn` / `rejectConn`；主动方调用 `peer.connect(remoteId)` 发起连接，连接 open 后先发 `hello` 控制消息进入等待确认。

连接确认采用最小应用层协议：

| 消息 | 方向 | 含义 |
|------|------|------|
| `hello` | 主动方 → 被动方 | 请求连接 |
| `accept` | 被动方 → 主动方 | 接受连接，双方进入 connected |
| `reject` | 被动方 → 主动方 | 拒绝连接，主动方收到反馈并回到待机 |

字符串内容仍走同一 `DataConnection` 传输，`usePeer` 通过 `typeof data === 'string'` 区分控制消息与文本内容。

`App.tsx` 把本地编辑与远端接收编织在一起：

- 本地 `onChange` → 写 localStorage + `conn.send(content)` 发给对方
- 远端 `conn.on('data')` → 字符串类型直接 `setContent(remote)` 覆盖本地
- 双方都进入 connected 时各推送一次当前内容给对方做初始同步

CodeMirror 的 `onChange` 只在用户真实输入时触发，`setValue` 不会回弹，因此不会形成循环。

### 文件传输

文件传输复用 PeerJS 同一条 `DataConnection`，扩展四类应用层消息：

| 消息 | 方向 | 含义 |
|------|------|------|
| `file-meta` | 发送方 → 接收方 | 文件元数据（id / 名称 / 大小 / MIME） |
| `file-chunk` | 发送方 → 接收方 | 单分片（16KB ArrayBuffer + 序号） |
| `file-end` | 发送方 → 接收方 | 所有分片发送完毕，触发接收方拼接下载 |
| `file-cancel` | 双向 | 任一方主动取消 |

**发送端**（`usePeer.sendFile`）：

- 200MB 上限 + 空文件校验，超限直接报错
- 生成 `crypto.randomUUID()` 作为本次传输 ID
- 文件按 16KB 切片，`file.slice(offset, end).arrayBuffer()` 异步读取
- 通过 `(conn as any).dataChannel ?? _dc` 拿到底层 `RTCDataChannel`，循环检测 `bufferedAmount`，超过 4MB 暂停发送、降到 1MB 以下再继续 —— 这是大文件不爆浏览器的关键
- 每个 chunk 发送后更新 `transfers` 状态，UI 进度条随之推进
- 取消标记用 `useRef<Set<string>>` 维护，发送循环每片检查；连接断开时整体标记为 `error`

**接收端**（`handleData` 内 `file-meta` / `file-chunk` / `file-end` / `file-cancel` 分支）：

- `file-meta` 到达时新建 `ReceiverState { meta, chunks: Map<index, ArrayBuffer>, received }` 并插入 `transfers` 列表，UI 立即显示一张接收卡片
- `file-chunk` 到达时写入对应槽位、累加 `received` 字节、增量更新进度
- `file-end` 到达时按 `index` 升序取出所有 `ArrayBuffer` → `new Blob(arr, { type: mime })` → `URL.createObjectURL` → 触发隐藏 `<a download>` 的点击 → 1 秒后 `revokeObjectURL` 释放
- `file-cancel` 到达时清理本地状态、标记为 `canceled`

**UI**（`Toolbar` 内 `.transfers-bar`）：

- 工具栏下方独立横条，多文件横向滚动
- 每张卡片：方向徽章（↑ 发送蓝 / ↓ 接收紫）+ 文件名 + 大小 + 4px 进度条 + 状态文案 + 取消按钮
- 进度条颜色随状态变化：active 跟随主题色、done 绿、error 红、canceled 灰
- 已完成 / 失败 / 取消的卡片 3 秒后自动消失（`scheduleRemoval` 用 `setTimeout` 派发 `setTransfers` 过滤）
- 连接断开时 `bindLifecycle` 的 `close` 回调把所有 `active` 状态的卡片改为 `error: '连接已断开'`

## 许可证

MIT
