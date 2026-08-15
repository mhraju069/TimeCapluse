import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import './OptionWheel.css';

const DEFAULT_ITEMS = [
  'Ambient',
  'House',
  'Techno',
  'Jazz',
  'Lo-Fi',
  'Synthwave',
  'Trance',
  'Funk',
  'Disco',
  'Hip-Hop',
  'Chillwave',
  'Drum & Bass'
];

const OptionWheel = ({
  items = DEFAULT_ITEMS,
  value,
  selected,
  selectedIndex: selectedIndexProp,
  defaultSelected = 0,
  onChange,

  color,
  textColor = 'var(--text-color)',
  activeColor = 'var(--primary-color)',

  side = 'left',

  fontSize = 3,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.25,
  minOpacity = 0.05,

  smoothing = 200,
  inset = 80,

  loop = true,
  draggable = true,

  soundUrl = '/asset/sounds/click-soft.mp3',
  soundVolume = 0.5,

  /*
   * Number of DOM elements rendered around
   * the selected item.
   */
  visibleItems = 7,

  className = ''
}) => {

  // Helper functions for item label, value, and index resolution
  const getItemLabel = useCallback((item) => {
    if (item === null || item === undefined) return '';
    if (typeof item === 'object') {
      return item.label ?? item.name ?? item.title ?? item.text ?? item.value ?? JSON.stringify(item);
    }
    return String(item);
  }, []);

  const getItemValue = useCallback((item) => {
    if (item === null || item === undefined) return '';
    if (typeof item === 'object') {
      return item.value ?? item.id ?? item.label ?? item.name ?? item;
    }
    return item;
  }, []);

  const getItemIndex = useCallback((itemsList, val) => {
    if (val === undefined || val === null || val === '') return -1;
    if (!itemsList || itemsList.length === 0) return -1;

    if (typeof val === 'number' && !isNaN(val)) {
      if (val >= 0 && val < itemsList.length) {
        return Math.floor(val);
      }
    }

    const exactIdx = itemsList.indexOf(val);
    if (exactIdx !== -1) return exactIdx;

    const valStr = String(val).toLowerCase();
    for (let i = 0; i < itemsList.length; i++) {
      const item = itemsList[i];
      const itemLabel = String(getItemLabel(item)).toLowerCase();
      const itemVal = String(getItemValue(item)).toLowerCase();
      if (itemLabel === valStr || itemVal === valStr) {
        return i;
      }
    }

    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num < itemsList.length) {
      return Math.floor(num);
    }

    return -1;
  }, [getItemLabel, getItemValue]);

  const getPropTargetIndex = useCallback(() => {
    let idx = getItemIndex(items, value);
    if (idx !== -1) return idx;
    idx = getItemIndex(items, selectedIndexProp);
    if (idx !== -1) return idx;
    idx = getItemIndex(items, selected);
    if (idx !== -1) return idx;
    idx = getItemIndex(items, defaultSelected);
    if (idx !== -1) return idx;
    return 0;
  }, [items, value, selectedIndexProp, selected, defaultSelected, getItemIndex]);

  const getShortestTarget = useCallback((curPos, targetIdx, count) => {
    if (count <= 1) return targetIdx;
    const currentNormalized = ((curPos % count) + count) % count;
    let d = targetIdx - currentNormalized;
    if (d > count / 2) {
      d -= count;
    } else if (d < -count / 2) {
      d += count;
    }
    return curPos + d;
  }, []);

  const initialIndex = useMemo(() => {
    return getPropTargetIndex();
  }, []);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);

  const rootRef = useRef(null);
  const itemRefs = useRef({});

  const posRef = useRef(initialIndex);
  const targetRef = useRef(initialIndex);
  const selectedRef = useRef(initialIndex);
  const lastPropIndexRef = useRef(initialIndex);

  const rafRef = useRef(null);
  const lastRef = useRef(0);

  const cfgRef = useRef({});
  const onChangeRef = useRef(onChange);

  const wheelTimerRef = useRef(null);

  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);

  const audioRef = useRef(null);
  const audioUrlRef = useRef('');

  const lastTickRef = useRef(0);
  const lastSoundedIndexRef = useRef(-1);

  /*
   * Keep callbacks/config refs updated.
   */
  onChangeRef.current = onChange;

  /*
   * Calculate rem only on client.
   */
  const remPx =
    typeof window !== 'undefined'
      ? parseFloat(
        getComputedStyle(document.documentElement).fontSize
      ) || 16
      : 16;

  /*
   * Configuration used by animation functions.
   */
  cfgRef.current = {
    count: items.length,
    items,

    rowH: Math.max(
      fontSize * spacing * remPx,
      1
    ),

    curve,
    tilt,
    blur,
    fade,
    minOpacity,

    side,
    loop,
    smoothing,
    draggable,

    soundUrl,
    soundVolume
  };

  /*
   * --------------------------------------------------
   * VIRTUALIZATION
   * --------------------------------------------------
   */

  const renderIndexes = useMemo(() => {
    const count = items.length;
    if (count === 0) {
      return [];
    }

    const selected = Math.round(selectedIndex);

    if (count <= visibleItems) {
      return Array.from(
        { length: count },
        (_, i) => i
      );
    }

    const half = Math.floor(visibleItems / 2);
    const indexes = [];

    if (loop) {
      for (let offset = -half; offset <= half; offset++) {
        let index = (selected + offset) % count;
        if (index < 0) {
          index += count;
        }
        if (!indexes.includes(index)) {
          indexes.push(index);
        }
      }
    } else {
      let start = selected - half;
      let end = selected + half;

      if (start < 0) {
        end += -start;
        start = 0;
      }

      if (end >= count) {
        const overflow = end - count + 1;
        start = Math.max(0, start - overflow);
        end = count - 1;
      }

      for (let i = start; i <= end; i++) {
        indexes.push(i);
      }
    }

    return indexes;

  }, [
    items.length,
    selectedIndex,
    visibleItems,
    loop
  ]);

  /*
   * --------------------------------------------------
   * SOUND — preload + cached Audio approach
   * --------------------------------------------------
   */

  // Preload the audio file as soon as soundUrl is known
  useEffect(() => {
    if (!soundUrl) return;
    const audio = new Audio(soundUrl);
    audio.preload = 'auto';
    audio.volume = Math.min(Math.max(soundVolume, 0), 1);
    audioRef.current = audio;
    audioUrlRef.current = soundUrl;
  }, [soundUrl, soundVolume]);

  const playTick = useCallback(() => {
    const { soundUrl, soundVolume } = cfgRef.current;
    if (!soundUrl) return;

    // Re-create cached audio if URL changed
    if (!audioRef.current || audioUrlRef.current !== soundUrl) {
      const audio = new Audio(soundUrl);
      audio.preload = 'auto';
      audioRef.current = audio;
      audioUrlRef.current = soundUrl;
    }

    const audio = audioRef.current;
    audio.volume = Math.min(Math.max(soundVolume, 0), 1);
    audio.currentTime = 0;
    const p = audio.play();
    if (p) p.catch(() => { });
  }, []);

  /*
   * --------------------------------------------------
   * ANIMATION
   * --------------------------------------------------
   */

  const runFrame = useCallback((now) => {
    const dt = Math.min(
      (now - lastRef.current) / 1000,
      0.05
    );

    lastRef.current = now;

    const cfg = cfgRef.current;
    const tau = Math.max(cfg.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    const target = targetRef.current;
    const cur = posRef.current;

    let next = cur + (target - cur) * k;
    const settled = Math.abs(target - next) < 0.001;

    if (settled) {
      next = target;
      if (cfg.loop && cfg.count > 0) {
        const normalized = ((next % cfg.count) + cfg.count) % cfg.count;
        posRef.current = normalized;
        targetRef.current = normalized;
        lastPropIndexRef.current = Math.round(normalized);
      } else {
        posRef.current = next;
      }
    } else {
      posRef.current = next;
    }

    const els = itemRefs.current;
    const n = cfg.count;

    const mirror = cfg.side === 'right' ? -1 : 1;
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;

    Object.entries(els).forEach(([indexString, el]) => {
      if (!el) return;

      const i = Number(indexString);
      let d = i - next;

      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) {
          d -= n;
        }
      }

      const dist = Math.abs(d);

      let x = 0;
      let y = d * cfg.rowH;
      let rot = 0;

      if (R > 0) {
        const ang = Math.max(
          -Math.PI / 2,
          Math.min(
            Math.PI / 2,
            d * tiltRad
          )
        );

        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }

      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = String(
        Math.max(
          cfg.minOpacity,
          1 - dist * cfg.fade
        )
      );
      el.style.filter = cfg.blur > 0
        ? `blur(${(dist * cfg.blur).toFixed(2)}px)`
        : 'none';
      el.style.setProperty(
        '--ow-p',
        Math.max(
          0,
          1 - Math.min(dist, 1)
        ).toFixed(4)
      );
    });

    rafRef.current = settled
      ? null
      : requestAnimationFrame(runFrame);

  }, [playTick]);

  /*
   * Start animation.
   */
  const startLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  /*
   * --------------------------------------------------
   * APPLY TARGET
   * --------------------------------------------------
   */

  const applyTarget = useCallback((val, snap = false) => {
    const cfg = cfgRef.current;
    if (cfg.count === 0) return;

    let v = val;
    if (!cfg.loop) {
      v = Math.min(
        Math.max(v, 0),
        Math.max(cfg.count - 1, 0)
      );
    }

    if (snap) {
      v = Math.round(v);
    }

    targetRef.current = v;

    const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;

    if (idx !== selectedRef.current) {
      selectedRef.current = idx;
      lastPropIndexRef.current = idx;
      setSelectedIndex(idx);

      const selectedItem = cfg.items[idx];
      const selectedVal = getItemValue(selectedItem);
      const selectedLabel = getItemLabel(selectedItem);

      onChangeRef.current?.(idx, selectedItem, selectedVal, selectedLabel);

      // Play once per unique index change
      if (idx !== lastSoundedIndexRef.current) {
        lastSoundedIndexRef.current = idx;
        playTick();
      }
    }

    startLoop();
  }, [startLoop, getItemValue, getItemLabel]);

  /*
   * --------------------------------------------------
   * WHEEL SCROLL
   * --------------------------------------------------
   */

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();

      const cfg = cfgRef.current;
      if (cfg.count === 0) return;

      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      const step = Math.max(-1, Math.min(1, delta / cfg.rowH));

      applyTarget(targetRef.current + step, false);

      if (wheelTimerRef.current) {
        clearTimeout(wheelTimerRef.current);
      }

      wheelTimerRef.current = setTimeout(() => {
        applyTarget(targetRef.current, true);
      }, 140);
    };

    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelTimerRef.current) {
        clearTimeout(wheelTimerRef.current);
      }
    };
  }, [applyTarget]);

  /*
   * --------------------------------------------------
   * DRAG START / MOVE / END
   * --------------------------------------------------
   */

  const handlePointerDown = useCallback((e) => {
    if (!cfgRef.current.draggable) return;

    dragRef.current = {
      y: e.clientY,
      start: targetRef.current,
      id: e.pointerId
    };

    dragMovedRef.current = false;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dy = e.clientY - drag.y;

    if (!dragMovedRef.current && Math.abs(dy) > 4) {
      dragMovedRef.current = true;
      rootRef.current?.setPointerCapture(drag.id);
    }

    if (dragMovedRef.current) {
      applyTarget(
        drag.start - dy / cfgRef.current.rowH,
        false
      );
    }
  }, [applyTarget]);

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return;

    dragRef.current = null;
    setIsDragging(false);

    if (dragMovedRef.current) {
      applyTarget(targetRef.current, true);
    }
  }, [applyTarget]);

  /*
   * --------------------------------------------------
   * ITEM CLICK
   * --------------------------------------------------
   */

  const handleItemClick = useCallback((index) => {
    if (dragMovedRef.current) return;

    const cfg = cfgRef.current;
    if (cfg.count === 0) return;

    const cur = posRef.current;
    let nextTarget = index;
    if (cfg.loop) {
      nextTarget = getShortestTarget(cur, index, cfg.count);
    }

    applyTarget(nextTarget, true);
  }, [applyTarget, getShortestTarget]);

  /*
   * --------------------------------------------------
   * KEYBOARD
   * --------------------------------------------------
   */

  const handleKeyDown = useCallback((e) => {
    let delta = null;

    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      delta = -1;
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      delta = 1;
    }

    if (delta == null) return;

    e.preventDefault();
    applyTarget(
      Math.round(targetRef.current) + delta,
      true
    );
  }, [applyTarget]);

  /*
   * --------------------------------------------------
   * ITEMS / PROPS CHANGE SYNCHRONIZATION
   * --------------------------------------------------
   */

  const itemsKey = useMemo(() => {
    if (!Array.isArray(items)) return '';
    return items.map(it => getItemLabel(it)).join('__||__');
  }, [items, getItemLabel]);

  useEffect(() => {
    if (!items || items.length === 0) return;

    const newPropIndex = getPropTargetIndex();
    const propChanged = newPropIndex !== lastPropIndexRef.current;

    if (propChanged) {
      lastPropIndexRef.current = newPropIndex;
      selectedRef.current = newPropIndex;
      setSelectedIndex(newPropIndex);

      if (loop && items.length > 1) {
        targetRef.current = getShortestTarget(posRef.current, newPropIndex, items.length);
      } else {
        targetRef.current = newPropIndex;
      }
      startLoop();
    } else {
      if (!loop && selectedRef.current >= items.length) {
        const safeIdx = Math.max(0, items.length - 1);
        selectedRef.current = safeIdx;
        setSelectedIndex(safeIdx);
        targetRef.current = safeIdx;
        startLoop();
      }
    }
  }, [itemsKey, value, selected, selectedIndexProp, defaultSelected, loop, getPropTargetIndex, getShortestTarget, startLoop]);

  /*
   * Ensure virtualized DOM nodes get styled immediately when mounted or updated.
   */
  useEffect(() => {
    if (items.length === 0) return;
    startLoop();
  }, [renderIndexes, selectedIndex, startLoop]);

  /*
   * Re-apply animation when visual configuration changes.
   */
  useEffect(() => {
    if (items.length === 0) return;
    startLoop();
  }, [
    fontSize,
    spacing,
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing,
    inset,
    textColor,
    activeColor,
    startLoop
  ]);

  /*
   * --------------------------------------------------
   * CLEANUP
   * --------------------------------------------------
   */

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;

      if (wheelTimerRef.current) {
        clearTimeout(wheelTimerRef.current);
      }
      audioRef.current?.pause();
    };
  }, []);

  /*
   * --------------------------------------------------
   * RENDER
   * --------------------------------------------------
   */

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label="Option wheel"
      className={`
        option-wheel
        ${side === 'right' ? 'option-wheel--right' : ''}
        ${isDragging ? 'option-wheel--dragging' : ''}
        ${className ? ` ${className}` : ''}
      `}
      style={{
        '--ow-text-color': textColor,
        '--ow-active-color': color || activeColor,
        '--ow-font-size': `${fontSize}rem`,
        '--ow-inset': `${inset}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {renderIndexes.map((index) => {
        const item = items[index];
        const label = getItemLabel(item);

        return (
          <div
            key={`${index}-${label}`}
            ref={(el) => {
              if (el) {
                itemRefs.current[index] = el;
              } else {
                delete itemRefs.current[index];
              }
            }}
            role="option"
            aria-selected={selectedIndex === index}
            className={`
              option-wheel__item
              ${selectedIndex === index ? 'option-wheel__item--selected' : ''}
            `}
            onClick={() => handleItemClick(index)}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

export default OptionWheel;
