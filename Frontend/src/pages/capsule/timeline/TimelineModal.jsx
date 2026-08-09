import { useState, useEffect } from 'react';
import './timelineModal.css';

import { convertMultipleToWebP } from '../../../utils/imageConverter';

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

const TimelineModal = ({ capsuleId, token, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        images: [],
    });
    const [imagePreviews, setImagePreviews] = useState([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);



    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        try {
            const webpFiles = await convertMultipleToWebP(files, { quality: 0.8, maxWidth: 1920, maxHeight: 1920 });
            setFormData(prev => ({ ...prev, images: webpFiles }));

            // Create previews
            const previews = webpFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
        } catch (err) {
            console.error('Error converting images to WebP:', err);
        }
    };

    const removeImage = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages });
        setImagePreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            const formDataObj = new FormData();
            formDataObj.append('title', formData.title);
            formDataObj.append('description', formData.description);
            formDataObj.append('event_date', formData.event_date);

            // Append multiple images
            formData.images.forEach(image => {
                formDataObj.append('images', image);
            });

            const res = await fetch(`${API_BASE_URL}/api/capsules/${capsuleId}/timeline/create/`, {
                method: 'POST',
                headers: getApiHeaders(token),
                body: formDataObj,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create timeline');
            }

            onSuccess();
        } catch (err) {
            setError(err.message);
            setCreating(false);
        }
    };

    return (
        <div className="timeline-modal-backdrop">
            <div className="timeline-modal">
                <div className="timeline-modal-header">
                    <h2>Add Timeline Event</h2>
                    <button className="timeline-modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="timeline-modal-form">
                    {error && (
                        <div className="timeline-modal-error">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="title">Event Title *</label>
                        <input
                            id="title"
                            type="text"
                            placeholder="Enter event title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea
                            id="description"
                            placeholder="Describe this event..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="4"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="event_date">Event Date & Time *</label>
                        <input
                            id="event_date"
                            type="datetime-local"
                            value={formData.event_date}
                            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="images">Images</label>
                        <div className="file-input-wrapper">
                            <input
                                id="images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                            />
                            <label htmlFor="images" className="file-input-label">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span>Choose images</span>
                            </label>
                        </div>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="image-previews">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="image-preview-item">
                                        <img src={preview} alt={`Preview ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="image-remove-btn"
                                            onClick={() => removeImage(index)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {formData.images.length > 0 && (
                            <p className="image-count">
                                {formData.images.length} image(s) selected
                            </p>
                        )}
                    </div>

                    <div className="timeline-modal-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={creating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={creating}
                        >
                            {creating ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TimelineModal;