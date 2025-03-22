import { Socket } from "socket.io-client";

export interface User {
  username: string;
  id: string;
  socketId?: string;
}

export interface Message {
  username: string;
  text: string;
  timestamp: number;
}

export interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
  username: string;
  setUsername: (username: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  users: User[];
  messages: Message[];
  loginError: string;
  handleLogin: (username: string) => void;
  rooms: string[];
  createRoom: (roomName: string) => void;
  roomError: string;
}

export interface SocketProviderProps {
  socketUrl?: string;
  socketOptions?: any;
  children: React.ReactNode;
}

export interface SocketConfig {
  socketUrl?: string;
  socketOptions?: any;
}
