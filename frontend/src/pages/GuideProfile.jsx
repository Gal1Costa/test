import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, onAuthStateChanged } from "../firebase";
import api from "../api";
import EditProfileModal from "../components/EditProfileModal";
import HikeCard from "../components/HikeCard";
import "./Profile.css";

export default function GuideProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [me, setMe] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
<<<<<<< HEAD
=======
  const [reviews, setReviews] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
>>>>>>> 44afc34 (Initial commit with all current changes)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("created");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);
  const [completedView, setCompletedView] = useState('created');
  const tabInitializedRef = useRef(false);
  const [authReady, setAuthReady] = useState(false);

  // Check auth and redirect if not guide
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthReady(true);
    });
    return () => unsub();
  }, [navigate]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams(location.search);
      const qsUserId = params.get('user');
      const stateGuideId = location.state?.guideId;
      // Clear previous profile to avoid showing stale data while loading
      setMe(null);
      console.debug('[GuideProfile] load() called, location.state:', location.state, 'qsUserId:', qsUserId, 'resolved guideId:', stateGuideId);

      // Get current user profile to check if they're viewing their own profile
      let currentUserProfile = null;
      try {
        const currentUserRes = await api.get("/api/me");
        currentUserProfile = currentUserRes.data;
      } catch (e) {
        // User not logged in, that's okay
        console.debug('[GuideProfile] Could not get current user:', e.message);
      }

      let profile;
      if (stateGuideId) {
        // Public view via guide id passed in state
        const res = await api.get(`/api/guides/${String(stateGuideId)}`);
        const g = res.data;
        // Normalize guide response into the shape this component expects
        profile = {
          id: g.user?.id || g.id,
          email: g.user?.email,
          name: g.user?.name || g.name,
          role: 'guide',
          guide: {
            ...g,
            id: g.id || (g.user && g.user.guide && g.user.guide.id) || null,
          },
          createdHikes: g.hikes || g.createdHikes || [],
          bookings: g.bookings || [],
        };
        
        // Check if current user is the owner of this guide profile
        const isOwner = currentUserProfile && (
          currentUserProfile.id === profile.id ||
          (currentUserProfile.role === 'guide' && currentUserProfile.guide?.id && String(currentUserProfile.guide.id) === String(stateGuideId)) ||
          (currentUserProfile.role === 'guide' && currentUserProfile.guide?.id && profile.guide?.id && String(currentUserProfile.guide.id) === String(profile.guide.id))
        );
        setIsPublicView(!isOwner);
      } else if (qsUserId) {
        // Viewing a user by userId (querystring). If that user is a guide, fetch the richer guide endpoint.
        const res = await api.get(`/api/users/${String(qsUserId)}`);
        const tmp = res.data;
        if (tmp && tmp.role === 'guide' && tmp.guide && tmp.guide.id) {
          try {
            const guideRes = await api.get(`/api/guides/${String(tmp.guide.id)}`);
            const g = guideRes.data;
            profile = {
              id: g.user?.id || g.id,
              email: g.user?.email,
              name: g.user?.name || g.name,
              role: 'guide',
              guide: {
                ...g,
                id: g.id || (g.user && g.user.guide && g.user.guide.id) || null,
              },
              createdHikes: g.hikes || g.createdHikes || [],
              bookings: g.bookings || [],
            };
          } catch (e) {
            profile = tmp;
          }
        } else {
          profile = tmp;
        }
        
        // Check if current user is the owner of this profile
        const isOwner = currentUserProfile && (
          currentUserProfile.id === profile.id ||
          (currentUserProfile.role === 'guide' && currentUserProfile.guide?.id && profile.guide?.id && String(currentUserProfile.guide.id) === String(profile.guide.id))
        );
        setIsPublicView(!isOwner);
      } else {
        // No guide id passed — load current user and, if they are a guide, fetch the canonical guide data
        const res = await api.get("/api/me", { params: { _t: Date.now() } });
        const meProfile = res.data;
        if (meProfile.role === 'guide') {
          // If guide record is present, use it; otherwise try to fetch user record which may include guide relation
          let guideIdCandidate = meProfile.guide?.id || null;
          if (!guideIdCandidate) {
            try {
              const userRes = await api.get(`/api/users/${String(meProfile.id)}`);
              const userObj = userRes.data;
              guideIdCandidate = userObj.guide?.id || null;
            } catch (e) {
              // ignore and fallback
            }
          }

          if (guideIdCandidate) {
            try {
              const guideRes = await api.get(`/api/guides/${String(guideIdCandidate)}`);
              const g = guideRes.data;
              profile = {
                id: g.user?.id || g.id,
                email: g.user?.email,
                name: g.user?.name || g.name,
                role: 'guide',
                guide: {
                  ...g,
                  id: g.id || (g.user && g.user.guide && g.user.guide.id) || null,
                },
                createdHikes: g.hikes || g.createdHikes || [],
                bookings: g.bookings || [],
              };
              setIsPublicView(false);
            } catch (innerErr) {
              // If fetching guide endpoint fails, fall back to /api/me response
              profile = meProfile;
              setIsPublicView(false);
            }
          } else {
            // No guide record found, use meProfile as-is
            profile = meProfile;
            setIsPublicView(false);
          }
        } else {
          profile = meProfile;
          setIsPublicView(false);
        }
      }

      // Redirect non-guides only when viewing own profile
      if (!stateGuideId && !qsUserId && profile.role !== 'guide') {
        navigate("/profile/hiker");
        return;
      }

      console.log('[GuideProfile] Loaded profile:', { id: profile.id, email: profile.email, name: profile.name, role: profile.role });
      setMe(profile);

      const now = new Date();
      let hikes = [];

      // For guides: show both created hikes AND joined hikes (bookings)
      const createdHikes = (profile.createdHikes || []).map((h) => ({
        ...h,
        imageUrl: h.coverUrl || h.imageUrl || null,
        isCreated: true,
      }));

      // Get joined hikes (bookings) 
      const createdHikeIds = new Set(createdHikes.map(h => h.id));
      const bookings = (profile.bookings || [])
        .filter((b) => b.hike && !createdHikeIds.has(b.hike.id))
        .map((b) => ({
          ...b.hike,
          imageUrl: b.hike.coverUrl || b.hike.imageUrl || null,
          isCreated: false,
        }));

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
<<<<<<< HEAD
=======

      // Load user's reviews if viewing own profile
      if (!isPublicView) {
        try {
          const userRevRes = await api.get('/api/reviews/user/me');
          setUserReviews(userRevRes.data || []);
        } catch (urErr) {
          console.warn('Failed to load user reviews', urErr);
          setUserReviews([]);
        }
      } else {
        setUserReviews([]);
      }

      // Load reviews for this guide
      if (profile.guide?.id) {
        try {
          const revRes = await api.get(`/api/reviews/guide/${profile.guide.id}`);
          setReviews(revRes.data || []);
        } catch (rErr) {
          console.warn('Failed to load guide reviews', rErr);
          setReviews([]);
        }
      } else {
        setReviews([]);
      }
