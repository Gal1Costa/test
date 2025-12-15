import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { auth, onAuthStateChanged } from "../firebase";
import api from "../api";
import ReviewCard from "../components/ReviewCard";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";


export default function HikeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [hike, setHike] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editErr, setEditErr] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Clear joined IDs when user logs out
      if (!u) {
        setJoinedIds([]);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // Always load hike details
      const hikeRes = await api.get(`/api/hikes/${id}`);
      setHike(hikeRes.data || null);

  // Only load profile/bookings if user is logged in and auth is ready
  if (authReady && user) {
        try {
          const profileRes = await api.get("/api/me");
          const profile = profileRes.data;
          setUserProfile(profile);
          const bookings = profile?.bookings || [];
          const joined = bookings.filter((b) => b.hikeId).map((b) => b.hikeId);
          setJoinedIds(joined);

          // Check if user has already reviewed this hike
          try {
            const reviewsRes = await api.get('/api/reviews/user/me');
            const userReviews = reviewsRes.data || [];
            const hasReviewedThisHike = userReviews.some(review => review.hikeId === id);
            setHasReviewed(hasReviewedThisHike);
          } catch (reviewErr) {
            console.warn('Failed to load user reviews:', reviewErr);
            setHasReviewed(false);
          }
        } catch (profileErr) {
          // If profile fails, user might not be authenticated
          console.warn("Failed to load profile:", profileErr);
          setJoinedIds([]);
          setUserProfile(null);
          setHasReviewed(false);
        }
      } else {
        // User is not logged in, clear joined IDs
        setJoinedIds([]);
        setUserProfile(null);
        setHasReviewed(false);
      }
    } catch (e) {
      console.error("Failed to load hike details", e);
      setErr(
        e?.response?.data?.error || e.message || "Failed to load hike details"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, id, user]);

  const joinedSet = useMemo(() => new Set(joinedIds), [joinedIds]);

  async function handleJoin() {
    // If user is not logged in, trigger login modal via custom event
    if (!user) {
      // Dispatch custom event to open auth modal
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'login' } }));
      return;
    }

    try {
      await api.post(`/api/hikes/${id}/join`);
      await load();
    } catch (e) {
      console.error("Join failed", e);
      // If unauthorized, trigger login modal
      if (e?.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'login' } }));
      } else {
        alert(e?.response?.data?.error || "Failed to join hike");
      }
    }
  }

  async function handleLeave() {
    try {
      await api.delete(`/api/hikes/${id}/join`);
      await load();
    } catch (e) {
      console.error("Leave failed", e);
      alert(e?.response?.data?.error || "Failed to leave hike");
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading hike…</div>;
  if (err && !hike) return <div style={{ padding: 16 }}>Error: {err}</div>;
  if (!hike) return <div style={{ padding: 16 }}>Hike not found.</div>;

  const date = hike.date || hike.createdAt;
  const d = date ? new Date(date) : null;
  const now = new Date();
  const isPast = d ? d < now : false;

  const participantsCount = hike.participantsCount ?? 0;
  const capacity = hike.capacity ?? 0;
  const isFull =
    hike.isFull || (capacity > 0 && participantsCount >= capacity);
  const isJoined = joinedSet.has(hike.id);

  // Check if current user is the creator of this hike
  const isCreator = userProfile && (
    (userProfile.role === 'guide' && userProfile.createdHikes?.some(h => h.id === hike.id)) ||
    (hike.guideId && userProfile.guide?.id === hike.guideId)
  );

  let buttonLabel = "";
  let buttonDisabled = true;
  let buttonOnClick = null;

  if (isPast) {
    buttonLabel = "Past";
    buttonDisabled = true;
  } else if (isCreator) {
    // User created this hike, they cannot join it
    buttonLabel = "Your Hike";
    buttonDisabled = true;
  } else if (isJoined) {
    buttonLabel = "Leave";
    buttonDisabled = false;
    buttonOnClick = handleLeave;
  } else if (isFull) {
    buttonLabel = "Full";
    buttonDisabled = true;
  } else {
    buttonLabel = "Join";
    buttonDisabled = false;
    buttonOnClick = handleJoin;
  }
  // Determine back link: if navigated from profile, go back to profile
  const fromProfile = location.state && location.state.fromProfile;
  const backLink = fromProfile ? '/profile' : '/';
  const backLabel = fromProfile ? 'Back to Profile' : 'Back to Explore';

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this hike? This cannot be undone.')) return;
    setDeleting(true);
    setEditErr(null);
    try {
      await api.delete(`/api/hikes/${hike.id}`);
      navigate('/profile');
    } catch (e) {
      setEditErr(e?.response?.data?.error || e.message || 'Failed to delete hike');
    } finally {
      setDeleting(false);
    }
  }

  async function handleEdit() {
    if (!editFields.title && !editFields.description && !editFields.capacity && !editFields.price && !editFields.difficulty && !editFields.distance && !editFields.duration && !editFields.meetingTime && !editFields.location && !editFields.date && !editFields.meetingPlace && !editFields.elevationGain && !editFields.whatToBring && !editCoverFile) {
      setEditErr('No changes to save');
      return;
    }
    
    setEditErr(null);
    setEditSaving(true);
    try {
      const fd = new FormData();
      
      // Add fields that were edited
      if (editFields.title) fd.append('title', editFields.title);
      if (editFields.description !== undefined) fd.append('description', editFields.description);
      if (editFields.capacity !== undefined) fd.append('capacity', editFields.capacity || '');
      if (editFields.price !== undefined) fd.append('price', editFields.price || '');
      if (editFields.difficulty) fd.append('difficulty', editFields.difficulty);
      if (editFields.distance) fd.append('distance', editFields.distance);
      if (editFields.duration) fd.append('duration', editFields.duration);
      if (editFields.meetingTime !== undefined) fd.append('meetingTime', editFields.meetingTime);
      if (editFields.location) fd.append('location', editFields.location);
      if (editFields.date) fd.append('date', editFields.date);
      if (editFields.meetingPlace !== undefined) fd.append('meetingPlace', editFields.meetingPlace);
      if (editFields.elevationGain !== undefined) fd.append('elevationGain', editFields.elevationGain);
      if (editFields.whatToBring !== undefined) fd.append('whatToBring', editFields.whatToBring);
      
      // Add files
      if (editCoverFile) fd.append('cover', editCoverFile);

      await api.put(`/api/hikes/${hike.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditMode(false);
      setEditFields({});
      setEditCoverFile(null);
      setEditCoverPreview(null);
      await load();
    } catch (e) {
      setEditErr(e?.response?.data?.error || e.message || 'Failed to update hike');
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div>
      {/* Image full-width at top, no margins */}
      {hike.imageUrl && (
        <div style={{ position: 'relative', marginLeft: -20, marginRight: -20, marginTop: -20 }}>
          <img src={hike.imageUrl.startsWith('/') ? `${api.defaults.baseURL}${hike.imageUrl}` : hike.imageUrl} alt={hike.title || hike.name} style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }} />
          <button onClick={() => navigate(backLink)} aria-label="Back" style={{ position: 'absolute', left: 12, top: 12, background: '#fff', border: '1px solid rgba(0,0,0,0.06)', padding: 8, borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            ←
          </button>
        </div>
      )}

      {/* Content container with padding */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Left (main) column */}
          <div>
            {/* Title below image */}
            <h2 style={{ marginTop: 8 }}>{hike.name || hike.title || "Untitled hike"}</h2>

            {/* Basic Information Section */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📍</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{hike.location || 'Not specified'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>👥</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {participantsCount}{capacity ? ` / ${capacity}` : ''} {isFull ? '(Full)' : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>💰</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{hike.price ? `$${hike.price}` : 'Free'}</div>
                </div>
              </div>
            </div>


          <hr style={{ border: 'none', borderTop: '1px solid #e6eef0', margin: '18px 0' }} />

          <h3 style={{ marginTop: 0 }}>About This Hike</h3>
          {hike.description ? (
            <p style={{ marginTop: 8 }}>{hike.description}</p>
          ) : (
            <p style={{ color: '#666' }}>No description provided.</p>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #e6eef0', margin: '18px 0' }} />

        

          <hr style={{ border: 'none', borderTop: '1px solid #e6eef0', margin: '18px 0' }} />

          <h3 style={{ marginTop: 0 }}>What to Bring</h3>
          {hike.whatToBring ? (
            (() => {
              const items = (typeof hike.whatToBring === 'string' ? hike.whatToBring.split('\n') : Array.isArray(hike.whatToBring) ? hike.whatToBring : []).filter(Boolean);
              if (items.length === 0) return <p style={{ color: '#666' }}>No items listed.</p>;
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  {items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 10, height: 10, background: '#2d6a4f', borderRadius: 2, marginTop: 6 }} />
                      <div style={{ fontSize: 14 }}>{it}</div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <p style={{ color: '#666' }}>No suggestions provided.</p>
          )}

          {/* Participants section after What to Bring (visible only when >=1 participant) */}
          {hike.participants && hike.participants.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ marginTop: 0 }}>Participants</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 8 }}>
                {hike.participants.map((p) => (
                  <button key={p.id} onClick={() => {
                    // If participant is a guide, open guide profile; otherwise open hiker profile
                    if (p.guideId) {
                      navigate('/profile/guide', { state: { guideId: p.guideId, guideName: p.name, guidePhoto: p.photoUrl } });
                    } else {
                      navigate('/profile/hiker', { state: { userId: p.id, userName: p.name, userPhoto: p.photoUrl } });
                    }
                  }} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderRadius: 8, border: '1px solid #eee', background: '#fff', cursor: 'pointer' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#e6eef0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#2d6a4f', overflow: 'hidden' }}>
                      {p.photoUrl ? (
                        <img src={p.photoUrl.startsWith('/') ? `${api.defaults.baseURL}${p.photoUrl}` : p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{(p.name || 'P').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ textAlign: 'left' }}>{p.name}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            participantsCount > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ marginTop: 0 }}>Participants</h4>
                <div style={{ fontSize: 13, color: '#444' }}><strong>Joined:</strong> {participantsCount}{capacity ? ` / ${capacity}` : ''} {isFull ? '(Full)' : ''}</div>
              </div>
            )
          )}

          {/* Non-edit Route Map (visible when route exists and not in edit mode) */}
          {!editMode && Array.isArray(hike.route) && hike.route.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ marginTop: 0 }}>Route Map</h3>
              <div style={{ height: 360, width: '100%', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
                <MapContainer
                  center={
                    hike.mapLocation?.lat && hike.mapLocation?.lng
                      ? [hike.mapLocation.lat, hike.mapLocation.lng]
                      : hike.route[0]
                  }
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
                  <Polyline positions={hike.route} />
                  <Marker position={hike.route[0]} />
                  {hike.route.length > 1 && <Marker position={hike.route[hike.route.length - 1]} />}
                </MapContainer>
              </div>
            </div>
          )}

          {/* Owner actions (keeps existing edit UI below) */}

          </div>

          {/* Right (sidebar) column */}
          <aside style={{ width: '100%' }}>
            {/* Join / Unjoin container (visible to non-creators) */}
            {!isCreator && (
              <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: '#fff' }}>
                {isJoined ? (
                  <button onClick={handleLeave} className="btn-cancel" style={{ background: '#fff', border: '1px solid #e53e3e', color: '#e53e3e', width: '100%', padding: '8px 12px', borderRadius: 8 }}>Unjoin Hike</button>
                ) : (
                  <button onClick={handleJoin} className="btn-primary" style={{ background: '#2d6a4f', color: '#fff', width: '100%', padding: '8px 12px', borderRadius: 8 }}>Join Hike</button>
                )}
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, background: '#e6eef0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#2d6a4f' }}>
                  {hike.guide?.user?.name ? hike.guide.user.name.charAt(0).toUpperCase() : (hike.guideName ? hike.guideName.charAt(0) : 'G')}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{hike.guide?.user?.name || hike.guideName || 'Guide'}</div>
                  <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>{hike.guide?.averageRating ? `${hike.guide.averageRating} ★` : ''} {hike.guide?.totalReviews ? `(${hike.guide.totalReviews} reviews)` : ''}</div>
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 13, color: '#444' }}>
                {hike.guide?.bio || 'Professional guide. No bio provided.'}
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={() => { const guideId = hike.guide?.id || null; navigate('/profile/guide', { state: { guideId, guideName: hike.guide?.user?.name, guidePhoto: hike.guide?.user?.photoUrl } }); }} className="btn-primary" style={{ width: '100%', background: '#fff', color: '#2d6a4f', border: '1px solid #e5e7eb' }}>
                  View Profile
                </button>
              </div>
            </div>

            {/* Meeting Details Section */}
            <div style={{ marginTop: 12, background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Meeting Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Meeting Place</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{hike.meetingPlace || 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Date</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{date ? d.toLocaleDateString() : 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Time</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {hike.meetingTime ? (() => {
                      // Format time if it's in HH:MM format
                      const time = hike.meetingTime;
                      if (time.includes(':')) {
                        const [hours, minutes] = time.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour % 12 || 12;
                        return `${displayHour}:${minutes} ${ampm}`;
                      }
                      return time;
                    })() : 'Not specified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Review Section - Show for users who joined this hike and it's in the past and haven't reviewed yet */}
            {isJoined && hike.date && new Date(hike.date) < new Date() && !hasReviewed && (
              <div style={{ marginTop: 12 }}>
                <ReviewCard
                  hikeId={hike.id}
                  guideId={hike.guide?.id}
                  guideName={hike.guide?.user?.name || hike.guideName}
                  onSubmitted={() => setHasReviewed(true)}
                />
              </div>
            )}
          </aside>
        </div>

        {/* Owner actions */}
        {isCreator && (
        <div style={{ marginTop: 24 }}>
          {!editMode ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-cancel" style={{ borderColor: '#2d6a4f', color: '#2d6a4f' }} onClick={() => { setEditMode(true); setEditFields({}); setEditErr(null); }}>
                Edit Hike
              </button>
              <button className="btn-cancel" style={{ borderColor: '#e53e3e', color: '#e53e3e' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Hike'}
              </button>
            </div>
          ) : (
            <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginTop: 0 }}>Edit Hike</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Title
                  <input type="text" value={editFields.title || hike.title || ''} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} placeholder="Hike title" style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    Location
                    <input type="text" value={editFields.location || hike.location || ''} onChange={(e) => setEditFields({ ...editFields, location: e.target.value })} placeholder="Location" style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    Meeting Place
                    <input type="text" value={editFields.meetingPlace !== undefined ? editFields.meetingPlace : (hike.meetingPlace || '')} onChange={(e) => setEditFields({ ...editFields, meetingPlace: e.target.value })} placeholder="Street / meetup spot" style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                  </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Difficulty
                  <select value={editFields.difficulty || hike.difficulty || ''} onChange={(e) => setEditFields({ ...editFields, difficulty: e.target.value })} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                    <option value="">Select difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="HARD">Hard</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Capacity
                  <input type="number" min="1" value={editFields.capacity !== undefined ? editFields.capacity : hike.capacity || ''} onChange={(e) => setEditFields({ ...editFields, capacity: e.target.value })} placeholder="Max participants" style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Distance
                  <input type="text" value={editFields.distance || hike.distance || ''} onChange={(e) => setEditFields({ ...editFields, distance: e.target.value })} placeholder="e.g., 8.5 km" style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Duration
                  <input type="text" value={editFields.duration || hike.duration || ''} onChange={(e) => setEditFields({ ...editFields, duration: e.target.value })} placeholder="e.g., 4-5 hours" style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Elevation Gain
                  <input type="text" value={editFields.elevationGain !== undefined ? editFields.elevationGain : (hike.elevationGain || '')} onChange={(e) => setEditFields({ ...editFields, elevationGain: e.target.value })} placeholder="e.g., 450 m" style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Meeting Time
                  <input type="time" value={editFields.meetingTime || hike.meetingTime || ''} onChange={(e) => setEditFields({ ...editFields, meetingTime: e.target.value })} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Price (USD)
                  <input type="number" min="0" value={editFields.price !== undefined ? editFields.price : hike.price || ''} onChange={(e) => setEditFields({ ...editFields, price: e.target.value })} placeholder="Price or leave empty for free" style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </label>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Date
                  <input type="date" value={editFields.date || (hike.date ? hike.date.split('T')[0] : '')} onChange={(e) => setEditFields({ ...editFields, date: e.target.value })} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </label>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Description
                  <textarea value={editFields.description !== undefined ? editFields.description : hike.description || ''} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} placeholder="Describe the hike..." rows={4} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'inherit' }} />
                </label>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  What To Bring (one per line)
                  <textarea value={editFields.whatToBring !== undefined ? editFields.whatToBring : (typeof hike.whatToBring === 'string' ? hike.whatToBring : Array.isArray(hike.whatToBring) ? hike.whatToBring.join('\n') : '')} onChange={(e) => setEditFields({ ...editFields, whatToBring: e.target.value })} placeholder="e.g. Water\nSnacks\nWarm jacket" rows={4} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'inherit' }} />
                </label>
              </div>

              <div style={{ marginBottom: 12 }}>
                <h4 style={{ marginTop: 0, marginBottom: 8 }}>Cover Image</h4>
                <div style={{ border: '1px dashed #e6eef0', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  {editCoverPreview || (hike.imageUrl && !editCoverFile) ? (
                    <div style={{ width: '100%', height: 200, position: 'relative', marginBottom: 8 }}>
                      <img 
                        src={editCoverPreview || (hike.imageUrl.startsWith('/') ? `${api.defaults.baseURL}${hike.imageUrl}` : hike.imageUrl)} 
                        alt="cover preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} 
                      />
                      <div style={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 8 }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setEditCoverPreview(url);
                                setEditCoverFile(file);
                              }
                            };
                            input.click();
                          }}
                          style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                        >
                          Change
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setEditCoverPreview(null); setEditCoverFile(null); }} 
                          style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label style={{ display: 'block', cursor: 'pointer', textAlign: 'center', padding: 16, color: '#666' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setEditCoverPreview(url);
                            setEditCoverFile(file);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <div>📸 Click to upload cover image</div>
                    </label>
                  )}
                </div>
              </div>

              <h3 style={{ marginTop: 0 }}>Trail Map & Route</h3>

              <div style={{ marginTop: 8, border: "1px solid #e6eef0", borderRadius: 8, overflow: "hidden" }}>
                {Array.isArray(hike.route) && hike.route.length > 0 ? (
                  <div style={{ height: 360, width: "100%" }}>
                    <MapContainer
                      center={
                        hike.mapLocation?.lat && hike.mapLocation?.lng
                          ? [hike.mapLocation.lat, hike.mapLocation.lng]
                          : hike.route[0]
                      }
                      zoom={12}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap contributors"
                      />
                      <Polyline positions={hike.route} />
                      <Marker position={hike.route[0]} />
                      {hike.route.length > 1 && <Marker position={hike.route[hike.route.length - 1]} />}
                    </MapContainer>
                  </div>
                ) : (
                  <div style={{ padding: 24, textAlign: "center", color: "#666", background: "#f9fafb" }}>
                    <div style={{ fontSize: 36 }}>🗺️</div>
                    <div style={{ marginTop: 8 }}>No route provided for this hike.</div>
                  </div>
                )}
              </div>

            <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
              {hike.distance ? `${hike.distance} · ${hike.duration || ""}` : ""}
            </div>


              {editErr && <div style={{ background: '#fff3f2', border: '1px solid #ffd2cf', padding: 8, borderRadius: 6, color: '#9b2c2c', marginBottom: 12, fontSize: 13 }}>{editErr}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-cancel" onClick={() => { setEditMode(false); setEditFields({}); setEditErr(null); setEditCoverFile(null); setEditCoverPreview(null); }}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleEdit} disabled={editSaving} style={{ background: '#2d6a4f', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.6 : 1 }}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {!isCreator && editErr && <div className="alert-error" style={{ marginTop: 8 }}>{editErr}</div>}
      </div>
    </div>
  );
}