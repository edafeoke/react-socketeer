# React Socketeer

A powerful React library for Socket.IO integration that provides seamless real-time communication features including rooms, private messaging, and user management.

[![NPM Version](https://img.shields.io/npm/v/react-socketeer)](https://www.npmjs.com/package/react-socketeer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Features](#features)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Local Development](#local-development)
- [Quick Start](#quick-start)
- [Next.js Integration](#nextjs-integration)
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
npm install react-socketeer socket.io-client
# or
yarn add react-socketeer socket.io-client
```

## Quick Start

```tsx
import { SocketProvider, useGlobalChat } from "react-socketeer";

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
      <button onClick={() => sendMessage("Hello, world!")}>Send Message</button>
    </div>
  );
}
```

### TypeScript Configuration

The library is written in TypeScript and includes built-in type definitions. For optimal TypeScript support, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es6",
    "module": "esnext",
    "moduleResolution": "node",
    "jsx": "react-jsx"
  }
}
```

## Server Setup

To use Socketeer, you'll need a Socket.IO server. Here's a basic setup using Express:

```javascript
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Your client URL
    methods: ["GET", "POST"],
  },
});

// Handle user connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle login
  socket.on("login", (username) => {
    // Validate username and handle login logic
    socket.username = username;
    io.emit("login_success", { username, id: socket.id });
  });

  // Handle global messages
  socket.on("send_message", (message) => {
    io.emit("new_message", {
      username: socket.username,
      text: message,
      timestamp: Date.now(),
    });
  });

  // Handle room messages
  socket.on("join_room", (room) => {
    socket.join(room);
    // Emit room history
  });

  socket.on("send_room_message", ({ room, message }) => {
    io.to(room).emit("new_room_message", {
      room,
      message: {
        username: socket.username,
        text: message,
        timestamp: Date.now(),
      },
    });
  });

  // Handle private messages
  socket.on("send_private_message", ({ recipient, message }) => {
    const recipientSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.username === recipient
    );

    if (recipientSocket) {
      io.to(recipientSocket.id).emit("new_private_message", {
        from: socket.username,
        message: {
          username: socket.username,
          text: message,
          timestamp: Date.now(),
        },
      });
    }
  });

  socket.on("disconnect", () => {
    io.emit("user_left", { username: socket.username });
  });
});

httpServer.listen(4000, () => {
  console.log("Server running on port 4000");
});
```

## Next.js Integration

### Version Compatibility

- Next.js 13.x or later (App Router)
- Next.js 12.x (Pages Router) - requires manual setup

### Automatic Setup (Recommended)

The easiest way to integrate react-socketeer with Next.js is using our CLI tool:

```bash
# Install the library
npm install react-socketeer socket.io-client

# Run the setup command
npx react-socketeer setup-nextjs [options]
```

Available options:
- `-p, --package-manager <manager>`: Specify package manager (npm, yarn, or pnpm)

The CLI tool will automatically:

1. Detect your project structure (src/app or app directory)
2. Detect your package manager (npm, yarn, or pnpm)
3. Create a custom server with Socket.IO integration
4. Set up necessary components and configurations
5. Install required dependencies
6. Update your package.json scripts

After the setup completes, update your `app/layout.tsx`:

```tsx
tsx;
import { SocketProvider } from "./components/SocketProvider";
import "./globals.css";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
```

Then create your page in `app/page.tsx`:

```tsx
"use client";
import { useSocket } from "react-socketeer";
import { LoginForm, ChatRoom } from "./components/Chat";
export default function Home() {
  const { isLoggedIn } = useSocket();
  return (
    <main className="container mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold p-4">React Socketeer Chat</h1>
      {!isLoggedIn ? <LoginForm /> : <ChatRoom />}
    </main>
  );
}
```

Finally, start the development server:

```bash
npm run dev
```

### Manual Setup

If you prefer to set up manually or need more control, follow these steps:

1. Install dependencies:

```bash
npm install react-socketeer socket.io-client
npm install --save-dev ts-node @types/node socket.io @types/socket.io
```

2. Create a custom server (`server.ts` in project root):

```ts
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });
  const io = new SocketIOServer(server, {
    cors: {
      origin: "",
      methods: ["GET", "POST"],
    },
  });
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("login", (username) => {
      socket.username = username;
      io.emit("login_success", { username, id: socket.id });
    });
    socket.on("send_message", (message) => {
      io.emit("new_message", {
        username: socket.username,
        text: message,
        timestamp: Date.now(),
      });
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
  server.listen(port, () => {
    console.log("> Ready on http://${hostname}:${port}");
  });
});
```

3. Create `tsconfig.server.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "dist",
    "noEmit": false,
    "jsx": "react"
  },
  "include": ["server.ts"]
}
```

4. Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "ts-node --project tsconfig.server.json server.ts",
    "build": "next build",
    "start": "NODE_ENV=production ts-node --project tsconfig.server.json server.ts"
  }
}
```

5. Create a Socket Provider (`app/_components/SocketProvider.tsx`):

```tsx
"use client";
import { SocketProvider as BaseSocketProvider } from "react-socketeer";
export function SocketProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseSocketProvider
      socketUrl={process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"}
    >
      {children}
    </BaseSocketProvider>
  );
}
```

6. Update your layout and create pages as shown in the automatic setup section.

### Production Deployment

When deploying to production:

1. Set the `NEXT_PUBLIC_SOCKET_URL` environment variable to your production URL
2. Configure CORS settings in the server for your production domain
3. Consider using a process manager like PM2:

```bash
npm install -g pm2
pm2 start npm --name "nextjs-socketeer" -- start
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
  socketOptions={
    {
      /* Socket.IO options */
    }
  }
