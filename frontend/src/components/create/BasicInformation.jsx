import React from 'react';

export default function BasicInformation({ value, onChange }) {
  const update = (k) => (e) => onChange({ ...value, [k]: e.target.value });

  return (
    <div className="panel">
      <h3>Basic Information</h3>

      {/* Row 1 – Name + Capacity */}
      <div className="grid-row">
        {/* LEFT COLUMN: Hike Name */}
        <label>
          Hike Name *
          <input
            type="text"
            value={value.name || ''}
            onChange={update('name')}
            placeholder="e.g., Morning Summit Adventure"
          />
        </label>

        {/* RIGHT COLUMN: Capacity */}
        <label>
          Capacity
          <input
            type="number"
            min="1"
            value={value.capacity || ''}
            onChange={update('capacity')}
            placeholder="Max participants"
          />
        </label>
      </div>

      {/* Row 2 – Date + Meeting Time */}
      <div className="grid-row">
        {/* LEFT COLUMN: Date */}
        <label>
          Date *
          <input
            type="date"
            value={value.date || ''}
            onChange={update('date')}
          />
        </label>

        {/* RIGHT COLUMN: Meeting Time */}
        <label>
          Meeting Time
          <input
            type="time"
            value={value.meetingTime || ''}
            onChange={update('meetingTime')}
          />
        </label>
      </div>

      {/* Row 3 – Meeting Place + Location */}
      <div className="grid-row">
        {/* LEFT COLUMN: Meeting Place */}
        <label>
          Meeting Place (street / meetup point) *
          <input
            type="text"
            value={value.meetingPlace || ''}
            onChange={update('meetingPlace')}
            placeholder="e.g., 123 Main St, parking lot near X"
          />
        </label>

        {/* RIGHT COLUMN: Location */}
        <label>
          Location (region / area)
          <input
            type="text"
            value={value.location || ''}
            onChange={update('location')}
            placeholder="e.g., Rocky Mountain National Park, CO"
          />
        </label>
      </div>

      {/* Row 4 – Price + Difficulty */}
      <div className="grid-row">
        {/* LEFT COLUMN: Price */}
        <label>
          Price (USD)
          <input
            type="number"
            min="0"
            value={value.price || ''}
            onChange={update('price')}
            placeholder="e.g., 20"
          />
        </label>

        {/* RIGHT COLUMN: Difficulty */}
        <label>
          Difficulty Level *
          <select value={value.difficulty || ''} onChange={update('difficulty')}>
            <option value="">Select difficulty</option>
            <option value="EASY">Easy</option>
            <option value="MODERATE">Moderate</option>
            <option value="HARD">Hard</option>
          </select>
        </label>
      </div>

    </div>
  );
}
