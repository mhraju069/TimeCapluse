import { useState, useRef } from "react";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const FilterSection = ({ label, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem',
          fontWeight: 500, letterSpacing: '0.02em',
        }}
      >
        <span>{label}</span>
        <span style={{
          fontSize: '1.2rem', lineHeight: 1,
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          color: 'rgba(255,255,255,0.5)',
        }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: '14px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

const AdvancedSearchModal = ({ filters, onChange, onApply, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const set = (key, val) => setLocalFilters(f => ({ ...f, [key]: val }));

  // Image drag-and-drop state
  const [dragOver, setDragOver] = useState(false);
  const imgInputRef = useRef(null);

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => set('imagePreview', e.target.result);
    reader.readAsDataURL(file);
    set('imageFile', file);
  };

  const hasActiveFilters = localFilters.text.trim() || localFilters.location.trim() ||
    localFilters.year || localFilters.month ||
    localFilters.dateFrom || localFilters.dateTo || localFilters.imageFile;

  return (
    <>
      {/* Backdrop — same as sm-backdrop.active */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 40,
        }}
      />

      {/* Panel — same as staggered-menu-panel */}
      <div
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0, right: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0 20px rgba(0,0,0,1)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: "10% 30% 10% 30%",
          overflowY: 'auto',
          animation: 'FadeIn 0.5s ease-in-out ',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.8rem' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Search Capsule
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', padding: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Sections */}
        <div style={{ flex: 1 }}>

          {/* Text Search */}
          <FilterSection label="Search Text" defaultOpen>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '10px 14px',
            }}>
              <svg width="15" height="15" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Search by title…"
                value={localFilters.text}
                onChange={e => set('text', e.target.value)}
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '0.875rem', width: '100%',
                }}
              />
              {localFilters.text && (
                <button onClick={() => set('text', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection label="Location">
            <input
              type="text"
              placeholder="Enter location name…"
              value={localFilters.location}
              onChange={e => set('location', e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '10px 14px',
                color: '#fff', fontSize: '0.875rem', outline: 'none',
              }}
            />
          </FilterSection>

          {/* Year */}
          <FilterSection label="Year">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                placeholder="e.g. 2024"
                min="1900"
                max={new Date().getFullYear()}
                value={localFilters.year}
                onChange={e => set('year', e.target.value)}
                style={{
                  flex: 1, boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '10px 14px',
                  color: '#fff', fontSize: '0.875rem', outline: 'none',
                }}
              />
              {localFilters.year && (
                <button onClick={() => set('year', '')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </FilterSection>

          {/* Month */}
          <FilterSection label="Month">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => set('month', localFilters.month === i + 1 ? '' : i + 1)}
                  style={{
                    padding: '7px 4px', borderRadius: '6px', fontSize: '0.75rem',
                    cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
                    background: localFilters.month === i + 1 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)',
                    border: localFilters.month === i + 1 ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    color: localFilters.month === i + 1 ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Date Range */}
          <FilterSection label="Date">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>From</label>
                <input
                  type="date"
                  value={localFilters.dateFrom}
                  onChange={e => set('dateFrom', e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '10px 14px',
                    color: '#fff', fontSize: '0.875rem', outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>To</label>
                <input
                  type="date"
                  value={localFilters.dateTo}
                  min={localFilters.dateFrom || undefined}
                  onChange={e => set('dateTo', e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '10px 14px',
                    color: '#fff', fontSize: '0.875rem', outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              {(localFilters.dateFrom || localFilters.dateTo) && (
                <button
                  onClick={() => { set('dateFrom', ''); set('dateTo', ''); }}
                  style={{
                    alignSelf: 'flex-start', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.78rem', padding: 0,
                  }}
                >
                  Clear dates
                </button>
              )}
            </div>
          </FilterSection>

          {/* Image Search */}
          <FilterSection label="Search by Image">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                handleImageFile(e.dataTransfer.files[0]);
              }}
              onClick={() => imgInputRef.current?.click()}
              style={{
                border: dragOver ? '1.5px dashed rgba(255,255,255,0.55)' : '1.5px dashed rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: localFilters.imagePreview ? '8px' : '28px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleImageFile(e.target.files[0])}
              />

              {localFilters.imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={localFilters.imagePreview}
                    alt="Search reference"
                    style={{
                      width: '100%', maxHeight: '140px',
                      objectFit: 'cover', borderRadius: '7px', display: 'block',
                    }}
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      set('imageFile', null);
                      set('imagePreview', '');
                    }}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '50%', width: '24px', height: '24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#fff',
                    }}
                  >
                    <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Click to change image</p>
                </div>
              ) : (
                <>
                  <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.25)" viewBox="0 0 24 24" style={{ margin: '0 auto 10px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 16M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    Drag &amp; drop an image here<br />
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>or click to browse</span>
                  </p>
                </>
              )}
            </div>
          </FilterSection>

        </div>

        {/* Action buttons */}
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {hasActiveFilters && (
            <button
              onClick={() => {
                const reset = { text: '', location: '', year: '', month: '', dateFrom: '', dateTo: '', imageFile: null, imagePreview: '' };
                setLocalFilters(reset);
                onChange(reset);
              }}
              style={{
                padding: '11px', borderRadius: '8px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', fontWeight: 500,
              }}
            >
              Clear All Filters
            </button>
          )}
          <button
            onClick={() => {
              onApply(localFilters);
              onClose();
            }}
            style={{
              padding: '12px', borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.92)',
              border: 'none',
              color: '#000', fontSize: '0.9rem', fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      <style>{`
        @keyframes FadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.7) brightness(1.2); cursor: pointer; }
        .csearch-input::placeholder { color: rgba(255,255,255,0.35); }
      `}</style>
    </>
  );
};

export default AdvancedSearchModal;