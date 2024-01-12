import React, { createContext, useContext, useEffect, useState } from 'react';

interface ServerIOContextProps {
  serverURL: string;
  socket: WebSocket | null; // Add WebSocket to the context
  connect: (handler: (msg: MessageEvent) => void) => void;
  disconnect: () => void;
}

const ServerContext = createContext<ServerIOContextProps>({
  serverURL: "",
  socket: null,
  connect: () => {},
  disconnect: () => {},
});

interface ServerProviderProps {
  children: React.ReactNode;
}

export const ServerProvider: React.FC<ServerProviderProps> = ({ children }) => {
  const serverURL = "http://localhost:8080";
  const wsServerURL = "ws://localhost:8080/ws";
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [msgHandler, setMsgHandler] = useState<((msg: MessageEvent) => void) | null>(null);

  const connect = (handler: (msg: MessageEvent) => void) => {
    const newSocket = new WebSocket(wsServerURL);
    newSocket.onopen = () => {
        console.log("WebSocket connected");
        newSocket.send("CONNECT:123456789")
    };
    newSocket.onmessage = handler;
    newSocket.onclose = () => {
        console.log("WebSocket closed");
    }
    setSocket(newSocket);
  }
  const disconnect = () => {
    socket?.close();
    setSocket(null);
  }


  return (
    <ServerContext.Provider value={{ serverURL, connect, disconnect, socket }}>
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => useContext(ServerContext);
