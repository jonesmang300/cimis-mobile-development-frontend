import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n"; // Import i18n configuratio
import { AuthProvider } from "./components/context/AuthContext";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
