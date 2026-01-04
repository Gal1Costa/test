import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, onAuthStateChanged } from "../firebase";
import api from "../api";
import HikeCard from "../components/HikeCard";
import "./Explore.css";

export default function Explore() {
  const [hikes, setHikes] = useState([]);
  const [joinedIds, setJoinedIds] = useState([]); // hikeIds user joined
  const [filter, setFilter] = useState("upcoming"); // "upcoming" | "past" | "all"
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [userReviews, setUserReviews] = useState([]);

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Clear joined IDs when user logs out
      if (!u) {
        setJoinedIds([]);
      }
      // Mark that Firebase has finished initialising auth state
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // Always get hikes (api baseURL is `/api` so use relative paths)
      const hikesRes = await api.get("/hikes");
      const hikesData = Array.isArray(hikesRes.data) ? hikesRes.data : [];
      setHikes(hikesData);

      // Only get profile/bookings if user is logged in
      if (user) {
        try {
          const profileRes = await api.get("/me");
          const profile = profileRes.data || {};
          setUserProfile(profile);
          const bookings = Array.isArray(profile.bookings) ? profile.bookings : [];
          const joined = bookings
            .filter((b) => b.hikeId)
            .map((b) => b.hikeId);
          setJoinedIds(joined);

          // Load user's reviews
          const reviewsRes = await api.get('/reviews/user/me');
          setUserReviews(reviewsRes.data || []);
        } catch (profileErr) {
          // If profile fails, user might not be authenticated
          console.warn("Failed to load profile:", profileErr);
          setJoinedIds([]);
          setUserProfile(null);
          setUserReviews([]);
        }
      } else {
        // User is not logged in, clear joined IDs
        setJoinedIds([]);
        setUserProfile(null);
        setUserReviews([]);
      }
    } catch (e) {
      console.error("Failed to load explore data", e);
      setErr(e?.response?.data?.error || e.message || "Failed to load hikes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    load();
  }, [authReady, user]);

  const navigate = useNavigate();

  async function handleJoin(hikeId) {
    // If user is not logged in, trigger login modal via custom event
    if (!user) {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'login' } }));
      return;
    }

    try {
      await api.post(`/hikes/${hikeId}/join`);
      await load(); // refresh counts + joined state
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

  async function handleLeave(hikeId) {
    try {
      await api.delete(`/hikes/${hikeId}/join`);
      await load();
    } catch (e) {
      console.error("Leave failed", e);
      alert(e?.response?.data?.error || "Failed to leave hike");
    }
  }

  const joinedSet = useMemo(() => new Set(joinedIds), [joinedIds]);
  const now = new Date();

  const hasReviewedHike = (hikeId) => {
    return userReviews.some(review => review.hikeId === hikeId);
  };

  // Apply filter rules
  const filteredHikes = useMemo(() => {
    return (hikes || []).filter((h) => {
      const date = h.date || h.createdAt;
      const d = date ? new Date(date) : null;

      if (filter === "upcoming") {
        if (!d) return false;
        return d >= now; // all upcoming hikes (joined or not)
      }

      if (filter === "past") {
        if (!d) return false;
        return d < now; // all past hikes
      }

      return true;
    });
  }, [hikes, filter, now]);

  if (loading) {
    return <div style={{ padding: 16 }}>Loading hikes…</div>;
  }

  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Explore Hikes</h2>
        <p style={{ color: "red" }}>Error: {err}</p>
      </div>
    );
  }

  return (
    <div className="explore-page">
      <div className="explore-header">
        <div>
          <h2>Explore Hikes</h2>
          <p>{filteredHikes.length} hikes found</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {["upcoming", "past"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
          >
            {f === "upcoming" ? "Upcoming" : "Past"}
          </button>
        ))}
      </div>

      {filteredHikes.length === 0 ? (
        <div className="empty-state">
          <p>No hikes in this category.</p>
        </div>
      ) : (
        <div className="hikes-grid">
          {filteredHikes.map((h) => {
            const hikeDate = h.date || h.createdAt;
            const d = hikeDate ? new Date(hikeDate) : null;
            const isPastHike = d && d < now;
            const isJoinedHike = joinedSet.has(h.id);
            const needsReview = isPastHike && isJoinedHike && !hasReviewedHike(h.id);

            return (
              <HikeCard
                key={h.id}
                hike={h}
                isJoined={isJoinedHike}
                onJoin={(id) => handleJoin(id)}
                onLeave={(id) => handleLeave(id)}
                allowJoin={filter === 'upcoming'}
                allowLeave={true}
                userProfile={userProfile}
                needsReview={needsReview}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

