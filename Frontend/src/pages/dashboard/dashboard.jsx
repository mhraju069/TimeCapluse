import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TimelineCard from './TimelineCard';
import TimelineDetailModal from './TimelineDetailModal';
import TimelineModal from '../capsule/timeline/TimelineModal';
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
    const [showAddModal, setShowAddModal] = useState(false);

    // Capsule Edit States
    const [editingCapsule, setEditingCapsule] = useState(false);
    const [capsuleFormData, setCapsuleFormData] = useState({
        name: '',
        bio: '',
        location: '',
        dob: '',
        is_public: true
    });
    const [capsuleProfileFile, setCapsuleProfileFile] = useState(null);
    const [capsuleCoverFile, setCapsuleCoverFile] = useState(null);
    const [capsuleProfilePreview, setCapsuleProfilePreview] = useState(null);
    const [capsuleCoverPreview, setCapsuleCoverPreview] = useState(null);
    const [savingCapsule, setSavingCapsule] = useState(false);
    const [capsuleError, setCapsuleError] = useState('');

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
                                if (retryData.data.capsule) {
                                    setCapsuleFormData({
                                        name: retryData.data.capsule.name || '',
                                        bio: retryData.data.capsule.bio || '',
                                        location: retryData.data.capsule.location || '',
                                        dob: retryData.data.capsule.dob || '',
                                        is_public: retryData.data.capsule.is_public ?? true,
                                    });
                                }
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
                if (result.data.capsule) {
                    setCapsuleFormData({
                        name: result.data.capsule.name || '',
                        bio: result.data.capsule.bio || '',
                        location: result.data.capsule.location || '',
                        dob: result.data.capsule.dob || '',
                        is_public: result.data.capsule.is_public ?? true,
                    });
                }

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

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        if (type === 'profile') {
            setCapsuleProfileFile(file);
            setCapsuleProfilePreview(URL.createObjectURL(file));
        } else {
            setCapsuleCoverFile(file);
            setCapsuleCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveCapsule = async (e) => {
        e.preventDefault();
        setSavingCapsule(true);
        setCapsuleError('');
        const token = localStorage.getItem('access_token');
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', capsuleFormData.name);
            formDataToSend.append('bio', capsuleFormData.bio);
            formDataToSend.append('location', capsuleFormData.location);
            formDataToSend.append('dob', capsuleFormData.dob);
            formDataToSend.append('is_public', capsuleFormData.is_public);
            
            if (capsuleProfileFile) {
                formDataToSend.append('profile', capsuleProfileFile);
            }
            if (capsuleCoverFile) {
                formDataToSend.append('cover', capsuleCoverFile);
            }

            const res = await fetch(`${API_BASE_URL}/api/capsules/${data.capsule_id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                },
                body: formDataToSend,
            });

            if (!res.ok) {
                throw new Error('Failed to update capsule details');
            }

            const updatedCapsule = await res.json();
            setData(prev => ({
                ...prev,
                capsule: updatedCapsule
            }));
            setEditingCapsule(false);
            setCapsuleProfileFile(null);
            setCapsuleCoverFile(null);
            setCapsuleProfilePreview(null);
            setCapsuleCoverPreview(null);
        } catch (err) {
            console.error(err);
            setCapsuleError(err.message || 'Failed to update capsule');
        } finally {
            setSavingCapsule(false);
        }
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
                        
                        {/* Capsule Details Section */}
                        {has_capsule && capsule && (
                            <div className="dashboard-capsule-detail-card">
                                <div className="capsule-detail-cover-wrap">
                                    {capsuleCoverPreview ? (
                                        <img src={capsuleCoverPreview} alt="Cover Preview" className="capsule-detail-cover" />
                                    ) : capsule.cover ? (
                                        <img src={capsule.cover} alt={capsule.name} className="capsule-detail-cover" />
                                    ) : (
                                        <div className="capsule-detail-cover-placeholder">
                                            <span>✦</span>
                                        </div>
                                    )}
                                    {editingCapsule && (
                                        <label className="cover-upload-btn">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                <circle cx="12" cy="13" r="4" />
                                            </svg>
                                            Update Cover
                                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} style={{ display: 'none' }} />
                                        </label>
                                    )}
                                    <div className="capsule-detail-cover-overlay" />
                                </div>

                                <div className="capsule-detail-header">
                                    <div className="capsule-detail-avatar-wrap">
                                        {capsuleProfilePreview ? (
                                            <img src={capsuleProfilePreview} alt="Profile Preview" className="capsule-detail-avatar" />
                                        ) : capsule.profile ? (
                                            <img src={capsule.profile} alt={capsule.name} className="capsule-detail-avatar" />
                                        ) : (
                                            <div className="capsule-detail-avatar-fallback">
                                                {capsule.name ? capsule.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        )}
                                        {editingCapsule && (
                                            <label className="avatar-upload-btn">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                    <circle cx="12" cy="13" r="4" />
                                                </svg>
                                                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} style={{ display: 'none' }} />
                                            </label>
                                        )}
                                    </div>

                                    {!editingCapsule && (
                                        <button className="btn-edit" onClick={() => setEditingCapsule(true)} style={{ marginTop: '20px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                            Edit Capsule
                                        </button>
                                    )}
                                </div>

                                <div className="capsule-detail-info" style={{ padding: '0 28px 28px' }}>
                                    {capsuleError && <div className="capsule-edit-error" style={{ color: '#ef4444', marginBottom: '1rem' }}>{capsuleError}</div>}
                                    
                                    {editingCapsule ? (
                                        <form onSubmit={handleSaveCapsule} className="capsule-edit-form">
                                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                                                <label style={{ color: '#d4a574', fontSize: '0.85rem', fontWeight: '600' }}>Capsule Name</label>
                                                <input
                                                    type="text"
                                                    value={capsuleFormData.name}
                                                    onChange={(e) => setCapsuleFormData({ ...capsuleFormData, name: e.target.value })}
                                                    required
                                                    style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,165,116,0.2)', borderRadius: '8px', color: '#fff' }}
                                                />
                                            </div>
                                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                                                <label style={{ color: '#d4a574', fontSize: '0.85rem', fontWeight: '600' }}>Bio</label>
                                                <textarea
                                                    value={capsuleFormData.bio}
                                                    onChange={(e) => setCapsuleFormData({ ...capsuleFormData, bio: e.target.value })}
                                                    rows="3"
                                                    maxLength={250}
                                                    style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,165,116,0.2)', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
                                                />
                                            </div>
                                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                                                <label style={{ color: '#d4a574', fontSize: '0.85rem', fontWeight: '600' }}>Location</label>
                                                <input
                                                    type="text"
                                                    value={capsuleFormData.location}
                                                    onChange={(e) => setCapsuleFormData({ ...capsuleFormData, location: e.target.value })}
                                                    style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,165,116,0.2)', borderRadius: '8px', color: '#fff' }}
                                                />
                                            </div>
                                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                                                <label style={{ color: '#d4a574', fontSize: '0.85rem', fontWeight: '600' }}>Date of Birth</label>
                                                <input
                                                    type="date"
                                                    value={capsuleFormData.dob}
                                                    onChange={(e) => setCapsuleFormData({ ...capsuleFormData, dob: e.target.value })}
                                                    style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,165,116,0.2)', borderRadius: '8px', color: '#fff' }}
                                                />
                                            </div>
                                            <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                                                <input
                                                    type="checkbox"
                                                    id="is_public_dash"
                                                    checked={capsuleFormData.is_public}
                                                    onChange={(e) => setCapsuleFormData({ ...capsuleFormData, is_public: e.target.checked })}
                                                />
                                                <label htmlFor="is_public_dash" style={{ color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>Public capsule (visible to everyone)</label>
                                            </div>

                                            <div className="capsule-edit-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    className="btn-cancel"
                                                    onClick={() => {
                                                        setEditingCapsule(false);
                                                        setCapsuleProfilePreview(null);
                                                        setCapsuleCoverPreview(null);
                                                        setCapsuleProfileFile(null);
                                                        setCapsuleCoverFile(null);
                                                    }}
                                                    disabled={savingCapsule}
                                                    style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn-save"
                                                    disabled={savingCapsule}
                                                    style={{ padding: '8px 16px', background: 'var(--primary-color)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                                                >
                                                    {savingCapsule ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <h1 className="capsule-detail-name" style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '700', margin: '0 0 10px 0' }}>{capsule.name}</h1>
                                            <p className="capsule-detail-bio" style={{ color: '#a0a0a0', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>{capsule.bio || 'No bio yet'}</p>
                                            <div className="capsule-detail-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#888', fontSize: '0.85rem' }}>
                                                {capsule.location && (
                                                    <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                            <circle cx="12" cy="10" r="3" />
                                                        </svg>
                                                        {capsule.location}
                                                    </span>
                                                )}
                                                {capsule.dob && (
                                                    <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                        {new Date(capsule.dob).toLocaleDateString()}
                                                    </span>
                                                )}
                                                <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    Created {new Date(capsule.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                    </svg>
                                                    {capsule.is_public ? 'Public Capsule' : 'Private Capsule'}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {has_capsule && capsule_id ? (
                            <>
                                <div className="section-header" style={{ marginBottom: '24px', marginTop: '40px', padding: '0 2px' }}>
                                    <h2 className="section-title">My Timeline Events</h2>
                                    <span className="section-count">{stats.timeline_count || 0} events</span>
                                </div>

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
                                        <div className="empty-state" style={{ padding: '40px 20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(212, 165, 116, 0.25)', borderRadius: '20px' }}>
                                            <div className="empty-icon" style={{ fontSize: '2.5rem', color: '#d4a574', marginBottom: '14px' }}>✦</div>
                                            <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '8px' }}>No timeline events yet</h3>
                                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem', marginBottom: '20px' }}>Start adding timeline events to your capsule.</p>
                                            <button 
                                                className="btn-save" 
                                                onClick={() => setShowAddModal(true)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'var(--primary-color)', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(212, 160, 36, 0.2)' }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                                Add New Event
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="empty-state" style={{ marginTop: '40px' }}>
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

            {/* Add Timeline Event Modal */}
            {showAddModal && (
                <TimelineModal
                    capsuleId={capsule_id}
                    token={localStorage.getItem('access_token')}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        fetchTimelineEvents(capsule_id, localStorage.getItem('access_token'));
                        setShowAddModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;