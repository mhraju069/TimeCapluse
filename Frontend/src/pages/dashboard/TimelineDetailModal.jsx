import { useState, useEffect } from 'react';
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

    useEffect(() => {
        // Load existing images
        if (event.images && event.images.length > 0) {
            setImages(event.images);
        }
    }, [event]);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setNewImages([...newImages, ...files]);

        // Create previews
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...previews]);
    };

    const removeExistingImage = (index) => {
        const newImagesList = images.filter((_, i) => i !== index);
        setImages(newImagesList);
    };

    const removeNewImage = (index) => {
        const newNewImages = newImages.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setNewImages(newNewImages);
        setImagePreviews(newPreviews);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');

        try {
            const formDataObj = new FormData();
            formDataObj.append('title', formData.title);
            formDataObj.append('description', formData.description);
            formDataObj.append('event_date', formData.event_date);

            // Append existing images that weren't removed
            images.forEach(img => {
                formDataObj.append('existing_images', img.id || img.image_url || img.image);
            });

            // Append new images
            newImages.forEach(image => {
                formDataObj.append('images', image);
            });

            const res = await fetch(`${API_BASE_URL}/api/capsules/timeline/${event.id}/`, {
                method: 'PATCH',
                headers: getApiHeaders(token),
                body: formDataObj,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update timeline');
            }

            const updated = await res.json();
            onUpdate(updated);
            setEditing(false);
        } catch (err) {
            setError(err.message);
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
                        </button>

                        <button className="timeline-detail-close" onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                    </div>
                </div>

                {error && (
                    <div className="timeline-detail-error">
                        {error}
                    </div>
                )}

                <div className="timeline-detail-content">
                    {editing ? (
                        <div className="timeline-edit-form">
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
                                <label>Event Date</label>
                                <input
                                    type="date"
                                    value={formData.event_date}
                                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="8"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Current Images</label>
                                <div className="timeline-images-grid">
                                    {images.map((img, index) => (
                                        <div key={index} className="timeline-image-item">
                                            <img src={img.image_url || img.image} alt={`Event ${index + 1}`} />
                                            <button
                                                type="button"
                                                className="timeline-image-remove"
                                                onClick={() => removeExistingImage(index)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Add New Images</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="timeline-file-input"
                                />
                                {imagePreviews.length > 0 && (
                                    <div className="timeline-images-grid">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="timeline-image-item">
                                                <img src={preview} alt={`New ${index + 1}`} />
                                                <button
                                                    type="button"
                                                    className="timeline-image-remove"
                                                    onClick={() => removeNewImage(index)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="timeline-detail-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setEditing(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-save"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
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
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* <div className="timeline-detail-actions">
                                <button 
                                    className="btn-edit"
                                    onClick={() => setEditing(true)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Edit Event
                                </button>
                            </div> */}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default TimelineDetailModal;