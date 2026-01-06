import React from 'react';

export default function WhatToBring({ value, onChange }) {
  const update = (e) => onChange({ ...value, whatToBring: e.target.value });

  return (
    <div className="panel">
      <h3>What to Bring</h3>
      <div style={{ marginTop: 8 }}>
        <label style={{ display: 'block' }}>
          <textarea
            value={value.whatToBring || ''}
            onChange={update}
            placeholder="Please, write each item on a new line."
            rows={6}
            style={{ width: '100%', marginTop: 8 }}
          />
        </label>
        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
          Examples: <em>Water (2L), Snacks, Hiking boots, Warm jacket</em>
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
          Each line becomes a separate checklist item for participants.
        </div>
      </div>
    </div>
  );
}
