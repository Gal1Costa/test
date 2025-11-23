import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { auth, onAuthStateChanged } from "../firebase";
import api from "../api";

export default function HikeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hike, setHike] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState(null);

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

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/" style={{ fontSize: 13 }}>
          ← Back to Explore
        </Link>
      </div>

      <h2>{hike.name || hike.title || "Untitled hike"}</h2>
      <p style={{ fontSize: 14, color: "#666" }}>
        {hike.location || "Unknown location"} ·{" "}
        {date ? d.toLocaleString() : "Unknown date"} ·{" "}
        {hike.difficulty || "n/a"}
      </p>

      {hike.guideName && (
        <p style={{ fontSize: 13, color: "#666" }}>
          Guide: {hike.guideName}
        </p>
      )}

      {hike.description && (
        <p style={{ marginTop: 12 }}>{hike.description}</p>
      )}

      <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
        Participants: {participantsCount}
        {capacity ? ` / ${capacity}` : ""} {isFull ? "(Full)" : ""}
      </p>

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
    </div>
  );
}
