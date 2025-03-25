// Export context and hooks
export { SocketProvider, useSocket } from './context/SocketContext';
export { useGlobalChat } from './hooks/useGlobalChat';
export { useRoom } from './hooks/useRoom';
export { usePrivateChat } from './hooks/usePrivateChat';

// Export utils
export { createSocket, getSocket } from './utils/socket';

// Export types
export type {
  BaseUser,
  User,
  Message,
  SocketConfig,
  SocketContextType,
  SocketProviderProps
} from './types';
