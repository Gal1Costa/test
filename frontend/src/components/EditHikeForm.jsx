import React, { useState, useEffect } from 'react';
import api from '../api';
import MapRoute from './create/MapRoute';
import { calculateRouteDistance, calculateRouteDuration, formatDuration } from '../utils/mapUtils.jsx';
import './EditHikeForm.css';

export default function EditHikeForm({ hike, onSave, onCancel, onDelete, deleting }) {
  const [editFields, setEditFields] = useState({});
  const [editErr, setEditErr] = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editRoute, setEditRoute] = useState(() => ({
    points: Array.isArray(hike?.route) ? [...hike.route] : [],
    location: hike?.mapLocation || null
  }));

  // Auto-calculate distance and duration when route changes
  useEffect(() => {
    if (editRoute?.points?.length >= 2) {
      const distance = calculateRouteDistance(editRoute.points);
      const elevationGainStr = editFields.elevationGain || hike.elevationGain || '';
      const elevationGain = parseFloat(elevationGainStr.replace(/[^\d.]/g, '')) || 0;
      const difficulty = editFields.difficulty || hike.difficulty || 'MODERATE';

      const formattedDistance = distance > 0 ? `${distance.toFixed(1)} km` : '';
      const durationHours = calculateRouteDuration(editRoute.points, elevationGain, difficulty);
      const formattedDuration = durationHours > 0 ? formatDuration(durationHours) : '';

      if (editFields.distance !== formattedDistance || editFields.duration !== formattedDuration) {
        setEditFields(prev => ({ ...prev, distance: formattedDistance, duration: formattedDuration }));
      }
    }
  }, [editRoute, editFields.elevationGain, editFields.difficulty]);

  const updateField = (key) => (e) => {
    const value = e.target.type === 'number' ? e.target.value : e.target.value;
    setEditFields(prev => ({ ...prev, [key]: value }));
  };

  const getFieldValue = (key, transform) => {
    if (editFields[key] !== undefined) return editFields[key];
    const hikeValue = hike[key];
    if (transform && hikeValue) return transform(hikeValue);
    return hikeValue || '';
  };

  const formFields = [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Hike title', group: 0 },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'Location', group: 0 },
    { key: 'meetingPlace', label: 'Meeting Place', type: 'text', placeholder: 'Street / meetup spot', group: 0 },
    { 
      key: 'difficulty', 
      label: 'Difficulty', 
      type: 'select', 
      options: ['', 'EASY', 'MODERATE', 'HARD'],
      optionLabels: ['Select difficulty', 'Easy', 'Moderate', 'Hard'],
      group: 1
    },
    { key: 'capacity', label: 'Capacity', type: 'number', min: 1, placeholder: 'Max participants', group: 1 },
    { key: 'distance', label: 'Distance', type: 'text', placeholder: 'e.g., 8.5 km', group: 2 },
    { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., 4-5 hours', group: 2 },
    { key: 'elevationGain', label: 'Elevation Gain', type: 'text', placeholder: 'e.g., 450 m', group: 2 },
    { key: 'meetingTime', label: 'Meeting Time', type: 'time', group: 3 },
    { key: 'price', label: 'Price (USD)', type: 'number', min: 0, placeholder: 'Price or leave empty for free', group: 3 },
    { key: 'date', label: 'Date', type: 'date', transform: (val) => val?.split('T')[0], group: 4 },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the hike...', rows: 4, group: 5 },
    { key: 'whatToBring', label: 'What To Bring (one per line)', type: 'textarea', placeholder: 'e.g. Water\nSnacks\nWarm jacket', rows: 4, transform: (val) => typeof val === 'string' ? val : Array.isArray(val) ? val.join('\n') : '', group: 6 },
  ];

  const renderField = (field) => {
    const value = getFieldValue(field.key, field.transform);
    const commonProps = {
      className: field.type === 'select' ? 'edit-hike-form-select' : 
                 field.type === 'textarea' ? 'edit-hike-form-textarea' : 'edit-hike-form-input',
      value,
      onChange: updateField(field.key),
      placeholder: field.placeholder,
      ...(field.min !== undefined && { min: field.min }),
      ...(field.rows && { rows: field.rows })
    };

    return (
      <label key={field.key} className={field.group >= 4 ? 'edit-hike-form-label' : 'edit-hike-form-label'}>
        {field.label}
        {field.type === 'select' ? (
          <select {...commonProps}>
            {field.options.map((opt, i) => (
              <option key={opt} value={opt}>{field.optionLabels[i]}</option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea {...commonProps} />
        ) : (
          <input type={field.type} {...commonProps} />
        )}
      </label>
    );
  };

  const groupedFields = formFields.reduce((acc, field) => {
    if (!acc[field.group]) acc[field.group] = [];
    acc[field.group].push(field);
    return acc;
  }, {});

  async function handleEdit() {
    const hasChanges = Object.keys(editFields).length > 0 || editCoverFile || editRoute;
    if (!hasChanges) {
      setEditErr('No changes to save');
      return;
    }
    
    setEditErr(null);
    setEditSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) fd.append(key, value || '');
      });
      if (editCoverFile) fd.append('cover', editCoverFile);
      if (editRoute?.points) {
        fd.append("route", JSON.stringify(editRoute.points));
        if (editRoute.location) fd.append("mapLocation", JSON.stringify(editRoute.location));
      }

      await api.put(`/api/hikes/${hike.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSave();
    } catch (e) {
      setEditErr(e?.response?.data?.error || e.message || 'Failed to update hike');
    } finally {
      setEditSaving(false);
    }
  }

  function handleCancel() {
    setEditFields({});
    setEditErr(null);
    setEditCoverFile(null);
    setEditCoverPreview(null);
    setEditRoute({ points: Array.isArray(hike.route) ? [...hike.route] : [], location: hike.mapLocation || null });
    onCancel();
  }

  function handleCoverChange(file) {
    if (file) {
      setEditCoverPreview(URL.createObjectURL(file));
      setEditCoverFile(file);
    }
  }

  const coverImageUrl = editCoverPreview || (hike.imageUrl?.startsWith('/') ? `${api.defaults.baseURL}${hike.imageUrl}` : hike.imageUrl);

  return (
    <div className="edit-hike-form">
      <h3>Edit Hike</h3>
      
      {Object.entries(groupedFields).map(([group, fields]) => (
        <div key={group} className={group >= 4 ? 'edit-hike-form-section' : 'edit-hike-form-grid'}>
          {fields.map(renderField)}
        </div>
      ))}

      <div className="edit-hike-cover-section">
        <h4>Cover Image</h4>
        <div className="edit-hike-cover-upload">
          {coverImageUrl ? (
            <div className="edit-hike-cover-preview">
              <img src={coverImageUrl} alt="cover preview" />
              <div className="edit-hike-cover-actions">
                <button type="button" className="edit-hike-cover-button" onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => handleCoverChange(e.target.files?.[0]);
                  input.click();
                }}>Change</button>
                <button type="button" className="edit-hike-cover-button" onClick={() => {
                  setEditCoverPreview(null);
                  setEditCoverFile(null);
                }}>Remove</button>
              </div>
            </div>
          ) : (
            <label className="edit-hike-cover-upload-label">
              <input type="file" accept="image/*" onChange={(e) => handleCoverChange(e.target.files?.[0])} />
              <div>📸 Click to upload cover image</div>
            </label>
          )}
        </div>
      </div>

      <h3>Trail Map & Route</h3>
      <div className="edit-hike-map-container">
        <MapRoute value={editRoute} onChange={setEditRoute} noPanel={true} />
      </div>
      <div className="edit-hike-route-info">
        {hike.distance ? `${hike.distance} · ${hike.duration || ""}` : ""}
      </div>

      {editErr && <div className="edit-hike-error">{editErr}</div>}

      <div className="edit-hike-actions">
        <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
        <button className="btn-primary edit-hike-save-button" onClick={handleEdit} disabled={editSaving}>
          {editSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
