import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function HikeDetails() {
  const { id } = useParams();
  const [hike, setHike] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [hikeRes, profileRes] = await Promise.all([
        api.get(`/api/hikes/${id}`),
        api.get("/api/profile"),
      ]);

      setHike(hikeRes.data || null);

      const bookings = profileRes.data?.bookings || [];
      const joined = bookings.filter((b) => b.hikeId).map((b) => b.hikeId);
      setJoinedIds(joined);
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
  }, [id]);

  const joinedSet = useMemo(() => new Set(joinedIds), [joinedIds]);

  async function handleJoin() {
    try {
      await api.post(`/api/hikes/${id}/join`);
      await load();
    } catch (e) {
      console.error("Join failed", e);
      alert(e?.response?.data?.error || "Failed to join hike");
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

  let buttonLabel = "";
  let buttonDisabled = true;
  let buttonOnClick = null;

  if (isPast) {
    buttonLabel = "Past";
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
