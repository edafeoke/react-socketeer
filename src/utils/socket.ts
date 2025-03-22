import { io, Socket } from "socket.io-client";
import { SocketConfig } from "../types";

let socket: Socket | null = null;

export const createSocket = (config?: SocketConfig): Socket => {
  if (socket) return socket;
  
  socket = io(config?.socketUrl || "", {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    ...(config?.socketOptions || {})
  });

  // Add global error handling
  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
  
  return socket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    return createSocket();
  }
  return socket;
};
