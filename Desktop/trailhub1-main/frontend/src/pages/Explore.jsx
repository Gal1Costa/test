import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Explore() {
  const [hikes, setHikes] = useState([]);
  const [joinedIds, setJoinedIds] = useState([]); // hikeIds user joined
  const [filter, setFilter] = useState("upcoming"); // "upcoming" | "past" | "all"
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // Get all hikes + profile (for joined info)
      const [hikesRes, profileRes] = await Promise.all([
        api.get("/api/hikes"),
        api.get("/api/profile"),
      ]);

      const hikesData = hikesRes.data || [];
      const profile = profileRes.data || {};
      const bookings = profile.bookings || [];

      const joined = bookings
        .filter((b) => b.hikeId)
        .map((b) => b.hikeId);

      setHikes(hikesData);
      setJoinedIds(joined);
    } catch (e) {
      console.error("Failed to load explore data", e);
      setErr(e?.response?.data?.error || e.message || "Failed to load hikes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const joinedSet = useMemo(() => new Set(joinedIds), [joinedIds]);
  const now = new Date();

  // Apply filter rules
  const filteredHikes = useMemo(() => {
    return (hikes || []).filter((h) => {
      const date = h.date || h.createdAt;
      const d = date ? new Date(date) : null;
      const isPast = d ? d < now : false;
      const isJoined = joinedSet.has(h.id);

      if (filter === "upcoming") {
        if (!d) return false;
        return d >= now; // all upcoming hikes (joined or not)
      }

      if (filter === "past") {
        if (!d) return false;
        return d < now; // all past hikes
      }

      if (filter === "all") {
        // ONLY hikes the user already joined (past or upcoming)
        return isJoined;
      }

      return true;
    });
  }, [hikes, filter, joinedSet, now]);

  async function handleJoin(hikeId) {
    try {
      await api.post(`/api/hikes/${hikeId}/join`);
      await load(); // refresh counts + joined state
    } catch (e) {
      console.error("Join failed", e);
      alert(e?.response?.data?.error || "Failed to join hike");
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
    <div style={{ padding: 16 }}>
      <h2>Explore Hikes</h2>

      {/* Filter tabs */}
      <div style={{ marginBottom: 16 }}>
        {["upcoming", "past", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              marginRight: 8,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #ccc",
              background: filter === f ? "#333" : "#fff",
              color: filter === f ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            {f === "upcoming"
              ? "Upcoming"
              : f === "past"
              ? "Past"
              : "All (Joined only)"}
          </button>
        ))}
      </div>

      {filteredHikes.length === 0 && <p>No hikes in this category.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredHikes.map((h) => {
          const date = h.date || h.createdAt;
          const d = date ? new Date(date) : null;
          const isPast = d ? d < now : false;

          const participantsCount = h.participantsCount ?? 0;
          const capacity = h.capacity ?? 0;
          const isFull =
            h.isFull || (capacity > 0 && participantsCount >= capacity);
          const isJoined = joinedSet.has(h.id);

          // Decide button behavior based on tab, join status, date, and capacity
          let buttonLabel = "";
          let buttonDisabled = true;
          let buttonOnClick = null;

          if (filter === "past" || isPast) {
            // Past: no join / no leave
            buttonLabel = "Past";
            buttonDisabled = true;
          } else if (filter === "upcoming") {
            if (isJoined) {
              buttonLabel = "Leave";
              buttonDisabled = false;
              buttonOnClick = () => handleLeave(h.id);
            } else if (isFull) {
              buttonLabel = "Full";
              buttonDisabled = true;
            } else {
              buttonLabel = "Join";
              buttonDisabled = false;
              buttonOnClick = () => handleJoin(h.id);
            }
          } else if (filter === "all") {
            // All tab: only already joined hikes; can only leave upcoming ones
            if (isPast) {
              buttonLabel = "Past";
              buttonDisabled = true;
            } else {
              // future joined hike
              buttonLabel = "Leave";
              buttonDisabled = false;
              buttonOnClick = () => handleLeave(h.id);
            }
          }

          return (
            <li
              key={h.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                border: "1px solid #eee",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  {/* name as a link to details page */}
                  <Link
                    to={`/hikes/${h.id}`}
                    style={{ color: "#2d6a4f", textDecoration: "none" }}
                  >
                    {h.name || h.title || "Untitled hike"}
                  </Link>
                </div>
                <div style={{ fontSize: 13, color: "#666" }}>
                  {h.location || "Unknown location"} ·{" "}
                  {date ? new Date(date).toLocaleString() : "Unknown date"} ·{" "}
                  {h.difficulty || "n/a"}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  Participants: {participantsCount}
                  {capacity ? ` / ${capacity}` : ""}{" "}
                  {isFull ? "(Full)" : ""}
                </div>
                {h.guideName && (
                  <div style={{ fontSize: 12, color: "#888" }}>
                    Guide: {h.guideName}
                  </div>
                )}
              </div>
              <div>
                {buttonLabel && (
                  <button
                    onClick={buttonOnClick || (() => {})}
                    disabled={buttonDisabled}
                    style={{
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
                      padding: "8px 12px",
                      cursor: buttonDisabled ? "default" : "pointer",
                      opacity: buttonDisabled ? 0.6 : 1,
                    }}
                  >
                    {buttonLabel}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
