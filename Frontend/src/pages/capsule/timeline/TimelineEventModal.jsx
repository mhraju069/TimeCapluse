import { useState } from 'react';
import ImageCarousel from '../../../components/application/carousel/ImageCarousel';
import './TimelineEventModal.css';

const TimelineEventModal = ({ event, onClose }) => {
    const [showCarousel, setShowCarousel] = useState(false);
    const [carouselStartIndex, setCarouselStartIndex] = useState(0);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const day = date.getDate();
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            return `${day} ${month} ${year}`;
        } catch {
            return dateStr;
        }
    };

    const hasImages = event.images && event.images.length > 0;
    const coverImage = hasImages ? (event.images[0].image_url || event.images[0].image) : null;

    return (
        <div className="timeline-event-modal-backdrop" onClick={onClose}>
            <div className="timeline-event-modal" onClick={(e) => e.stopPropagation()}>
                {/* Floating Close Button */}
                <button className="timeline-event-modal-close-floating" onClick={onClose} aria-label="Close modal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Hero Cover Header */}
                <div 
                    className="timeline-event-modal-cover"
                    style={{ backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
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
                    {hasImages && (
                        <div className="timeline-event-modal-gallery-section">
                            <h4 className="timeline-event-modal-gallery-title">Photos</h4>
                            <div className="timeline-event-modal-gallery-grid">
                                {event.images.map((img, index) => (
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
                </div>

                {/* Fullscreen Image Carousel Lightbox */}
                {showCarousel && (
                    <ImageCarousel
                        images={event.images}
                        startIndex={carouselStartIndex}
                        onClose={() => setShowCarousel(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default TimelineEventModal;