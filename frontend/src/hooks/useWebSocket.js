import { useState, useEffect, useRef, useCallback } from 'react';

export default function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      try {
        wsRef.current = new WebSocket(url);

        wsRef.current.onopen = () => {
          setConnectionStatus('connected');
          console.log('WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
          setLastMessage(event.data);
        };

        wsRef.current.onclose = () => {
          setConnectionStatus('disconnected');
          console.log('WebSocket disconnected, reconnecting in 3s...');
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  }, []);

  return { sendMessage, lastMessage, connectionStatus };
}
