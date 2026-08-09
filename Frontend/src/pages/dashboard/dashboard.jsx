import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TimelineCard from './TimelineCard';
import TimelineDetailModal from './TimelineDetailModal';
import './dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Headers needed for ngrok and Django API
const getApiHeaders = (token = null) => {
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const [timelineEvents, setTimelineEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/auth');
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/dashboard/`, {
                    headers: getApiHeaders(token),
                });

                if (res.status === 401) {
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        const refreshRes = await fetch(`${API_BASE_URL}/token/refresh/`, {
                            method: 'POST',
                            headers: getApiHeaders(),
                            body: JSON.stringify({ refresh: refreshToken }),
                        });
                        if (refreshRes.ok) {
                            const refreshData = await refreshRes.json();
                            localStorage.setItem('access_token', refreshData.access);
                            const retryRes = await fetch(`${API_BASE_URL}/api/dashboard/`, {
                                headers: getApiHeaders(refreshData.access),
                            });
                            if (retryRes.ok) {
                                const retryData = await retryRes.json();
                                setData(retryData.data);
                                setLoading(false);
                                return;
                            }
                        }
                    }
                    navigate('/auth');
                    return;
                }

                if (!res.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const result = await res.json();
                setData(result.data);

                // Fetch timeline events
                if (result.data.has_capsule && result.data.capsule_id) {
                    fetchTimelineEvents(result.data.capsule_id, token);
                }
            } catch (err) {
                setError(err.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [navigate]);

    const fetchTimelineEvents = async (capsuleId, token) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/capsules/${capsuleId}/timeline/`, {
                headers: getApiHeaders(token),
            });
            if (res.ok) {
                const data = await res.json();
                setTimelineEvents(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch timeline events:', err);
        }
    };

    const handleSeeMore = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleUpdateEvent = (updatedEvent) => {
        setTimelineEvents(prev =>
            prev.map(event => event.id === updatedEvent.id ? updatedEvent : event)
        );
        setSelectedEvent(updatedEvent);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num?.toString() || '0';
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        const hasHalf = (rating || 0) % 1 >= 0.5;
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<span key={i} className="star filled">★</span>);
            } else if (i === fullStars && hasHalf) {
                stars.push(<span key={i} className="star half">★</span>);
            } else {
                stars.push(<span key={i} className="star">★</span>);
            }
        }
        return stars;
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <div className="error-icon">✦</div>
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="retry-btn">Try Again</button>
            </div>
        );
    }

    if (!data) return null;

    const { user, stats, has_capsule, capsule_id, capsule } = data;

    return (
        <div className="dashboard-container">
            <div className="dashboard-bg-glow glow-1" />
            <div className="dashboard-bg-glow glow-2" />
            <div className="dashboard-bg-pattern" />

            <div className="dashboard-content">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <div className="header-avatar-wrap">
                            {user.image ? (
                                <img src={user.image} alt={user.name} className="header-avatar" referrerPolicy="no-referrer" />
                            ) : (
                                <div className="header-avatar header-avatar-fallback">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                            )}
                            <span className="avatar-status" />
                        </div>
                        <div className="header-info">
                            <h1 className="header-title">Welcome, <span className="gold-text">{user.name || 'Explorer'}</span></h1>
                            <p className="header-subtitle">{user.email}</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        {has_capsule ? (
                            <button className="header-btn" onClick={() => navigate(`/capsule/${capsule_id}`)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                View Capsule
                            </button>
                        ) : (
                            <button className="header-btn" onClick={() => navigate('/mint')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Mint Capsule
                            </button>
                        )}
                    </div>
                </header>

                {/* Stats Grid */}
                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Timeline Events</span>
                            <span className="stat-value">{stats.timeline_count || 0}</span>
                        </div>
                        <div className="stat-trend positive">
                            <span>✦</span> Memories stored
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Total Views</span>
                            <span className="stat-value">{formatNumber(stats.total_views)}</span>
                        </div>
                        <div className="stat-trend positive">
                            <span>▲</span> {stats.engagement_per_capsule}/capsule
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Total Likes</span>
                            <span className="stat-value">{formatNumber(stats.total_likes)}</span>
                        </div>
                        <div className="stat-trend positive">
                            <span>♥</span> Loved by many
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Reviews</span>
                            <span className="stat-value">{stats.total_reviews_received}</span>
                        </div>
                        <div className="stat-trend positive">
                            <span>✦</span> {stats.total_reviews_written} written
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Avg Rating</span>
                            <span className="stat-value">{stats.average_rating || '—'}</span>
                        </div>
                        <div className="stat-trend positive">
                            <span>★</span> {stats.average_rating || 0}/5
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Total Engagement</span>
                            <span className="stat-value">{formatNumber(stats.total_engagement)}</span>
                        </div>
                        <div className="stat-trend positive">
                            <span>✦</span> Views + Likes + Reviews
                        </div>
                    </div>
                </section>

                {/* Main Content Grid — Timeline display */}
                <div className="dashboard-main-grid">
                    <section className="dashboard-section capsules-section" style={{ padding: '24px 0 0 0' }}>
                        <div className="section-header" style={{ marginBottom: '24px', padding: '0 2px' }}>
                            <h2 className="section-title">My Timeline Events</h2>
                            <span className="section-count">{stats.timeline_count || 0} events</span>
                        </div>

                        {has_capsule && capsule_id ? (
                            <div>
                                {timelineEvents.length > 0 ? (
                                    <div className="timeline-cards-grid">
                                        {timelineEvents.map((event) => (
                                            <TimelineCard
                                                key={event.id}
                                                event={event}
                                                onSeeMore={handleSeeMore}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">✦</div>
                                        <h3>No timeline events yet</h3>
                                        <p>Start adding timeline events to your capsule.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">✦</div>
                                <h3>No capsule created yet</h3>
                                <p>Mint your profile capsule to start adding timeline events.</p>
                                <button className="retry-btn" style={{ marginTop: '16px' }} onClick={() => navigate('/mint')}>
                                    Mint Capsule Now
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* Timeline Detail Modal */}
            {showModal && selectedEvent && (
                <TimelineDetailModal
                    event={selectedEvent}
                    onClose={() => setShowModal(false)}
                    onUpdate={handleUpdateEvent}
                />
            )}
        </div>
    );
};

export default Dashboard;