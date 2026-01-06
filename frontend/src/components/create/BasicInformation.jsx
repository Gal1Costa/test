import React from 'react';

export default function BasicInformation({ value, onChange, errors = {} }) {
  const update = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const getError = (field) => errors[field];

  return (
    <div className="panel">
      <h3>Basic Information</h3>

      {/* Row 1 – Name + Capacity */}
      <div className="grid-row" style={{ marginBottom: '24px' }}>
        <div className="field-error-container">
          <label>
            Hike Name *
            <input
              type="text"
              value={value.name || ''}
              onChange={update('name')}
              placeholder="e.g., Morning Summit Adventure"
              className={getError('name') ? 'has-error' : ''}
            />
          </label>
          {getError('name') && <span className="field-error">{getError('name')}</span>}
        </div>

        {/* RIGHT COLUMN: Capacity */}
        <div className="field-error-container">
          <label>
            Capacity
            <input
              type="number"
              min="1"
              value={value.capacity || ''}
              onChange={update('capacity')}
              placeholder="Max participants"
              className={getError('capacity') ? 'has-error' : ''}
            />
          </label>
          {getError('capacity') && <span className="field-error">{getError('capacity')}</span>}
        </div>
      </div>

      {/* Row 2 – Date + Meeting Time */}
      <div className="grid-row" style={{ marginBottom: '24px' }}>
        {/* LEFT COLUMN: Date */}
        <div className="field-error-container">
          <label>
            Date *
            <input
              type="date"
              value={value.date || ''}
              onChange={update('date')}
              className={getError('date') ? 'has-error' : ''}
            />
          </label>
          {getError('date') && <span className="field-error">{getError('date')}</span>}
        </div>

        {/* RIGHT COLUMN: Meeting Time */}
        <div className="field-error-container">
          <label>
            Meeting Time *
            <input
              type="time"
              value={value.meetingTime || ''}
              onChange={update('meetingTime')}
              className={getError('meetingTime') ? 'has-error' : ''}
            />
          </label>
          {getError('meetingTime') && <span className="field-error">{getError('meetingTime')}</span>}
        </div>
      </div>

      {/* Row 3 – Meeting Place + Location */}
      <div className="grid-row" style={{ marginBottom: '24px' }}>
        {/* LEFT COLUMN: Meeting Place */}
        <div className="field-error-container">
          <label>
            Meeting Place (street / meetup point) *
            <input
              type="text"
              value={value.meetingPlace || ''}
              onChange={update('meetingPlace')}
              placeholder="e.g., 123 Main St, parking lot near X"
              className={getError('meetingPlace') ? 'has-error' : ''}
            />
          </label>
          {getError('meetingPlace') && <span className="field-error">{getError('meetingPlace')}</span>}
        </div>

        {/* RIGHT COLUMN: Location */}
        <div className="field-error-container">
          <label>
            Location (region / area)
            <input
              type="text"
              value={value.location || ''}
              onChange={update('location')}
              placeholder="e.g., Rocky Mountain National Park, CO"
              className={getError('location') ? 'has-error' : ''}
            />
          </label>
          {getError('location') && <span className="field-error">{getError('location')}</span>}
        </div>
      </div>

      {/* Row 4 – Price + Difficulty */}
      <div className="grid-row">
        {/* LEFT COLUMN: Price */}
        <div className="field-error-container">
          <label>
            Price (USD)
            <input
              type="number"
              min="0"
              value={value.price || ''}
              onChange={update('price')}
              placeholder="e.g., 20"
              className={getError('price') ? 'has-error' : ''}
            />
          </label>
          {getError('price') && <span className="field-error">{getError('price')}</span>}
        </div>

        {/* RIGHT COLUMN: Difficulty */}
        <div className="field-error-container">
          <label>
            Difficulty Level *
            <select value={value.difficulty || ''} onChange={update('difficulty')} className={getError('difficulty') ? 'has-error' : ''}>
              <option value="">Select difficulty</option>
              <option value="EASY">Easy</option>
              <option value="MODERATE">Moderate</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
          {getError('difficulty') && <span className="field-error">{getError('difficulty')}</span>}
        </div>
      </div>

    </div>
  );
}