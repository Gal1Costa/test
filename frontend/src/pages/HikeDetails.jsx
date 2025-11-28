import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { auth, onAuthStateChanged } from "../firebase";
import api from "../api";

export default function HikeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // All useState hooks MUST be at the top, before any conditional logic
  const [hike, setHike] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editErr, setEditErr] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editGpxFile, setEditGpxFile] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Clear joined IDs when user logs out
      if (!u) {
        setJoinedIds([]);
      }
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

      // Only load profile/bookings if user is logged in
      if (user) {
        try {
          const profileRes = await api.get("/api/profile");
          const profile = profileRes.data;
          setUserProfile(profile);
          const bookings = profile?.bookings || [];
          const joined = bookings.filter((b) => b.hikeId).map((b) => b.hikeId);
          setJoinedIds(joined);
        } catch (profileErr) {
          // If profile fails, user might not be authenticated
          console.warn("Failed to load profile:", profileErr);
          setJoinedIds([]);
          setUserProfile(null);
        }
      } else {
        // User is not logged in, clear joined IDs
        setJoinedIds([]);
        setUserProfile(null);
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
    load();
  }, [id, user]);

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
    if (!editFields.title && !editFields.description && !editFields.capacity && !editFields.price && !editFields.difficulty && !editFields.distance && !editFields.duration && !editFields.meetingTime && !editFields.location && !editFields.date && !editCoverFile && !editGpxFile) {
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
      
      // Add files
      if (editCoverFile) fd.append('cover', editCoverFile);
      if (editGpxFile) fd.append('gpx', editGpxFile);

      await api.put(`/api/hikes/${hike.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditMode(false);
      setEditFields({});
      setEditCoverFile(null);
      setEditGpxFile(null);
      setEditCoverPreview(null);
      await load();
    } catch (e) {
      setEditErr(e?.response?.data?.error || e.message || 'Failed to update hike');
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to={backLink} style={{ fontSize: 13 }}>
          ← {backLabel}
        </Link>
      </div>

      <h2>{hike.name || hike.title || "Untitled hike"}</h2>
          {hike.imageUrl && (
            <div style={{ margin: '12px 0' }}>
              <img src={hike.imageUrl.startsWith('/') ? `${api.defaults.baseURL}${hike.imageUrl}` : hike.imageUrl} alt={hike.title || hike.name} style={{ width: '100%', height: 320, objectFit: 'cover', borderRadius: 8 }} />
            </div>
          )}

          <p style={{ fontSize: 14, color: "#666" }}>
            {hike.location || "Unknown location"} · {date ? d.toLocaleDateString() : "Unknown date"} · {hike.difficulty || "n/a"}
          </p>

      {hike.guideName && (
        <p style={{ fontSize: 13, color: "#666" }}>
          Guide: {hike.guideName}
        </p>
      )}

      {hike.description && (
        <p style={{ marginTop: 12 }}>{hike.description}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
        <div style={{ fontSize: 13, color: '#444' }}><strong>Participants:</strong> {participantsCount}{capacity ? ` / ${capacity}` : ''} {isFull ? '(Full)' : ''}</div>
        <div style={{ fontSize: 13, color: '#444' }}><strong>Distance:</strong> {hike.distance || '—'}</div>
        <div style={{ fontSize: 13, color: '#444' }}><strong>Duration:</strong> {hike.duration || '—'}</div>
        <div style={{ fontSize: 13, color: '#444' }}><strong>Meeting Time:</strong> {hike.meetingTime || '—'}</div>
        <div style={{ fontSize: 13, color: '#444' }}><strong>Price:</strong> {hike.price != null ? `$${hike.price}` : 'Free'}</div>
      </div>

      {buttonLabel && (
        <button
          onClick={buttonOnClick || (() => {})}
          disabled={buttonDisabled}
          style={{
            marginTop: 16,
            background:
              buttonLabel === "Leave"
                ? "#fff"
                : buttonLabel === "Join"
                ? "#2d6a4f"
                : "#f0f0f0",
            border:
              buttonLabel === "Leave"
                ? "1px solid #d33"
                : "1px solid #ccc",
            color:
              buttonLabel === "Leave"
                ? "#d33"
                : buttonLabel === "Join"
                ? "#fff"
                : "#555",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: buttonDisabled ? "default" : "pointer",
            opacity: buttonDisabled ? 0.6 : 1,
          }}
        >
          {buttonLabel}
        </button>
      )}

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

              <div style={{ marginBottom: 12 }}>
                <h4 style={{ marginTop: 0, marginBottom: 8 }}>GPX Route (Optional)</h4>
                <label style={{ display: 'block', cursor: 'pointer', border: '1px dashed #e6eef0', borderRadius: 8, padding: 12, textAlign: 'center', color: '#666' }}>
                  <input 
                    type="file" 
                    accept=".gpx" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setEditGpxFile(file || null);
                    }}
                    style={{ display: 'none' }}
                  />
                  <div>📍 Click to upload GPX file</div>
                </label>
                {editGpxFile && <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>Selected: {editGpxFile.name}</div>}
              </div>

              {editErr && <div style={{ background: '#fff3f2', border: '1px solid #ffd2cf', padding: 8, borderRadius: 6, color: '#9b2c2c', marginBottom: 12, fontSize: 13 }}>{editErr}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-cancel" onClick={() => { setEditMode(false); setEditFields({}); setEditErr(null); setEditCoverFile(null); setEditGpxFile(null); setEditCoverPreview(null); }}>
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
  );
}
