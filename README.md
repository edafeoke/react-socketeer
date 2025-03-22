# Socketeer

A powerful React library for Socket.IO integration that provides seamless real-time communication features including rooms, private messaging, and user management.

[![NPM Version](https://img.shields.io/npm/v/socketeer)](https://www.npmjs.com/package/socketeer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Features](#features)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Local Development](#local-development)
- [Quick Start](#quick-start)
- [Server Setup](#server-setup)
- [API Reference](#api-reference)
- [Advanced Examples](#advanced-examples)
- [Types](#types)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🔌 Easy Socket.IO integration with React
- 👥 Built-in user management
- 💬 Global chat functionality
- 🚪 Room-based communication
- 📨 Private messaging support
- 🔄 Automatic reconnection handling
- 🎯 TypeScript support
- ⚡ Modern React Hooks API

## Dependencies

### Peer Dependencies
- React >=16.8.0
- Socket.IO Client >=4.0.0

### Development Dependencies
- TypeScript ^5.0.0
- Rollup ^3.0.0
- Jest ^29.0.0

## Installation

```bash
npm install socketeer socket.io-client
# or
yarn add socketeer socket.io-client
```

## Local Development

### Testing the Library Locally

1. First, clone and set up the library:
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/socketeer
   cd socketeer

   # Install all dependencies including development dependencies
   npm install

   # Install Rollup globally (if you encounter rollup command not found)
   npm install -g rollup

   # Build the library
   npm run build
   ```

2. If you encounter any dependency errors, ensure all required packages are installed:
   ```bash
   # Install core dependencies
   npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs
   npm install --save-dev @rollup/plugin-typescript rollup-plugin-dts
   npm install --save-dev rollup-plugin-peer-deps-external rollup-plugin-terser
   npm install --save-dev typescript tslib @types/react

   # Rebuild the library
   npm run build
   ```

3. Create a global symlink in your system:
   ```bash
   npm link
   ```

4. Create a test application (if you don't have one):
   ```bash
   # In a different directory
   npx create-react-app test-socketeer --template typescript
   cd test-socketeer
   ```

5. Link the library to your test application:
   ```bash
   # In your test application directory
   npm link socketeer
   
   # Install peer dependencies
   npm install socket.io-client
   
   # If you get React hooks errors, link React
   cd node_modules/react
   npm link
   cd ../..
   cd ../socketeer
   npm link react
   ```

6. Use the library in your test application:
   ```tsx
   // src/App.tsx
   import React from 'react';
   import { SocketProvider, useGlobalChat } from 'socketeer';
   
   function App() {
     return (
       <SocketProvider socketUrl="http://localhost:4000">
         <Chat />
       </SocketProvider>
     );
   }
   ```

7. Start the development environment:
   ```bash
   # Terminal 1 - Library development (in socketeer directory)
   npm run dev    # or: npx rollup -c -w

   # Terminal 2 - Test server (in test-socketeer directory)
   node server.js

   # Terminal 3 - Test application (in test-socketeer directory)
   npm start
   ```

### Development Server Setup

For testing the full functionality, you'll need a Socket.IO server. First, install the required dependencies:

```bash
# In your test-socketeer directory
npm install express socket.io cors
```

Create a new file `server.js`:

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Basic server setup for testing
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('login', (username) => {
    socket.username = username;
    io.emit('login_success', { username, id: socket.id });
    console.log('User logged in:', username);
  });

  socket.on('send_message', (message) => {
    io.emit('new_message', {
      username: socket.username,
      text: message,
      timestamp: Date.now()
    });
    console.log('Message sent:', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
```

Install server dependencies and start it:
```bash
npm install express socket.io cors
node server.js
```

### Troubleshooting Local Development

1. **Module not found errors**
   - Ensure you've run `npm run build` in the library directory
   - Check if `npm link` was successful
   - Try removing and relinking: `npm unlink socketeer && npm link socketeer`

2. **React invalid hook call**
   - This usually happens when you have multiple React versions
   - Link React from your test app:
     ```bash
     cd test-socketeer
     npm link ../socketeer/node_modules/react
     ```

3. **Hot reload not working**
   - Ensure you're running `npm run dev` in the library directory
   - Check if your test app is set up to watch for changes

4. **Socket connection issues**
   - Verify the server is running on the correct port
   - Check CORS settings in the server
   - Ensure the `socketUrl` matches your server address

### File Structure for Local Development

```
socketeer/                  # Library root
├── src/                   # Library source code
├── dist/                  # Built files
└── package.json          

test-socketeer/            # Test application
├── src/
│   ├── App.tsx           # Test components
│   └── index.tsx
├── server.js             # Test server
└── package.json
```

## Quick Start

```tsx
import { SocketProvider, useGlobalChat } from 'socketeer';

// Wrap your app with the SocketProvider
function App() {
  return (
    <SocketProvider socketUrl="http://your-socket-server.com">
      <Chat />
    </SocketProvider>
  );
}

// Use the hooks in your components
function Chat() {
  const { messages, sendMessage, error } = useGlobalChat();
  
  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.timestamp}>
          <strong>{msg.username}:</strong> {msg.text}
        </div>
      ))}
      <button onClick={() => sendMessage("Hello, world!")}>
        Send Message
      </button>
    </div>
  );
}
```

## Server Setup

To use Socketeer, you'll need a Socket.IO server. Here's a basic setup using Express:

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Your client URL
    methods: ["GET", "POST"]
  }
});

// Handle user connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle login
  socket.on('login', (username) => {
    // Validate username and handle login logic
    socket.username = username;
    io.emit('login_success', { username, id: socket.id });
  });

  // Handle global messages
  socket.on('send_message', (message) => {
    io.emit('new_message', {
      username: socket.username,
      text: message,
      timestamp: Date.now()
    });
  });

  // Handle room messages
  socket.on('join_room', (room) => {
    socket.join(room);
    // Emit room history
  });

  socket.on('send_room_message', ({ room, message }) => {
    io.to(room).emit('new_room_message', {
      room,
      message: {
        username: socket.username,
        text: message,
        timestamp: Date.now()
      }
    });
  });

  // Handle private messages
  socket.on('send_private_message', ({ recipient, message }) => {
    const recipientSocket = Array.from(io.sockets.sockets.values())
      .find(s => s.username === recipient);
    
    if (recipientSocket) {
      io.to(recipientSocket.id).emit('new_private_message', {
        from: socket.username,
        message: {
          username: socket.username,
          text: message,
          timestamp: Date.now()
        }
      });
    }
  });

  socket.on('disconnect', () => {
    io.emit('user_left', { username: socket.username });
  });
});

httpServer.listen(4000, () => {
  console.log('Server running on port 4000');
});
```

## API Reference

### `SocketProvider`

The main provider component that sets up the Socket.IO connection.

```tsx
interface SocketProviderProps {
  socketUrl?: string;
  socketOptions?: any;
  children: React.ReactNode;
}

<SocketProvider
  socketUrl="http://localhost:3000"
  socketOptions={{ /* Socket.IO options */ }}
>
  {children}
</SocketProvider>
```

### Hooks

#### `useSocket()`

Access the core socket functionality and connection state.

```tsx
const {
  socket,         // Socket.IO instance
  isConnected,    // boolean
  username,       // string
  isLoggedIn,     // boolean
  users,          // User[]
  handleLogin,    // (username: string) => void
  messages,       // Message[]
  loginError,     // string
  rooms,          // string[]
  createRoom,     // (roomName: string) => void
  roomError       // string
} = useSocket();
```

#### `useGlobalChat(options?)`

Manage global chat messages.

```tsx
const {
  messages,
  sendMessage,
  error,
  messagesEndRef
} = useGlobalChat({
  autoScroll: true,
  scrollDelay: 100
});
```

#### `useRoom(roomName, options?)`

Handle room-based communication.

```tsx
const {
  messages,
  sendMessage,
  isJoined,
  error,
  messagesEndRef
} = useRoom("my-room", {
  autoScroll: true,
  scrollDelay: 100
});
```

#### `usePrivateChat(recipient, options?)`

Manage private messages with other users.

```tsx
const {
  messages,
  sendMessage,
  error,
  messagesEndRef
} = usePrivateChat("username", {
  autoScroll: true,
  scrollDelay: 100
});
```

## Advanced Examples

### Complete Chat Application with Error Handling

```tsx
import { SocketProvider, useSocket, useGlobalChat } from 'socketeer';

function ChatApp() {
  const { isConnected, username, handleLogin, loginError } = useSocket();
  const [inputUsername, setInputUsername] = useState("");
  
  // Login form with error handling
  if (!isConnected || !username) {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleLogin(inputUsername);
      }}>
        <input
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          placeholder="Enter username"
        />
        {loginError && <div className="error">{loginError}</div>}
        <button type="submit" disabled={!isConnected}>
          {isConnected ? 'Login' : 'Connecting...'}
        </button>
      </form>
    );
  }

  return <Chat />;
}

