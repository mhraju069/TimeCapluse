import { useState, useEffect, useRef } from 'react';
import TimelineModal from './TimelineModal';
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

const Timeline = ({ capsuleId, capsuleName, isOwner }) => {
    const [timelines, setTimelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [token] = useState(localStorage.getItem('access_token'));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageIndexes, setImageIndexes] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [displayData, setDisplayData] = useState({
        year: '',
        title: '',
        description: '',
        image: null,
        hasMultipleImages: false,
        imageCount: 0
    });
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
        setDisplayData({
            year: formatDate(timeline.event_date),
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
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
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

    const currentTimeline = timelines[currentIndex];
    const yearItems = timelines.map(t => new Date(t.event_date).getFullYear().toString());

    return (
        <div className="timeline-section">
            <h2 className="timeline-section-title">Timeline</h2>

            <div className="timeline-container">
                {/* Background Image */}
                <div className={`timeline-bg ${isAnimating ? 'fade-out' : 'fade-in'}`}>
                    {displayData.image ? (
                        <img
                            src={displayData.image}
                            alt={displayData.title}
                            className="timeline-bg-image"
                        />
                    ) : (
                        <div className="timeline-bg-placeholder" />
                    )}
                    <div className="timeline-bg-overlay" />
                </div>

                {/* Content */}
                <div className={`timeline-content ${isAnimating ? 'slide-out' : 'slide-in'}`}>
                    <div className="timeline-year-display">
                        {displayData.year}
                    </div>
                    <h3 className="timeline-title-display">{displayData.title}</h3>
                    <p className="timeline-description">{displayData.description}</p>

                    {/* Image dots for multi-image carousel */}
                    {displayData.hasMultipleImages && (
                        <div className="timeline-dots">
                            {Array.from({ length: displayData.imageCount }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`dot ${(imageIndexes[timelines[currentIndex]?.id] || 0) === i ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* OptionWheel Year Navigation */}
                <div className="timeline-option-wheel">
                    <OptionWheel
                        items={yearItems}
                        defaultSelected={currentIndex}
                        textColor="rgba(255, 255, 255, 0.25)"
                        activeColor="#ffffff"
                        side="right"
                        fontSize={getDynamicFontSize()}
                        spacing={getDynamicSpacing()}
                        curve={1}
                        tilt={getDynamicTilt()}
                        blur={getDynamicBlur()}
                        fade={0.3}
                        smoothing={200}
                        inset={100}
                        loop={false}
                        draggable={true}
                        onChange={(index) => {
                            if (!isAnimating && index !== currentIndex) {
                                animateTransition(index);
                            }
                        }}
                    />
                </div>

                {/* Add Button */}
                {isOwner && (
                    <button
                        className="timeline-add-fab"
                        onClick={() => setShowModal(true)}
                        title="Add Timeline Event"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                )}

                {/* Modal */}
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
        </div>
    );
};

export default Timeline;