import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n"; // Import i18n configuratio
import { MembersProvider } from "./components/context/MembersContext";
import { ClustersProvider } from "./components/context/ClustersContext";
import { NotificationMessageProvider } from "./components/context/notificationMessageContext";
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ClustersProvider>
      <MembersProvider>
        <NotificationMessageProvider>
          <App />
        </NotificationMessageProvider>
      </MembersProvider>
    </ClustersProvider>
  </React.StrictMode>
);
