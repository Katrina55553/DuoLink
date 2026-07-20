import { useCallback, useEffect, useRef, useState } from 'react'
import Peer, { DataConnection } from 'peerjs'

// PeerJS 默认使用其官方公共信令服务器(0.peerjs.com)做一次握手,
// 握手成功后两台机器走 WebRTC 直连传输,无需自己部署任何后端。

export type PeerStatus = 'idle' | 'waiting' | 'connected' | 'error'

interface UsePeerOptions {
  onRemoteContent: (content: string) => void
}

export function usePeer({ onRemoteContent }: UsePeerOptions) {
  const [myId, setMyId] = useState<string>('')
  const [status, setStatus] = useState<PeerStatus>('idle')
  const [error, setError] = useState<string>('')

  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const onRemoteRef = useRef(onRemoteContent)
  onRemoteRef.current = onRemoteContent

  // 把数据连接的通用事件统一绑定
  const bindConn = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      connRef.current = conn
      setStatus('connected')
      setError('')
    })
    conn.on('data', (data) => {
      if (typeof data === 'string') {
        onRemoteRef.current(data)
      }
    })
    conn.on('close', () => {
      connRef.current = null
      setStatus('idle')
    })
    conn.on('error', (err) => {
      setError(err?.message ?? String(err))
      setStatus('error')
    })
  }, [])

  useEffect(() => {
    const peer = new Peer()
    peerRef.current = peer
    setStatus('waiting')

    peer.on('open', (id) => {
      setMyId(id)
    })

    // 被动方:收到他人发起的连接
    peer.on('connection', (conn) => {
      bindConn(conn)
    })

    peer.on('error', (err) => {
      setError(err?.message ?? String(err))
      setStatus('error')
    })

    return () => {
      connRef.current?.close()
      peer.destroy()
      peerRef.current = null
      connRef.current = null
    }
  }, [bindConn])

  // 主动方:输入对方 ID 发起连接
  const connect = useCallback((remoteId: string) => {
    const peer = peerRef.current
    if (!peer || !remoteId) return
    setError('')
    const conn = peer.connect(remoteId.trim(), { reliable: true })
    bindConn(conn)
  }, [bindConn])

  // 主动断开当前连接
  const disconnect = useCallback(() => {
    connRef.current?.close()
    connRef.current = null
    setStatus('idle')
  }, [])

  // 把本地最新内容发给对方
  const send = useCallback((content: string) => {
    const conn = connRef.current
    if (conn && conn.open) {
      conn.send(content)
    }
  }, [])

  return { myId, status, error, connect, disconnect, send }
}
