import React, { createContext, useContext, useEffect, useState } from 'react';

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    console.log("🔌 Connecting to PitchNest Brain...");
    
    // ✅ DYNAMIC URL FIX: Works seamlessly for both Localhost and Google Cloud!
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const explicitWs = import.meta.env.VITE_WS_BACKEND_URL as string | undefined;
    const onRender = window.location.hostname.includes('onrender.com');

    let WS_URL: string;
    if (isLocal) {
      WS_URL = `ws://${window.location.hostname}:3000`;
    } else if (explicitWs) {
      WS_URL = explicitWs;
    } else if (onRender) {
      WS_URL = `${protocol}//${window.location.host}`;
    } else {
      WS_URL = 'wss://pitchnest-live.onrender.com';
    }

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ Connected to PitchNest Brain');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onclose = () => {
      console.log('❌ Disconnected from Brain');
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('⚠️ WebSocket Error:', error);
    };

    return () => {
      // Clean up when leaving the room
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, []); // Empty array ensures this only runs ONCE now that Strict Mode is off

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};