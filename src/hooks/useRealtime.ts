import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ?? 'http://localhost:4000';

/**
 * Connexion Socket.IO authentifiée par le JWT du store.
 *
 * Usage :
 *   const { socket, connected } = useRealtime();
 *   useEffect(() => {
 *     if (!socket) return;
 *     socket.on('order:created', (p) => queryClient.invalidateQueries({ queryKey: ['orders'] }));
 *     return () => { socket.off('order:created'); };
 *   }, [socket]);
 */
export function useRealtime() {
  const token = useAuthStore((s) => s.token);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(WS_URL, {
      path: '/realtime',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      console.warn('[realtime] connect_error', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return { socket: socketRef.current, connected };
}
