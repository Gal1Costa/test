import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import BasicInformation from '../components/create/BasicInformation';
import TrailDetails from '../components/create/TrailDetails';
import MapRoute from '../components/create/MapRoute';
import WhatToBring from '../components/create/WhatToBring';
import CoverImage from '../components/create/CoverImage';
import { calculateRouteDistance, calculateRouteDuration, formatDuration } from '../utils/mapUtils.jsx';
import { validateHikeForm } from '../utils/hikeValidation.jsx';
import './CreateHike.css';

export default function CreateHike() {
  const navigate = useNavigate();
  const [basic, setBasic] = useState({});
  const [trail, setTrail] = useState({});
  const [route, setRoute] = useState({});
  const [cover, setCover] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Auto-calculate distance and duration when route changes (only if fields are empty)
  useEffect(() => {
    if (route.points && route.points.length >= 2) {
      const distance = calculateRouteDistance(route.points);
      // Parse elevation gain, removing units like "m" or "meters"
      const elevationGainStr = trail.elevationGain || '';
      const elevationGain = parseFloat(elevationGainStr.replace(/[^\d.]/g, '')) || 0;
      const difficulty = basic.difficulty || 'MODERATE';

      // Update distance (format to 1 decimal place)
      const formattedDistance = distance > 0 ? `${distance.toFixed(1)} km` : '';

      // Calculate duration if we have elevation data
      const durationHours = calculateRouteDuration(route.points, elevationGain, difficulty);
      const formattedDuration = durationHours > 0 ? formatDuration(durationHours) : '';

      // Only auto-fill if fields are empty (user can manually override)
      const updates = {};
      if (!trail.distance && formattedDistance) {
        updates.distance = formattedDistance;
      }
      if (!trail.duration && formattedDuration) {
        updates.duration = formattedDuration;
      }
      
      if (Object.keys(updates).length > 0) {
        setTrail(prev => ({ ...prev, ...updates }));
      }
    }
  }, [route.points, trail.elevationGain, basic.difficulty]);
  

  async function handleCreate() {
    setErr(null);
    
    // Comprehensive validation
    const validation = validateHikeForm({ basic, trail, route, cover });
    if (!validation.isValid) {
      setValidationErrors(validation.errors || {});
      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('.has-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    
    // Clear validation errors if form is valid
    setValidationErrors({});

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', basic.name || '');
      fd.append('date', basic.date || '');
      fd.append('capacity', basic.capacity || '');
      fd.append('location', basic.location || '');
      fd.append('difficulty', basic.difficulty || '');

      fd.append('distance', trail.distance || '');
      fd.append('duration', trail.duration || '');
      fd.append('elevationGain', trail.elevationGain || '');
      fd.append('price', basic.price || '');
      fd.append('meetingTime', basic.meetingTime || '');
      fd.append('description', trail.description || '');
      fd.append('meetingPlace', basic.meetingPlace || '');
      fd.append('whatToBring', (basic.whatToBring || '').toString());

      fd.append("route", JSON.stringify(route?.points || []));
      fd.append("mapLocation", JSON.stringify(route?.location || null));

      if (cover.coverFile) fd.append('cover', cover.coverFile);
      
      console.log("ROUTE STATE JUST BEFORE SUBMIT:", route);


      const res = await api.post('/api/hikes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const created = res?.data;
      navigate('/');
    } catch (e) {
      console.error('Create hike failed', e);
      setErr(e?.response?.data?.error || e.message || 'Failed to create hike');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="create-hike-page">
      <div style={{ maxWidth: 1100, center: 'auto', padding: 16 }}>
        <h1 style={{ marginBottom: 20 }}>Create New Hike</h1>
        

        {err && <div className="alert-error">{err}</div>}

        <BasicInformation value={basic} onChange={setBasic} errors={validationErrors.basic} />
        <TrailDetails value={trail} onChange={setTrail} errors={validationErrors.trail} />
        <MapRoute value={route} onChange={setRoute} errors={validationErrors.route} />
        <WhatToBring value={basic} onChange={setBasic} />
        <CoverImage value={cover} onChange={setCover} errors={validationErrors.cover} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
          <button className="btn-cancel" onClick={() => navigate(-1)} disabled={submitting}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating…' : 'Create Hike'}</button>
        </div>
      </div>
    </div>
  );
}
