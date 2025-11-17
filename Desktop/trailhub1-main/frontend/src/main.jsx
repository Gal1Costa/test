import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import HikeDetails from "./pages/HikeDetails";
import ErrorBoundary from "./ErrorBoundary";
import AppAuthBar from "./AppAuthBar";

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
        <header
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <h1>TrailHub (dev)</h1>
          <nav style={{ display: "flex", gap: 8 }}>
            <Link to="/explore">Explore</Link>
            <span>|</span>
            <Link to="/profile">My Profile</Link>
          </nav>

          {/* Auth bar on the right */}
          <AppAuthBar />
        </header>

        <Routes>
          {/* redirect root to /explore */}
          <Route path="/" element={<Navigate to="/explore" replace />} />

          {/* main pages */}
          <Route path="/explore" element={<Explore />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/hikes/:id" element={<HikeDetails />} />

          {/* catch-all → back to explore */}
          <Route path="*" element={<Navigate to="/explore" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
