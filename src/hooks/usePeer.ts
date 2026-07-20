import { useCallback, useEffect, useRef, useState } from 'react'
import Peer, { DataConnection } from 'peerjs'

// PeerJS 默认使用其官方公共信令服务器(0.peerjs.com)做一次握手,
// 握手成功后两台机器走 WebRTC 直连传输,无需自己部署任何后端。
//
// 协议:
//   主动方 connect → conn open 后发 {type:'hello'},进入 waiting 等待确认
//   被动方收到 connection 事件 → 进入 incoming,UI 显示接受/拒绝
//   被动方接受 → 发 {type:'accept'},双方 connected
//   被动方拒绝 → 发 {type:'reject'} 并关闭,主动方回到 waiting
//   内容同步:双方 connected 后各发一次本地内容,后续编辑实时同步

export type PeerStatus = 'idle' | 'waiting' | 'incoming' | 'connected' | 'error'

interface UsePeerOptions {
  onRemoteContent: (content: string) => void
}

type ControlMsg = { type: 'hello' } | { type: 'accept' } | { type: 'reject' }

export function usePeer({ onRemoteContent }: UsePeerOptions) {
  const [myId, setMyId] = useState<string>('')
  const [status, setStatus] = useState<PeerStatus>('idle')
  const [error, setError] = useState<string>('')
  const [incomingFrom, setIncomingFrom] = useState<string>('')
  // 主动方发起 connect 后等待对方 accept 期间为 true,用于 UI 区分"待机"与"等待确认"
  const [awaitingAccept, setAwaitingAccept] = useState(false)

  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const pendingConnRef = useRef<DataConnection | null>(null)
  const onRemoteRef = useRef(onRemoteContent)
  onRemoteRef.current = onRemoteContent

  // 处理收到的数据:返回消息类型供调用方决定状态切换
  const handleData = useCallback((data: unknown): 'accept' | 'reject' | 'content' | null => {
    if (typeof data === 'string') {
      onRemoteRef.current(data)
      return 'content'
    }
    if (data && typeof data === 'object') {
      const msg = data as ControlMsg
      if (msg.type === 'accept') return 'accept'
      if (msg.type === 'reject') return 'reject'
    }
    return null
  }, [])

  // 通用 close/error 绑定
  const bindLifecycle = useCallback((conn: DataConnection, onAccept?: () => void) => {
    conn.on('data', (data) => {
      const kind = handleData(data)
      if (kind === 'accept' && onAccept) onAccept()
      else if (kind === 'reject') {
        setError('对方拒绝连接')
        setAwaitingAccept(false)
        setStatus('waiting')
        try { conn.close() } catch { /* 忽略 */ }
      }
    })
    conn.on('close', () => {
      if (connRef.current === conn) connRef.current = null
      setAwaitingAccept(false)
      setStatus('waiting')
    })
    conn.on('error', (err) => {
      setError(err?.message ?? String(err))
      setStatus('error')
    })
  }, [handleData])

  // 主动方绑定:open 后发 hello,等待 accept
  const bindInitiator = useCallback((conn: DataConnection) => {
    const onOpen = () => {
      conn.send({ type: 'hello' } as ControlMsg)
      setStatus('waiting') // 等待对方确认
    }
    if (conn.open) onOpen()
    else conn.on('open', onOpen)
    bindLifecycle(conn, () => {
      connRef.current = conn
      setAwaitingAccept(false)
      setStatus('connected')
      setError('')
    })
  }, [bindLifecycle])

  // 被动方绑定(用户接受后调用):发 accept,转 connected
  const bindResponder = useCallback((conn: DataConnection) => {
    const onOpen = () => {
      conn.send({ type: 'accept' } as ControlMsg)
      connRef.current = conn
      setStatus('connected')
      setError('')
    }
    if (conn.open) onOpen()
    else conn.on('open', onOpen)
    bindLifecycle(conn)
  }, [bindLifecycle])

  // 用指定数字 ID 初始化 Peer
  const init = useCallback((id: string) => {
    if (peerRef.current) return
    const trimmed = id.trim()
    if (!trimmed) return
    setError('')
    setStatus('waiting')
    const peer = new Peer(trimmed)
    peerRef.current = peer

    peer.on('open', (assignedId) => {
      setMyId(assignedId)
    })

    peer.on('connection', (conn) => {
      // 已有连接或待确认请求时,拒绝新请求
      if (connRef.current || pendingConnRef.current) {
        try { conn.close() } catch { /* 忽略 */ }
        return
      }
      pendingConnRef.current = conn
      setIncomingFrom(conn.peer)
      setStatus('incoming')
    })

    peer.on('error', (err: unknown) => {
      const e = err as { message?: string; type?: string }
      setError(e?.message ?? String(err))
      // ID 冲突(unavailable-id)等错误回到 idle,允许重新设置
      setStatus('idle')
      try { peer.destroy() } catch { /* 忽略 */ }
      peerRef.current = null
    })
  }, [])

  const acceptConn = useCallback(() => {
    const conn = pendingConnRef.current
    if (!conn) return
    pendingConnRef.current = null
    setIncomingFrom('')
    bindResponder(conn)
  }, [bindResponder])

  const rejectConn = useCallback(() => {
    const conn = pendingConnRef.current
    if (!conn) return
    pendingConnRef.current = null
    setIncomingFrom('')
    const sendReject = () => {
      try { conn.send({ type: 'reject' } as ControlMsg) } catch { /* 忽略 */ }
    }
    if (conn.open) sendReject()
    else conn.on('open', sendReject)
    // 留点时间让 reject 发出去再关闭
    setTimeout(() => {
      try { conn.close() } catch { /* 忽略 */ }
    }, 150)
    setStatus('waiting')
  }, [])

  // 卸载时释放资源
  useEffect(() => {
    return () => {
      connRef.current?.close()
      pendingConnRef.current?.close()
      peerRef.current?.destroy()
      peerRef.current = null
      connRef.current = null
      pendingConnRef.current = null
    }
  }, [])

  // 主动方:输入对方 ID 发起连接
  const connect = useCallback((remoteId: string) => {
    const peer = peerRef.current
    if (!peer || !remoteId) return
    setError('')
    setAwaitingAccept(true)
    const conn = peer.connect(remoteId.trim(), { reliable: true })
    bindInitiator(conn)
  }, [bindInitiator])

  // 主动断开当前连接
  const disconnect = useCallback(() => {
    connRef.current?.close()
    connRef.current = null
    setAwaitingAccept(false)
    setStatus('waiting')
  }, [])

  // 把本地最新内容发给对方
  const send = useCallback((content: string) => {
    const conn = connRef.current
    if (conn && conn.open) {
      conn.send(content)
    }
  }, [])

  return { myId, status, error, incomingFrom, awaitingAccept, init, acceptConn, rejectConn, connect, disconnect, send }
}
