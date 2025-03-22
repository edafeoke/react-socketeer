import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { Message } from "../types";

interface UseGlobalChatOptions {
  autoScroll?: boolean;
  scrollDelay?: number;
}

export function useGlobalChat(options: UseGlobalChatOptions = {}) {
  const { socket, messages: globalMessages, isLoggedIn } = useSocket();
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { autoScroll = true, scrollDelay = 100 } = options;

  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (autoScroll) {
      setTimeout(scrollToBottom, scrollDelay);
    }
  }, [globalMessages, autoScroll, scrollDelay]);

  useEffect(() => {
    // Handle errors
    const handleMessageError = (error: string) => {
      setError(error);
    };

    socket.on("message_error", handleMessageError);

    return () => {
      socket.off("message_error", handleMessageError);
    };
  }, [socket]);

  const sendMessage = (message: string) => {
    if (message.trim() && isLoggedIn) {
      console.log(`Sending global message: ${message.trim()}`);
      socket.emit("send_message", message.trim());
      return true;
    }
    return false;
  };

  return {
    messages: globalMessages,
    sendMessage,
    error,
    messagesEndRef
  };
}
