import React from 'react';

export default function TrailDetails({ value, onChange, errors = {} }) {
  const update = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const getError = (field) => errors[field];

  return (
    <div className="panel">
      <h3>Trail Details</h3>
      
      {/* Distance and Duration side by side */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Distance */}
        <div className="field-error-container" style={{ flex: 1 }}>
          <label>
            Distance
            <input 
              type="text" 
              value={value.distance || ''} 
              onChange={update('distance')} 
              placeholder="e.g., 8.5 km"
              className={getError('distance') ? 'has-error' : ''}
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              * Leave empty to auto-calculate from map route 
            </small>
          </label>
          {getError('distance') && <span className="field-error">{getError('distance')}</span>}
        </div>
        
        {/* Duration */}
        <div className="field-error-container" style={{ flex: 1 }}>
          <label>
            Duration
            <input 
              type="text" 
              value={value.duration || ''} 
              onChange={update('duration')} 
              placeholder="e.g., 4-5 hours"
              className={getError('duration') ? 'has-error' : ''}
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              * Leave empty to auto-calculate from map route (estimated by foot)
            </small>
          </label>
          {getError('duration') && <span className="field-error">{getError('duration')}</span>}
        </div>
      </div>

      <div className="grid-row" style={{ marginTop: 12 }}>
        <div className="field-error-container">
          <label>
            Elevation Gain
            <input 
              type="text" 
              value={value.elevationGain || ''} 
              onChange={update('elevationGain')} 
              placeholder="e.g., 1200 m"
              className={getError('elevationGain') ? 'has-error' : ''}
            />
          </label>
          {getError('elevationGain') && <span className="field-error">{getError('elevationGain')}</span>}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="field-error-container">
          <label>
            Description
            <textarea 
              value={value.description || ''} 
              onChange={update('description')} 
              placeholder="Describe the hike, what participants can expect, and any special features..." 
              rows={6}
              className={getError('description') ? 'has-error' : ''}
            />
          </label>
          {getError('description') && <span className="field-error">{getError('description')}</span>}
        </div>
      </div>
    </div>
  );
}