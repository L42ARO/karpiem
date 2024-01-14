import { useIonToast } from '@ionic/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ServerIOContextProps {
  serverURL: string;
  socket: WebSocket | null;
  connect: (handler: (msg: MessageEvent) => void) => void;
  disconnect: () => void;
  showToast: (msg: string, color?:string) => void;
}

const ServerContext = createContext<ServerIOContextProps>({
  serverURL: "",
  socket: null,
  connect: () => {},
  disconnect: () => {},
  showToast: () => {},
});

interface ServerProviderProps {
  children: React.ReactNode;
}

interface ToastQueueItem{
  msg: string;
  color: string;
}
export const ServerProvider: React.FC<ServerProviderProps> = ({ children }) => {
  const isLocalhost = window.location.hostname === 'localhost';
  const serverURL = isLocalhost ? 'http://localhost:8080' : 'https://karpiem.up.railway.app';
  const wsServerURL = isLocalhost ? 'ws://localhost:8080/ws' : 'wss://karpiem.up.railway.app/ws';
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [toast] = useIonToast();
  const [wsConnState, setWsConnState] = useState<"INIT"|"CONNECTED" | "RECONNECTING">("INIT");
  const [toastQueue, setToastQueue]  = useState<ToastQueueItem[]>([]);


  const showToast = (msg: string, color?: string) => {
    if (!color){
      color = "tertiary";
    }
    //Add to the queue
    const item: ToastQueueItem = {msg, color};
    setToastQueue((prev)=>{
      //Make sure the last item in the queue isn't the same as this one
      if ((prev.length > 0 && prev[prev.length-1].msg === msg) || (prev.length > 1 && prev[prev.length-2].msg === msg)){
        return prev;
      }
      return [...prev, item];

    });
  }
  useEffect(() => {
    if (toastQueue.length > 0){
      //Get the first item in the queue
      const item = toastQueue[0];
      //Remove the first item from the queue
      //Show the toast
      toast({
        message: item.msg,
        duration: 2000,
        position: "bottom",
        positionAnchor: "tab-footer",
        color: item.color,
        onDidDismiss: () => {
          setToastQueue((prev)=>{
            return prev.slice(1);
          });
        },
      });

    }
  }, [toastQueue]);

  const connect = (handler: (msg: MessageEvent) => void) => {
    const newSocket = new WebSocket(wsServerURL);
    newSocket.onopen = () => {
      setWsConnState((prev)=>{
        if (prev === "INIT"){
          console.log("WebSocket connected");
          return "CONNECTED";
        }
        else if (prev === "RECONNECTING"){
          console.log("WebSocket reconnected");
          showToast("WebSocket reconnected", "success");
          return "CONNECTED";
        }
        else{
          return prev;
        }
      })

      newSocket.send("CONNECT:123456789");
    };
    newSocket.onmessage = handler;
    newSocket.onclose = () => {
      console.log("WebSocket closed");
    };
    newSocket.onerror = (err) => {
      console.log("WebSocket error", err);
      showToast("WebSocket error", "warning");
    }
    newSocket.onclose = () => {
      //Automatically reconnect
      setTimeout(() => {
        setWsConnState("RECONNECTING");
        showToast("WebSocket closed... reconnecting", "warning");
        connect(handler);
      }, 5000);
    }
    setSocket(newSocket);
  };
  useEffect(() => {
  }, [wsConnState]);


  const disconnect = () => {
    socket?.close();
    setSocket(null);
  };

  return (
    <ServerContext.Provider value={{ serverURL, connect, disconnect, socket, showToast }}>
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => useContext(ServerContext);
