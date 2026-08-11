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
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 40,
        }}
      />

      {/* Main Container */}
      <div
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '700px',
          height: '90vh',
          maxHeight: '900px',
          background: 'transparent',
          borderRadius: '40px',
          display: 'flex',
          overflow: 'hidden',
          // border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 50,
          // boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
          animation: 'FadeIn 0.35s ease-out',
        }}
      >
        {/* RIGHT PANEL — Form */}
        <div
          style={{
            flex: 1,
            padding: '60px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'transparent',
            overflowY: 'auto',
          }}
        >
          {/* Header Close button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: 1, justifyContent: 'center' }}>
            {/* Search Text */}
            <div className="premium-form-group">
              <label className="premium-form-label" htmlFor="searchText">Keyword</label>
              <div className="premium-input-wrap">
                <input
                  type="text"
                  id="searchText"
                  placeholder="Search by name or title…"
                  value={localFilters.text}
                  onChange={e => set('text', e.target.value)}
                  className="premium-form-input"
                  autoFocus
                />
              </div>
            </div>

            {/* Location */}
            <div className="premium-form-group">
              <label className="premium-form-label" htmlFor="searchLocation">Location</label>
              <div className="premium-input-wrap">
                <input
                  type="text"
                  id="searchLocation"
                  placeholder="Enter location name…"
                  value={localFilters.location}
                  onChange={e => set('location', e.target.value)}
                  className="premium-form-input"
                />
              </div>
            </div>

            {/* Year */}
            <div className="premium-form-group">
              <label className="premium-form-label" htmlFor="searchYear">Year</label>
              <div className="premium-input-wrap">
                <input
                  type="number"
                  id="searchYear"
                  placeholder="e.g. 2024"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={localFilters.year}
                  onChange={e => set('year', e.target.value)}
                  className="premium-form-input"
                />
              </div>
            </div>

            {/* Month */}
            <div className="premium-form-group">
              <label className="premium-form-label" htmlFor="searchMonth">Month</label>
              <div className="premium-input-wrap">
                <select
                  id="searchMonth"
                  value={localFilters.month}
                  onChange={e => set('month', e.target.value)}
                  className="premium-form-input"
                  style={{
                    background: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" style={{ background: '#000000', color: 'rgba(255,255,255,0.4)' }}>Select month…</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1} style={{ background: '#000000', color: '#ffffff' }}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <div className="premium-form-group" style={{ flex: 1 }}>
                <label className="premium-form-label" htmlFor="dateFrom">From Date</label>
                <div className="premium-input-wrap">
                  <input
                    type="date"
                    id="dateFrom"
                    value={localFilters.dateFrom}
                    onChange={e => set('dateFrom', e.target.value)}
                    className="premium-form-input"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <div className="premium-form-group" style={{ flex: 1 }}>
                <label className="premium-form-label" htmlFor="dateTo">To Date</label>
                <div className="premium-input-wrap">
                  <input
                    type="date"
                    id="dateTo"
                    min={localFilters.dateFrom || undefined}
                    onChange={e => set('dateTo', e.target.value)}
                    value={localFilters.dateTo}
                    className="premium-form-input"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
            <div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    const reset = { text: '', location: '', year: '', month: '', dateFrom: '', dateTo: '', imageFile: null, imagePreview: '' };
                    setLocalFilters(reset);
                    onChange(reset);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.85rem',
                    fontFamily: "'Inter', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: 0,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <button
              onClick={() => {
                onApply(localFilters);
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '2.5rem',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                padding: 0,
                lineHeight: 1
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateX(8px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes FadeIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        
        .custum-file-upload {
          height: 160px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 15px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          border: 1px dashed rgba(255, 255, 255, 0.15);
          background-color: #000000;
          padding: 1.5rem;
          border-radius: 14px;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .custum-file-upload .icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custum-file-upload .icon svg {
          height: 48px;
          fill: rgba(255, 255, 255, 0.4);
        }

        .custum-file-upload .text {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custum-file-upload .text span {
          font-weight: 400;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Inter', sans-serif;
        }

        @media (max-width: 768px) {
           div[style*="max-width: 1000px"] {
               flex-direction: column !important;
               height: auto !important;
               max-height: none !important;
               width: 90% !important;
           }
           div[style*="flex: 0 0 45%"] {
               flex: 1 1 auto !important;
               border-right: none !important;
               border-bottom: 1px solid rgba(255,255,255,0.06) !important;
               padding: 40px 24px !important;
           }
           div[style*="padding: 60px 48px"] {
               padding: 40px 24px !important;
           }
        }
      `}</style>
    </>
  );
};

export default AdvancedSearchModal;