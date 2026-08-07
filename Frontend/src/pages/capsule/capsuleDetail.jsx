    import { useState, useEffect, useRef  } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import './capsuleDetail.css';

    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

    const CapsuleDetail = () => {
        const { id } = useParams();
        const navigate = useNavigate();
        const token = localStorage.getItem('access_token');
        const [loading, setLoading] = useState(true);
        const hasFetched = useRef(false);
        const [saving, setSaving] = useState(false);
        const [error, setError] = useState('');
        const [capsule, setCapsule] = useState(null);
        const [editing, setEditing] = useState(false);
        const [formData, setFormData] = useState({
            name: '',
            bio: '',
            story: '',
            location: '',
            dob: '',
            is_public: true,
        });

        // Reviews state
        const [reviews, setReviews] = useState([]);
        const [reviewsPage, setReviewsPage] = useState(1);
        const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
        const [reviewsLoading, setReviewsLoading] = useState(false);

        useEffect(() => {
            if (!token) {
                navigate('/auth');
                return;
            }

            if (hasFetched.current) return;
            hasFetched.current = true;

            fetchCapsule();
            fetchReviews(1);
        }, [id, token, navigate]);

        const fetchCapsule = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/capsules/${id}/`, {
                    headers: getApiHeaders(),
                });
                if (!res.ok) throw new Error('Failed to fetch capsule');
                const data = await res.json();
                setCapsule(data);
                setFormData({
                    name: data.name || '',
                    bio: data.bio || '',
                    story: data.story || '',
                    location: data.location || '',
                    dob: data.dob || '',
                    is_public: data.is_public ?? true,
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchReviews = async (page) => {
            setReviewsLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/capsules/${id}/reviews/?page=${page}`, {
                    headers: getApiHeaders(token),
                });
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data.results || []);
                    setReviewsTotalPages(data.total_pages || 1);
                    setReviewsPage(page);
                }
            } catch (err) {
                console.error('Failed to fetch reviews:', err);
            } finally {
                setReviewsLoading(false);
            }
        };

        const handleSave = async () => {
            setSaving(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/capsules/${id}/`, {
                    method: 'PATCH',
                    headers: getApiHeaders(token),
                    body: JSON.stringify(formData),
                });
                if (!res.ok) throw new Error('Failed to update capsule');
                const updated = await res.json();
                setCapsule(updated);
                setEditing(false);
            } catch (err) {
                setError(err.message);
            } finally {
                setSaving(false);
            }
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
                <div className="capsule-detail-loading">
                    <div className="loading-spinner" />
                    <p>Loading capsule...</p>
                </div>
            );
        }

        if (error || !capsule) {
            return (
                <div className="capsule-detail-error">
                    <div className="error-icon">✦</div>
                    <h2>Something went wrong</h2>
                    <p>{error || 'Capsule not found'}</p>
                    <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
                </div>
            );
        }

        return (
            <div className="capsule-detail-container">
                <div className="capsule-detail-bg-glow glow-1" />
                <div className="capsule-detail-bg-glow glow-2" />

                <div className="capsule-detail-content">
                    {/* Back button */}
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back
                    </button>

                    <div className='details-content' style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>

                        {/* Main Card */}
                        <div className="capsule-detail-card">
                            {/* Cover Image */}
                            <div className="capsule-detail-cover-wrap">
                                {capsule.cover ? (
                                    <img src={capsule.cover} alt={capsule.name} className="capsule-detail-cover" />
                                ) : (
                                    <div className="capsule-detail-cover-placeholder">
                                        <span>✦</span>
                                    </div>
                                )}
                                <div className="capsule-detail-cover-overlay" />
                            </div>

                            {/* Avatar + Actions */}
                            <div className="capsule-detail-header">
                                <div className="capsule-detail-avatar-wrap">
                                    {capsule.profile ? (
                                        <img src={capsule.profile} alt={capsule.name} className="capsule-detail-avatar" />
                                    ) : (
                                        <div className="capsule-detail-avatar-fallback">
                                            {capsule.name ? capsule.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="capsule-detail-actions">
                                    {!editing ? (
                                        <>
                                            <button className="action-btn edit-btn" onClick={() => setEditing(true)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                                Edit
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="action-btn save-btn" onClick={handleSave} disabled={saving}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button className="action-btn cancel-btn" onClick={() => setEditing(false)}>
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="capsule-detail-stats">
                                <div className="capsule-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    <span>{capsule.views || 0} views</span>
                                </div>
                                <div className="capsule-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                    <span>{capsule.likes || 0} likes</span>
                                </div>
                                <div className="capsule-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    <span>{capsule.average_rating || 0}/5</span>
                                </div>
                                <div className="capsule-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <span>{capsule.review_count || 0} reviews</span>
                                </div>
                            </div>

                            {/* Name & Bio */}
                            <div className="capsule-detail-info">
                                <h1 className="capsule-detail-name">{capsule.name}</h1>
                                <div className="capsule-detail-rating">
                                    {renderStars(capsule.average_rating)}
                                    <span className="rating-text">{capsule.average_rating || 0}/5 ({capsule.review_count || 0} reviews)</span>
                                </div>

                                {editing ? (
                                    <div className="capsule-edit-form">
                                        <div className="form-group">
                                            <label>Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Bio</label>
                                            <textarea
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                rows="3"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Story</label>
                                            <textarea
                                                value={formData.story}
                                                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                                                rows="5"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Location</label>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Date of Birth</label>
                                            <input
                                                type="date"
                                                value={formData.dob}
                                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group checkbox-group">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_public}
                                                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                                />
                                                Public capsule
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="capsule-detail-bio">{capsule.bio || 'No bio yet'}</p>
                                        {capsule.story && (
                                            <div className="capsule-detail-story">
                                                <h3>Story</h3>
                                                <p>{capsule.story}</p>
                                            </div>
                                        )}
                                        <div className="capsule-detail-meta">
                                            {capsule.location && (
                                                <span className="meta-item">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                        <circle cx="12" cy="10" r="3" />
                                                    </svg>
                                                    {capsule.location}
                                                </span>
                                            )}
                                            {capsule.dob && (
                                                <span className="meta-item">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    {new Date(capsule.dob).toLocaleDateString()}
                                                </span>
                                            )}
                                            <span className="meta-item">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                Created {new Date(capsule.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <section className="capsule-reviews-section">
                            <div className="reviews-header">
                                <h2 className="reviews-title">Reviews ({capsule.total_reviews || 0})</h2>
                            </div>

                            {reviewsLoading && reviewsPage === 1 ? (
                                <div className="reviews-loading">
                                    <div className="loading-spinner small" />
                                    <p>Loading reviews...</p>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="reviews-empty">
                                    <p>No reviews yet. Be the first to review!</p>
                                </div>
                            ) : (
                                <>
                                    <div className="reviews-list">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="review-card">
                                                <div className="review-avatar-wrap">
                                                    {review.user_image ? (
                                                        <img src={review.user_image} alt={review.user_name} className="review-avatar" referrerPolicy="no-referrer" />
                                                    ) : (
                                                        <div className="review-avatar-fallback">
                                                            {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="review-content">
                                                    <div className="review-header">
                                                        <span className="review-author">{review.user_name || 'Anonymous'}</span>
                                                        <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="review-stars">{renderStars(review.rating)}</div>
                                                    <p className="review-text">{review.review}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {reviewsTotalPages > 1 && (
                                        <div className="reviews-pagination">
                                            <button
                                                className="pagination-btn"
                                                disabled={reviewsPage === 1}
                                                onClick={() => fetchReviews(reviewsPage - 1)}
                                            >
                                                Previous
                                            </button>
                                            <span className="pagination-info">
                                                Page {reviewsPage} of {reviewsTotalPages}
                                            </span>
                                            <button
                                                className="pagination-btn"
                                                disabled={reviewsPage === reviewsTotalPages}
                                                onClick={() => fetchReviews(reviewsPage + 1)}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        );
    };

    export default CapsuleDetail;