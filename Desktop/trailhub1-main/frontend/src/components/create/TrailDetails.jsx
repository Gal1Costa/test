import React from 'react';

export default function TrailDetails({ value, onChange }) {
  const update = (k) => (e) => onChange({ ...value, [k]: e.target.value });

  return (
    <div className="panel">
      <h3>Trail Details</h3>
      <div className="grid-row">
        <label>
          Distance
          <input type="text" value={value.distance || ''} onChange={update('distance')} placeholder="e.g., 8.5 km" />
        </label>

        <label>
          Duration
          <input type="text" value={value.duration || ''} onChange={update('duration')} placeholder="e.g., 4-5 hours" />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>
          Description
          <textarea value={value.description || ''} onChange={update('description')} placeholder="Describe the hike, what participants can expect, and any special features..." rows={6} />
        </label>
      </div>
    </div>
  );
}