>
  {children}
</SocketProvider>;
```

### Hooks

#### `useSocket()`

Access the core socket functionality and connection state.

```tsx
const {
  socket, // Socket.IO instance
  isConnected, // boolean
  username, // string
  isLoggedIn, // boolean
  users, // User[]
  handleLogin, // (username: string) => void
  messages, // Message[]
  loginError, // string
  rooms, // string[]
  createRoom, // (roomName: string) => void
  roomError, // string
} = useSocket();
```

#### `useGlobalChat(options?)`

Manage global chat messages.

```tsx
const { messages, sendMessage, error, messagesEndRef } = useGlobalChat({
  autoScroll: true,
  scrollDelay: 100,
});
```

#### `useRoom(roomName, options?)`

Handle room-based communication.

```tsx
const { messages, sendMessage, isJoined, error, messagesEndRef } = useRoom(
  "my-room",
  {
    autoScroll: true,
    scrollDelay: 100,
  }
);
```

#### `usePrivateChat(recipient, options?)`

Manage private messages with other users.

```tsx
const { messages, sendMessage, error, messagesEndRef } = usePrivateChat(
  "username",
  {
    autoScroll: true,
    scrollDelay: 100,
  }
);
```

## Advanced Examples

### Complete Chat Application with Error Handling

```tsx
import { SocketProvider, useSocket, useGlobalChat } from "socketeer";

function ChatApp() {
  const { isConnected, username, handleLogin, loginError } = useSocket();
  const [inputUsername, setInputUsername] = useState("");

  // Login form with error handling
  if (!isConnected || !username) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(inputUsername);
        }}
      >
        <input
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          placeholder="Enter username"
        />
        {loginError && <div className="error">{loginError}</div>}
        <button type="submit" disabled={!isConnected}>
          {isConnected ? "Login" : "Connecting..."}
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
      <button onClick={() => sendMessage("Hello, world!")}>Send Message</button>
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
        {rooms.map((room) => (
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

### Environment Variables

- `NEXT_PUBLIC_SOCKET_URL`: Socket server URL (default: http://localhost:3000)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

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
    transports: ["websocket", "polling"],
  }}
>
  {children}
</SocketProvider>
```

### Adapter Configuration

For production deployments or multi-server setups, Socket.IO requires an adapter to synchronize events between multiple Socket.IO server instances. Configure adapters using a `react-socketeer.json` file in your project root.

#### Available Adapters

- **Redis Adapter**: Synchronizes Socket.IO instances using Redis pub/sub
- **MongoDB Adapter**: Uses MongoDB for event storage and synchronization
- **Custom Adapters**: Implement your own adapter integration

#### Configuration Examples

**Redis Adapter**:

```json
{
  "adapter": {
    "type": "redis",
    "options": {
      "url": "redis://localhost:6379",
      "username": "optional-username",
      "password": "optional-password"
    }
  }
}
```

**MongoDB Adapter**:

```json
{
  "adapter": {
    "type": "mongodb",
    "uri": "mongodb://localhost:27017",
    "dbName": "socketio",        // Optional, defaults to "socketio"
    "collection": "socket.io-adapter-events"  // Optional, defaults to "socket.io-adapter-events"
  }
}
```

**Custom Adapter**:

```json
{
  "adapter": {
    "type": "custom",
    "setupFunction": "./adapters/custom-adapter.js",
    "options": {
      // Your custom options here
    }
  }
}
```

#### Installing Adapter Dependencies

Depending on your adapter choice, install the required dependencies:

```bash
# For Redis adapter
npm install @socket.io/redis-adapter redis

# For MongoDB adapter
npm install @socket.io/mongo-adapter mongodb
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
    logger: console,
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
