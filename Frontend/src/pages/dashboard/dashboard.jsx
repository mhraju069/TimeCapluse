import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/auth');
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/dashboard/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (res.status === 401) {
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        const refreshRes = await fetch(`${API_BASE_URL}/token/refresh/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refresh: refreshToken }),
                        });
                        if (refreshRes.ok) {
                            const refreshData = await refreshRes.json();
                            localStorage.setItem('access_token', refreshData.access);
                            const retryRes = await fetch(`${API_BASE_URL}/api/dashboard/`, {
                                headers: {
                                    'Authorization': `Bearer ${refreshData.access}`,
                                    'Content-Type': 'application/json',
                                },
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
            } catch (err) {
                setError(err.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [navigate]);

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

    const { user, stats, capsules, reviews_received, reviews_written, most_viewed, recent_capsules } = data;

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
                            <h1 className="header-title">Welcome back, <span className="gold-text">{user.name || 'Explorer'}</span></h1>
                            <p className="header-subtitle">{user.email}</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="header-btn" onClick={() => navigate('/mint')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Capsule
                        </button>
                        <button className="header-btn secondary" onClick={() => navigate('/capsule')}>
                            View Gallery
                        </button>
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
                            <span className="stat-label">Total Capsules</span>
                            <span className="stat-value">{stats.total_capsules}</span>
                        </div>
                        <div className="stat-trend positive">
                            <span>✦</span> Your collection
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

                {/* Main Content Grid */}
                <div className="dashboard-main-grid">
                    {/* My Capsules */}
                    <section className="dashboard-section capsules-section">
                        <div className="section-header">
                            <h2 className="section-title">My Capsules</h2>
                            <span className="section-count">{capsules.length} total</span>
                        </div>

                        {capsules.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">✦</div>
                                <h3>No capsules yet</h3>
                                <p>Create your first time capsule to start preserving memories.</p>
                                <button className="empty-btn" onClick={() => navigate('/mint')}>Create Capsule</button>
                            </div>
                        ) : (
                            <div className="capsules-grid">
                                {capsules.map((capsule) => (
                                    <div key={capsule.id} className="capsule-card" onClick={() => navigate(`/capsule/${capsule.id}`)}>
                                        <div className="capsule-card-image-wrap">
                                            {capsule.thumbnail ? (
                                                <img src={capsule.thumbnail} alt={capsule.name} className="capsule-card-image" />
                                            ) : (
                                                <div className="capsule-card-image capsule-card-placeholder">
                                                    <span>✦</span>
                                                </div>
                                            )}
                                            <div className="capsule-card-overlay">
                                                <div className="capsule-card-actions">
                                                    <span className="capsule-action">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                        {formatNumber(capsule.views)}
                                                    </span>
                                                    <span className="capsule-action">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                        </svg>
                                                        {formatNumber(capsule.likes)}
                                                    </span>
                                                </div>
                                            </div>
                                            {!capsule.is_public && (
                                                <span className="capsule-private-badge">
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                    </svg>
                                                    Private
                                                </span>
                                            )}
                                        </div>
                                        <div className="capsule-card-body">
                                            <h3 className="capsule-card-title">{capsule.name}</h3>
                                            <p className="capsule-card-bio">{capsule.bio || 'No bio yet'}</p>
                                            <div className="capsule-card-meta">
                                                <span className="capsule-meta-item">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                        <circle cx="12" cy="10" r="3" />
                                                    </svg>
                                                    {capsule.location || 'Unknown'}
                                                </span>
                                                <span className="capsule-meta-item">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    {formatDate(capsule.created_at)}
                                                </span>
                                            </div>
                                            <div className="capsule-card-footer">
                                                <div className="capsule-rating">
                                                    {renderStars(capsule.average_rating)}
                                                    <span className="rating-count">({capsule.review_count})</span>
                                                </div>
                                                <span className="capsule-view-link">
                                                    View
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                        <polyline points="12 5 19 12 12 19" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Sidebar */}
                    <aside className="dashboard-sidebar">
                        {/* Most Viewed */}
                        {most_viewed && (
                            <section className="dashboard-section most-viewed-section">
                                <div className="section-header">
                                    <h2 className="section-title">Most Viewed</h2>
                                </div>
                                <div className="most-viewed-card" onClick={() => navigate(`/capsule/${most_viewed.id}`)}>
                                    {most_viewed.thumbnail ? (
                                        <img src={most_viewed.thumbnail} alt={most_viewed.name} className="most-viewed-image" />
                                    ) : (
                                        <div className="most-viewed-image most-viewed-placeholder">
                                            <span>✦</span>
                                        </div>
                                    )}
                                    <div className="most-viewed-info">
                                        <h3 className="most-viewed-name">{most_viewed.name}</h3>
                                        <div className="most-viewed-stats">
                                            <span className="most-viewed-stat">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                {formatNumber(most_viewed.views)} views
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Recent Capsules */}
                        {recent_capsules && recent_capsules.length > 0 && (
                            <section className="dashboard-section recent-section">
                                <div className="section-header">
                                    <h2 className="section-title">Recent</h2>
                                </div>
                                <div className="recent-list">
                                    {recent_capsules.map((capsule) => (
                                        <div key={capsule.id} className="recent-item" onClick={() => navigate(`/capsule/${capsule.id}`)}>
                                            {capsule.thumbnail ? (
                                                <img src={capsule.thumbnail} alt={capsule.name} className="recent-thumb" />
                                            ) : (
                                                <div className="recent-thumb recent-thumb-placeholder">
                                                    <span>✦</span>
                                                </div>
                                            )}
                                            <div className="recent-info">
                                                <span className="recent-name">{capsule.name}</span>
                                                <span className="recent-date">{formatDate(capsule.created_at)}</span>
                                            </div>
                                            <span className="recent-arrow">→</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Reviews Received */}
                        <section className="dashboard-section reviews-section">
                            <div className="section-header">
                                <h2 className="section-title">Reviews Received</h2>
                                <span className="section-count">{reviews_received.length}</span>
                            </div>
                            {reviews_received.length === 0 ? (
                                <div className="mini-empty">
                                    <p>No reviews yet</p>
                                </div>
                            ) : (
                                <div className="reviews-list">
                                    {reviews_received.slice(0, 5).map((review) => (
                                        <div key={review.id} className="review-item">
                                            <div className="review-avatar-wrap">
                                                {review.user_image ? (
                                                    <img src={review.user_image} alt={review.user_name} className="review-avatar" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <div className="review-avatar review-avatar-fallback">
                                                        {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="review-content">
                                                <div className="review-header">
                                                    <span className="review-author">{review.user_name || 'Anonymous'}</span>
                                                    <span className="review-capsule">on {review.capsule_name}</span>
                                                </div>
                                                <div className="review-stars">{renderStars(review.rating)}</div>
                                                <p className="review-text">{review.review}</p>
                                                <span className="review-date">{formatDate(review.created_at)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Reviews Written */}
                        <section className="dashboard-section reviews-section">
                            <div className="section-header">
                                <h2 className="section-title">Reviews Written</h2>
                                <span className="section-count">{reviews_written.length}</span>
                            </div>
                            {reviews_written.length === 0 ? (
                                <div className="mini-empty">
                                    <p>You haven't written any reviews yet</p>
                                </div>
                            ) : (
                                <div className="reviews-list">
                                    {reviews_written.slice(0, 5).map((review) => (
                                        <div key={review.id} className="review-item">
                                            <div className="review-avatar-wrap">
                                                {review.capsule_cover ? (
                                                    <img src={review.capsule_cover} alt={review.capsule_name} className="review-avatar" />
                                                ) : (
                                                    <div className="review-avatar review-avatar-fallback">
                                                        <span>✦</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="review-content">
                                                <div className="review-header">
                                                    <span className="review-author">{review.capsule_name}</span>
                                                </div>
                                                <div className="review-stars">{renderStars(review.rating)}</div>
                                                <p className="review-text">{review.review}</p>
                                                <span className="review-date">{formatDate(review.created_at)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;