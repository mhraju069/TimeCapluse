"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
const CARD_WIDTH = 320;
const CARD_HEIGHT = 220;
const GALLERY_JSON_URL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/gallery.json';
const NEIGHBOURS = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, 1], [-1, 1], [-1, -1], [1, -1]];
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const applyDamping = (velocity, deltaTime) => {
  const dampingRate = 0.0028;
  return velocity * Math.exp(-dampingRate * deltaTime);
};
const smoothStep = (current, target, deltaTime, speed = 0.15) => current + (target - current) * (1 - Math.exp(-speed * deltaTime));
const useViewportSize = () => {
  const [size, setSize] = useState({
    width: 0,
    height: 0
  });
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};
const useAnimationFrame = callback => {
  const requestRef = useRef(null);
  const previousTimeRef = useRef(undefined);
  const animate = useCallback(time => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);
};
const Card = React.memo(({
  descriptor,
  x,
  y
}) => {
  const [opacity, setOpacity] = useState(0);
  const imgRef = useRef(null);
  useEffect(() => {
    setOpacity(0);
    const img = new Image();
    img.src = descriptor.thumb_src;
    const fadeIn = () => {
      let start = null;
      const fade = t => {
        if (start === null) start = t;
        const p = Math.min(1, (t - start) / 300);
        setOpacity(p);
        if (p < 1) requestAnimationFrame(fade);
      };
      requestAnimationFrame(fade);
    };
    if (img.decode) {
      img.decode().then(fadeIn).catch(fadeIn);
    } else {
      img.onload = fadeIn;
    }
  }, [descriptor]);
  return <div className="absolute overflow-hidden" style={{
    transform: `translate3d(${x}px, ${y}px, 0)`,
    willChange: 'transform',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    maxWidth: CARD_WIDTH,
    maxHeight: CARD_HEIGHT,
    contain: 'layout style paint'
  }}>
    <img ref={imgRef} src={descriptor.thumb_src} alt={descriptor.title || 'Gallery image'} className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none select-none" style={{
      opacity,
      transition: 'opacity 0.3s ease-out',
      imageRendering: 'crisp-edges',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)'
    }} loading="lazy" decoding="async" />
  </div>;
}, (prevProps, nextProps) => prevProps.descriptor === nextProps.descriptor && prevProps.x === nextProps.x && prevProps.y === nextProps.y);
Card.displayName = 'Card';
/* ─── Advanced Search Modal ─────────────────────────────────────────────── */
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
            Advanced Search
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

