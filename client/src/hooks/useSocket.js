/**
 * useSocket — Drop-in replacement for the old SocketContext useSocket hook.
 * Reads the token from Redux instead of AuthContext.
 *
 * Usage (same as before):
 *   import { useSocket } from '../../hooks/useSocket';
 *   const socket = useSocket();
 */
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectToken } from '../store/authSlice';

// Module-level singleton so only ONE socket connection exists regardless of
// how many components call useSocket() simultaneously.
let socketInstance = null;
let currentToken = null;

export const useSocket = () => {
    const token = useSelector(selectToken);
    const [socket, setSocket] = useState(socketInstance);

    useEffect(() => {
        if (!token) {
            // If the token is gone (logout), disconnect and clean up
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
                currentToken = null;
            }
            setTimeout(() => setSocket(null), 0);
            return;
        }

        // Only create a new socket if the token has changed or there is no instance
        if (!socketInstance || currentToken !== token) {
            if (socketInstance) {
                socketInstance.disconnect();
            }

            const socketUrl =
                import.meta.env.VITE_API_URL ||
                import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
                'http://localhost:3006';

            socketInstance = io(socketUrl, { auth: { token } });
            currentToken = token;
        }

        setTimeout(() => setSocket(socketInstance), 0);

        // Do NOT disconnect on unmount — the singleton persists for the session.
        // It will be disconnected when the token is cleared (logout).
    }, [token]);

    return socket;
};

export default useSocket;
