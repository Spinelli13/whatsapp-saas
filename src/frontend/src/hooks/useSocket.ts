import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../socket/client';
import { useAuthStore } from '../store/authStore';

export function useSocket(): Socket | null {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);
  const usuario = useAuthStore((s) => s.usuario);

  useEffect(() => {
    if (!token || !usuario) return;
    socketRef.current = getSocket(usuario.cliente_id, token);
  }, [token, usuario]);

  return socketRef.current;
}

export function useSocketEvent<T>(event: string, handler: (data: T) => void): void {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event, handler]);
}
