import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import type { PeerStatus } from '../hooks/usePeer'

interface ToolbarProps {
  peerId: string
  peerStatus: PeerStatus
  peerError: string
  onConnect: (remoteId: string) => void
  onDisconnect: () => void
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function statusLabel(status: PeerStatus): string {
  switch (status) {
    case 'idle': return '未连接'
    case 'waiting': return '等待连接'
    case 'connected': return '已连接'
    case 'error': return '连接错误'
  }
}

export default function Toolbar({ peerId, peerStatus, peerError, onConnect, onDisconnect }: ToolbarProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [remoteId, setRemoteId] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!peerId) return
    try {
      await navigator.clipboard.writeText(peerId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard 可能被浏览器拦截,忽略 */
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (remoteId.trim()) {
      onConnect(remoteId.trim())
      setRemoteId('')
    }
  }

  const connected = peerStatus === 'connected'

  return (
    <header className="toolbar">
      <div className="toolbar-title">Markdown 转换器</div>

      <div className="peer-panel">
        <div className="peer-id" title="你的设备 ID,发给对方让其连接">
          <span className="peer-id-label">我的 ID:</span>
          <code className="peer-id-value">{peerId || '获取中…'}</code>
          {peerId && (
            <button
              type="button"
              className="peer-copy-btn"
              onClick={handleCopy}
              title="复制 ID"
              aria-label="复制 ID"
            >
              <CopyIcon />
              {copied && <span className="peer-copy-tip">已复制</span>}
            </button>
          )}
        </div>

        {connected ? (
          <button type="button" className="peer-btn peer-btn-disconnect" onClick={onDisconnect}>
            断开 ({statusLabel(peerStatus)})
          </button>
        ) : (
          <form className="peer-connect" onSubmit={handleSubmit}>
            <input
              type="text"
              className="peer-input"
              placeholder="输入对方 ID"
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
            />
            <button type="submit" className="peer-btn" disabled={!remoteId.trim()}>
              连接
            </button>
          </form>
        )}

        <span className={`peer-status peer-status-${peerStatus}`}>{statusLabel(peerStatus)}</span>

        {peerError && <span className="peer-error" title={peerError}>{peerError}</span>}
      </div>

      <button
        className="theme-btn"
        onClick={toggleTheme}
        title={isDark ? '切换到浅色模式' : '切换到深色模式'}
        aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    </header>
  )
}
