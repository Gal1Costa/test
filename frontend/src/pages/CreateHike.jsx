import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import BasicInformation from '../components/create/BasicInformation';
import TrailDetails from '../components/create/TrailDetails';
import MapRoute from '../components/create/MapRoute';
import WhatToBring from '../components/create/WhatToBring';
import CoverImage from '../components/create/CoverImage';
import './CreateHike.css';

export default function CreateHike() {
  const navigate = useNavigate();
  const [basic, setBasic] = useState({});
  const [trail, setTrail] = useState({});
  const [route, setRoute] = useState({});
  const [cover, setCover] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  

  async function handleCreate() {
    setErr(null);
    // simple validation
    if (!basic.name || !basic.date || !basic.meetingPlace) {
      setErr('Please fill required fields (Name, Date, Meeting Place).');
      return;
    }

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

      //if (route.gpxFile) fd.append('gpx', route.gpxFile);
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

        <BasicInformation value={basic} onChange={setBasic} />
        <TrailDetails value={trail} onChange={setTrail} />
        <MapRoute value={route} onChange={setRoute} />
        <WhatToBring value={basic} onChange={setBasic} />
        <CoverImage value={cover} onChange={setCover} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
          <button className="btn-cancel" onClick={() => navigate(-1)} disabled={submitting}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating…' : 'Create Hike'}</button>
        </div>
      </div>
    </div>
  );
}
