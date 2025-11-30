import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, onAuthStateChanged } from "../firebase";
import api from "../api";
import EditProfileModal from "../components/EditProfileModal";
import HikeCard from "../components/HikeCard";
import "./Profile.css";

export default function HikerProfile() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("joined");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const tabInitializedRef = useRef(false);
  const [authReady, setAuthReady] = useState(false);

  // Check auth and redirect if not hiker
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/explore");
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [navigate]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
  const res = await api.get("/api/me", {
        params: { _t: Date.now() }
      });
      const profile = res.data;
      
      // Redirect guides to GuideProfile page
      if (profile.role === 'guide') {
        navigate("/profile/guide");
        return;
      }

      console.log('[HikerProfile] Loaded profile:', { id: profile.id, email: profile.email, name: profile.name, role: profile.role });
      setMe(profile);

      const now = new Date();
      
      // For hikers: show bookings (hikes they joined)
      const bookings = profile.bookings || [];
      const hikes = bookings
        .filter((b) => b.hike)
        .map((b) => ({
          ...b.hike,
          imageUrl: b.hike.coverUrl || b.hike.imageUrl || null,
          isCreated: false,
        }));

      const upcomingHikes = hikes.filter((h) => {
        if (!h.date) return false;
        return new Date(h.date) >= now;
      });

      const pastHikes = hikes.filter((h) => {
        if (!h.date) return false;
        return new Date(h.date) < now;
      });

      setUpcoming(upcomingHikes);
      setPast(pastHikes);
    } catch (e) {
      console.error("Failed to load profile", e);
      setErr(
        e?.response?.data?.error || e.message || "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  const counts = useMemo(
    () => ({
      total: (upcoming?.length || 0) + (past?.length || 0),
      upcoming: upcoming?.length || 0,
      completed: past?.length || 0,
    }),
    [upcoming, past]
  );

  async function handleLeave(hikeId) {
    try {
      await api.delete(`/api/hikes/${hikeId}/join`);
      await load();
    } catch (e) {
      console.error("Leave failed", e);
      alert(e?.response?.data?.error || "Failed to leave hike");
    }
  }

  async function handleSaveProfile(formData) {
    try {
      await api.patch('/api/users/profile', formData);
      await load();
    } catch (e) {
      console.error("Save profile failed", e);
      throw new Error(e?.response?.data?.error || "Failed to save profile");
    }
  }

  if (loading) return <div className="profile-loading">Loading…</div>;
  if (err && !me) return <div className="profile-error">Error: {err}</div>;
  if (!me) return <div className="profile-error">Could not load profile.</div>;

  const joinDate = me.createdAt
    ? new Date(me.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const userInitial = (me.name?.[0] || me.email?.[0] || 'U').toUpperCase();

  return (
    <div className="profile-page">
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-large">
          {userInitial}
        </div>
        <div className="profile-info">
          <div className="profile-header-actions">
            <button 
              className="btn-edit-profile"
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Profile
            </button>
          </div>
          <h1 className="profile-name">{me.name || me.email || "User"}</h1>
          <p className="profile-role">Hiker</p>
          {me.hikerProfile?.location && (
            <p className="profile-location">
              {me.hikerProfile.location}
            </p>
          )}
          {joinDate && (
            <p className="profile-joined">Joined {joinDate}</p>
          )}
          {me.hikerProfile?.bio && (
            <p className="profile-bio">
              {me.hikerProfile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-number">{counts.total}</div>
          <div className="stat-label">Hikes Joined</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.upcoming}</div>
          <div className="stat-label">Upcoming</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'joined' ? 'active' : ''}`}
          onClick={() => setActiveTab('joined')}
        >
          Joined Hikes
        </button>
        <button
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'joined' ? (
        <div className="hikes-section">
          <h2 className="section-title">Upcoming Hikes</h2>
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <p>You haven't joined any hikes yet. Browse available hikes to get started!</p>
              <Link to="/explore" className="btn-explore-hikes">
                Explore Hikes
              </Link>
            </div>
          ) : (
            <div className="hikes-list">
              {upcoming.map((h) => (
                <HikeCard
                  key={h.id}
                  hike={h}
                  isJoined={true}
                  onLeave={(id) => handleLeave(id)}
                  allowJoin={false}
                  allowLeave={true}
                  userProfile={me}
                  fromProfile={true}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="hikes-section">
          <h2 className="section-title">Completed Hikes</h2>
          {past.length === 0 ? (
            <div className="empty-state">
              <p>No completed hikes yet.</p>
            </div>
          ) : (
            <div className="hikes-list">
              {past.map((h) => (
                <HikeCard
                  key={h.id}
                  hike={h}
                  isJoined={true}
                  onLeave={(id) => handleLeave(id)}
                  allowJoin={false}
                  allowLeave={false}
                  userProfile={me}
                  fromProfile={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={me}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
