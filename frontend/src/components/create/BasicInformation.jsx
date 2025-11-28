import React from 'react';

export default function BasicInformation({ value, onChange }) {
  const update = (k) => (e) => onChange({ ...value, [k]: e.target.value });

  return (
    <div className="panel">
      <h3>Basic Information</h3>
      <div className="grid-row">
        <label>
          Hike Name *
          <input type="text" value={value.name || ''} onChange={update('name')} placeholder="e.g., Morning Summit Adventure" />
        </label>
      </div>

      <div className="grid-row">
        <label>
          Date *
          <input type="date" value={value.date || ''} onChange={update('date')} />
        </label>

        <label>
          Capacity *
          <input type="number" min="1" value={value.capacity || ''} onChange={update('capacity')} placeholder="Max participants" />
        </label>
      </div>

      <div className="grid-row">
        <label>
          Location *
          <input type="text" value={value.location || ''} onChange={update('location')} placeholder="e.g., Rocky Mountain National Park, CO" />
        </label>

        <label>
          Difficulty Level *
          <select value={value.difficulty || ''} onChange={update('difficulty')}>
            <option value="">Select difficulty</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>
    </div>
  );
}
