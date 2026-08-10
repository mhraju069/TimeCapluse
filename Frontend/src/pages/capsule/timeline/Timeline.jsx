import { useState, useEffect, useRef } from 'react';
import TimelineModal from './TimelineModal';
import TimelineEventModal from './TimelineEventModal';
import OptionWheel from './OptionWheel';
import './timeline.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getApiHeaders = (token = null) => {
    const headers = {
        'ngrok-skip-browser-warning': 'true',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Scroll Sub-Component
// Replicates the scroll-activated blurred alternating timeline from the
// jQuery reference: items start faded/blurred/translated, scroll into view
// triggers active state, background image updates to active item's image.
// ─────────────────────────────────────────────────────────────────────────────
const ScrollTimeline = ({
    timelines,
    formatDate,
    truncateText,
    imageIndexes,
    setImageIndexes,
    handleSeeMore,
    activeIndex,
    setActiveIndex,
    bgImage,
    setBgImage,
    itemRefs,
}) => {
    const scrollBoxRef = useRef(null);

    // IntersectionObserver with the scroll box as root
    useEffect(() => {
        if (!timelines.length || !scrollBoxRef.current) return;

        const root = scrollBoxRef.current;
        const observers = [];

        timelines.forEach((item, idx) => {
            const el = itemRefs.current[idx];
            if (!el) return;

            const obs = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
                            setActiveIndex(idx);
                            const imgArr = item.images;
                            const imgObj = imgArr && imgArr.length > 0 ? imgArr[imageIndexes[item.id] || 0] : null;
                            const url = imgObj ? (imgObj.image_url || imgObj.image) : null;
                            if (url) setBgImage(url);
                        }
                    });
                },
                { root, threshold: 0.4, rootMargin: '-5% 0px -5% 0px' }
            );

            obs.observe(el);
            observers.push(obs);
        });

        return () => observers.forEach((o) => o.disconnect());
    }, [timelines, imageIndexes, scrollBoxRef.current]);

    // Init to first item
    useEffect(() => {
        if (timelines.length > 0) {
            const first = timelines[0];
            const imgObj = first.images && first.images.length > 0 ? first.images[0] : null;
            setBgImage(imgObj ? (imgObj.image_url || imgObj.image) : null);
            setActiveIndex(0);
        }
    }, [timelines]);

    return (
        <div className="scroll-wrapper" ref={scrollBoxRef}>
            {/* Background image: sticky inside the scroll box */}
            <div
                className="scroll-background"
                style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}
            >
                <div className="scroll-bg-overlay" />
            </div>

            {/* Timeline items */}
            <div className="scroll-scroll-area">
                <div className="scroll-center-line" />

                {timelines.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    const isRight = idx % 2 === 1;
                    const formattedDate = formatDate(item.event_date);
                    const year = item.event_date ? new Date(item.event_date).getFullYear() : '';
                    const activeImgIdx = imageIndexes[item.id] || 0;
                    const hasImages = item.images && item.images.length > 0;

                    return (
                        <div
                            key={item.id || idx}
                            ref={(el) => { itemRefs.current[idx] = el; }}
                            className={`scroll-item ${isRight ? 'scroll-item--right' : 'scroll-item--left'} ${isActive ? 'scroll-item--active' : ''}`}
                            data-label={item.title ? item.title.toUpperCase() : ''}
                        >
                            <div className="scroll-content">
                                {hasImages && (
                                    <div className="scroll-img-wrapper">
                                        {item.images.map((imgObj, i) => {
                                            const url = imgObj.image_url || imgObj.image;
                                            return (
                                                <img
                                                    key={imgObj.id || i}
                                                    src={url}
                                                    alt={item.title}
                                                    className={`scroll-img ${i === activeImgIdx ? 'active' : ''}`}
                                                />
                                            );
                                        })}
                                        {item.images.length > 1 && (
                                            <div className="scroll-img-dots">
                                                {item.images.map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`scroll-dot ${i === activeImgIdx ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setImageIndexes(prev => ({ ...prev, [item.id]: i }));
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <h2 className="scroll-year">{formattedDate}</h2>
                                <p className="scroll-desc">{truncateText(item.description, 60)}</p>
                                {item.description && item.description.split(' ').length > 60 && (
                                    <button className="scroll-readmore" onClick={() => handleSeeMore(item)}>
                                        Read more →
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const Timeline = ({ capsuleId, capsuleName, isOwner }) => {
    const [timelines, setTimelines] = useState([]);

    const [loading, setLoading] = useState(true);
    const [token] = useState(localStorage.getItem('access_token'));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageIndexes, setImageIndexes] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [displayData, setDisplayData] = useState({
        year: '',
        title: '',
        description: '',
        image: null,
        hasMultipleImages: false,
        imageCount: 0
    });
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('timeline_view_mode') || 'wheel';
    });
    const [scrollActiveIndex, setScrollActiveIndex] = useState(0);
    const [scrollBgImage, setScrollBgImage] = useState(null);
    const scrollItemRefs = useRef([]);
    const animationTimeoutRef = useRef(null);

    const fetchTimeline = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/capsules/${capsuleId}/timeline/`, {
                headers: getApiHeaders(token),
            });
            if (!res.ok) throw new Error('Failed to fetch timeline');
            const data = await res.json();
            setTimelines(data || []);
        } catch (err) {
            console.error('Timeline fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (capsuleId) {
            fetchTimeline();
        }
    }, [capsuleId]);

    const updateDisplayData = (timeline) => {
        if (!timeline) return;
        const activeImage = getActiveImage(timeline);
        const formattedDate = formatDate(timeline.event_date);
        setDisplayData({
            year: formattedDate,
            date: formattedDate,
            event_date: formattedDate,
            title: timeline.title,
            description: timeline.description,
            image: activeImage,
            hasMultipleImages: timeline.images && timeline.images.length > 1,
            imageCount: timeline.images ? timeline.images.length : 0
        });
    };

    const animateTransition = (newIndex) => {
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }

        setIsAnimating(true);

        animationTimeoutRef.current = setTimeout(() => {
            setCurrentIndex(newIndex);

            setTimeout(() => {
                setIsAnimating(false);
            }, 50);
        }, 300);
    };

    const handleDotClick = (imageIdx) => {
        if (!currentTimeline) return;
        setImageIndexes(prev => ({
            ...prev,
            [currentTimeline.id]: imageIdx
        }));
    };

    const handleYearClick = (index) => {
        if (isAnimating || index === currentIndex) return;
        animateTransition(index);
    };

    // Update display data when current timeline changes
    useEffect(() => {
        if (timelines[currentIndex]) {
            updateDisplayData(timelines[currentIndex]);
        }
    }, [currentIndex, timelines, imageIndexes]);

    // Auto-change image carousel for timeline entries with multiple images
    useEffect(() => {
        const timers = {};
        timelines.forEach(timeline => {
            if (timeline.images && timeline.images.length > 1) {
                timers[timeline.id] = setInterval(() => {
                    setImageIndexes(prev => {
                        const current = prev[timeline.id] || 0;
                        const next = (current + 1) % timeline.images.length;
                        return {
                            ...prev,
                            [timeline.id]: next
                        };
                    });
                }, 4000);
            }
        });
        return () => {
            Object.values(timers).forEach(timer => clearInterval(timer));
        };
    }, [timelines]);

    const getActiveImage = (timeline) => {
        if (!timeline.images || timeline.images.length === 0) return null;
        const idx = imageIndexes[timeline.id] || 0;
        return timeline.images[idx]?.image_url || timeline.images[idx]?.image;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const truncateText = (text, maxWords = 70) => {
        if (!text) return '';
        const words = text.split(' ');
        if (words.length <= maxWords) return text;
        return words.slice(0, maxWords).join(' ') + '...';
    };

    const handleSeeMore = (event) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    // Calculate dynamic font size based on number of items
    const getDynamicFontSize = () => {
        const count = timelines.length;
        if (count <= 5) return 3;
        if (count <= 10) return 2.5;
        if (count <= 15) return 2;
        if (count <= 20) return 1.8;
        if (count <= 30) return 1.5;
        if (count <= 40) return 1.2;
        return 1;
    };

    // Calculate dynamic spacing based on number of items
    const getDynamicSpacing = () => {
        const count = timelines.length;
        if (count <= 5) return 1.8;
        if (count <= 10) return 1.5;
        if (count <= 15) return 1.3;
        if (count <= 20) return 1.1;
        if (count <= 30) return 1.0;
        return 0.8;
    };

    // Calculate dynamic tilt based on number of items
    const getDynamicTilt = () => {
        const count = timelines.length;
        if (count <= 5) return 8;
        if (count <= 10) return 6;
        if (count <= 15) return 5;
        if (count <= 20) return 4;
        return 3;
    };

    // Calculate dynamic blur based on number of items
    const getDynamicBlur = () => {
        const count = timelines.length;
        if (count <= 5) return 1.5;
        if (count <= 10) return 1.2;
        if (count <= 15) return 1.0;
        return 0.8;
    };

    if (loading) {
        return (
            <div className="timeline-section">
                <h2 className="timeline-section-title">Timeline</h2>
                <div className="timeline-loading">Loading timeline...</div>
            </div>
        );
    }

    if (timelines.length === 0) {
        return (
            <div className="timeline-section">
                <h2 className="timeline-section-title">Timeline</h2>
                <div className="timeline-empty">
                    <p>No timeline events added yet for {capsuleName}.</p>
                    {isOwner && (
                        <button
                            className="timeline-add-btn"
                            onClick={() => setShowModal(true)}
                        >
                            + Add Timeline Event
                        </button>
                    )}
                </div>

                {showModal && (
                    <TimelineModal
                        capsuleId={capsuleId}
                        token={token}
                        onClose={() => setShowModal(false)}
                        onSuccess={() => {
                            fetchTimeline();
                            setShowModal(false);
                        }}
                    />
                )}
            </div>
        );
    }

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem('timeline_view_mode', mode);
    };

    const currentTimeline = timelines[currentIndex];
    const yearItems = timelines.map(t => new Date(t.event_date).getFullYear().toString() + " ◦");

    return (
        <div className="timeline-section">
            <div className="timeline-header">
                <h2 className="timeline-section-title">Timeline</h2>

                <div className="timeline-controls-group">
                    <div className="timeline-view-switch">
                        <button
                            type="button"
                            className={`timeline-view-btn ${viewMode === 'wheel' ? 'active' : ''}`}
                            onClick={() => handleViewModeChange('wheel')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 2a10 10 0 0 1 10 10" />
                            </svg>
                            Wheel
                        </button>
                        <button
                            type="button"
                            className={`timeline-view-btn ${viewMode === 'scroll' ? 'active' : ''}`}
                            onClick={() => handleViewModeChange('scroll')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <circle cx="12" cy="12" r="3" />
                                <line x1="12" y1="3" x2="12" y2="9" />
                                <line x1="12" y1="15" x2="12" y2="21" />
                            </svg>
                            Scroll
                        </button>
                        <button
                            type="button"
                            className={`timeline-view-btn ${viewMode === 'static' ? 'active' : ''}`}
                            onClick={() => handleViewModeChange('static')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M3 9h18M9 21V9" />
                            </svg>
                            Static
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'scroll' ? (
                /* Scroll View — Scroll-driven blurred alternating timeline (jQuery reference port) */
                <ScrollTimeline
                    timelines={timelines}
                    formatDate={formatDate}
                    truncateText={truncateText}
                    imageIndexes={imageIndexes}
                    setImageIndexes={setImageIndexes}
                    handleSeeMore={handleSeeMore}
                    activeIndex={scrollActiveIndex}
                    setActiveIndex={setScrollActiveIndex}
                    bgImage={scrollBgImage}
                    setBgImage={setScrollBgImage}
                    itemRefs={scrollItemRefs}
                />
            ) : viewMode === 'wheel' ? (
                /* Wheel View (Original Wheel & Full-screen background layout) */
                <div className="timeline-container">
                    {/* Background Image */}
                    <div className={`timeline-bg ${isAnimating ? 'fade-out' : 'fade-in'}`}>
                        {currentTimeline?.images && currentTimeline.images.length > 0 ? (
                            currentTimeline.images.map((imgObj, i) => {
                                const url = imgObj.image_url || imgObj.image;
                                const activeIdx = imageIndexes[currentTimeline.id] || 0;
                                const isActive = i === activeIdx;
                                return (
                                    <img
                                        key={imgObj.id || i}
                                        src={url}
                                        alt={currentTimeline.title}
                                        className={`timeline-bg-image ${isActive ? 'active' : ''}`}
                                    />
                                );
                            })
                        ) : displayData.image ? (
                            <img
                                src={displayData.image}
                                alt={displayData.title}
                                className="timeline-bg-image active"
                            />
                        ) : (
                            <div className="timeline-bg-placeholder" />
                        )}
                        <div className="timeline-bg-overlay" />
                    </div>

                    {/* Content */}
                    <div className={`timeline-content ${isAnimating ? 'slide-out' : 'slide-in'}`}>
                        <div className="timeline-year-display">
                            {displayData.event_date}
                        </div>
                        <h3 className="timeline-title-display">{displayData.title}</h3>
                        <p className="timeline-description">
                            {truncateText(displayData.description)}
                            {displayData.description && displayData.description.split(' ').length > 70 && (
                                <span
                                    className="timeline-see-more"
                                    onClick={() => handleSeeMore(currentTimeline)}
                                >
                                    See More
                                </span>
                            )}
                        </p>

                        {/* Image dots for multi-image carousel */}
                        {displayData.hasMultipleImages && (
                            <div className="timeline-dots">
                                {Array.from({ length: displayData.imageCount }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`dot ${(imageIndexes[currentTimeline?.id] || 0) === i ? 'active' : ''}`}
                                        onClick={() => handleDotClick(i)}
                                        title={`View image ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* OptionWheel Year Navigation */}
                    <div className="timeline-option-wheel">
                        <OptionWheel
                            items={yearItems}
                            value={currentIndex}
                            defaultSelected={currentIndex}
                            side="right"
                            fontSize={2}
                            spacing={getDynamicSpacing()}
                            curve={2}
                            tilt={15}
                            blur={2}
                            fade={0}
                            smoothing={300}
                            inset={100}
                            loop={true}
                            draggable={true}
                            soundUrl="/asset/sounds/click-soft.mp3"
                            soundVolume={0.1}
                            onChange={(index) => {
                                if (index !== currentIndex) {
                                    animateTransition(index);
                                }
                            }}
                        />
                    </div>
                </div>
            ) : (
                /* Classic View (Alternating editorial layout based on design reference) */
                <div className="timeline-classic-container">
                    {timelines.map((item, idx) => {
                        const eventYear = item.event_date ? new Date(item.event_date).getFullYear() : '';
                        const formattedDateStr = formatDate(item.event_date);
                        const indexNum = (idx + 1).toString().padStart(2, '0');
                        const hasImages = item.images && item.images.length > 0;
                        const activeImgIdx = imageIndexes[item.id] || 0;
                        const activeImage = hasImages
                            ? (item.images[activeImgIdx]?.image_url || item.images[activeImgIdx]?.image)
                            : null;
                        const isEven = idx % 2 === 1;

                        return (
                            <div
                                key={item.id || idx}
                                className={`classic-timeline-row ${isEven ? 'classic-row-reverse' : ''}`}
                            >
                                {/* Text Content Block */}
                                <div className="classic-content-block">
                                    <div className="classic-number-badge">
                                        <span className="classic-ghost-number">{indexNum}</span>
                                        <span className="classic-tagline">
                                            {formattedDateStr}
                                        </span>
                                    </div>
                                    <h3
                                        className="classic-item-title"
                                        onClick={() => handleSeeMore(item)}
                                    >
                                        {item.title}
                                    </h3>
                                    <p className="classic-item-description">
                                        {truncateText(item.description, 50)}
                                    </p>
                                    <button
                                        type="button"
                                        className="classic-read-more"
                                        onClick={() => handleSeeMore(item)}
                                    >
                                        read more &rarr;
                                    </button>
                                </div>

                                {/* Image Block with Auto Smooth Carousel */}
                                <div
                                    className="classic-image-block"
                                    onClick={() => handleSeeMore(item)}
                                >
                                    {hasImages ? (
                                        <div className="classic-image-wrapper">
                                            {item.images.map((imgObj, i) => {
                                                const url = imgObj.image_url || imgObj.image;
                                                const isActive = i === activeImgIdx;
                                                return (
                                                    <img
                                                        key={imgObj.id || i}
                                                        src={url}
                                                        alt={item.title}
                                                        className={`classic-carousel-img ${isActive ? 'active' : ''}`}
                                                    />
                                                );
                                            })}
                                            <div className="classic-image-overlay" />
                                            {item.images.length > 1 && (
                                                <div className="classic-carousel-indicators">
                                                    {item.images.map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={`classic-dot ${i === activeImgIdx ? 'active' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setImageIndexes(prev => ({
                                                                    ...prev,
                                                                    [item.id]: i
                                                                }));
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="classic-image-placeholder">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Event Modal */}
            {showModal && (
                <TimelineModal
                    capsuleId={capsuleId}
                    token={token}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        fetchTimeline();
                        setShowModal(false);
                    }}
                />
            )}

            {/* Event Detail Modal - Read Only */}
            {showEventModal && selectedEvent && (
                <TimelineEventModal
                    event={selectedEvent}
                    onClose={() => setShowEventModal(false)}
                />
            )}
        </div>
    );
};

export default Timeline;