export const providerTemplate = `'use client'

import { SocketProvider as BaseSocketProvider } from 'react-socketeer'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseSocketProvider 
      socketUrl={process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'}
    >
      {children}
    </BaseSocketProvider>
  )
}`

export const chatComponentTemplate = `'use client'

import { useState } from 'react'
import { useSocket, useGlobalChat } from 'react-socketeer'

export function LoginForm() {
  const { handleLogin, loginError } = useSocket()
  const [username, setUsername] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      handleLogin(username)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="px-4 py-2 border rounded mr-2"
        placeholder="Enter username"
      />
      <button type="submit">Login</button>
      {loginError && <div className="text-red-500">{loginError}</div>}
    </form>
  )
}

export function ChatRoom() {
  const { messages, sendMessage } = useGlobalChat()
  const [newMessage, setNewMessage] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      sendMessage(newMessage)
      setNewMessage('')
    }
  }

  return (
    <div className="p-4">
      <div className="h-[400px] overflow-y-auto border rounded p-4 mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.username}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}`
