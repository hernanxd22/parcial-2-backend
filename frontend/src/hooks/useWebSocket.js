import { useEffect, useRef, useCallback, useState } from 'react'

const WS_URL = "ws://localhost:8000/api/v1/pedidos/ws"

export function useWebSocket({ onMessage, enabled = true }) {
  const wsRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let retryCount = 0
    let retryTimer = null
    let currentWs = null

    const closeCleanly = (ws) => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(1000), { once: true })
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000)
      }
    }

    const connect = () => {
      if (cancelled) return

      const token = localStorage.getItem('access_token')
      const wsUrl = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL

      const ws = new WebSocket(wsUrl)
      currentWs = ws
      wsRef.current = ws

      ws.onopen = () => {
        if (cancelled) {
          ws.close(1000)
          return
        }
        retryCount = 0
        setConnected(true)
        onMessageRef.current?.({ event: "WS_CONNECTED", data: null })
      }

      ws.onmessage = (event) => {
        if (cancelled) return
        try {
          const msg = JSON.parse(event.data)
          onMessageRef.current?.(msg)
        } catch {
          // ignore malformed
        }
      }

      ws.onerror = () => {
        // onclose handles reconnect logic
      }

      ws.onclose = (e) => {
        if (wsRef.current === ws) wsRef.current = null
        currentWs = null
        setConnected(false)

        const wasNormal = e.code === 1000
        const wasAuthRejected = e.code === 1008

        if (cancelled || wasNormal || wasAuthRejected) return

        retryCount++
        const delay = Math.min(1000 * 2 ** retryCount, 30000)
        retryTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer !== null) clearTimeout(retryTimer)
      if (currentWs) closeCleanly(currentWs)
      wsRef.current = null
      setConnected(false)
    }
  }, [enabled])

  const subscribeToOrder = useCallback((orderId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "subscribe-order", order_id: orderId }))
    }
  }, [])

  const unsubscribeFromOrder = useCallback((orderId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "unsubscribe-order", order_id: orderId }))
    }
  }, [])

  return { subscribeToOrder, unsubscribeFromOrder, connected }
}