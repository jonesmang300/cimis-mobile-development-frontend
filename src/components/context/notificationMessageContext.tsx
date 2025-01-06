import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface NotificationMessageContextType {
  messageState: { text: string; type: "success" | "error" | null }; // The notification message object
  setMessage: (text: string, type: "success" | "error" | null) => void; // Function to update message and type
}

// Create the context with a default value (undefined means no context by default)
const NotificationMessageContext = createContext<
  NotificationMessageContextType | undefined
>(undefined);

// Provider component that will provide the data and functions to child components
interface NotificationMessageProviderProps {
  children: React.ReactNode;
}

export const NotificationMessageProvider: React.FC<
  NotificationMessageProviderProps
> = ({ children }) => {
  // State for notification messages
  const [messageState, setMessageState] = useState<{
    text: string;
    type: "success" | "error" | null;
  }>({
    text: "",
    type: null,
  });

  // Function to update message and type
  const setMessage = (text: string, type: "success" | "error" | null) => {
    setMessageState({ text, type });
  };

  return (
    <NotificationMessageContext.Provider value={{ messageState, setMessage }}>
      {children}
    </NotificationMessageContext.Provider>
  );
};

// Custom hook to access NotificationMessageContext
export const useNotificationMessage = (): NotificationMessageContextType => {
  const context = useContext(NotificationMessageContext);
  if (!context) {
    throw new Error(
      "useNotificationMessage must be used within a NotificationMessageProvider"
    );
  }
  return context;
};
