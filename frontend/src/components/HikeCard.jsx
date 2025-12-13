import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import api from '../api';
import './HikeCard.css';

export default function HikeCard({
  hike,
  isJoined = false,
  onJoin,
  onLeave,
  allowJoin = true,
  allowLeave = true,
  userProfile = null,
  fromProfile = false,
<<<<<<< HEAD
=======
  needsReview = false,
>>>>>>> 44afc34 (Initial commit with all current changes)
}) {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const date = hike.date || hike.startDate || hike.createdAt;
  const d = date ? new Date(date) : null;
  const now = new Date();
  const isPast = d ? d < now : false;

  const participantsCount = hike.participantsCount ?? 0;
  const capacity = hike.capacity ?? 0;
  const isFull = hike.isFull || (capacity > 0 && participantsCount >= capacity);

  const isCreator = userProfile && (
    (userProfile.role === 'guide' && userProfile.createdHikes?.some(ch => ch.id === hike.id)) ||
    (hike.guideId && userProfile.guide?.id === hike.guideId)
  );

  // Decide button state
  let buttonLabel = '';
  let disabled = true;
  let buttonAction = null;
  let btnClass = '';

  if (isPast) {
    buttonLabel = 'Past';
    disabled = true;
    btnClass = 'past';
  } else if (isCreator) {
    buttonLabel = 'Your Hike';
    disabled = true;
    btnClass = 'your-hike';
  } else if (isJoined) {
    if (allowLeave) {
      buttonLabel = 'Leave';
      disabled = false;
      buttonAction = onLeave;
      btnClass = 'leave';
    } else {
      buttonLabel = 'Joined';
      disabled = true;
      btnClass = 'joined';
    }
  } else if (isFull) {
    buttonLabel = 'Full';
    disabled = true;
    btnClass = 'full';
  } else {
    if (allowJoin) {
      buttonLabel = 'Join';
      disabled = false;
      buttonAction = onJoin;
      btnClass = 'join';
    } else {
      buttonLabel = '';
    }
  }

  const difficulty = (hike.difficulty || 'moderate').toLowerCase();

  function handleView(e) {
    // If clicked from a button, stopPropagation handled by parent
    if (!user) {
      // open auth modal (app listens to this custom event)
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'login' } }));
      return;
    }
    navigate(`/hikes/${hike.id}`, { state: { fromProfile: !!fromProfile } });
  }

  return (
    <div className="hike-card">
      <div className="hike-image-container" onClick={handleView}>
        {hike.imageUrl ? (
          (() => {
            const src = hike.imageUrl && hike.imageUrl.startsWith('/') ? `${api.defaults.baseURL}${hike.imageUrl}` : hike.imageUrl;
            return <img src={src} alt={hike.title || hike.name} className="hike-image" />;
          })()
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e0e0e0 0%, #f0f0f0 100%)' }} />
        )}
        <div className={`difficulty-badge ${difficulty}`}>{difficulty}</div>
<<<<<<< HEAD
=======
        {needsReview && (
          <div className="review-reminder-badge" title="You haven't reviewed this hike yet">
            💬
          </div>
        )}
>>>>>>> 44afc34 (Initial commit with all current changes)
      </div>

      <div className="hike-content" onClick={handleView}>
        <h3 className="hike-title">{hike.name || hike.title || 'Untitled hike'}</h3>
        <div className="hike-meta">
          <div className="meta-item">📍 {hike.location || 'Unknown location'}</div>
          <div className="meta-item">📅 {date ? new Date(date).toLocaleDateString() : 'Date TBD'}</div>
          {hike.guideName && <div className="meta-item">👤 {hike.guideName}</div>}
        </div>
        <div className="participants-info">👥 {participantsCount}{capacity ? ` / ${capacity}` : ''} {isFull ? '(Full)' : ''}</div>
      </div>

      <div className="hike-actions">
        <button className="view-details-btn" onClick={(e) => { e.stopPropagation(); handleView(); }}>
          View Details
        </button>
        {buttonLabel && (
          <button
            className={`join-btn ${btnClass}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled && typeof buttonAction === 'function') buttonAction(hike.id);
            }}
            disabled={disabled}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}
