import { Socket } from "socket.io-client";
import { ReactNode } from "react";

// Base user type with required properties
export interface BaseUser {
  username: string;
  id: string;
  socketId?: string;
}

// Extensible user type that can include additional properties
export type User<T = {}> = BaseUser & T;

export interface Message<T = {}> {
  username: string;
  text: string;
  timestamp: number;
  user?: User<T>; // Optional reference to the user who sent the message
}

export interface SocketConfig {
  socketUrl?: string;
  socketOptions?: any;
}

// Make context type generic as well
export interface SocketContextType<UserExtension = {}> {
  socket: Socket;
  isConnected: boolean;
  username: string;
  setUsername: (username: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  users: User<UserExtension>[];
  messages: Message<UserExtension>[];
  loginError: string;
  handleLogin: (username: string, userData?: Partial<UserExtension>) => void;
  rooms: string[];
  createRoom: (roomName: string) => void;
  roomError: string;
  userData: UserExtension | null;
  setUserData: (data: UserExtension | null) => void;
  updateUserData: (key: string, value: any) => boolean;
}

// Update provider props to support generic extensions
export interface SocketProviderProps<UserExtension = {}> {
  socketUrl?: string;
  socketOptions?: any;
  userDataTransformer?: (userData: any) => UserExtension;
  children: ReactNode;
}
