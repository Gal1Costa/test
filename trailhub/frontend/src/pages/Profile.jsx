import React, { useEffect, useState, useMemo } from "react";
import api from "../api";

function Section({ title, hikes, onLeave }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h3>{title}</h3>
      {hikes.length === 0 && <p>Nothing here yet.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {hikes.map((h) => (
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
              <div style={{ fontWeight: 600 }}>{h.name}</div>
              <div style={{ fontSize: 13, color: "#666" }}>
                {h.location} ·{" "}
                {h.date
                  ? new Date(h.date).toLocaleString()
                  : "Unknown date"}{" "}
                · {h.difficulty}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                Participants: {h.participantsCount} / {h.capacity}{" "}
                {h.isFull ? "(Full)" : ""}
              </div>
            </div>
            <div>
              <button
                onClick={() => onLeave(h.id)}
                style={{
                  background: "#fff",
                  border: "1px solid #d33",
                  color: "#d33",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Leave
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Profile() {
  const [me, setMe] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // single call to backend profile endpoint
      const res = await api.get("/api/profile");
      const profile = res.data;
      setMe(profile);

      const bookings = profile.bookings || [];
      const now = new Date();

      // Map bookings to the shape our Section expects
      const hikes = bookings
        .filter((b) => b.hike)
        .map((b) => {
          const h = b.hike;
          const date = h.date || h.createdAt; // we mapped createdAt -> date on the backend for hikes
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
          };
        });

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
    () => ({
      total: (upcoming?.length || 0) + (past?.length || 0),
      upcoming: upcoming?.length || 0,
      past: past?.length || 0,
    }),
    [upcoming, past]
  );

  async function handleLeave(hikeId) {
    try {
      await api.delete(`/api/hikes/${hikeId}/join`);
      await load(); // refresh profile after leaving
    } catch (e) {
      console.error("Leave failed", e);
      alert(e?.response?.data?.error || "Failed to leave hike");
    }
  }

  if (loading) return <div>Loading…</div>;
  if (err && !me) return <div>Error: {err}</div>;
  if (!me) return <div>Could not load profile.</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>My Profile</h2>
      <div
        style={{
          border: "1px solid #eee",
          padding: 16,
          borderRadius: 12,
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 18 }}>
          {me.name || "Hiker"}
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>{me.email}</div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          Role: {me.role}
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          Joined hikes: {counts.total} (Upcoming: {counts.upcoming} · Past:{" "}
          {counts.past})
        </div>
      </div>

      <Section title="Upcoming hikes" hikes={upcoming} onLeave={handleLeave} />
      <Section title="Past hikes" hikes={past} onLeave={handleLeave} />
    </div>
  );
}
