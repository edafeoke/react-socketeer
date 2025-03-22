import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { Message } from "../types";

interface UsePrivateChatOptions {
  autoScroll?: boolean;
  scrollDelay?: number;
}

export function usePrivateChat(recipient: string, options: UsePrivateChatOptions = {}) {
  const { socket, username, isLoggedIn } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { autoScroll = true, scrollDelay = 100 } = options;

  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    console.log(`Requesting private messages with: ${recipient}`);
    // Request private chat history
    socket.emit("get_private_messages", recipient);

    // Handle receiving private messages
    const handlePrivateMessages = (data: { user: string; messages: Message[] }) => {
      console.log(`Received ${data.messages.length} private messages with ${data.user}`);
      if (data.user === recipient) {
        setMessages(data.messages);
        setTimeout(scrollToBottom, scrollDelay);
      }
    };

    // Handle new private messages
    const handleNewPrivateMessage = (data: { from: string; message: Message }) => {
      console.log(`New private message from ${data.from}: ${data.message.text}`);
      if (data.from === recipient || data.message.username === username) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(scrollToBottom, scrollDelay);
      }
    };

    // Handle errors
    const handleMessageError = (error: string) => {
      setError(error);
    };

    socket.on("private_messages", handlePrivateMessages);
    socket.on("new_private_message", handleNewPrivateMessage);
    socket.on("message_error", handleMessageError);

    return () => {
      socket.off("private_messages", handlePrivateMessages);
      socket.off("new_private_message", handleNewPrivateMessage);
      socket.off("message_error", handleMessageError);
    };
  }, [socket, recipient, username, isLoggedIn, autoScroll, scrollDelay]);

  const sendMessage = (message: string) => {
    if (message.trim() && isLoggedIn) {
      console.log(`Sending private message to ${recipient}: ${message.trim()}`);
      socket.emit("send_private_message", {
        recipient,
        message: message.trim()
      });
      return true;
    }
    return false;
  };

  return {
    messages,
    sendMessage,
    error,
    messagesEndRef
  };
}
