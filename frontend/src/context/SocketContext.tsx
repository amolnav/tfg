import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ReactNode } from 'react';
import { SocketContext } from './socketContextImpl';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socket = useMemo<Socket | null>(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      return null;
    }

    return io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Socket.io conectado:', socket.id);
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log('Socket.io desconectado:', reason);
    };

    const handleConnectError = (error: Error | string) => {
      const message = typeof error === 'string' ? error : error.message;
      setConnectionError(message);
      console.warn('Socket.io error de conexión:', message);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}