/* ─── Main Grid Component ────────────────────────────────────────────────── */
export const InfiniteDraggableGrid = ({
  gallery
}) => {
  const viewportSize = useViewportSize();
  const [offset, setOffset] = useState({
    x: 0,
    y: 0
  });
  const [targetOffset, setTargetOffset] = useState({
    x: 0,
    y: 0
  });
  const [visibleCards, setVisibleCards] = useState([]);
  const [velocity, setVelocity] = useState({
    x: 0,
    y: 0
  });
  const [modalOpen, setModalOpen] = useState(false);
  const EMPTY_FILTERS = { text: '', location: '', year: '', month: '', dateFrom: '', dateTo: '', imageFile: null, imagePreview: '' };
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);

  const hasActive = activeFilters.text || activeFilters.location || activeFilters.year || activeFilters.month ||
    activeFilters.dateFrom || activeFilters.dateTo || activeFilters.imageFile;

  const filteredGallery = useMemo(() => {
    if (!gallery) return [];
    let result = gallery;
    if (activeFilters.text.trim()) {
      const q = activeFilters.text.toLowerCase().trim();
      result = result.filter(item => item.title?.toLowerCase().includes(q));
    }
    if (activeFilters.location.trim()) {
      const q = activeFilters.location.toLowerCase().trim();
      result = result.filter(item => item.location?.toLowerCase().includes(q));
    }
    if (activeFilters.year) {
      result = result.filter(item => item.year === Number(activeFilters.year));
    }
    if (activeFilters.month) {
      result = result.filter(item => item.month === Number(activeFilters.month));
    }
    return result.length ? result : gallery; // fallback to full gallery to avoid empty canvas
  }, [gallery, activeFilters]);

  // Clear cell cache whenever filters change
  useEffect(() => {
    picksRef.current = {};
  }, [activeFilters]);

  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef({
    x: 0,
    y: 0
  });
  const lastTimeRef = useRef(Date.now());
  const picksRef = useRef({});
  const containerRef = useRef(null);
  const momentumRef = useRef({
    x: 0,
    y: 0
  });
  const isFullscreen = true;
  useAnimationFrame(useCallback(deltaTime => {
    if (!isDraggingRef.current) {
      momentumRef.current.x = applyDamping(momentumRef.current.x, deltaTime);
      momentumRef.current.y = applyDamping(momentumRef.current.y, deltaTime);
      if (Math.abs(momentumRef.current.x) < 0.01) momentumRef.current.x = 0;
      if (Math.abs(momentumRef.current.y) < 0.01) momentumRef.current.y = 0;
      setTargetOffset(prev => ({
        x: prev.x + momentumRef.current.x,
        y: prev.y + momentumRef.current.y
      }));
    }
    setOffset(prev => ({
      x: smoothStep(prev.x, targetOffset.x, deltaTime, isDraggingRef.current ? 0.4 : 0.18),
      y: smoothStep(prev.y, targetOffset.y, deltaTime, isDraggingRef.current ? 0.4 : 0.18)
    }));
  }, [targetOffset]));
  const handleDragStart = useCallback(e => {
    isDraggingRef.current = true;
    momentumRef.current = {
      x: 0,
      y: 0
    };
    const point = 'touches' in e ? e.touches[0] : e;
    lastPositionRef.current = {
      x: point.clientX,
      y: point.clientY
    };
    lastTimeRef.current = Date.now();
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  }, []);
  const handleDragMove = useCallback(e => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const point = e instanceof TouchEvent ? e.touches[0] : e;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastTimeRef.current;
    const deltaX = point.clientX - lastPositionRef.current.x;
    const deltaY = point.clientY - lastPositionRef.current.y;
    if (timeDelta > 0) {
      const vx = deltaX / timeDelta * 16;
      const vy = deltaY / timeDelta * 16;
      setVelocity(prev => ({
        x: prev.x * 0.5 + vx * 0.5,
        y: prev.y * 0.5 + vy * 0.5
      }));
    }
    lastPositionRef.current = {
      x: point.clientX,
      y: point.clientY
    };
    lastTimeRef.current = currentTime;
    setTargetOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
  }, []);
  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    momentumRef.current = {
      x: clamp(velocity.x, -30, 30),
      y: clamp(velocity.y, -30, 30)
    };
    setVelocity({
      x: 0,
      y: 0
    });
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  }, [velocity]);
  useEffect(() => {
    const move = e => handleDragMove(e);
    const end = () => handleDragEnd();
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, {
      passive: false
    });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchend', end);
    };
  }, [handleDragMove, handleDragEnd]);
  const visibleCardsData = useMemo(() => {
    if (!filteredGallery.length || viewportSize.width === 0) return [];
    const getGalleryDescriptor = index => filteredGallery[((index % filteredGallery.length) + filteredGallery.length) % filteredGallery.length];
    const getRandomSafe = (col, row) => {
      let pick;
      let tries = 0;
      while (pick === undefined) {
        const rnd = Math.floor(Math.random() * filteredGallery.length);
        const item = getGalleryDescriptor(rnd);
        let isSafe = true;
        for (const offsets of NEIGHBOURS) {
          const key = `${col + offsets[0]}:${row + offsets[1]}`;
          if (picksRef.current[key] === item) {
            isSafe = false;
            break;
          }
        }
        if (tries++ > 20 || isSafe) {
          pick = item;
        }
      }
      return pick;
    };
    const getRandomDescriptor = (col, row) => {
      const key = `${col}:${row}`;
      if (!picksRef.current[key]) {
        picksRef.current[key] = getRandomSafe(col, row);
      }
      return picksRef.current[key];
    };
    const offsetX = ((Math.round(offset.x) % CARD_WIDTH) + CARD_WIDTH) % CARD_WIDTH;
    const offsetY = ((Math.round(offset.y) % CARD_HEIGHT) + CARD_HEIGHT) % CARD_HEIGHT;
    const getCardPos = (col, row) => {
      const x = col * CARD_WIDTH + offsetX - CARD_WIDTH;
      const y = row * CARD_HEIGHT + offsetY - CARD_HEIGHT;
      return [x, y];
    };
    const isVisible = (x, y) => {
      const buffer = 300;
      return x + CARD_WIDTH > -buffer && y + CARD_HEIGHT > -buffer && x < viewportSize.width + buffer && y < viewportSize.height + buffer;
    };
    const viewCols = Math.ceil(viewportSize.width / CARD_WIDTH) + 10;
    const viewRows = Math.ceil(viewportSize.height / CARD_HEIGHT) + 10;
    const colOffset = Math.floor(offset.x / CARD_WIDTH) * -1;
    const rowOffset = Math.floor(offset.y / CARD_HEIGHT) * -1;
    const newVisibleCards = [];
    for (let row = -3; row < viewRows; row++) {
      for (let col = -3; col < viewCols; col++) {
        const tCol = colOffset + col;
        const tRow = rowOffset + row;
        const desc = getRandomDescriptor(tCol, tRow);
        const [x, y] = getCardPos(col, row);
        if (isVisible(x, y)) {
          newVisibleCards.push({
            key: `${tCol}:${tRow}`,
            descriptor: desc,
            x,
            y
          });
        }
      }
    }
    return newVisibleCards;
  }, [filteredGallery, offset, viewportSize]);
  useEffect(() => {
    setVisibleCards(visibleCardsData);
  }, [visibleCardsData]);
  return <div ref={containerRef} className="fixed inset-0 select-none cursor-grab overflow-hidden" onMouseDown={handleDragStart} onTouchStart={handleDragStart} style={{
    background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 100%)',
    touchAction: 'none',
    minHeight: '100vh',
    height: '100vh',
    width: '100vw',
    margin: 0,
    padding: 0,
    zIndex: 0
  }}>
    <div className="absolute inset-0 overflow-hidden" style={{
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden',
      width: '100%',
      height: '100%'
    }}>
      {visibleCards.map(card => <Card key={card.key} descriptor={card.descriptor} x={card.x} y={card.y} />)}
    </div>

    {/* ── Search Bar Pill ─────────────────────────────────────────────────── */}
    <div
      style={{
        position: 'absolute', top: '24px',
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 30, width: '100%', maxWidth: '480px',
        padding: '0 16px', pointerEvents: 'none',
      }}
    >
      <div
        onClick={() => setModalOpen(true)}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        style={{
          pointerEvents: 'auto', display: 'flex', alignItems: 'center',
          gap: '10px', cursor: 'pointer',
          background: 'rgba(0,0,0,0)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: hasActive ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.12)',
          borderRadius: '999px', padding: '10px 18px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          transition: 'border-color 0.2s',
        }}
      >
        {/* search icon */}
        <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <span style={{ flex: 1, color: hasActive ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {hasActive
            ? [
              activeFilters.text && `"${activeFilters.text}"`,
              activeFilters.location && `📍 ${activeFilters.location}`,
              activeFilters.year && `📅 ${activeFilters.year}`,
              activeFilters.month && `🗓 ${MONTHS[activeFilters.month - 1]}`,
              (activeFilters.dateFrom || activeFilters.dateTo) && `📆 ${activeFilters.dateFrom || '…'} → ${activeFilters.dateTo || '…'}`,
              activeFilters.imageFile && `🖼 Image`,
            ].filter(Boolean).join('  ·  ')
            : 'Search capsules…'}
        </span>

        {/* filter badge */}
        {hasActive ? (
          <button
            onClick={e => {
              e.stopPropagation();
              const reset = { text: '', location: '', year: '', month: '', dateFrom: '', dateTo: '', imageFile: null, imagePreview: '' };
              setFilters(reset);
              setActiveFilters(reset);
            }}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '999px', padding: '3px 8px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '999px', padding: '3px 10px',
            color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
          }}>
            Filter
          </div>
        )}
      </div>
    </div>

    {/* ── Advanced Search Modal (navbar-style) ──────────────────────────── */}
    {modalOpen && (
      <AdvancedSearchModal
        filters={filters}
        onChange={setFilters}
        onApply={applied => {
          setFilters(applied);
          setActiveFilters(applied);
        }}
        onClose={() => setModalOpen(false)}
      />
    )}

    {/* Drag prompt placeholder */}
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
      <h1 style={{ color: 'white', fontSize: '3.75rem', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.8, userSelect: 'none' }}>
        {/* Drag me */}
      </h1>
    </div>
  </div>;
};
export default function CapsuleGrid({ gallery }) {
  return <InfiniteDraggableGrid gallery={gallery} />;
}

