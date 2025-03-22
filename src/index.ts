// Export context and hooks
export { SocketProvider, useSocket } from './context/SocketContext';
export { useRoom } from './hooks/useRoom';
export { usePrivateChat } from './hooks/usePrivateChat';
export { useGlobalChat } from './hooks/useGlobalChat';

// Export utils
export { createSocket, getSocket } from './utils/socket';

// Export types
export * from './types';
