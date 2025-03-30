import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { createSocket } from "../utils/socket";
import { User, Message, SocketContextType, SocketProviderProps } from "../types";

// Make the context generic
export const SocketContext = createContext<SocketContextType<any> | undefined>(undefined);

export function SocketProvider<T = {}>({ 
  socketUrl, 
  socketOptions, 
  userDataTransformer,
  children 
}: SocketProviderProps<T>) {
  const socket = createSocket({ socketUrl, socketOptions });
  
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [username, setUsername] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [users, setUsers] = useState<User<T>[]>([]);
  const [messages, setMessages] = useState<Message<T>[]>([]);
  const [loginError, setLoginError] = useState<string>("");
  const [rooms, setRooms] = useState<string[]>([]);
  const [roomError, setRoomError] = useState<string>("");
  const [userData, setUserData] = useState<T | null>(null);

  // Update login handler to accept additional user data
  const handleLogin = (username: string, userData?: Partial<T>) => {
    if (username.trim()) {
      console.log("Attempting login with username:", username.trim());
      // Emit login with additional user data if provided
      socket.emit("login", {
        username: username.trim(),
        ...userData
      });
      setUsername(username.trim());
      setUserData(userData as T);
    }
  };

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

    function onInit(data: { users: any[], messages: any[], rooms: string[] }) {
      console.log("Received init data:", data);
      // Transform user data if transformer is provided
      const transformedUsers = data.users.map(user => 
        userDataTransformer ? { ...user, ...userDataTransformer(user) } : user
      );
      setUsers(transformedUsers);
      setMessages(data.messages);
      setRooms(data.rooms);
    }

    function onLoginSuccess(user: any) {
      console.log("Login successful:", user);
      
      // Transform user data if transformer is provided
      const transformedUser = userDataTransformer 
        ? { ...user, ...userDataTransformer(user) } 
        : user;
        
      setIsLoggedIn(true);
      setLoginError("");
      setUsers(prev => [...prev.filter(u => u.username !== transformedUser.username), transformedUser]);
    }

    function onLoginError(error: string) {
      console.log("Login error:", error);
      setLoginError(error);
    }

    function onUserJoined(user: User<T>) {
      console.log("User joined:", user);
      setUsers(prev => [...prev.filter(u => u.username !== user.username), user]);
    }

    function onUserLeft(user: { username: string }) {
      console.log("User left:", user);
      setUsers(prev => prev.filter(u => u.username !== user.username));
    }

    function onNewMessage(message: Message<T>) {
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
  }, [socket, userDataTransformer]);

  const createRoom = (roomName: string) => {
    if (roomName.trim()) {
      console.log("Attempting to create room:", roomName.trim());
      socket.emit("create_room", roomName.trim());
      setRoomError("");
    }
  };

  const updateUserData = (key: string, value: any) => {
    if (!isLoggedIn || !userData) {
      console.warn("Cannot update user data: User not logged in");
      return false;
    }

    try {
      // Update local userData state with the new key-value pair
      const updatedUserData = {
        ...userData,
        [key]: value
      };
      
      setUserData(updatedUserData as T);
      
      // Emit event to server so other clients get the update
      socket.emit("update_user_data", {
        username,
        key,
        value
      });
      
      console.log(`User data updated: ${key} = ${value}`);
      return true;
    } catch (error) {
      console.error("Error updating user data:", error);
      return false;
    }
  };

  const updateUserDataState = (data: T | null) => {
    setUserData(data);
    if (data && isLoggedIn) {
      socket.emit("update_user_data", {
        username,
        data
      });
    }
  };

  const value: SocketContextType<T> = {
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
    roomError,
    userData,
    setUserData: updateUserDataState,
    updateUserData
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// Make the useSocket hook generic as well
export function useSocket<T = {}>() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context as SocketContextType<T>;
}
