import React, { createContext, useContext, useState, useEffect } from "react";

// Define the type for the context value
interface NotificationMessageContextType {
  messageState: { text: string; type: "success" | "error" | null };
  setMessage: (
    text: string,
    type: "success" | "error" | null,
    duration?: number
  ) => void;
}

// Create the context
const NotificationMessageContext = createContext<
  NotificationMessageContextType | undefined
>(undefined);

// Provider component
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

  // Timer for auto-clearing the message
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (messageState.text) {
      // Clear message after 3 seconds by default
      timer = setTimeout(() => {
        setMessageState({ text: "", type: null });
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [messageState]);

  // Update message and optionally customize duration
  const setMessage = (
    text: string,
    type: "success" | "error" | null,
    duration: number = 3000
  ) => {
    setMessageState({ text, type });

    // If a custom duration is provided, reset the timer
    if (duration > 0) {
      setTimeout(() => {
        setMessageState({ text: "", type: null });
      }, duration);
    }
  };

  return (
    <NotificationMessageContext.Provider value={{ messageState, setMessage }}>
      {children}
    </NotificationMessageContext.Provider>
  );
};

// Custom hook
export const useNotificationMessage = (): NotificationMessageContextType => {
  const context = useContext(NotificationMessageContext);
  if (!context) {
    throw new Error(
      "useNotificationMessage must be used within a NotificationMessageProvider"
    );
  }
  return context;
};
