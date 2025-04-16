import react, { useEffect, useState, useCallback } from "react";
import { useGuest } from "../contexts/GuestContext";
import { api } from "../services/api";

interface WebSocketMessage {
  type: string;
  payload: any;
}

const useWebsocket = (tableId: string) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { guestId } = useGuest();

  // Add event handlers storage
  const [eventHandlers] = useState<Map<string, (payload: any) => void>>(
    new Map()
  );

  useEffect(() => {
    if (!guestId) return;

    const socket = new WebSocket(
      `ws://localhost:8080/${tableId}?guestId=${guestId}`
    );

    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const handler = eventHandlers.get(message.type);
        if (handler) {
          handler(message.payload);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    socket.onerror = (event) => {
      console.error("WebSocket error: ", event);
      setError("WebSocket error");
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket closed");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [tableId, guestId, eventHandlers]);

  const subscribe = useCallback(
    (eventType: string, handler: (payload: any) => void) => {
      eventHandlers.set(eventType, handler);
      return () => {
        eventHandlers.delete(eventType);
      };
    },
    [eventHandlers]
  );

  const unsubscribe = useCallback(
    (eventType: string) => {
      eventHandlers.delete(eventType);
    },
    [eventHandlers]
  );

  const sendMessage = (message: string) => {
    if (ws && isConnected) {
      ws.send(message);
    } else {
      console.error("WebSocket is not connected");
    }
  };
  return { ws, isConnected, error, sendMessage, subscribe, unsubscribe };
};

export default useWebsocket;