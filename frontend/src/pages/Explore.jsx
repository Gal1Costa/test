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
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState("newest"); // newest | soonest | priceLow | priceHigh


  // NEW: filters for backend query
  const [q, setQ] = useState("");                 // search
  const [difficulty, setDifficulty] = useState(""); // "", "easy", "moderate", "hard"
  const [dateFrom, setDateFrom] = useState("");   // "YYYY-MM-DD"
  const [dateTo, setDateTo] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [locationQ, setLocationQ] = useState(""); // location search box
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
      // Always get hikes (send filter params)
      const params = {
        search: q.trim() || undefined,
        difficulty: difficulty || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        priceFrom: priceFrom !== "" ? priceFrom : undefined,
        priceTo: priceTo !== "" ? priceTo : undefined,
        location: locationQ.trim() || undefined,
      };

      const hikesRes = await api.get("/api/hikes", { params });
      const hikesData = hikesRes.data || [];
      setHikes(hikesData);

      // Only get profile/bookings if user is logged in
      if (user) {
        try {
          const profileRes = await api.get("/api/me");
          const profile = profileRes.data || {};
          setUserProfile(profile);
          const bookings = profile.bookings || [];
          const joined = bookings
            .filter((b) => b.hikeId)
            .map((b) => b.hikeId);
          setJoinedIds(joined);

          // Load user's reviews
          const reviewsRes = await api.get('/api/reviews/user/me');
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
      await api.post(`/api/hikes/${hikeId}/join`);
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
      await api.delete(`/api/hikes/${hikeId}/join`);
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

  const sortedHikes = useMemo(() => {
    const arr = [...filteredHikes];

    if (sort === "soonest") {
      arr.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
    } else if (sort === "priceLow") {
      arr.sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));
    } else if (sort === "priceHigh") {
      arr.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    } else {
      // newest
      arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return arr;
  }, [filteredHikes, sort]);

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
      <div
        className="explore-header"
        style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>Explore Hikes</h2>
          <p style={{ margin: 0, color: "#666" }}>{sortedHikes.length} hikes found</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
          >
            <option value="newest">Sort: Newest</option>
            <option value="soonest">Sort: Soonest</option>
            <option value="priceLow">Sort: Price (low → high)</option>
            <option value="priceHigh">Sort: Price (high → low)</option>
          </select>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className="btn-cancel"
            style={{ padding: "10px 12px", borderRadius: 10 }}
          >
            {showFilters ? "Hide filters" : "Filters"}
          </button>
          <button
            onClick={() => {
              setQ("");
              setDifficulty("");
              setDateFrom("");
              setDateTo("");
              setPriceFrom("");
              setPriceTo("");
              setLocationQ("");
            }}
            className="btn-cancel"
            style={{ padding: "10px 12px", borderRadius: 10 }}
          >
            Clear
          </button>

          <button
            onClick={() => {
              load();
              setShowFilters(false);
            }}
            className="btn-primary"
            style={{ padding: "10px 12px", borderRadius: 10 }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Quick search row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10, marginTop: 14 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Search hikes (title, location, etc.)'
          style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
        >
          <option value="">Difficulty (all)</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Filters panel (collapsible) */}
      {showFilters && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            background: "#fff",
            display: "grid",
            gap: 12,
          }}
        >
          <input
            value={locationQ}
            onChange={(e) => setLocationQ(e.target.value)}
            placeholder='Location / Meeting place (e.g. "Kazbegi")'
            style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#666" }}>Date from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#666" }}>Date to</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#666" }}>Price from</label>
              <input
                type="number"
                min="0"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                placeholder="0"
                style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#666" }}>Price to</label>
              <input
                type="number"
                min="0"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                placeholder="100"
                style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setQ("");
                setDifficulty("");
                setDateFrom("");
                setDateTo("");
                setPriceFrom("");
                setPriceTo("");
                setLocationQ("");
              }}
              className="btn-cancel"
              style={{ padding: "10px 12px", borderRadius: 10 }}
            >
              Clear
            </button>

            <button
              onClick={() => {
                load();
                setShowFilters(false); // collapse after apply = feels clean
              }}
              className="btn-primary"
              style={{ padding: "10px 12px", borderRadius: 10 }}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="filter-tabs" style={{ marginTop: 16 }}>
        {["upcoming", "past"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? "active" : ""}`}
          >
            {f === "upcoming" ? "Upcoming" : "Past"}
          </button>
        ))}
      </div>

      {/* Hikes */}
      {sortedHikes.length === 0 ? (
        <div className="empty-state">
          <p>No hikes match your filters.</p>
        </div>
      ) : (
        <div className="hikes-grid">
          {sortedHikes.map((h) => {
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
                allowJoin={filter === "upcoming"}
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

