import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Explore from "./pages/Explore";
import HikerProfile from "./pages/HikerProfile";
import GuideProfile from "./pages/GuideProfile";
import HikeDetails from "./pages/HikeDetails";
import CreateHike from "./pages/CreateHike";
import ErrorBoundary from "./ErrorBoundary";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal.jsx";
import { auth, onAuthStateChanged } from "./firebase";

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const [modalKey, setModalKey] = useState(0);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleOpenAuthModal = (tab) => {
    setModalTab(tab);
    setModalKey(k => k + 1);
    setModalOpen(true);
  };

  // Listen for custom event to open auth modal
  useEffect(() => {
    const handleOpenAuth = (event) => {
      const tab = event.detail?.tab || 'login';
      handleOpenAuthModal(tab);
    };
    window.addEventListener('openAuthModal', handleOpenAuth);
    return () => window.removeEventListener('openAuthModal', handleOpenAuth);
  }, []);

  return (
    <BrowserRouter>
      <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>
        <Header onOpenAuthModal={handleOpenAuthModal} />
        
        <div style={{ padding: 20 }}>

          <Routes>
            {/* redirect root to /explore */}
            <Route path="/" element={<Navigate to="/explore" replace />} />

            {/* main pages */}
            <Route path="/explore" element={<Explore />} />
            <Route path="/profile" element={<Navigate to="/profile/hiker" replace />} />
            <Route path="/profile/hiker" element={<HikerProfile />} />
            <Route path="/profile/guide" element={<GuideProfile />} />
            <Route path="/hikes/:id" element={<HikeDetails />} />
            <Route path="/hikes/create" element={<CreateHike />} />

            {/* catch-all → back to explore */}
            <Route path="*" element={<Navigate to="/explore" replace />} />
          </Routes>
        </div>

        {modalOpen && (
          <AuthModal 
            key={`${modalTab}-${modalKey}`}
            open={modalOpen} 
            onClose={() => setModalOpen(false)} 
            initialTab={modalTab} 
          />
        )}
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
