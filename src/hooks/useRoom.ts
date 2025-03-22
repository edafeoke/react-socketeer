import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { Message } from "../types";

interface UseRoomOptions {
  autoScroll?: boolean;
  scrollDelay?: number;
}

export function useRoom(roomName: string, options: UseRoomOptions = {}) {
  const { socket, username } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { autoScroll = true, scrollDelay = 100 } = options;

  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    console.log(`Joining room: ${roomName}`);
    
    // Join room when hook is mounted
    socket.emit("join_room", roomName);
    setIsJoined(true);

    // Handle receiving room messages
    const handleRoomMessages = (data: { room: string; messages: Message[] }) => {
      console.log(`Received ${data.messages.length} messages for room ${data.room}`);
      if (data.room === roomName) {
        setMessages(data.messages);
        setTimeout(scrollToBottom, scrollDelay);
      }
    };

    // Handle new room messages
    const handleNewRoomMessage = (data: { room: string; message: Message }) => {
      console.log(`New message in room ${data.room}: ${data.message.text}`);
      if (data.room === roomName) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(scrollToBottom, scrollDelay);
      }
    };

    // Handle errors
    const handleMessageError = (error: string) => {
      setError(error);
    };

    socket.on("room_messages", handleRoomMessages);
    socket.on("new_room_message", handleNewRoomMessage);
    socket.on("message_error", handleMessageError);

    return () => {
      socket.off("room_messages", handleRoomMessages);
      socket.off("new_room_message", handleNewRoomMessage);
      socket.off("message_error", handleMessageError);
    };
  }, [roomName, socket, autoScroll, scrollDelay]);

  const sendMessage = (message: string) => {
    if (message.trim() && isJoined) {
      console.log(`Sending message to room ${roomName}: ${message.trim()}`);
      socket.emit("send_room_message", {
        room: roomName,
        message: message.trim()
      });
      return true;
    }
    return false;
  };

  return {
    messages,
    sendMessage,
    isJoined,
    error,
    messagesEndRef
  };
}
