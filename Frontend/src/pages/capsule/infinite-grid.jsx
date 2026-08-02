// "use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CapsuleDetailModal, Card } from './cardDetails';
import AdvancedSearchModal from './search';

const CARD_WIDTH = 320;
const CARD_HEIGHT = 220;
const NEIGHBOURS = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, 1], [-1, 1], [-1, -1], [1, -1]];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const applyDamping = (velocity, deltaTime) => {
  const dampingRate = 0.0028;
  return velocity * Math.exp(-dampingRate * deltaTime);
};

const smoothStep = (current, target, deltaTime, speed = 0.15) =>
  current + (target - current) * (1 - Math.exp(-speed * deltaTime));

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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

Card.displayName = 'Card';

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
  const [selectedCard, setSelectedCard] = useState(null);

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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 select-none cursor-grab overflow-hidden"
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      style={{
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 100%)',
        touchAction: 'none',
        minHeight: '100vh',
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        zIndex: 0
      }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        width: '100%',
        height: '100%'
      }}>
        {visibleCards.map(card => (
          <Card
            key={card.key}
            descriptor={card.descriptor}
            x={card.x}
            y={card.y}
            onOpen={setSelectedCard}
          />
        ))}
      </div>

      {/* ── Search Bar Pill ─────────────────────────────────────────────────── */}
      {/* <div
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
            <div></div>
          )}
        </div>
      </div> */}
      <a
        href="/capsule/search"
        style={{ zIndex: "999", position: "absolute", right: "50px", bottom: "50px", borderRadius: "50%", padding: "10px", boxShadow: "10px 10px 10px rgba(0, 0, 0, 0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", cursor: "pointer", display: "flex", alignItems: "center", justifyName: "center" }}>
        <svg style={{ fill: "white" }} xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 128 128">
          <path d="M 52.349609 14.400391 C 42.624609 14.400391 32.9 18.1 25.5 25.5 C 10.7 40.3 10.7 64.399219 25.5 79.199219 C 32.9 86.599219 42.600391 90.300781 52.400391 90.300781 C 62.200391 90.300781 71.900781 86.599219 79.300781 79.199219 C 94.000781 64.399219 93.999219 40.3 79.199219 25.5 C 71.799219 18.1 62.074609 14.400391 52.349609 14.400391 z M 52.300781 20.300781 C 60.500781 20.300781 68.700391 23.399219 74.900391 29.699219 C 87.400391 42.199219 87.4 62.5 75 75 C 62.5 87.5 42.199219 87.5 29.699219 75 C 17.199219 62.5 17.199219 42.199219 29.699219 29.699219 C 35.899219 23.499219 44.100781 20.300781 52.300781 20.300781 z M 52.300781 26.300781 C 45.400781 26.300781 38.9 29 34 34 C 29.3 38.7 26.700391 44.800391 26.400391 51.400391 C 26.300391 53.100391 27.600781 54.4 29.300781 54.5 L 29.400391 54.5 C 31.000391 54.5 32.300391 53.199609 32.400391 51.599609 C 32.600391 46.499609 34.699219 41.799219 38.199219 38.199219 C 41.999219 34.399219 47.000781 32.300781 52.300781 32.300781 C 54.000781 32.300781 55.300781 31.000781 55.300781 29.300781 C 55.300781 27.600781 54.000781 26.300781 52.300781 26.300781 z M 35 64 A 3 3 0 0 0 32 67 A 3 3 0 0 0 35 70 A 3 3 0 0 0 38 67 A 3 3 0 0 0 35 64 z M 83.363281 80.5 C 82.600781 80.5 81.850781 80.800391 81.300781 81.400391 C 80.100781 82.600391 80.100781 84.499609 81.300781 85.599609 L 83.800781 88.099609 C 83.200781 89.299609 82.900391 90.6 82.900391 92 C 82.900391 94.4 83.8 96.700391 85.5 98.400391 L 98.300781 111 C 100.10078 112.8 102.39922 113.69922 104.69922 113.69922 C 106.99922 113.69922 109.29961 112.79961 111.09961 111.09961 C 114.59961 107.59961 114.59961 101.90039 111.09961 98.400391 L 98.300781 85.599609 C 96.600781 83.899609 94.300391 83 91.900391 83 C 90.500391 83 89.2 83.300391 88 83.900391 L 85.5 81.400391 C 84.9 80.800391 84.125781 80.5 83.363281 80.5 z M 91.900391 88.900391 C 92.700391 88.900391 93.5 89.200781 94 89.800781 L 106.69922 102.5 C 107.89922 103.7 107.89922 105.59922 106.69922 106.69922 C 105.49922 107.89922 103.6 107.89922 102.5 106.69922 L 89.800781 94.099609 C 89.200781 93.499609 88.900391 92.700391 88.900391 91.900391 C 88.900391 91.100391 89.200781 90.300781 89.800781 89.800781 C 90.400781 89.200781 91.100391 88.900391 91.900391 88.900391 z"></path>
        </svg>
      </a>

      {/* ── Capsule Detail Modal ────────────────────────────────────────────── */}
      {selectedCard && (
        <CapsuleDetailModal
          descriptor={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

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
    </div>
  );
};

export default function CapsuleGrid({ gallery }) {
  return <InfiniteDraggableGrid gallery={gallery} />;
}