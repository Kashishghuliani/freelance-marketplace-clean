import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      // Use env variable, fallback to localhost for dev
      const SOCKET_URL =
        process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

      const newSocket = io(SOCKET_URL, {
        auth: { token }, // send token for auth if backend expects it
        transports: ["websocket"], // force websocket for stability
      });

      newSocket.emit("join", payload.id);
      setSocket(newSocket);

      return () => newSocket.disconnect();
    } catch (err) {
      console.error("❌ Socket init error:", err);
    }
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
