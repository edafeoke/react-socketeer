import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { createSocket } from "../utils/socket";
import { User, Message, SocketContextType, SocketProviderProps } from "../types";

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ socketUrl, socketOptions, children }: SocketProviderProps) {
  const socket = createSocket({ socketUrl, socketOptions });
  
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loginError, setLoginError] = useState("");
  const [rooms, setRooms] = useState<string[]>([]);
  const [roomError, setRoomError] = useState("");

  useEffect(() => {
    function onConnect() {
      console.log("Socket connected!");
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log("Socket disconnected");
      setIsConnected(false);
      setIsLoggedIn(false);
    }

    function onInit(data: { users: User[], messages: Message[], rooms: string[] }) {
      console.log("Received init data:", data);
      setUsers(data.users);
      setMessages(data.messages);
      setRooms(data.rooms);
    }

    function onLoginSuccess(user: User) {
      console.log("Login successful:", user);
      setIsLoggedIn(true);
      setLoginError("");
      setUsers(prev => [...prev.filter(u => u.username !== user.username), user]);
    }

    function onLoginError(error: string) {
      console.log("Login error:", error);
      setLoginError(error);
    }

    function onUserJoined(user: User) {
      console.log("User joined:", user);
      setUsers(prev => [...prev.filter(u => u.username !== user.username), user]);
    }

    function onUserLeft(user: { username: string }) {
      console.log("User left:", user);
      setUsers(prev => prev.filter(u => u.username !== user.username));
    }

    function onNewMessage(message: Message) {
      console.log("New message received:", message);
      setMessages(prev => [...prev, message]);
    }

    function onRoomsList(roomsList: string[]) {
      console.log("Rooms list:", roomsList);
      setRooms(roomsList);
    }

    function onRoomCreated(roomName: string) {
      console.log("Room created:", roomName);
      if (!rooms.includes(roomName)) {
        setRooms(prev => [...prev, roomName]);
      }
    }

    function onRoomError(error: string) {
      console.log("Room error:", error);
      setRoomError(error);
    }

    function onSocketError(error: any) {
      console.error("Socket error:", error);
    }

    // Register event handlers
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("init", onInit);
    socket.on("login_success", onLoginSuccess);
    socket.on("login_error", onLoginError);
    socket.on("user_joined", onUserJoined);
    socket.on("user_left", onUserLeft);
    socket.on("new_message", onNewMessage);
    socket.on("rooms_list", onRoomsList);
    socket.on("room_created", onRoomCreated);
    socket.on("room_error", onRoomError);
    socket.on("connect_error", onSocketError);
    socket.on("error", onSocketError);

    // Check initial connection state
    if (socket.connected) {
      console.log("Socket already connected");
      setIsConnected(true);
    } else {
      console.log("Socket connecting...");
    }

    // Request rooms list on initial load
    socket.emit("get_rooms");

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("init", onInit);
      socket.off("login_success", onLoginSuccess);
      socket.off("login_error", onLoginError);
      socket.off("user_joined", onUserJoined);
      socket.off("user_left", onUserLeft);
      socket.off("new_message", onNewMessage);
      socket.off("rooms_list", onRoomsList);
      socket.off("room_created", onRoomCreated);
      socket.off("room_error", onRoomError);
      socket.off("connect_error", onSocketError);
      socket.off("error", onSocketError);
    };
  }, [rooms, socket]);

  const handleLogin = (username: string) => {
    if (username.trim()) {
      console.log("Attempting login with username:", username.trim());
      socket.emit("login", username.trim());
      setUsername(username.trim());
    }
  };

  const createRoom = (roomName: string) => {
    if (roomName.trim()) {
      console.log("Attempting to create room:", roomName.trim());
      socket.emit("create_room", roomName.trim());
      setRoomError("");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        username,
        setUsername,
        isLoggedIn,
        setIsLoggedIn,
        users,
        messages,
        loginError,
        handleLogin,
        rooms,
        createRoom,
        roomError
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
