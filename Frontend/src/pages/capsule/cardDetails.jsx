import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
const CARD_WIDTH = 320;
const CARD_HEIGHT = 220;
const StarRating = ({ rating, max = 5 }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: max }, (_, i) => (
            <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < rating ? '#f5c518' : 'none'} stroke={i < rating ? '#f5c518' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        ))}
    </div>
);


const STATIC_CAPSULE = {
    coverSrc: null,           // falls back to descriptor.full_src / thumb_src
    avatarSrc: null,          // falls back to descriptor.thumb_src
    name: 'Zane Whitaker',
    verified: true,
    bio: 'I will inspire 10 million people to do what they love the best they can!',
    likes: '1.6k',
    views: '28.4k',
    rating: 4,
    reviewCount: 26,
    skills: ['UI/UX Design', 'React', 'Node.js', 'Public Speaking', 'Mentorship'],
    seeMoreHref: '#',
};

// Cache of thumbnails already loaded so cards don't re-flash dark during drag
const loadedThumbCache = new Set();


const CapsuleDetailModal = ({ descriptor, onClose }) => {
    // Use server capsule data if available, otherwise fall back to static
    const isServer = descriptor?.isServer;
    const [detail, setDetail] = useState(null);
    useEffect(() => {
        if (isServer && descriptor?.id && !detail) {
            fetch(`/api/capsules/${descriptor.id}/`)
                .then(res => res.json())
                .then(data => setDetail(data))
                .catch(() => {});
        }
    }, [isServer, descriptor?.id, detail]);

    const serverData = detail || {};
    const data = isServer ? {
        name: serverData.name || descriptor?.name || descriptor?.title || 'Untitled Capsule',
        verified: false,
        bio: serverData.bio || 'A time capsule from the grid.',
        likes: serverData.likes ?? '—',
        views: serverData.views ?? '—',
        rating: serverData.average_rating || 0,
        reviewCount: serverData.total_reviews || 0,
        skills: [],
        seeMoreHref: '#',
    } : STATIC_CAPSULE;
    // Cover background uses the real cover image (detail.cover), falling back to the grid thumbnail
    const cover = isServer
        ? (serverData.cover || descriptor?.full_src || descriptor?.thumb_src)
        : (data.coverSrc || descriptor?.full_src || descriptor?.thumb_src);
    // Avatar uses the real profile image (detail.profile), falling back to the thumbnail
    const avatar = isServer
        ? (serverData.profile || descriptor?.thumb_src)
        : (data.avatarSrc || descriptor?.thumb_src);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Card — stop propagation so clicks inside don't close */}
                <div
                    style={{
                        width: "100%",
                        maxWidth: "400px",
                        borderRadius: "20px",
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    {/* Background */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${cover})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            zIndex: 0,
                        }}
                    />

                    {/* Blur overlay */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            background:
                                "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0, 0, 0, 1) 100%)",
                            maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                            WebkitMaskImage:
                                "linear-gradient(to bottom, transparent 0%, black 100%)",
                            zIndex: 1,
                            pointerEvents: "none",
                        }}
                    />
                    {/* Your content */}
                    <div
                        style={{
                            position: "relative",
                            zIndex: 2,
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: '12px', right: '12px',
                                zIndex: 10, background: 'rgba(0,0,0,0.5)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '50%', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#fff',
                            }}
                        >
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Cover image */}
                        <div style={{ position: 'relative', height: '80px', overflowY: 'visible' }}>
                            {/* <img
                                src={cover}
                                alt="cover"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            /> */}
                            <div style={{
                                position: 'absolute', inset: 0,
                            }} />
                        </div>

                        {/* Avatar + Like */}
                        <div style={{
                            display: 'flex', alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            padding: '0 20px',
                            marginTop: '-36px',
                            position: 'relative',
                        }}>
                            {/* Avatar */}
                            <div style={{
                                width: '72px', height: '72px',
                                borderRadius: '50%',
                                border: '3px solid #12131f',
                                overflow: 'hidden',
                                flexShrink: 0,
                            }}>
                                <img src={avatar} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            {/* Like button */}
                            <button style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '999px', padding: '7px 14px',
                                cursor: 'pointer', color: '#fff', fontSize: '0.82rem', fontWeight: 600,
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="0">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                Like
                            </button>
                        </div>

                        {/* Stats row */}
                        <div style={{
                            display: 'flex', justifyContent: 'flex-end', gap: '18px',
                            padding: '15px 20px 0',
                            color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem',
                        }}>
                            <span><strong style={{ color: '#fff' }}>{data.likes}</strong> likes</span>
                            <span><strong style={{ color: '#fff' }}>{data.views}</strong> views</span>
                        </div>

                        {/* Name, username, bio */}
                        <div style={{ padding: '0px 20px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{data.name}</span>
                                {data.verified && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="none" />
                                        <path d="M9 12l2 2 4-4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', lineHeight: 1.55 }}>{data.bio}</p>
                        </div>

                        {/* Star rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px 0' }}>
                            <StarRating rating={data.rating} />
                            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>{data.reviewCount} reviews</span>
                        </div>

                        {/* Divider */}
                        <div style={{ margin: '16px 20px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }} />


                        {/* Learn More button */}
                        <div style={{ padding: '10px 20px 10px', display: 'flex', justifyContent: 'space-between' }}>
                            <button 
                                className="capsule-learn-more"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (descriptor?.id) {
                                        window.location.href = `/capsule/${descriptor.id}`;
                                    }
                                }}
                            >
                                <span className="capsule-circle" aria-hidden="true">
                                    <span className="capsule-icon capsule-arrow"></span>
                                </span>
                                <span className="capsule-button-text">See More</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes capsuleCardIn {
          from { transform: scale(0.88) translateY(24px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }

        /* Learn More button — from Uiverse.io by cssbuttons-io */
        .capsule-learn-more {
          position: relative;
          display: inline-block;
          cursor: pointer;
          outline: none;
          border: 0;
          vertical-align: middle;
          text-decoration: none;
          background: transparent;
          padding: 0;
          font-size: inherit;
          font-family: inherit;
          width: 10rem;
          height: auto;
        }
        .capsule-circle {
          transition: all 0.45s cubic-bezier(0.65, 0, 0.076, 1);
          position: relative;
          display: block;
          margin: 0;
          width: 3rem;
          height: 3rem;
          background: transparent;
          border-radius: 1.625rem;
          border: 0.1px solid #ffffff75;
        }
        .capsule-icon {
          transition: all 0.45s cubic-bezier(0.65, 0, 0.076, 1);
          position: absolute;
          top: 0; bottom: 0;
          margin: auto;
          background: #fff;
        }
        .capsule-arrow {
          transition: all 0.45s cubic-bezier(0.65, 0, 0.076, 1);
          left: 0.625rem;
          width: 1.125rem;
          height: 0.125rem;
          background: none;
        }
        .capsule-arrow::before {
          position: absolute;
          content: '';
          top: -0.29rem;
          right: 0.0625rem;
          width: 0.625rem;
          height: 0.625rem;
          border-top: 0.125rem solid #fff;
          border-right: 0.125rem solid #fff;
          transform: rotate(45deg);
        }
        .capsule-button-text {
          transition: all 0.45s cubic-bezier(0.65, 0, 0.076, 1);
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          padding: 0.75rem 0;
          margin: 0 0 0 1.85rem;
          color: #ffffff75;
          font-weight: 500;
          line-height: 1.6;
          text-align: center;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .capsule-learn-more:hover .capsule-circle { width: 100%; }
        .capsule-learn-more:hover .capsule-arrow {
          background: #fff;
          transform: translate(1rem, 0);
        }
        .capsule-learn-more:hover .capsule-button-text { color: #fff; }
      `}</style>
        </>
    );
};


const Card = React.memo(({
    descriptor,
    x,
    y,
    onOpen,
}) => {
    // Dark overlay opacity: 1 = fully dark, 0 = image revealed
    const [darkOpacity, setDarkOpacity] = useState(1);
    const imgRef = useRef(null);
    const startPosRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);

    useEffect(() => {
        // If already loaded before, show instantly (no dark flash while dragging)
        if (loadedThumbCache.has(descriptor.thumb_src)) {
            setDarkOpacity(0);
            return;
        }
        setDarkOpacity(1);
        const img = new Image();
        img.src = descriptor.thumb_src;
        const reveal = () => {
            loadedThumbCache.add(descriptor.thumb_src);
            let start = null;
            const fade = t => {
                if (start === null) start = t;
                // Smooth ease-out: dark -> real image (no blur/scale, GPU friendly)
                const p = Math.min(1, (t - start) / 400);
                const eased = 1 - Math.pow(1 - p, 3);
                setDarkOpacity(1 - eased);
                if (p < 1) requestAnimationFrame(fade);
            };
            requestAnimationFrame(fade);
        };
        if (img.decode) {
            img.decode().then(reveal).catch(reveal);
        } else {
            img.onload = reveal;
        }
    }, [descriptor]);

    const handleMouseDown = useCallback((e) => {
        startPosRef.current = { x: e.clientX, y: e.clientY };
        isDraggingRef.current = false;
    }, []);

    const handleMouseMove = useCallback((e) => {
        const dx = Math.abs(e.clientX - startPosRef.current.x);
        const dy = Math.abs(e.clientY - startPosRef.current.y);
        // If moved more than 5 pixels, consider it a drag
        if (dx > 5 || dy > 5) {
            isDraggingRef.current = true;
        }
    }, []);

    const handleClick = useCallback((e) => {
        // Only trigger modal if the user didn't drag
        if (!isDraggingRef.current) {
            e.stopPropagation();
            onOpen?.(descriptor);
        }
    }, [descriptor, onOpen]);

    return <div
        className="absolute overflow-hidden"
        style={{
            transform: `translate3d(${x}px, ${y}px, 0)`,
            willChange: 'transform',
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            maxWidth: CARD_WIDTH,
            maxHeight: CARD_HEIGHT,
            contain: 'layout style paint',
            cursor: 'pointer',
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
    >
        <img
            ref={imgRef}
            src={descriptor.thumb_src}
            alt={descriptor.title || descriptor.name || 'Gallery image'}
            className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none select-none"
            style={{
                imageRendering: 'crisp-edges',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)'
            }}
            loading="lazy"
            decoding="async"
        />
        {/* Dark overlay that fades out to reveal the real image (dark -> image) */}
        <div
            className="absolute inset-0 pointer-events-none select-none"
            style={{
                background: '#000',
                opacity: darkOpacity,
                willChange: 'opacity'
            }}
        />
    </div>;
}, (prevProps, nextProps) =>
    prevProps.descriptor === nextProps.descriptor &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.onOpen === nextProps.onOpen
);


export { CapsuleDetailModal, Card };