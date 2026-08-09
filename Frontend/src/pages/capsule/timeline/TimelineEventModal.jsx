import { useState } from 'react';
import ImageCarousel from '../../../components/application/carousel/ImageCarousel';
import './TimelineEventModal.css';

const TimelineEventModal = ({ event, onClose }) => {
    const [showCarousel, setShowCarousel] = useState(false);
    const [carouselStartIndex, setCarouselStartIndex] = useState(0);

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
        <div className="timeline-event-modal-backdrop" onClick={onClose}>
            <div className="timeline-event-modal" onClick={(e) => e.stopPropagation()}>
                <div className="timeline-event-modal-header">
                    <h2>Timeline Event</h2>
                    <button className="timeline-event-modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="timeline-event-modal-content">
                    <div className="timeline-event-date">
                        {formatDate(event.event_date)}
                    </div>
                    <h3 className="timeline-event-title">{event.title}</h3>
                    <p className="timeline-event-description">{event.description}</p>

                    {event.images && event.images.length > 0 && (
                        <div className="timeline-event-images">
                            <h4>Images</h4>
                            <div className="timeline-event-images-grid">
                                    {event.images.map((img, index) => (
                                        <img
                                            key={index}
                                            src={img.image_url || img.image}
                                            alt={`Event ${index + 1}`}
                                            className="timeline-event-image"
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
            </div>
        </div>
    );
};

export default TimelineEventModal;