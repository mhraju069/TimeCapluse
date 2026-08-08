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
  defaultSelected = 0,
  onChange,

  textColor = '#a6a6a6',
  activeColor = '#ffffff',

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

  loop = false,
  draggable = true,

  soundUrl = '',
  soundVolume = 0.5,

  /*
   * Number of DOM elements rendered around
   * the selected item.
   *
   * Example:
   * visibleItems = 7
   *
   * Only roughly 7 items are mounted instead
   * of 500 / 1000 / 10000 items.
   */
  visibleItems = 7,

  className = ''
}) => {

  const rootRef = useRef(null);
  const itemRefs = useRef({});

  const posRef = useRef(defaultSelected);
  const targetRef = useRef(defaultSelected);

  const rafRef = useRef(null);
  const lastRef = useRef(0);

  const cfgRef = useRef({});

  const onChangeRef = useRef(onChange);

  const selectedRef = useRef(defaultSelected);

  const wheelTimerRef = useRef(null);

  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);

  const audioRef = useRef(null);
  const audioUrlRef = useRef('');

  const lastTickRef = useRef(0);

  const [selectedIndex, setSelectedIndex] = useState(
    Math.max(
      0,
      Math.min(defaultSelected, Math.max(items.length - 1, 0))
    )
  );

  const [isDragging, setIsDragging] = useState(false);

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
   *
   * We only render items around the current index.
   *
   * Example:
   *
   * items.length = 1000
   * current = 500
   * visibleItems = 7
   *
   * Render:
   *
   * 497
   * 498
   * 499
   * 500
   * 501
   * 502
   * 503
   *
   * instead of all 1000.
   */

  const renderIndexes = useMemo(() => {

    const count = items.length;

    if (count === 0) {
      return [];
    }

    const selected = Math.round(selectedIndex);

    /*
     * If there aren't many items,
     * render everything.
     */
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

        let index =
          (selected + offset) % count;

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

      /*
       * Shift window when near beginning.
       */
      if (start < 0) {
        end += -start;
        start = 0;
      }

      /*
       * Shift window when near end.
       */
      if (end >= count) {
        const overflow = end - count + 1;

        start = Math.max(
          0,
          start - overflow
        );

        end = count - 1;
      }

      for (
        let i = start;
        i <= end;
        i++
      ) {
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

    const tau =
      Math.max(cfg.smoothing, 1) / 1000;

    const k =
      1 - Math.exp(-dt / tau);

    const target =
      targetRef.current;

    const cur =
      posRef.current;

    let next =
      cur + (target - cur) * k;

    const settled =
      Math.abs(target - next) < 0.001;

    if (settled) {
      next = target;
    }

    posRef.current = next;

    const els = itemRefs.current;

    const n = cfg.count;

    const mirror =
      cfg.side === 'right'
        ? -1
        : 1;

    const tiltRad =
      (cfg.tilt * Math.PI) / 180;

    const R =
      tiltRad > 0.0005
        ? cfg.rowH / tiltRad
        : 0;

    Object.entries(els).forEach(
      ([indexString, el]) => {

        if (!el) return;

        const i =
          Number(indexString);

        let d =
          i - next;

        /*
         * Infinite loop calculation.
         */
        if (
          cfg.loop &&
          n > 1
        ) {

          d =
            ((d % n) + n) % n;

          if (d > n / 2) {
            d -= n;
          }
        }

        const dist =
          Math.abs(d);

        let x = 0;
        let y =
          d * cfg.rowH;

        let rot = 0;

        if (R > 0) {

          const ang =
            Math.max(
              -Math.PI / 2,
              Math.min(
                Math.PI / 2,
                d * tiltRad
              )
            );

          y =
            R * Math.sin(ang);

          x =
            -mirror *
            R *
            (1 - Math.cos(ang)) *
            cfg.curve;

          rot =
            (mirror *
              ang *
              180) /
            Math.PI;
        }

        el.style.transform =
          `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;

        el.style.opacity =
          String(
            Math.max(
              cfg.minOpacity,
              1 -
              dist * cfg.fade
            )
          );

        el.style.filter =
          cfg.blur > 0
            ? `blur(${(
              dist *
              cfg.blur
            ).toFixed(2)}px)`
            : 'none';

        el.style.setProperty(
          '--ow-p',
          Math.max(
            0,
            1 -
            Math.min(
              dist,
              1
            )
          ).toFixed(4)
        );
      }
    );

    rafRef.current =
      settled
        ? null
        : requestAnimationFrame(
          runFrame
        );

  }, []);

  /*
   * Start animation.
   */
  const startLoop =
    useCallback(() => {

      if (
        rafRef.current !== null
      ) {
        cancelAnimationFrame(
          rafRef.current
        );
      }

      lastRef.current =
        performance.now();

      rafRef.current =
        requestAnimationFrame(
          runFrame
        );

    }, [runFrame]);

  /*
   * --------------------------------------------------
   * SOUND
   * --------------------------------------------------
   */

  const playTick =
    useCallback(() => {

      const {
        soundUrl,
        soundVolume
      } = cfgRef.current;

      if (!soundUrl) {
        return;
      }

      const now =
        performance.now();

      if (
        now - lastTickRef.current <
        70
      ) {
        return;
      }

      lastTickRef.current = now;

      if (
        !audioRef.current ||
        audioUrlRef.current !==
        soundUrl
      ) {

        audioRef.current =
          new Audio(soundUrl);

        audioRef.current.preload =
          'auto';

        audioUrlRef.current =
          soundUrl;
      }

      const audio =
        audioRef.current;

      audio.volume =
        Math.min(
          Math.max(
            soundVolume,
            0
          ),
          1
        );

      audio.currentTime = 0;

      audio.play()?.catch(() => { });

    }, []);

  /*
   * --------------------------------------------------
   * APPLY TARGET
   * --------------------------------------------------
   */

  const applyTarget =
    useCallback(
      (value, snap = false) => {

        const cfg =
          cfgRef.current;

        if (cfg.count === 0) {
          return;
        }

        let v = value;

        /*
         * Normal wheel:
         * stop at first / last item.
         */
        if (!cfg.loop) {

          v =
            Math.min(
              Math.max(
                v,
                0
              ),
              Math.max(
                cfg.count - 1,
                0
              )
            );
        }

        /*
         * Snap to exact index.
         */
        if (snap) {
          v = Math.round(v);
        }

        targetRef.current = v;

        const idx =
          ((Math.round(v) %
            cfg.count) +
            cfg.count) %
          cfg.count;

        if (
          idx !==
          selectedRef.current
        ) {

          selectedRef.current =
            idx;

          setSelectedIndex(idx);

          onChangeRef.current?.(
            idx,
            cfg.items[idx]
          );

          playTick();
        }

        startLoop();

      },
      [
        startLoop,
        playTick
      ]
    );

  /*
   * --------------------------------------------------
   * WHEEL SCROLL
   * --------------------------------------------------
   */

  useEffect(() => {

    const el =
      rootRef.current;

    if (!el) {
      return;
    }

    const onWheel = (e) => {

      e.preventDefault();

      const cfg =
        cfgRef.current;

      if (cfg.count === 0) {
        return;
      }

      const delta =
        e.deltaMode === 1
          ? e.deltaY * 24
          : e.deltaY;

      const step =
        Math.max(
          -1,
          Math.min(
            1,
            delta / cfg.rowH
          )
        );

      applyTarget(
        targetRef.current +
        step,
        false
      );

      if (
        wheelTimerRef.current
      ) {
        clearTimeout(
          wheelTimerRef.current
        );
      }

      wheelTimerRef.current =
        setTimeout(() => {

          applyTarget(
            targetRef.current,
            true
          );

        }, 140);
    };

    el.addEventListener(
      'wheel',
      onWheel,
      { passive: false }
    );

    return () => {

      el.removeEventListener(
        'wheel',
        onWheel
      );

      if (
        wheelTimerRef.current
      ) {
        clearTimeout(
          wheelTimerRef.current
        );
      }

    };

  }, [applyTarget]);

  /*
   * --------------------------------------------------
   * DRAG START
   * --------------------------------------------------
   */

  const handlePointerDown =
    useCallback((e) => {

      if (
        !cfgRef.current.draggable
      ) {
        return;
      }

      dragRef.current = {
        y: e.clientY,
        start: targetRef.current,
        id: e.pointerId
      };

      dragMovedRef.current =
        false;

      setIsDragging(true);

    }, []);

  /*
   * --------------------------------------------------
   * DRAG MOVE
   * --------------------------------------------------
   */

  const handlePointerMove =
    useCallback(
      (e) => {

        const drag =
          dragRef.current;

        if (!drag) {
          return;
        }

        const dy =
          e.clientY -
          drag.y;

        if (
          !dragMovedRef.current &&
          Math.abs(dy) > 4
        ) {

          dragMovedRef.current =
            true;

          rootRef.current
            ?.setPointerCapture(
              drag.id
            );
        }

        if (
          dragMovedRef.current
        ) {

          applyTarget(
            drag.start -
            dy /
            cfgRef.current.rowH,
            false
          );
        }

      },
      [applyTarget]
    );

  /*
   * --------------------------------------------------
   * DRAG END
   * --------------------------------------------------
   */

  const handlePointerEnd =
    useCallback(() => {

      if (
        !dragRef.current
      ) {
        return;
      }

      dragRef.current = null;

      setIsDragging(false);

      if (
        dragMovedRef.current
      ) {

        applyTarget(
          targetRef.current,
          true
        );
      }

    }, [applyTarget]);

  /*
   * --------------------------------------------------
   * ITEM CLICK
   * --------------------------------------------------
   */

  const handleItemClick =
    useCallback(
      (index) => {

        if (
          dragMovedRef.current
        ) {
          return;
        }

        const cfg =
          cfgRef.current;

        if (
          cfg.count === 0
        ) {
          return;
        }

        const cur =
          targetRef.current;

        let d =
          index -
          (
            (
              cur %
              cfg.count
            ) +
            cfg.count
          ) %
          cfg.count;

        if (
          cfg.loop &&
          cfg.count > 1
        ) {

          if (
            d >
            cfg.count / 2
          ) {
            d -= cfg.count;
          }
          else if (
            d <
            -cfg.count / 2
          ) {
            d += cfg.count;
          }
        }

        applyTarget(
          cur + d,
          true
        );

      },
      [applyTarget]
    );

  /*
   * --------------------------------------------------
   * KEYBOARD
   * --------------------------------------------------
   */

  const handleKeyDown =
    useCallback(
      (e) => {

        let delta = null;

        if (
          e.key === 'ArrowUp' ||
          e.key === 'ArrowLeft'
        ) {
          delta = -1;
        }

        else if (
          e.key === 'ArrowDown' ||
          e.key === 'ArrowRight'
        ) {
          delta = 1;
        }

        if (delta == null) {
          return;
        }

        e.preventDefault();

        applyTarget(
          Math.round(
            targetRef.current
          ) + delta,
          true
        );

      },
      [applyTarget]
    );

  /*
   * --------------------------------------------------
   * ITEMS / PROPS CHANGE
   * --------------------------------------------------
   */

  useEffect(() => {

    if (items.length === 0) {
      return;
    }

    const safeIndex =
      Math.min(
        Math.max(
          defaultSelected,
          0
        ),
        items.length - 1
      );

    selectedRef.current =
      safeIndex;

    setSelectedIndex(
      safeIndex
    );

    posRef.current =
      safeIndex;

    targetRef.current =
      safeIndex;

    startLoop();

  }, [
    items,
    defaultSelected,
    startLoop
  ]);

  /*
   * Re-apply animation when visual
   * configuration changes.
   */
  useEffect(() => {

    if (items.length === 0) {
      return;
    }

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
    startLoop
  ]);

  /*
   * --------------------------------------------------
   * CLEANUP
   * --------------------------------------------------
   */

  useEffect(() => {

    return () => {

      if (
        rafRef.current !== null
      ) {
        cancelAnimationFrame(
          rafRef.current
        );
      }

      rafRef.current = null;

      if (
        wheelTimerRef.current
      ) {
        clearTimeout(
          wheelTimerRef.current
        );
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
                ${side === 'right'
          ? 'option-wheel--right'
          : ''
        }
                ${isDragging
          ? 'option-wheel--dragging'
          : ''
        }
                ${className
          ? ` ${className}`
          : ''
        }
            `}

      style={{
        '--ow-text-color':
          textColor,

        '--ow-active-color':
          activeColor,

        '--ow-font-size':
          `${fontSize}rem`,

        '--ow-inset':
          `${inset}px`
      }}

      onPointerDown={
        handlePointerDown
      }

      onPointerMove={
        handlePointerMove
      }

      onPointerUp={
        handlePointerEnd
      }

      onPointerCancel={
        handlePointerEnd
      }

      onKeyDown={
        handleKeyDown
      }
    >

      {renderIndexes.map(
        (index) => {

          const label =
            items[index];

          return (
            <div
              key={`${index}-${label}`}

              ref={(el) => {

                if (el) {
                  itemRefs.current[
                    index
                  ] = el;
                }
                else {
                  delete itemRefs.current[
                    index
                  ];
                }

              }}

              role="option"

              aria-selected={
                selectedIndex ===
                index
              }

              className={`
                                option-wheel__item
                                ${selectedIndex ===
                  index
                  ? 'option-wheel__item--selected'
                  : ''
                }
                            `}

              onClick={() =>
                handleItemClick(
                  index
                )
              }
            >
              {label}
            </div>
          );
        }
      )}

    </div>
  );
};

export default OptionWheel;