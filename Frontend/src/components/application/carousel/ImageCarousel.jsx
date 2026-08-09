import { useState, useCallback } from 'react';
import './ImageCarousel.css';

const ImageCarousel = ({ images, startIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [direction, setDirection] = useState(''); // 'left' or 'right'

    const prev = useCallback(() => {
        setDirection('left');
        setCurrentIndex(i => (i - 1 + images.length) % images.length);
    }, [images.length]);

    const next = useCallback(() => {
        setDirection('right');
        setCurrentIndex(i => (i + 1) % images.length);
    }, [images.length]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'Escape') onClose();
    }, [prev, next, onClose]);

    const src = images[currentIndex]?.image_url || images[currentIndex]?.image || images[currentIndex];

    return (
        <div
            className="ic-backdrop"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            ref={(el) => el && el.focus()}
        >
            {/* Close button */}
            <button className="ic-close" onClick={onClose} aria-label="Close">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* Card */}
            <div className="ic-card" onClick={e => e.stopPropagation()}>
                {/* Image Wrapper for sliding effect */}
                <div className="ic-img-container">
                    <img
                        key={currentIndex}
                        src={src}
                        alt={`Image ${currentIndex + 1}`}
                        className={`ic-img ic-slide-${direction}`}
                        draggable={false}
                        onAnimationEnd={() => setDirection('')}
                    />
                </div>

                {/* Left arrow */}
                {images.length > 1 && (
                    <button className="ic-arrow ic-arrow-left" onClick={prev} aria-label="Previous">
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                )}

                {/* Right arrow */}
                {images.length > 1 && (
                    <button className="ic-arrow ic-arrow-right" onClick={next} aria-label="Next">
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                )}

                {/* Dot indicator */}
                {images.length > 1 && (
                    <div className="ic-dots">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                className={`ic-dot${i === currentIndex ? ' ic-dot-active' : ''}`}
                                onClick={() => {
                                    if (i !== currentIndex) {
                                        setDirection(i > currentIndex ? 'right' : 'left');
                                        setCurrentIndex(i);
                                    }
                                }}
                                aria-label={`Go to image ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageCarousel;
