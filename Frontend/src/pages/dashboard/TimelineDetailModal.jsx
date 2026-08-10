import { useState, useEffect } from 'react';
import ImageCarousel from '../../components/application/carousel/ImageCarousel';
import { convertMultipleToWebP } from '../../utils/imageConverter';
import '../capsule/timeline/TimelineEventModal.css';
import './TimelineDetailModal.css';

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

const TimelineDetailModal = ({ event, onClose, onUpdate }) => {
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: event.title || '',
        description: event.description || '',
        event_date: event.event_date ? event.event_date.split('T')[0] : '',
    });
    const [images, setImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [showCarousel, setShowCarousel] = useState(false);
    const [carouselStartIndex, setCarouselStartIndex] = useState(0);

    useEffect(() => {
        // Load existing images
        if (event.images && event.images.length > 0) {
            setImages(event.images);
        }
    }, [event]);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        try {
            const webpFiles = await convertMultipleToWebP(files, { quality: 0.8, maxWidth: 1920, maxHeight: 1920 });
            setNewImages(prev => [...prev, ...webpFiles]);

            // Generate previews
            const newPreviews = webpFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        } catch (err) {
            console.error('Error converting images to WebP:', err);
        }
    };

    const handleRemoveNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingImage = async (imageId) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/timeline-images/${imageId}/`, {
                method: 'DELETE',
                headers: getApiHeaders(token),
            });

            if (!res.ok) throw new Error('Failed to delete image');

            setImages(prev => prev.filter(img => img.id !== imageId));
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Delete image error:', err);
            setError('Failed to delete image');
        }
    };

    const handleDeleteEvent = async () => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/timeline/${event.id}/`, {
                method: 'DELETE',
                headers: getApiHeaders(token),
            });

            if (!res.ok) throw new Error('Failed to delete event');

            if (onUpdate) onUpdate();
            onClose();
        } catch (err) {
            console.error('Delete event error:', err);
            setError('Failed to delete event');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            // Update event details
            const res = await fetch(`${API_BASE_URL}/api/timeline/${event.id}/`, {
                method: 'PATCH',
                headers: {
                    ...getApiHeaders(token),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to update event details');

            // Upload new images if any
            if (newImages.length > 0) {
                for (const file of newImages) {
                    const imgFormData = new FormData();
                    imgFormData.append('timeline', event.id);
                    imgFormData.append('image', file);

                    const imgRes = await fetch(`${API_BASE_URL}/api/timeline-images/`, {
                        method: 'POST',
                        headers: getApiHeaders(token),
                        body: imgFormData,
                    });

                    if (!imgRes.ok) console.error('Failed to upload an image');
                }
            }

            setEditing(false);
            if (onUpdate) onUpdate();
            onClose();
        } catch (err) {
            console.error('Update error:', err);
            setError(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const dateStr = formatDate(event.event_date);

    return (
        <div className="timeline-event-modal-backdrop" onClick={onClose}>
            <div className={`timeline-event-modal ${editing ? 'is-editing' : ''}`} onClick={(e) => e.stopPropagation()}>
                {/* Floating Close Button for View Mode */}
                {!editing && (
                    <div className="timeline-event-modal-floating-actions">
                        <button className="timeline-event-modal-close-floating" onClick={onClose} aria-label="Close modal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Edit Form Header */}
                {editing && (
                    <div className="timeline-detail-header">
                        <h2>Edit Timeline Event</h2>
                        <button className="timeline-detail-close" onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                {error && <div className="timeline-detail-error">{error}</div>}

                <div className={editing ? "timeline-detail-edit-content" : "timeline-detail-view-content"}>
                    {editing ? (
                        <form onSubmit={handleSubmit} className="timeline-edit-form">
                            <div className="premium-form-group">
                                <label className="premium-form-label">Date</label>
                                <span className="premium-asterisk">*</span>
                                <div className="premium-input-wrap">
                                    <input
                                        className="premium-form-input"
                                        type="date"
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="premium-form-group">
                                <label className="premium-form-label">Title</label>
                                <span className="premium-asterisk">*</span>
                                <div className="premium-input-wrap">
                                    <input
                                        className="premium-form-input"
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="premium-form-group">
                                <label className="premium-form-label">Description</label>
                                <span className="premium-asterisk">*</span>
                                <div className="premium-input-wrap">
                                    <textarea
                                        className="premium-form-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Existing Images */}
                            {images.length > 0 && (
                                <div className="form-group">
                                    <label>Current Images</label>
                                    <div className="timeline-images-grid">
                                        {images.map((img) => (
                                            <div key={img.id} className="timeline-image-item">
                                                <img src={img.image_url || img.image} alt="Event" />
                                                <button
                                                    type="button"
                                                    className="timeline-image-remove"
                                                    onClick={() => handleRemoveExistingImage(img.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Image Previews */}
                            {imagePreviews.length > 0 && (
                                <div className="form-group">
                                    <label>New Images to Upload</label>
                                    <div className="timeline-images-grid">
                                        {imagePreviews.map((preview, idx) => (
                                            <div key={idx} className="timeline-image-item">
                                                <img src={preview} alt="New Preview" />
                                                <button
                                                    type="button"
                                                    className="timeline-image-remove"
                                                    onClick={() => handleRemoveNewImage(idx)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload Input */}
                            <div className="form-group">
                                <label htmlFor="edit-images">Add More Images</label>
                                <div className="file-input-wrapper">
                                    <input
                                        id="edit-images"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="timeline-file-input-hidden"
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="edit-images" className="file-input-label">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        <span>Choose images</span>
                                    </label>
                                </div>
                            </div>

                            <div className="timeline-detail-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => {
                                        setEditing(false);
                                        setNewImages([]);
                                        setImagePreviews([]);
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-save"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="timeline-event-modal-content" style={{ padding: 0 }}>
                            {/* Hero Cover Header */}
                            <div
                                className="timeline-event-modal-cover"
                                style={{ backgroundImage: images.length > 0 ? `url(${images[0].image_url || images[0].image})` : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
                            >
                                <div className="timeline-event-modal-cover-overlay" />
                                <div className="timeline-event-modal-cover-content">
                                    <h2 className="timeline-event-modal-cover-title">{event.title}</h2>
                                    <span className="timeline-event-modal-cover-date">{formatDate(event.event_date)}</span>
                                </div>
                            </div>

                            <div className="timeline-event-modal-body">
                                {/* Description Text */}
                                <div className="timeline-event-modal-description-wrapper">
                                    <p className="timeline-event-modal-description-text">
                                        {event.description}
                                    </p>
                                </div>

                                {/* Image Gallery */}
                                {images.length > 0 && (
                                    <div className="timeline-event-modal-gallery-section">
                                        <h4 className="timeline-event-modal-gallery-title">Photos</h4>
                                        <div className="timeline-event-modal-gallery-grid">
                                            {images.map((img, index) => (
                                                <div
                                                    key={index}
                                                    className="timeline-event-modal-gallery-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCarouselStartIndex(index);
                                                        setShowCarousel(true);
                                                    }}
                                                >
                                                    <img
                                                        src={img.image_url || img.image}
                                                        alt={`Event ${index + 1}`}
                                                    />
                                                    <div className="timeline-event-modal-gallery-hover">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="11" cy="11" r="8"></circle>
                                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                            <line x1="11" y1="8" x2="11" y2="14"></line>
                                                            <line x1="8" y1="11" x2="14" y2="11"></line>
                                                        </svg>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions Section Below Image */}
                                <div className="timeline-detail-view-actions">
                                    <button
                                        className="btn-update-detail"
                                        onClick={() => setEditing(true)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Update Event
                                    </button>
                                    <button
                                        className="btn-delete-detail"
                                        onClick={handleDeleteEvent}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                        Delete Event
                                    </button>
                                </div>
                            </div>

                            {/* Image Carousel */}
                            {showCarousel && (
                                <ImageCarousel
                                    images={images}
                                    startIndex={carouselStartIndex}
                                    onClose={() => setShowCarousel(false)}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimelineDetailModal;