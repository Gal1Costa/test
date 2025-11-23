import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, onAuthStateChanged } from '../firebase';
import api from '../api';
import './Header.css';

export default function Header({ onOpenAuthModal }) {
  const [user, setUser] = useState(auth.currentUser);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  // Listen for login/logout
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchUserRole();
      } else {
        setUserRole(null);
      }
    });
    return () => unsub();
  }, []);

  // Fetch user role from backend
  const fetchUserRole = async () => {
    try {
      const response = await api.get('/api/profile').catch(() => api.get('/api/me'));
      const role = response.data?.role;

      if (role) {
        setUserRole(role);
      } else {
        setUserRole('hiker'); // fallback
      }
    } catch (err) {
      console.error('[Header] Failed fetching role:', err);
    }
  };

  async function handleSignOut() {
    try {
      await auth.signOut();
      navigate('/explore');
    } catch (err) {
      console.error('Sign-out failed:', err);
      alert(err.message || 'Sign-out failed');
    }
  }

  const isGuide = userRole === 'guide';
  const isHiker = userRole === 'hiker';
  const isVisitor = !user;

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/explore" className="logo">TrailHub</Link>
      </div>

      <nav className="nav-links">
        {/* SHARED LINKS */}
        <Link to="/explore">Home</Link>

        {/* ---- GUIDE HEADER ---- */}
        {isGuide && (
          <>
            <Link to="/hikes/create">Create Hike</Link>
            <Link to="/my-bookings">My Bookings</Link>
            <Link to="/profile">My Hikes</Link>
          </>
        )}

        {/* ---- HIKER HEADER ---- */}
        {isHiker && (
          <>
            <Link to="/my-bookings">My Bookings</Link>
          </>
        )}

        {/* Visitors only see Home (no additional links) */}
      </nav>

      <div className="header-right">
        {/* VISITOR (not logged in) */}
        {!user && (
          <>
            <button
              onClick={() => onOpenAuthModal('login')}
              className="btn-login"
            >
              Log In
            </button>

            <button
              onClick={() => onOpenAuthModal('signup')}
              className="btn-signup"
            >
              Sign Up
            </button>
          </>
        )}

        {/* LOGGED IN */}
        {user && (
          <>
            <Link to="/profile" className="profile-icon-link">
              {user.photoURL ? (
                <img src={user.photoURL} alt="profile" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
            </Link>

            <button onClick={handleSignOut} className="btn-signout">
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
