import { useState } from 'react';
import './TimelineCard.css';

const TimelineCard = ({ event, onSeeMore }) => {
    const [imageError, setImageError] = useState(false);

    // Truncate text to ~100 words
    const truncateText = (text, maxWords = 30) => {
        if (!text) return '';
        const words = text.split(' ');
        if (words.length <= maxWords) return text;
        return words.slice(0, maxWords).join(' ') + '...';
    };

    const coverImage = event.images && event.images.length > 0
        ? event.images[0].image_url || event.images[0].image
        : null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="timeline-card" onClick={() => onSeeMore(event)}>
            {/* Cover Image */}
            <div className="timeline-card-image-wrap">
                {coverImage && !imageError ? (
                    <img 
                        src={coverImage} 
                        alt={event.title}
                        className="timeline-card-image"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="timeline-card-image-placeholder">
                        <span>✦</span>
                    </div>
                )}
                <div className="timeline-card-image-overlay" />
            </div>

            {/* Content */}
            <div className="timeline-card-content">
                <div className="timeline-card-date">
                    {formatDate(event.event_date)}
                </div>
                <h3 className="timeline-card-title">{event.title}</h3>
                <p className="timeline-card-description">
                    {truncateText(event.description)}
                </p>
            </div>
        </div>
    );
};

export default TimelineCard;