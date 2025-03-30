# React Socketeer

A powerful React library for Socket.IO integration with built-in real-time communication features.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [1. Wrap your app with SocketProvider](#1-wrap-your-app-with-socketprovider)
  - [2. Use hooks in your components](#2-use-hooks-in-your-components)
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
