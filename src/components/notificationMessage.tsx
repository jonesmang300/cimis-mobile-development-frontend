import { useState, useEffect } from "react";

interface NotificationProps {
  text: string;
  type: "success" | "error" | null;
}

export const NotificationMessage = ({ text, type }: NotificationProps) => {
  return (
    <div
      style={{
        backgroundColor: type === "success" ? "green" : "red", // Use 'type' directly instead of 'message.type'
        color: "white",
        padding: "10px",
        marginBottom: "20px",
        borderRadius: "4px",
        textAlign: "center",
        marginTop: "10px",
      }}
    >
      {text} {/* Use 'text' directly instead of 'message.text' */}
    </div>
  );
};
