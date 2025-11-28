import React, { useState, useEffect, useRef } from 'react';

export default function CoverImage({ value, onChange }) {
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

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

  const handleRemove = () => {
    onChange({ ...value, coverFile: null });
    if (inputRef.current) inputRef.current.value = null;
  };

  const triggerFile = () => {
    if (inputRef.current) inputRef.current.click();
  };

  return (
    <div className="panel">
      <h3>Cover Image</h3>
      <div className="cover-placeholder">
        {preview ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img src={preview} alt="cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', gap: 8 }}>
              <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); triggerFile(); }}>Change</button>
              <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); handleRemove(); }}>Remove</button>
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </div>
        ) : (
          <label className="file-drop">
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} />
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
