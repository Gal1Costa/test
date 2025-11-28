import React, { useState, useEffect } from 'react';

export default function CoverImage({ value, onChange }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!value.coverFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value.coverFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value.coverFile]);

  const handleFile = (e) => {
    const f = e.target.files?.[0] || null;
    onChange({ ...value, coverFile: f });
  };

  return (
    <div className="panel">
      <h3>Cover Image</h3>
      <div className="cover-placeholder">
        {preview ? (
          <img src={preview} alt="cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <label className="file-drop">
            <input type="file" accept="image/*" onChange={handleFile} />
            <div style={{ textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 28 }}>⬆️</div>
              <div>Upload a cover photo</div>
              <div style={{ fontSize: 12, color: '#999' }}>Recommended size: 1200×600px, Max file size: 5MB</div>
            </div>
          </label>
        )}
      </div>
    </div>
  );
}
