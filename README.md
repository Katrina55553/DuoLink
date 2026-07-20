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
- **双机协作** —— 基于 PeerJS 的 P2P 实时同步，两台设备（同网络下）输入对方 ID 即可双向编辑同一份内容，无需自建后端

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

顶部工具栏中部的「我的 ID / 输入对方 ID」面板用于实时同步：

1. **A 与 B 两台设备**同时打开本工具（需能访问公网，建议同一局域网更稳定）
2. 等待 A、B 各自的「我的 ID」显示出来（一串随机字符串，由 PeerJS 公共信令服务器分配）
3. A 点 ID 旁的复制按钮，把 ID 通过任意方式（微信/QQ/口述）发给 B
4. B 在「输入对方 ID」框中粘贴 → 点「连接」
5. 状态指示灯变绿即表示连接成功。**任一方编辑，另一方编辑器内容实时同步**

### 协作机制

- **传输方式**：PeerJS 默认走官方公共信令服务器（`0.peerjs.com`）完成一次握手，握手成功后两台设备之间建立 WebRTC 数据通道直连，文字在浏览器之间点对点传输，不经过任何自建后端
- **同步粒度**：每次本地编辑（按键触发）即发送当前全文给对方，对方直接覆盖本地内容
- **冲突策略**：简单覆盖，不合并、不锁定。两人同时编辑同一段会互相覆盖，适合"一人主笔 + 另一人补充"的场景
- **首次同步**：连接刚建立时双方各推送一次当前内容给对方，后到者覆盖先到者
- **断开重连**：点「断开」或关闭页面即结束会话；再次连接需重新交换 ID（PeerJS 每次会分配新 ID）
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

`usePeer` Hook 封装 PeerJS 客户端：组件挂载时实例化 `Peer`，由公共信令服务器分配随机 ID；被动方监听 `connection` 事件接收来连请求，主动方调用 `peer.connect(remoteId)` 发起连接。连接建立后通过 `DataConnection` 双向发送字符串内容。

`App.tsx` 把本地编辑与远端接收编织在一起：

- 本地 `onChange` → 写 localStorage + `conn.send(content)` 发给对方
- 远端 `conn.on('data')` → 直接 `setContent(remote)` 覆盖本地
- 连接刚建立时各推送一次当前内容给对方做初始同步

CodeMirror 的 `onChange` 只在用户真实输入时触发，`setValue` 不会回弹，因此不会形成循环。

## 许可证

MIT
