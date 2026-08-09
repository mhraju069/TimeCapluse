import { useState, useEffect } from 'react';
import ImageCarousel from '../../components/application/carousel/ImageCarousel';
import { convertMultipleToWebP } from '../../utils/imageConverter';
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

    return (
        <div className="timeline-modal-backdrop" onClick={onClose}>
            <div className="timeline-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="timeline-detail-header">
                    <h2>{editing ? 'Edit Timeline Event' : 'Timeline Event'}</h2>
                    <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>

                        <button
                            className="btn-edit"
                            onClick={() => setEditing(true)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                        </button>
                        <button className="timeline-detail-close" onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                </div>

                {error && <div className="timeline-detail-error">{error}</div>}

                <div className="timeline-detail-content">
                    {editing ? (
                        <form onSubmit={handleSubmit} className="timeline-edit-form">
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={formData.event_date}
                                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
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
                                <label>Add More Images</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="timeline-file-input"
                                />
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
                        <div className="timeline-detail-view">
                            <div className="timeline-detail-date">
                                {formatDate(event.event_date)}
                            </div>
                            <h3 className="timeline-detail-title">{event.title}</h3>
                            <p className="timeline-detail-description">{event.description}</p>

                            {event.images && event.images.length > 0 && (
                                <div className="timeline-detail-images">
                                    <h4>Images</h4>
                                    <div className="timeline-images-grid">
                                        {event.images.map((img, index) => (
                                            <img
                                                key={index}
                                                src={img.image_url || img.image}
                                                alt={`Event ${index + 1}`}
                                                className="timeline-detail-image"
                                                style={{ cursor: 'pointer' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCarouselStartIndex(index);
                                                    setShowCarousel(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Image Carousel */}
                            {showCarousel && (
                                <ImageCarousel
                                    images={event.images}
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