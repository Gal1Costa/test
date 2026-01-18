import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Explore from "./pages/Explore";
import MyTrails from "./pages/MyTrails";
import HikerProfile from "./pages/HikerProfile";
import GuideProfile from "./pages/GuideProfile";
import HikeDetails from "./pages/HikeDetails";
import CreateHike from "./pages/CreateHike";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAccess from "./pages/admin/AdminAccess";
import AdminLayout from "./pages/admin/layouts/AdminLayout";
import AdminRoute from "./pages/admin/AdminRoute";
import ProtectedRoute from "./pages/ProtectedRoute";
import HikesAdmin from "./pages/admin/Hikes";
import HikeEdit from "./pages/admin/HikeEdit";
import UsersAdmin from "./pages/admin/Users";
import GuidesAdmin from "./pages/admin/Guides";
import DeletedAccounts from "./pages/admin/DeletedAccounts";
import RoleRequests from "./pages/admin/RoleRequests";
import Analytics from "./pages/admin/Analytics";
import AdminDevLogin from "./pages/admin/AdminDevLogin";
import AdminAudit from "./pages/admin/AdminAudit";
import ErrorBoundary from "./ErrorBoundary";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal.jsx";
import Toast from "./components/Toast";
import { auth, onAuthStateChanged } from "./firebase";

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const [modalKey, setModalKey] = useState(0);
  const [user, setUser] = useState(auth.currentUser);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      // If user is signed in, verify their account is not deleted
      if (u) {
        try {
          const api = (await import('./api')).default;
          await api.get('/me');
        } catch (error) {
          // The axios interceptor will handle the sign-out and redirect
          // if the account is deleted (401 + "Account deleted")
        }
      }
    });
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

  // Listen for admin sign-in event: close modal (no toast needed)
  useEffect(() => {
    const onAdminSignedIn = (e) => {
      setModalOpen(false);
    };
    window.addEventListener('admin:signedin', onAdminSignedIn);
    return () => window.removeEventListener('admin:signedin', onAdminSignedIn);
  }, []);

  // Generic toast listener: dispatch events with new CustomEvent('app:toast', { detail: { message, type } })
  useEffect(() => {
    const onToast = (e) => {
      const d = e.detail || {};
      setToast({ message: d.message || 'Notice', type: d.type || 'info' });
      setTimeout(() => setToast(null), 3500);
    };
    window.addEventListener('app:toast', onToast);
    return () => window.removeEventListener('app:toast', onToast);
  }, []);

  // If the app is opened under an admin-specific hostname, rewrite path to /admin/access
  useEffect(() => {
    try {
      const host = window.location.hostname || '';
      if (host.includes('trailhub-admin') && !window.location.pathname.startsWith('/admin')) {
        // direct to admin access gate first
        window.history.replaceState({}, '', '/admin/access');
      }
    } catch (e) {
      // ignore in SSR or environments without window
    }
  }, []);

  return (
    <BrowserRouter>
      <AppContent 
        handleOpenAuthModal={handleOpenAuthModal}
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        modalTab={modalTab}
        modalKey={modalKey}
        toast={toast}
      />
    </BrowserRouter>
  );
}

function AppContent({ handleOpenAuthModal, modalOpen, setModalOpen, modalTab, modalKey, toast }) {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>
      {/* Hide main site header when browsing admin pages */}
      {!isAdminPage && (
        <Header onOpenAuthModal={handleOpenAuthModal} />
      )}

      <div style={{ padding: 20 }}>

        <Routes>
            <Route path="/admin/access" element={<AdminAccess />} />

              <Route path="/admin/dev-login" element={<AdminDevLogin />} />

            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Navigate to="/admin/access" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="hikes" element={<HikesAdmin />} />
              <Route path="hikes/:id" element={<HikeEdit />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="guides" element={<GuidesAdmin />} />
              <Route path="role-requests" element={<RoleRequests />} />
              <Route path="deleted" element={<DeletedAccounts />} />
            </Route>
            {/* redirect root to /explore */}
            <Route path="/" element={<Navigate to="/explore" replace />} />

            {/* main pages - protected from admin access */}
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/mytrails" element={<ProtectedRoute><MyTrails /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Navigate to="/profile/hiker" replace /></ProtectedRoute>} />
            <Route path="/profile/hiker" element={<ProtectedRoute><HikerProfile /></ProtectedRoute>} />
            <Route path="/profile/guide" element={<ProtectedRoute><GuideProfile /></ProtectedRoute>} />
            <Route path="/hikes/:id" element={<ProtectedRoute><HikeDetails /></ProtectedRoute>} />
            <Route path="/hikes/create" element={<ProtectedRoute><CreateHike /></ProtectedRoute>} />

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
        <Toast toast={toast} />
      </div>
    );
}

const root = createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);