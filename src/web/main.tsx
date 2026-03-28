import React from "react";
import ReactDOM from "react-dom/client";
import WebApp from "./WebApp";
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "../theme/variables.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WebApp />
  </React.StrictMode>,
);
