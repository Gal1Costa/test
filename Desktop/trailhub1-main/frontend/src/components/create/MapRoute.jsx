import React from 'react';

export default function MapRoute({ value, onChange }) {
  const handleGpx = (e) => {
    const file = e.target.files?.[0] || null;
    onChange({ ...value, gpxFile: file });
  };

  return (
    <div className="panel">
      <h3>Map & Route</h3>

      <div className="map-placeholder" onClick={() => alert('Map picker not implemented in this demo')}>
        <div className="map-icon">📍</div>
        <div>Click to select location on map</div>
        <div style={{ fontSize: 12, color: '#777' }}>Interactive map picker</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label className="file-drop">
          Upload GPX Route (Optional)
          <input type="file" accept=".gpx" onChange={handleGpx} />
        </label>
        {value.gpxFile && <div style={{ marginTop: 8 }}>Selected: {value.gpxFile.name}</div>}
      </div>
    </div>
  );
}