const FALLBACK_GALLERY = [{
  id: 0,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/0.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_0.jpg",
  title: "Gallery Image 0"
}, {
  id: 1,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/1.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_1.jpg",
  title: "Gallery Image 1"
}, {
  id: 2,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/2.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_2.jpg",
  title: "Gallery Image 2"
}, {
  id: 3,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/3.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_3.jpg",
  title: "Gallery Image 3"
}, {
  id: 4,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/4.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_4.jpg",
  title: "Gallery Image 4"
}, {
  id: 5,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/5.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_5.jpg",
  title: "Gallery Image 5"
}, {
  id: 6,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/6.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_6.jpg",
  title: "Gallery Image 6"
}, {
  id: 7,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/7.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_7.jpg",
  title: "Gallery Image 7"
}, {
  id: 8,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/8.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_8.jpg",
  title: "Gallery Image 8"
}, {
  id: 9,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/9.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_9.jpg",
  title: "Gallery Image 9"
}, {
  id: 10,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/10.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_10.jpg",
  title: "Gallery Image 10"
}, {
  id: 11,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/11.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_11.jpg",
  title: "Gallery Image 11"
}, {
  id: 12,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/12.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_12.jpg",
  title: "Gallery Image 12"
}, {
  id: 13,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/13.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_13.jpg",
  title: "Gallery Image 13"
}, {
  id: 14,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/14.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_14.jpg",
  title: "Gallery Image 14"
}, {
  id: 15,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/15.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_15.jpg",
  title: "Gallery Image 15"
}, {
  id: 16,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/16.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_16.jpg",
  title: "Gallery Image 16"
}, {
  id: 17,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/17.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_17.jpg",
  title: "Gallery Image 17"
}, {
  id: 18,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/18.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_18.jpg",
  title: "Gallery Image 18"
}, {
  id: 19,
  full_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/19.jpg",
  thumb_src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/thumb_19.jpg",
  title: "Gallery Image 19"
}];
