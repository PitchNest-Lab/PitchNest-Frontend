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
    const host = window.location.host;
    const WS_URL = window.location.hostname === 'localhost' 
      ? 'ws://localhost:3000' 
      : `${protocol}//${host}`;

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