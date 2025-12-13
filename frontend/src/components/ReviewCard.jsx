import React, { useState, useEffect } from 'react';
import api from '../api';
import './ReviewCard.css';

export default function ReviewCard({ hikeId, guideId, guideName, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const quickTags = ['Friendly','Knowledgeable','Good pace','Great route','Safety-focused'];

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSubmit() {
    if (!rating) return;
    setSubmitting(true);
    try {
      await api.post('/api/reviews', { hikeId, guideId, rating, comment: comment || null, tags: tags.length ? tags : null });
      setDone(true);
    } catch (e) {
      console.error('Failed to submit review', e);
      alert(e?.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (done && onSubmitted) {
      const timer = setTimeout(() => {
        onSubmitted();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [done, onSubmitted]);

  if (done) return (
    <div className="review-success-card">
      <span style={{ fontSize: '22px' }}>✅</span>
      <div className="review-success-text">
        <strong>Thanks!</strong> Your review helps others choose a guide.
      </div>
    </div>
  );

  return (
    <div className="review-card-form">
      <h3 className="review-form-title">How was this hike with {guideName || 'the guide'}?</h3>

      <div className="review-rating-input">
        <div className="rating-stars">
          {[1,2,3,4,5].map((s) => (
            <button key={s} className={`rating-star ${s <= rating ? 'active' : ''}`} onClick={() => setRating(s)}>
              {'★'}
            </button>
          ))}
        </div>
        <span className="rating-display">{rating} / 5</span>
      </div>

      <textarea 
        className="review-comment-input" 
        value={comment} 
        onChange={e => setComment(e.target.value)} 
        placeholder="Share what you liked..." 
        rows={3} 
      />

      <div className="review-tags-input">
        {quickTags.map(t => (
          <button key={t} className={`tag-button ${tags.includes(t) ? 'active' : ''}`} onClick={() => toggleTag(t)}>
            {t}
          </button>
        ))}
      </div>

      <button 
        disabled={submitting} 
        onClick={handleSubmit} 
        className="review-submit"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  );
}
