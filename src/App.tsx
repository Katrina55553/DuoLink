import { useCallback, useEffect, useRef } from 'react'
import Editor from './components/Editor'
import Preview from './components/Preview'
import Toolbar from './components/Toolbar'
import { ThemeProvider } from './context/ThemeContext'
import { useLocalStorage } from './hooks/useLocalStorage'
import { usePeer } from './hooks/usePeer'
import { sampleContent } from './utils/sampleContent'

function AppContent() {
  const [content, setContent] = useLocalStorage<string>('md-content', sampleContent)
  const contentRef = useRef(content)
  contentRef.current = content

  // 远端内容直接覆盖本地(用户已确认简单覆盖即可)
  const handleRemoteContent = useCallback((remote: string) => {
    setContent(remote)
  }, [setContent])

  const {
    myId, status, error, incomingFrom, awaitingAccept, transfers,
    init, acceptConn, rejectConn, connect, disconnect, send, sendFile, cancelTransfer,
  } = usePeer({ onRemoteContent: handleRemoteContent })

  // 连接刚建立时,主动同步一次本地内容给对方
  const prevStatus = useRef(status)
  useEffect(() => {
    if (prevStatus.current !== 'connected' && status === 'connected') {
      send(contentRef.current)
    }
    prevStatus.current = status
  }, [status, send])

  // 本地编辑:更新自己 + 发给对方(CodeMirror 的 onChange 不会因 setContent 触发,不会循环)
  const handleChange = useCallback((value: string) => {
    setContent(value)
    send(value)
  }, [setContent, send])

  return (
    <div className="app">
      <Toolbar
        peerId={myId}
        peerStatus={status}
        peerError={error}
        incomingFrom={incomingFrom}
        awaitingAccept={awaitingAccept}
        transfers={transfers}
        onInit={init}
        onConnect={connect}
        onDisconnect={disconnect}
        onAccept={acceptConn}
        onReject={rejectConn}
        onSendFile={sendFile}
        onCancelTransfer={cancelTransfer}
      />
      <div className="main">
        <div className="pane pane-editor">
          <Editor value={content} onChange={handleChange} />
        </div>
        <div className="pane pane-preview">
          <Preview content={content} />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
