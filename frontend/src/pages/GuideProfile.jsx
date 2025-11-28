import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, onAuthStateChanged } from "../firebase";
import api from "../api";
import EditProfileModal from "../components/EditProfileModal";
import HikeCard from "../components/HikeCard";
import "./Profile.css";

export default function GuideProfile() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("created");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [completedView, setCompletedView] = useState('created');
  const tabInitializedRef = useRef(false);

  // Check auth and redirect if not guide
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/explore");
      }
    });
    return () => unsub();
  }, [navigate]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/profile", {
        params: { _t: Date.now() }
      });
      const profile = res.data;
      
      // Redirect non-guides to HikerProfile page
      if (profile.role !== 'guide') {
        navigate("/profile/hiker");
        return;
      }

      console.log('[GuideProfile] Loaded profile:', { id: profile.id, email: profile.email, name: profile.name, role: profile.role });
      setMe(profile);

      const now = new Date();
      let hikes = [];

      // For guides: show both created hikes AND joined hikes (bookings)
      const createdHikes = (profile.createdHikes || []).map((h) => {
        const date = h.date || h.startDate || h.createdAt;
        const participantsCount = h.participantsCount ?? h._count?.bookings ?? 0;
        const capacity = h.capacity ?? 0;

        return {
          id: h.id,
          name: h.title || h.name || "Untitled hike",
          location: h.location || "Unknown location",
          date,
          difficulty: h.difficulty || "n/a",
          participantsCount,
          capacity,
          isFull: capacity > 0 && participantsCount >= capacity,
          isCreated: true,
        };
      });

      // Get joined hikes (bookings) 
      const createdHikeIds = new Set(createdHikes.map(h => h.id));
      const bookings = (profile.bookings || [])
        .filter((b) => b.hike && !createdHikeIds.has(b.hike.id))
        .map((b) => {
          const h = b.hike;
          const date = h.date || h.startDate || h.createdAt;
          const participantsCount =
            h.participantsCount ??
            (h._count?.bookings ?? 0) ??
            0;
          const capacity = h.capacity ?? 0;

          return {
            id: h.id,
            name: h.title || h.name || "Untitled hike",
            location: h.location || "Unknown location",
            date,
            difficulty: h.difficulty || "n/a",
            participantsCount,
            capacity,
            isFull: capacity > 0 && participantsCount >= capacity,
            isCreated: false,
          };
        });

      // Combine both lists
      hikes = [...createdHikes, ...bookings];

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
    load();
  }, []);

  const counts = useMemo(
    () => {
      const createdHikes = (upcoming || []).filter(h => h.isCreated).concat((past || []).filter(h => h.isCreated));
      const upcomingJoined = (upcoming || []).filter(h => !h.isCreated);

      return {
        total: (upcoming?.length || 0) + (past?.length || 0),
        created: createdHikes.length,
        joined: upcomingJoined.length, // only upcoming joined hikes
        upcoming: upcoming?.length || 0,
        completed: past?.length || 0,
      };
    },
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
          <p className="profile-role">Guide</p>
          {me.guide?.location && (
            <p className="profile-location">
              {me.guide.location}
            </p>
          )}
          {joinDate && (
            <p className="profile-joined">Joined {joinDate}</p>
          )}
          {me.guide?.isVerified && (
            <p className="profile-verified" style={{ color: "#2f855a", fontSize: "14px", marginTop: "8px" }}>
              ✓ Verified Guide
            </p>
          )}
          {me.guide?.bio && (
            <p className="profile-bio">
              {me.guide.bio}
            </p>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-number">{counts.created || 0}</div>
          <div className="stat-label">Hikes Created</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.joined || 0}</div>
          <div className="stat-label">Hikes Joined</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.total}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'created' ? 'active' : ''}`}
          onClick={() => setActiveTab('created')}
        >
          Created Hikes
        </button>
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
      {activeTab === 'created' ? (
        <div className="hikes-section">
          <h2 className="section-title">Upcoming Created Hikes</h2>
          {upcoming.filter(h => h.isCreated).length === 0 ? (
            <div className="empty-state">
              <p>You haven't created any upcoming hikes yet. Create your first hike to get started!</p>
              <Link to="/hikes/create" className="btn-explore-hikes">
                Create Hike
              </Link>
            </div>
          ) : (
            <div className="hikes-list">
              {upcoming.filter(h => h.isCreated).map((h) => (
                <HikeCard
                  key={h.id}
                  hike={h}
                  isJoined={false}
                  allowJoin={false}
                  allowLeave={false}
                  userProfile={me}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'joined' ? (
        <div className="hikes-section">
          <h2 className="section-title">Upcoming Joined Hikes</h2>
          {upcoming.filter(h => !h.isCreated).length === 0 ? (
            <div className="empty-state">
              <p>You haven't joined any hikes yet. Browse available hikes to get started!</p>
              <Link to="/explore" className="btn-explore-hikes">
                Explore Hikes
              </Link>
            </div>
          ) : (
            <>
              {upcoming.filter(h => !h.isCreated).length > 0 && (
                <div className="hikes-list">
                  {upcoming.filter(h => !h.isCreated).map((h) => (
                    <HikeCard
                      key={h.id}
                      hike={h}
                      isJoined={true}
                      onLeave={(id) => handleLeave(id)}
                      allowJoin={false}
                      allowLeave={true}
                      userProfile={me}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : activeTab === 'completed' ? (
        <div className="hikes-section">
          <h2 className="section-title">Completed Hikes</h2>

          {/* Sub-navigation for completed hikes: Created (first) then Joined */}
          <div className="profile-tabs" style={{ marginBottom: 16 }}>
            <button
              className={`tab ${completedView === 'created' ? 'active' : ''}`}
              onClick={() => setCompletedView('created')}
            >
              Created
            </button>
            <button
              className={`tab ${completedView === 'joined' ? 'active' : ''}`}
              onClick={() => setCompletedView('joined')}
            >
              Joined
            </button>
          </div>

          {completedView === 'created' ? (
            (past || []).filter(h => h.isCreated).length === 0 ? (
              <div className="empty-state">
                <p>No completed created hikes yet.</p>
              </div>
            ) : (
              <div className="hikes-list">
                {(past || []).filter(h => h.isCreated).map((h) => (
                  <HikeCard
                    key={h.id}
                    hike={h}
                    isJoined={false}
                    allowJoin={false}
                    allowLeave={false}
                    userProfile={me}
                  />
                ))}
              </div>
            )
          ) : (
            (past || []).filter(h => !h.isCreated).length === 0 ? (
              <div className="empty-state">
                <p>No completed joined hikes yet.</p>
              </div>
            ) : (
              <div className="hikes-list">
                {(past || []).filter(h => !h.isCreated).map((h) => (
                  <HikeCard
                    key={h.id}
                    hike={h}
                    isJoined={true}
                    allowJoin={false}
                    allowLeave={false}
                    userProfile={me}
                  />
                ))}
              </div>
            )
          )}
        </div>
      ) : null}

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
