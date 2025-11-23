import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import EditProfileModal from "../components/EditProfileModal";
import "./Profile.css";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("joined"); // "joined"/"created" or "completed"
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const tabInitializedRef = useRef(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // Add cache-busting parameter to ensure fresh data
      const res = await api.get("/api/profile", {
        params: { _t: Date.now() }
      });
      const profile = res.data;
      console.log('[Profile] Loaded profile:', { id: profile.id, email: profile.email, name: profile.name, role: profile.role });
      setMe(profile);

      const now = new Date();
      let hikes = [];

      // For guides: show both created hikes AND joined hikes (bookings)
      // For hikers: show hikes they joined (bookings)
      if (profile.role === 'guide') {
        // Combine created hikes and joined hikes
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

        // Get joined hikes (bookings) - exclude hikes they created
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
      } else {
        // For hikers: show bookings (hikes they joined)
        const bookings = profile.bookings || [];
        hikes = bookings
          .filter((b) => b.hike)
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
      }

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

  // Set default tab based on role when profile first loads (only once)
  useEffect(() => {
    if (me && me.role === 'guide' && !tabInitializedRef.current) {
      // Only set default to 'created' on initial load, not when user manually changes tabs
      setActiveTab('created');
      tabInitializedRef.current = true;
    }
  }, [me]);

  const counts = useMemo(
    () => {
      if (me?.role === 'guide') {
        // For guides: separate created and joined hikes
        const createdHikes = (upcoming || []).filter(h => h.isCreated).concat((past || []).filter(h => h.isCreated));
        const joinedHikes = (upcoming || []).filter(h => !h.isCreated).concat((past || []).filter(h => !h.isCreated));
        
        return {
          total: (upcoming?.length || 0) + (past?.length || 0),
          created: createdHikes.length,
          joined: joinedHikes.length,
          upcoming: upcoming?.length || 0,
          completed: past?.length || 0,
        };
      } else {
        // For hikers: all are joined hikes
        return {
          total: (upcoming?.length || 0) + (past?.length || 0),
          upcoming: upcoming?.length || 0,
          completed: past?.length || 0,
        };
      }
    },
    [upcoming, past, me]
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
      // Reload profile data to show updated information
      await load();
    } catch (e) {
      console.error("Save profile failed", e);
      throw new Error(e?.response?.data?.error || "Failed to save profile");
    }
  }

  if (loading) return <div className="profile-loading">Loading…</div>;
  if (err && !me) return <div className="profile-error">Error: {err}</div>;
  if (!me) return <div className="profile-error">Could not load profile.</div>;

  // Format join date
  const joinDate = me.createdAt
    ? new Date(me.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  // Get user initial for avatar
  const userInitial = (me.name?.[0] || me.email?.[0] || 'U').toUpperCase();

  // For hikers: show the new design
  if (me.role === 'hiker') {
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
            <p className="profile-role">
              {me.role === 'guide' ? 'Guide' : me.role === 'hiker' ? 'Hiker' : 'User'}
            </p>
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
                  <div key={h.id} className="hike-card">
                    <div className="hike-info">
                      <h3 className="hike-name">{h.name}</h3>
                      <p className="hike-details">
                        {h.location} · {h.date ? new Date(h.date).toLocaleDateString() : "Date TBD"} · {h.difficulty}
                      </p>
                      <p className="hike-participants">
                        Participants: {h.participantsCount} / {h.capacity || '∞'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLeave(h.id)}
                      className="btn-leave"
                    >
                      Leave
                    </button>
                  </div>
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
                  <div key={h.id} className="hike-card">
                    <div className="hike-info">
                      <h3 className="hike-name">{h.name}</h3>
                      <p className="hike-details">
                        {h.location} · {h.date ? new Date(h.date).toLocaleDateString() : "Date TBD"} · {h.difficulty}
                      </p>
                    </div>
                  </div>
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

  // For guides: show similar design to hikers
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
          <p className="profile-role">
            {me.role === 'guide' ? 'Guide' : me.role === 'hiker' ? 'Hiker' : 'User'}
          </p>
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
                <div key={h.id} className="hike-card">
                  <div className="hike-info">
                    <h3 className="hike-name">{h.name}</h3>
                    <p className="hike-details">
                      {h.location} · {h.date ? new Date(h.date).toLocaleDateString() : "Date TBD"} · {h.difficulty}
                    </p>
                    <p className="hike-participants">
                      Participants: {h.participantsCount} / {h.capacity || '∞'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'joined' ? (
        <div className="hikes-section">
          <h2 className="section-title">Upcoming Joined Hikes</h2>
          {upcoming.filter(h => !h.isCreated).length === 0 && past.filter(h => !h.isCreated).length === 0 ? (
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
                    <div key={h.id} className="hike-card">
                      <div className="hike-info">
                        <h3 className="hike-name">{h.name}</h3>
                        <p className="hike-details">
                          {h.location} · {h.date ? new Date(h.date).toLocaleDateString() : "Date TBD"} · {h.difficulty}
                        </p>
                        <p className="hike-participants">
                          Participants: {h.participantsCount} / {h.capacity || '∞'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleLeave(h.id)}
                        className="btn-leave"
                      >
                        Leave
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {past.filter(h => !h.isCreated).length > 0 && (
                <>
                  <h3 className="section-subtitle" style={{ marginTop: "32px", marginBottom: "16px" }}>Completed Joined Hikes</h3>
                  <div className="hikes-list">
                    {past.filter(h => !h.isCreated).map((h) => (
                      <div key={h.id} className="hike-card">
                        <div className="hike-info">
                          <h3 className="hike-name">{h.name}</h3>
                          <p className="hike-details">
                            {h.location} · {h.date ? new Date(h.date).toLocaleDateString() : "Date TBD"} · {h.difficulty}
                          </p>
                          <p className="hike-participants">
                            Participants: {h.participantsCount} / {h.capacity || '∞'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      ) : activeTab === 'completed' ? (
        <div className="hikes-section">
          <h2 className="section-title">Completed Hikes</h2>
          {past.length === 0 ? (
            <div className="empty-state">
              <p>No completed hikes yet.</p>
            </div>
          ) : (
            <div className="hikes-list">
              {past.map((h) => (
                <div key={h.id} className="hike-card">
                  <div className="hike-info">
                    <h3 className="hike-name">{h.name}</h3>
                    <p className="hike-details">
                      {h.location} · {h.date ? new Date(h.date).toLocaleDateString() : "Date TBD"} · {h.difficulty}
                    </p>
                    <p className="hike-participants">
                      Participants: {h.participantsCount} / {h.capacity || '∞'}
                    </p>
                    {h.isCreated && (
                      <p className="hike-badge" style={{ fontSize: "12px", color: "#2f855a", marginTop: "4px" }}>
                        Created by you
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