>>>>>>> 44afc34 (Initial commit with all current changes)
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
    // wait for Firebase auth initialization before loading profile
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthReady(true);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure we reload when auth is ready or when location state/search changes
  useEffect(() => {
    if (!authReady) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, location.key, location.search, location.state?.guideId]);

<<<<<<< HEAD
=======
  const reviewedHikeIds = useMemo(() => new Set(userReviews.map(r => r.hikeId)), [userReviews]);

>>>>>>> 44afc34 (Initial commit with all current changes)
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
            {!isPublicView && (
              <button 
                className="btn-edit-profile"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Profile
              </button>
            )}
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
<<<<<<< HEAD
          <div className="stat-number">{counts.total}</div>
          <div className="stat-label">Total</div>
=======
          <div className="stat-number">{reviews.length}</div>
          <div className="stat-label">Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.total}</div>
          <div className="stat-label">Total Hikes</div>
>>>>>>> 44afc34 (Initial commit with all current changes)
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
          {(() => {
            const createdUpcoming = upcoming.filter(h => h.isCreated);
            if (createdUpcoming.length === 0) {
              return (
                <div className="empty-state">
                  {isPublicView ? (
                    <p>No upcoming created hikes.</p>
                  ) : (
                    <>
                      <p>You haven't created any upcoming hikes yet. Create your first hike to get started!</p>
                      <Link to="/hikes/create" className="btn-explore-hikes">
                        Create Hike
                      </Link>
                    </>
                  )}
                </div>
              );
            }

            return (
              <div className="hikes-list">
                {createdUpcoming.map((h) => (
                  <HikeCard
                    key={h.id}
                    hike={h}
                    isJoined={false}
                    allowJoin={false}
                    allowLeave={false}
                    userProfile={me}
                    fromProfile={true}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      ) : activeTab === 'joined' ? (
        <div className="hikes-section">
          <h2 className="section-title">Upcoming Joined Hikes</h2>
          {(() => {
            const joinedUpcoming = upcoming.filter(h => !h.isCreated);
            if (joinedUpcoming.length === 0) {
              return (
                <div className="empty-state">
                  {isPublicView ? (
                    <p>No upcoming joined hikes.</p>
                  ) : (
                    <>
                      <p>You haven't joined any hikes yet. Browse available hikes to get started!</p>
                      <Link to="/explore" className="btn-explore-hikes">
                        Explore Hikes
                      </Link>
                    </>
                  )}
                </div>
              );
            }

            return (
              <div className="hikes-list">
                {joinedUpcoming.map((h) => (
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
            );
          })()}
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
                    fromProfile={true}
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
                    fromProfile={true}
<<<<<<< HEAD
=======
                    needsReview={!reviewedHikeIds.has(h.id)}
>>>>>>> 44afc34 (Initial commit with all current changes)
                  />
                ))}
              </div>
            )
          )}
        </div>
      ) : null}

<<<<<<< HEAD
=======
      {/* Reviews Section */}
      <div className="reviews-section">
        <h2 className="section-title">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="empty-state">
            <p>No reviews yet.</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-user">
                    {review.user?.name || 'Anonymous'}
                  </div>
                  <div className="review-rating">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                {review.comment && (
                  <div className="review-comment">
                    {review.comment}
                  </div>
                )}
                {review.tags && review.tags.length > 0 && (
                  <div className="review-tags">
                    {review.tags.map((tag, idx) => (
                      <span key={idx} className="review-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

>>>>>>> 44afc34 (Initial commit with all current changes)
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
