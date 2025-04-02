# React Socketeer

A powerful React library for Socket.IO integration with built-in real-time communication features.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [1. Wrap your app with SocketProvider](#1-wrap-your-app-with-socketprovider)
  - [2. Use hooks in your components](#2-use-hooks-in-your-components)
- [Next.js Integration](#nextjs-integration)
  - [Installation for Next.js](#installation-for-nextjs)
  - [Setting up the Socket Server](#setting-up-the-socket-server)
  - [Client-Side Integration](#client-side-integration)
- [Core Features](#core-features)
  - [Type-Safe User Data](#type-safe-user-data)
  - [Available Hooks](#available-hooks)
- [Advanced Usage](#advanced-usage)
  - [Custom Socket Configuration](#custom-socket-configuration)
  - [Server Setup Example](#server-setup-example)
- [API Reference](#api-reference)
  - [SocketProvider Props](#socketprovider-props)
  - [useSocket() Return Values](#usesocket-return-values)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

[![NPM Version](https://img.shields.io/npm/v/react-socketeer)](https://www.npmjs.com/package/react-socketeer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 Real-time messaging (global/private/room)
- 👥 User presence tracking
- 🔒 Type-safe API with TypeScript support
- ⚡ React hooks for easy integration
- 🔄 Automatic reconnection handling
- 🛠️ Extensible with custom user data

## Installation

```bash
npm install react-socketeer socket.io-client
# or
yarn add react-socketeer socket.io-client
```

## Quick Start

### 1. Wrap your app with SocketProvider

```tsx
import { SocketProvider } from 'react-socketeer';

function App() {
  return (
    <SocketProvider socketUrl="http://localhost:3000">
      <ChatApp />
    </SocketProvider>
  );
}
```

### 2. Use hooks in your components

```tsx
import { useSocket, useGlobalChat } from 'react-socketeer';

function ChatApp() {
  const { isConnected, handleLogin } = useSocket();
  const { messages, sendMessage } = useGlobalChat();

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.timestamp}>{msg.username}: {msg.text}</div>
      ))}
      <button onClick={() => sendMessage('Hello!')}>Send</button>
    </div>
  );
}
```

## Core Features

### Type-Safe User Data

Define custom user data types and use them throughout your app:

```tsx
interface UserProfile {
  age: number;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

// In your component
const { setUserData, userData } = useSocket<UserProfile>();

// Update user data
setUserData({
  age: 30,
  preferences: {
    theme: 'dark',
    notifications: true
  }
});
```

### Available Hooks

1. **useSocket()** - Core socket functionality
2. **useGlobalChat()** - Global messaging
3. **usePrivateChat()** - Direct messaging
4. **useRoom()** - Room-based communication

## Next.js Integration

### Installation for Next.js

```bash
npm install react-socketeer socket.io-client socket.io
# or
yarn add react-socketeer socket.io-client socket.io
# or
pnpm add react-socketeer socket.io-client socket.io
```

### Setting up the Socket Server

Create a custom server file in your Next.js project:

```typescript
// server.ts
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })
  
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })
  
  io.on('connection', (socket) => {
    console.log('Client connected')
    
    socket.on('login', (username) => {
      socket.username = username
      io.emit('user_joined', { username })
    })
    
    socket.on('send_message', (message) => {
      io.emit('new_message', {
        username: socket.username,
        text: message,
        timestamp: Date.now()
      })
    })
    
    socket.on('disconnect', () => {
      console.log('Client disconnected')
    })
  })
  
  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000')
  })
})
```

Update your `package.json` to use the custom server:

```json
"scripts": {
  "dev": "ts-node --project tsconfig.server.json server.ts",
  "build": "next build",
  "start": "NODE_ENV=production ts-node --project tsconfig.server.json server.ts"
}
```

### Client-Side Integration

Create a SocketProvider component in your Next.js app:

```tsx
// app/providers.tsx
'use client'

import { SocketProvider as BaseSocketProvider } from 'react-socketeer'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseSocketProvider 
      socketUrl={process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'}
    >
      {children}
    </BaseSocketProvider>
  )
}
```

Wrap your app with the provider in your layout:

```tsx
// app/layout.tsx
import { SocketProvider } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  )
}
```

Use the hooks in your client components:

```tsx
// app/chat.tsx
'use client'

import { useState } from 'react'
import { useSocket, useGlobalChat } from 'react-socketeer'

export default function ChatComponent() {
  const { isConnected, handleLogin } = useSocket()
  const { messages, sendMessage } = useGlobalChat()
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username) handleLogin(username)
  }
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message) {
      sendMessage(message)
      setMessage('')
    }
  }
  
  return (
    <div>
      {!isConnected ? (
        <form onSubmit={handleLoginSubmit}>
          <input 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
          <button type="submit">Join Chat</button>
        </form>
      ) : (
        <div>
          <div>
            {messages.map((msg, i) => (
              <div key={i}>
                <strong>{msg.username}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  )
}
```

## Advanced Usage

### Custom Socket Configuration

```tsx
<SocketProvider
  socketUrl="http://localhost:3000"
  socketOptions={{
    reconnection: true,
    reconnectionAttempts: 5,
    transports: ['websocket']
  }}
>
  {children}
</SocketProvider>
```

### Server Setup Example

```javascript
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('login', (username) => {
    socket.username = username;
    io.emit('user_joined', { username });
  });

  socket.on('send_message', (message) => {
    io.emit('new_message', {
      username: socket.username,
      text: message,
      timestamp: Date.now()
    });
  });
});
```

## API Reference

### SocketProvider Props

| Prop | Type | Description |
|------|------|-------------|
| socketUrl | string | Socket server URL |
| socketOptions | object | Socket.IO client options |
| userDataTransformer | function | Transforms incoming user data |

### useSocket() Return Values

| Property | Type | Description |
|----------|------|-------------|
| socket | Socket | Socket.IO instance |
| isConnected | boolean | Connection status |
| setUserData | function | Update user data |
| userData | T | Current user data |
| ... | ... | ... |

## Troubleshooting

**Connection Issues:**
- Verify server is running
- Check CORS settings
- Enable debug mode: `socketOptions: { debug: true }`

**Type Errors:**
- Ensure proper type definitions
- Use generic types consistently

## Contributing

PRs welcome! Please follow existing code style and add tests for new features.

## License

MIT