function Chat() {
  const { messages, sendMessage, error } = useGlobalChat();
  
  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.timestamp}>
          <strong>{msg.username}:</strong> {msg.text}
        </div>
      ))}
      <button onClick={() => sendMessage("Hello, world!")}>
        Send Message
      </button>
    </div>
  );
}
```

### Room Management Example

```tsx
function RoomManager() {
  const { rooms, createRoom, roomError } = useSocket();
  const [newRoomName, setNewRoomName] = useState("");

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    createRoom(newRoomName);
    setNewRoomName("");
  };

  return (
    <div>
      <form onSubmit={handleCreateRoom}>
        <input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="New room name"
        />
        <button type="submit">Create Room</button>
      </form>
      {roomError && <div className="error">{roomError}</div>}
      
      <h3>Available Rooms</h3>
      <ul>
        {rooms.map(room => (
          <li key={room}>{room}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Types

The library exports TypeScript types for better development experience:

```typescript
interface User {
  username: string;
  id: string;
  socketId?: string;
}

interface Message {
  username: string;
  text: string;
  timestamp: number;
}

interface SocketConfig {
  socketUrl?: string;
  socketOptions?: any;
}

interface SocketContextType {
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
```

## Configuration

### Socket.IO Options

You can pass any Socket.IO client options through the `socketOptions` prop of `SocketProvider`:

```tsx
<SocketProvider
  socketUrl="http://localhost:3000"
  socketOptions={{
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    transports: ['websocket', 'polling']
  }}
>
  {children}
</SocketProvider>
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   ```typescript
   // Check if connected
   const { isConnected } = useSocket();
   useEffect(() => {
     if (!isConnected) {
       console.log("Socket disconnected - check server status");
     }
   }, [isConnected]);
   ```

2. **Authentication Errors**
   - Ensure `handleLogin` is called before attempting to send messages
   - Check server logs for authentication failures
   - Verify CORS settings on your server

3. **Message Not Received**
   - Verify room name matches exactly
   - Check if user is properly joined to room
   - Ensure server is forwarding messages correctly

4. **Performance Issues**
   - Implement pagination for message history
   - Use `useCallback` for message handlers
   - Implement message batching for high-frequency updates

### Debug Mode

Enable debug mode to see detailed logs:

```tsx
<SocketProvider
  socketUrl="http://localhost:3000"
  socketOptions={{
    debug: true,
    logger: console
  }}
>
  {children}
</SocketProvider>
```

## Contributing

We love your input! We want to make contributing to Socketeer as easy and transparent as possible.

### Development Process

1. Fork the repo
2. Clone it and install dependencies
   ```bash
   git clone https://github.com/your-username/socketeer
   cd socketeer
   npm install
   ```
3. Create a branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. Make your changes
5. Run tests
   ```bash
   npm test
   ```
6. Commit your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
7. Push to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
8. Create a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/__tests__/useSocket.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Building

```bash
# Build the library
npm run build

# Run in development mode
npm run dev
```

## License

MIT © Oke Edafe Great

---

Made with ❤️ by the Socketeer team
