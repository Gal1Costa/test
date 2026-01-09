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
  needsReview = false,
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

  // Determine hike type badge (Multi-day or Day)
  const getHikeType = () => {
    const duration = hike.duration || '';
    // Check if duration contains "day" or is multi-day
    if (duration.toLowerCase().includes('day') || duration.toLowerCase().includes('days')) {
      return 'Multi-day';
    }
    // Default to "Day" for single day hikes
    return 'Day';
  };

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

  // Format hike cost/price
  const formatCost = (price) => {
    if (price === null || price === undefined || price === 0) {
      return 'Free';
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return 'Free';
    return numPrice % 1 === 0 ? `$${numPrice.toFixed(0)}` : `$${numPrice.toFixed(2)}`;
  };

  // Format difficulty for display
  const formatDifficulty = (diff) => {
    if (!diff) return 'Moderate';
    return diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
  };

  function handleView(e) {
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
        {/* Type Badge */}
        <div className="hike-type-badge">{getHikeType()}</div>
        {needsReview && (
          <div className="review-indicator" title="Review pending">
            ✍️
          </div>
        )}
      </div>

      <div className="hike-content" onClick={handleView}>
        <h3 className="hike-title">{hike.name || hike.title || 'Untitled hike'}</h3>
        <div className="hike-location">📍 {hike.location || 'Unknown location'}</div>
        
        {/* Single line: Difficulty, Duration, Price */}
        <div className="hike-details-line">
          <span className="detail-item">
            <span className="detail-icon">⛰️</span>
            {formatDifficulty(difficulty)}
          </span>
          {hike.duration && (
            <span className="detail-item">
              <span className="detail-icon">⏱️</span>
              {hike.duration}
            </span>
          )}
          <span className="detail-item price">
            {formatCost(hike.price || hike.cost)}
          </span>
        </div>
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
