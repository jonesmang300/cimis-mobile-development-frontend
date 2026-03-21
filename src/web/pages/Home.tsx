import React from "react";

const WebHome: React.FC = () => {
  return (
    <div className="app-shell">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Web Admin</h1>
        <p className="muted" style={{ maxWidth: 520 }}>
          Manage users and administrative settings from the browser. This experience is web-only and
          stays out of the mobile APK.
        </p>
      </div>
    </div>
  );
};

export default WebHome;
