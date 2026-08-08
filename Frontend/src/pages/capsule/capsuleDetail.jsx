import { useState, useEffect, useRef } from 'react';
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
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [loading, setLoading] = useState(true);
    const hasFetched = useRef(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [capsule, setCapsule] = useState(null);
    const [editing, setEditing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        story: '',
        location: '',
        dob: '',
        is_public: true,
    });

    const [reviews, setReviews] = useState([]);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(capsule?.likes || 0);
    const [likeLoading, setLikeLoading] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        // Get current user ID from localStorage
        const updateCurrentUser = () => {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    setCurrentUserId(user.id);
                } catch (e) {
                    console.error('Failed to parse user data:', e);
                }
            } else {
                setCurrentUserId(null);
            }
        };

        // Initial check
        updateCurrentUser();

        // Listen for login/logout events
        const handleStorageChange = (event) => {
            if (event.key === 'user' || event.key === 'access_token') {
                updateCurrentUser();
                setToken(localStorage.getItem('access_token'));
            }
        };

        const handleLoginSuccess = () => {
            updateCurrentUser();
            setToken(localStorage.getItem('access_token'));
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('loginSuccess', handleLoginSuccess);

        // Fetch capsule data only once
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchCapsule();
            fetchReviews(1);
            // Check like status after capsule is loaded
            setTimeout(() => {
                checkLikeStatus();
            }, 500);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('loginSuccess', handleLoginSuccess);
        };
    }, [id]);

    const fetchCapsule = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/capsules/${id}/`, {
                headers: getApiHeaders(token),
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

    const checkLikeStatus = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/capsules/${id}/like/`, {
                headers: getApiHeaders(token),
            });
            if (res.ok) {
                const data = await res.json();
                setLiked(data.liked);
                setLikesCount(data.likes_count);
            }
        } catch (err) {
            console.error('Failed to check like status:', err);
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
        if (!token) {
            setError('Please login to edit capsule');
            return;
        }
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

    const handleLike = async () => {
        if (!token) {
            setError('Please login to like');
            return;
        }
        setLikeLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/capsules/${id}/like/`, {
                method: 'POST',
                headers: getApiHeaders(token),
            });
            if (!res.ok) throw new Error('Failed to like capsule');
            const data = await res.json();
            setLiked(data.liked);
            setLikesCount(data.likes_count);
        } catch (err) {
            setError(err.message);
        } finally {
            setLikeLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!token) {
            setError('Please login to review');
            return;
        }
        if (!reviewRating || !reviewText) {
            setError('Please provide both rating and review');
            return;
        }
        setSubmittingReview(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/capsules/${id}/review/`, {
                method: 'POST',
                headers: getApiHeaders(token),
                body: JSON.stringify({
                    rating: reviewRating,
                    review: reviewText
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit review');
            }
            const data = await res.json();
            // Refresh reviews
            fetchReviews(1);
            // Reset form
            setShowReviewForm(false);
            setReviewRating(0);
            setReviewText('');
            // Update capsule stats
            if (data.review) {
                setCapsule(prev => ({
                    ...prev,
                    total_reviews: (prev.total_reviews || 0) + 1,
                    average_rating: data.review.rating
                }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmittingReview(false);
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
                <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
            </div>
        );
    }

    return (
        <div className="capsule-detail-container">
            <div className="capsule-detail-bg-glow glow-1" />
            <div className="capsule-detail-bg-glow glow-2" />

            <div className="capsule-detail-content">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back
                </button>

                <div className='details-content' style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <div className="capsule-detail-card">
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
                                {token && capsule && currentUserId === capsule.user?.id ? (
                                    !editing ? (
                                        <button className="action-btn edit-btn" onClick={() => setEditing(true)}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                            Edit
                                        </button>
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
                                    )
                                ) : null}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                    <span>{capsule.total_reviews || 0} reviews</span>
                                </div>

                            </div>
                            {/* Like Button - Show only if not the owner */}
                            {token && currentUserId !== capsule.user?.id && (
                                <div className="capsule-like-section">
                                    <button
                                        className={`like-btn ${liked ? 'liked' : 'like'}`}
                                        onClick={handleLike}
                                        disabled={likeLoading}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                        {/* <span>{liked ? 'Liked' : 'Like'}</span> */}
                                    </button>
                                </div>
                            )}


                        </div>



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

                    <section className="capsule-reviews-section">
                        <div className="reviews-header">
                            <h2 className="reviews-title">Reviews ({capsule.total_reviews || 0})</h2>
                            {/* Add Review Button - Show only if not the owner and logged in */}
                            {token && currentUserId !== capsule.user?.id && !showReviewForm && (
                                <button
                                    className="add-review-btn"
                                    onClick={() => setShowReviewForm(true)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Add Review
                                </button>
                            )}
                        </div>



                        {/* Review Form */}
                        {showReviewForm && (
                            <div className="review-form">
                                <h3>Write a Review</h3>
                                <div className="review-form-rating">
                                    <label>Rating:</label>
                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star-btn ${star <= reviewRating ? 'active' : ''}`}
                                                onClick={() => setReviewRating(star)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <textarea
                                        placeholder="Write your review here..."
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        rows="4"
                                    />
                                </div>
                                <div className="review-form-actions">
                                    <button
                                        className="submit-review-btn"
                                        onClick={handleSubmitReview}
                                        disabled={submittingReview}
                                    >
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                    <button
                                        className="cancel-review-btn"
                                        onClick={() => {
                                            setShowReviewForm(false);
                                            setReviewRating(0);
                                            setReviewText('');
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

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