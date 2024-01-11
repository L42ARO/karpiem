import React, { createContext, useContext, useEffect, useState } from 'react';
interface ServerIOContextProps{
    serverURL: string;
}

const ServerContext = createContext<ServerIOContextProps>({
    serverURL: "http://localhost:8080"
});

interface ServerProviderProps {
    children: React.ReactNode;
}

export const ServerProvider:React.FC<ServerProviderProps> = ({children}) => {
    const serverURL = "http://localhost:8080";
    return (
        <ServerContext.Provider value={{serverURL}}>
            {children}
        </ServerContext.Provider>
    )
}

export const useServer = () => useContext(ServerContext);