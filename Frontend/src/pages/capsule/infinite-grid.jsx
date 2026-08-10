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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ─── Viewport API Integration ───────────────────────────────────────────── */
async function fetchViewport(minX, maxX, minY, maxY) {
  const res = await fetch(
    `${API_BASE_URL}/api/capsules/viewport/?min_x=${minX}&max_x=${maxX}&min_y=${minY}&max_y=${maxY}`
  );
  if (!res.ok) {
    throw new Error(`Viewport fetch failed: ${res.status}`);
  }
  return res.json();
}

// Map backend capsule to frontend descriptor format
const mapServerCapsule = (capsule) => ({
  id: capsule.id,
  thumb_src: capsule.thumbnail,
  full_src: capsule.thumbnail,
  title: capsule.name || capsule.title,
  name: capsule.name || capsule.title,
  grid_x: capsule.grid_x,
  grid_y: capsule.grid_y,
  isServer: true,
});

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
  // Server-fetched capsules keyed by "grid_x:grid_y"
  const [serverCapsules, setServerCapsules] = useState({});
  // True until the first backend load completes (prevents static-image flash)
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // Search state
  const [searchTopic, setSearchTopic] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [noResults, setNoResults] = useState(false);
  // Cache of previously loaded server capsules (to restore after search reset)
  const prevServerCapsulesRef = useRef({});
  const serverInitRef = useRef(false);

  const hasActive = activeFilters.text || activeFilters.location || activeFilters.year || activeFilters.month ||
    activeFilters.dateFrom || activeFilters.dateTo || activeFilters.imageFile;

  // Fetch search results from backend using viewport API
  const fetchSearchResults = async (searchFilters) => {
    // Save current server capsules before search (to restore later)
    if (!serverInitRef.current) {
      prevServerCapsulesRef.current = { ...serverCapsulesRef.current };
      serverInitRef.current = true;
    }

    const params = new URLSearchParams();
    
    // Always include viewport bounds (large range) so backend doesn't reject
    params.append('min_x', '0');
    params.append('max_x', '100');
    params.append('min_y', '0');
    params.append('max_y', '100');
    
    // Include filter params
    if (searchFilters.text) params.append('text', searchFilters.text);
    if (searchFilters.location) params.append('location', searchFilters.location);
    if (searchFilters.year) params.append('year', searchFilters.year);
    if (searchFilters.month) params.append('month', searchFilters.month);
    if (searchFilters.dateFrom) params.append('date_from', searchFilters.dateFrom);
    if (searchFilters.dateTo) params.append('date_to', searchFilters.dateTo);

    console.log('Search API call:', `${API_BASE_URL}/api/capsules/viewport/?${params.toString()}`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/capsules/viewport/?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      // Convert search results to server capsules format
      if (Array.isArray(data)) {
        const capsuleMap = {};
        data.forEach(capsule => {
          const key = `${capsule.grid_x}:${capsule.grid_y}`;
          capsuleMap[key] = mapServerCapsule(capsule);
        });
        
        if (data.length === 0) {
          // No results found - keep old capsules visible with blur overlay
          setNoResults(true);
          console.log('No results found');
        } else {
          // Results found - replace with search results
          setServerCapsules(capsuleMap);
          setNoResults(false);
        }
        setIsSearchMode(true);
        console.log('Search results:', data.length);
      }
      
      // Set search topic for display
      const topic = searchFilters.text || searchFilters.location || 
        (searchFilters.year ? `Year: ${searchFilters.year}` : '') ||
        (searchFilters.month ? `Month: ${MONTHS[searchFilters.month - 1]}` : '') || 'Search Results';
      setSearchTopic(topic);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const clearSearch = () => {
    setFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setSearchTopic('');
    setIsSearchMode(false);
    setNoResults(false);
    // Restore previously loaded server capsules instead of showing static gallery
    if (serverInitRef.current && Object.keys(prevServerCapsulesRef.current).length > 0) {
      setServerCapsules(prevServerCapsulesRef.current);
    } else {
      setServerCapsules({});
    }
    serverInitRef.current = false;
  };

  // Update the onApply handler to fetch search results
  const handleSearchApply = (applied) => {
    setFilters(applied);
    setActiveFilters(applied);
    // Check the NEW applied filters, not the old activeFilters state
    const hasAppliedFilters = applied.text || applied.location || applied.year || applied.month ||
      applied.dateFrom || applied.dateTo || applied.imageFile;
    if (hasAppliedFilters) {
      fetchSearchResults(applied);
    } else {
      clearSearch();
    }
  };

  const filteredGallery = useMemo(() => {
    if (!gallery) return [];
    // If in search mode, only show server capsules (search results)
    if (isSearchMode) {
      return Object.values(serverCapsules);
    }
    // Otherwise use local filtering
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
  }, [gallery, activeFilters, serverCapsules, isSearchMode]);

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
  const debounceTimerRef = useRef(null);
  const serverCapsulesRef = useRef({});
  const initRef = useRef(false);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    serverCapsulesRef.current = serverCapsules;
  }, [serverCapsules]);

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

  /* ─── Debounced viewport fetch on drag ─────────────────────────────────── */
  const fetchViewportData = useCallback((bounds) => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchViewport(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY)
        .then(data => {
          if (Array.isArray(data)) {
            const capsuleMap = {};
            data.forEach(capsule => {
              const key = `${capsule.grid_x}:${capsule.grid_y}`;
              capsuleMap[key] = mapServerCapsule(capsule);
            });
            setServerCapsules(prev => ({ ...prev, ...capsuleMap }));
          }
        })
        .catch(err => console.error('Viewport fetch error:', err));
    }, 300);
  }, []);

  // Compute viewport bounds from current offset and fetch
  const handleViewportChange = useCallback((currentOffset) => {
    const minX = Math.floor(-currentOffset.x / CARD_WIDTH) - 5;
    const maxX = Math.floor((-currentOffset.x + viewportSize.width) / CARD_WIDTH) + 5;
    const minY = Math.floor(-currentOffset.y / CARD_HEIGHT) - 5;
    const maxY = Math.floor((-currentOffset.y + viewportSize.height) / CARD_HEIGHT) + 5;
    fetchViewportData({ minX, maxX, minY, maxY });
  }, [viewportSize, fetchViewportData]);

  // Center the viewport on the centroid of all public capsules so that
  // any capsule in the DB (including newly added ones) appears in the middle.
  useEffect(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) return;
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;
    fetch(`${API_BASE_URL}/api/capsules/bounds/`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        // Only override the start position if there are public capsules
        if (data && data.min_x !== null && data.max_x !== null) {
          // Fetch all capsules in the full bounds so we can compute their centroid
          const pad = 2;
          const minX = data.min_x - pad;
          const maxX = data.max_x + pad;
          const minY = data.min_y - pad;
          const maxY = data.max_y + pad;
          fetch(`${API_BASE_URL}/api/capsules/viewport/?min_x=${minX}&max_x=${maxX}&min_y=${minY}&max_y=${maxY}`)
            .then(res => res.json())
            .then(capsules => {
              if (cancelled) return;
              const list = Array.isArray(capsules) ? capsules : [];
              // Populate server capsules immediately so no static flash occurs
              if (list.length) {
                const capsuleMap = {};
                list.forEach(capsule => {
                  const key = `${capsule.grid_x}:${capsule.grid_y}`;
                  capsuleMap[key] = mapServerCapsule(capsule);
                });
                setServerCapsules(prev => ({ ...prev, ...capsuleMap }));
              }
              let centerX, centerY;
              if (list.length) {
                // Centroid of actual capsule positions
                const sumX = list.reduce((s, c) => s + c.grid_x, 0);
                const sumY = list.reduce((s, c) => s + c.grid_y, 0);
                centerX = Math.round(sumX / list.length);
                centerY = Math.round(sumY / list.length);
              } else {
                centerX = Math.round((data.min_x + data.max_x) / 2);
                centerY = Math.round((data.min_y + data.max_y) / 2);
              }
              const centerOffset = {
                x: viewportSize.width / 2 + CARD_WIDTH / 2 - centerX * CARD_WIDTH,
                y: viewportSize.height / 2 + CARD_HEIGHT / 2 - centerY * CARD_HEIGHT,
              };
              setOffset(centerOffset);
              setTargetOffset(centerOffset);
              lastFetchedOffsetRef.current = centerOffset;
              handleViewportChange(centerOffset);
              setIsInitialLoading(false);
            });
        } else {
          handleViewportChange({ x: 0, y: 0 });
          setIsInitialLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          handleViewportChange({ x: 0, y: 0 });
          setIsInitialLoading(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportSize, handleViewportChange]);

  // Fetch when offset changes significantly (after drag/momentum settles)
  const lastFetchedOffsetRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const dx = Math.abs(offset.x - lastFetchedOffsetRef.current.x);
    const dy = Math.abs(offset.y - lastFetchedOffsetRef.current.y);
    // Only fetch when moved more than one card dimension
    if (dx > CARD_WIDTH || dy > CARD_HEIGHT) {
      lastFetchedOffsetRef.current = { x: offset.x, y: offset.y };
      handleViewportChange(offset);
    }
  }, [offset, handleViewportChange]);

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
    if (viewportSize.width === 0) return [];
    // Mode: show ONLY DB capsules (looped) if any exist, otherwise ONLY static gallery
    const serverList = Object.values(serverCapsules);
    const hasServer = serverList.length > 0;
    if (!hasServer && !filteredGallery.length) return [];

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
    // Pick a descriptor for a grid cell: loop DB capsules if present, else loop static gallery
    const getDescriptorForCell = (tCol, tRow) => {
      if (hasServer) {
        const index = (((tCol + tRow * 7) % serverList.length) + serverList.length) % serverList.length;
        return serverList[index];
      }
      return getRandomDescriptor(tCol, tRow);
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
        const desc = getDescriptorForCell(tCol, tRow);
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
  }, [filteredGallery, offset, viewportSize, serverCapsules]);

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
        background: 'radial-gradient(ellipse at center, #000000 0%, #000000 100%)',
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
        {!isInitialLoading && visibleCards.map(card => (
          <Card
            key={card.key}
            descriptor={card.descriptor}
            x={card.x}
            y={card.y}
            onOpen={setSelectedCard}
          />
        ))}
      </div>

      <button
        onClick={() => setModalOpen(true)}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        style={{ zIndex: "9", position: "absolute", right: "50px", bottom: "50px", borderRadius: "50%", padding: "10px", boxShadow: "10px 10px 10px rgba(0, 0, 0, 0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", cursor: "pointer", display: "flex", alignItems: "center", justifyName: "center" }}>
        <svg style={{ fill: "white" }} xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 128 128">
          <path d="M 52.349609 14.400391 C 42.624609 14.400391 32.9 18.1 25.5 25.5 C 10.7 40.3 10.7 64.399219 25.5 79.199219 C 32.9 86.599219 42.600391 90.300781 52.400391 90.300781 C 62.200391 90.300781 71.900781 86.599219 79.300781 79.199219 C 94.000781 64.399219 93.999219 40.3 79.199219 25.5 C 71.799219 18.1 62.074609 14.400391 52.349609 14.400391 z M 52.300781 20.300781 C 60.500781 20.300781 68.700391 23.399219 74.900391 29.699219 C 87.400391 42.199219 87.4 62.5 75 75 C 62.5 87.5 42.199219 87.5 29.699219 75 C 17.199219 62.5 17.199219 42.199219 29.699219 29.699219 C 35.899219 23.499219 44.100781 20.300781 52.300781 20.300781 z M 52.300781 26.300781 C 45.400781 26.300781 38.9 29 34 34 C 29.3 38.7 26.700391 44.800391 26.400391 51.400391 C 26.300391 53.100391 27.600781 54.4 29.300781 54.5 L 29.400391 54.5 C 31.000391 54.5 32.300391 53.199609 32.400391 51.599609 C 32.600391 46.499609 34.699219 41.799219 38.199219 38.199219 C 41.999219 34.399219 47.000781 32.300781 52.300781 32.300781 C 54.000781 32.300781 55.300781 31.000781 55.300781 29.300781 C 55.300781 27.600781 54.000781 26.300781 52.300781 26.300781 z M 35 64 A 3 3 0 0 0 32 67 A 3 3 0 0 0 35 70 A 3 3 0 0 0 38 67 A 3 3 0 0 0 35 64 z M 83.363281 80.5 C 82.600781 80.5 81.850781 80.800391 81.300781 81.400391 C 80.100781 82.600391 80.100781 84.499609 81.300781 85.599609 L 83.800781 88.099609 C 83.200781 89.299609 82.900391 90.6 82.900391 92 C 82.900391 94.4 83.8 96.700391 85.5 98.400391 L 98.300781 111 C 100.10078 112.8 102.39922 113.69922 104.69922 113.69922 C 106.99922 113.69922 109.29961 112.79961 111.09961 111.09961 C 114.59961 107.59961 114.59961 101.90039 111.09961 98.400391 L 98.300781 85.599609 C 96.600781 83.899609 94.300391 83 91.900391 83 C 90.500391 83 89.2 83.300391 88 83.900391 L 85.5 81.400391 C 84.9 80.800391 84.125781 80.5 83.363281 80.5 z M 91.900391 88.900391 C 92.700391 88.900391 93.5 89.200781 94 89.800781 L 106.69922 102.5 C 107.89922 103.7 107.89922 105.59922 106.69922 106.69922 C 105.49922 107.89922 103.6 107.89922 102.5 106.69922 L 89.800781 94.099609 C 89.200781 93.499609 88.900391 92.700391 88.900391 91.900391 C 88.900391 91.100391 89.200781 90.300781 89.800781 89.800781 C 90.400781 89.200781 91.100391 88.900391 91.900391 88.900391 z"></path>
        </svg>
      </button>

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
          onApply={handleSearchApply}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* ── Search Topic Indicator ───────────────────────────────────────── */}
      {searchTopic && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '999px',
          padding: '10px 20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}>
          <span style={{
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}>
            {searchTopic}
          </span>
          <button
            onClick={clearSearch}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── No Results Found Overlay ─────────────────────────────────────── */}
      {noResults && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          pointerEvents: 'none',
        }}>
          <div style={{
            textAlign: 'center',
            padding: '30px 50px',
            borderRadius: '16px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '12px',
              opacity: 0.6,
            }}>🔍</div>
            <h2 style={{
              color: '#fff',
              fontSize: '1.4rem',
              fontWeight: 600,
              margin: '0 0 8px',
              letterSpacing: '0.02em',
            }}>
              No Results Found
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: 1.5,
            }}>
              No capsules match "{searchTopic}"
            </p>
          </div>
        </div>
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