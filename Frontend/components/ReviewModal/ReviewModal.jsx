import React, { useState, useEffect } from 'react';
import './ReviewModal.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ReviewModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    review: '',
    imageFile: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormData({ name: '', email: '', rating: 5, review: '', imageFile: null });
      setMessage({ type: '', text: '' });
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating: rating
    }));
  };

  // Convert uploaded image to WebP client-side
  const convertImageToWebP = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: "image/webp",
                lastModified: Date.now()
              });
              resolve(newFile);
            } else {
              reject(new Error("Canvas conversion to WebP failed"));
            }
          }, 'image/webp', 0.85);
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const webpFile = await convertImageToWebP(file);
      setFormData(prev => ({
        ...prev,
        imageFile: webpFile
      }));
    } catch (err) {
      console.error("WebP client-side conversion failed, utilizing original file:", err);
      setFormData(prev => ({
        ...prev,
        imageFile: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    // Use FormData for file upload support
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('rating', formData.rating);
    formDataToSend.append('review', formData.review);
    if (formData.imageFile) {
      formDataToSend.append('image', formData.imageFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/`, {
        method: 'POST',
        // Note: Do NOT set Content-Type header when sending FormData.
        // The browser will automatically set it along with the boundary string.
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setMessage({ type: 'success', text: 'Review submitted successfully!' });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: data.message || data.errors?.review?.[0] || data.errors?.image?.[0] || 'Failed to submit review. Please try again.'
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay" onClick={handleOverlayClick}>
      <div className="review-modal-container">
        <button className="review-modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="review-modal-layout">
          {/* Left Panel */}
          <div className="review-modal-left">
            <h1 className="touch-title">
              SHARE YOUR

              <div style={{
                position: 'absolute',
                top: '27%',
                left: '245px',
                opacity: 0.95,
                zIndex: 1,
                pointerEvents: 'none'
              }}>
                <svg width="220" height="220" viewBox="0 0 100 100" fill="none">
                  <g transform="translate(116, -10) scale(-0.38, 0.38)">
                    <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M250.426 215.978C254.209 215.749 257.494 216.131 261.027 217.554C290.766 229.535 327.845 306.278 340.481 336.176C337.767 338.066 334.364 339.863 331.429 341.854C330.769 339.556 329.908 337.322 328.856 335.175C325.838 328.968 320.5 321.036 316.579 315.337C305.035 298.886 292.986 282.794 280.449 267.086C275.024 260.192 269.656 253.203 263.933 246.562C260.503 242.582 255.246 241.916 250.699 244.435C248.241 245.781 246.457 248.091 245.775 250.809C244.889 254.348 245.995 260.379 246.736 263.959C250.437 281.836 258.441 298.866 267.343 314.693C269.813 319.083 272.572 323.153 275.083 327.467C272.099 330.012 268.222 332.873 265.084 335.393C257.301 341.523 249.761 347.953 242.478 354.67C238.26 358.615 226.721 369.582 228.019 374.798C229.859 382.19 252.883 374.653 256.927 373.553L283.682 366.209L314.935 357.581C321.002 355.902 326.954 354.214 332.983 352.4C341.257 349.91 345.275 343.441 352.112 338.683C354.085 337.311 356.059 335.775 357.835 334.168C367.373 323.861 375.541 312.163 381.661 299.512C384.836 293.23 387.319 285.521 388.402 278.603C388.918 275.308 388.488 270.156 389.839 267.33C391.256 264.367 394.866 260.281 397.013 257.651C397.704 281.707 382.882 304.84 369.615 323.952C367.704 326.705 365.618 329.31 363.421 331.841C366.908 330.393 372.08 328.666 375.878 329.546C376.86 329.774 377.79 330.294 378.22 331.258C378.803 332.569 378.409 334.269 377.942 335.55C377.057 337.981 375.469 340.095 373.906 342.125C368.612 349 361.717 354.935 353.313 357.551C348.465 359.061 343.245 358.981 338.991 362.103C334.057 365.724 330.099 375.208 326.773 380.662C323.157 386.591 305.319 414.03 299.84 416.178C299.151 416.448 298.838 416.414 298.196 416.093C296.802 412.462 305.854 394.43 307.707 390.108C312.045 379.989 315.495 369.296 323.963 361.878C319.609 363.64 315.459 364.938 311.013 366.914C287.921 377.177 263.95 390.208 238.252 391.64C234.141 391.869 228.313 390.848 224.373 389.618C217.242 387.392 207.958 383.744 204.227 376.733C202.552 373.584 202.64 369.225 203.872 366.071C210.75 348.461 242.74 330.394 258.604 322.647C256.76 319.991 253.906 314.492 252.415 311.553C244.966 296.814 238.376 281.504 234.428 265.43C230.136 247.958 227.922 221.299 250.426 215.978Z" />
                    <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M308.212 221.621C311.231 210.181 317.323 191.396 327.281 184.583C335.095 179.237 343.442 191.269 346.14 197.492C359.576 228.482 362.743 264.235 360.667 297.659C359.74 312.59 356.616 313.908 352.113 326.101C353.044 302.623 344.102 233.122 328.228 215.794C326.595 214.01 324.511 212.365 321.994 212.254C319.474 212.144 317.304 213.604 315.577 215.298C312.929 217.895 310.757 221.427 309.141 224.738L308.559 224.403C308.056 223.583 308.205 222.631 308.212 221.621Z" />
                    <path fill="#ffffff" fillOpacity="0.92" transform="scale(0.586667 0.586667)" d="M309.141 224.738C307.062 229.074 305.753 232.905 303.966 237.339L303.678 237.527C303.706 238.008 303.763 237.793 303.533 238.179C303.617 236.995 307.638 223.476 308.212 221.621C308.205 222.631 308.205 222.631 308.559 224.403L309.141 224.738Z" />
                  </g>
                </svg>
              </div>

              <br />THOUGHTS
            </h1>
          </div>

          {/* Right Panel */}
          <div className="review-modal-right">
            {message.text && (
              <div className={`review-modal-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="touch-form">
              {/* Name */}
              <div className="touch-form-group">
                <div className="touch-label-row">
                  <label htmlFor="name">NAME</label>
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder=""
                  required
                />
              </div>

              {/* Email */}
              <div className="touch-form-group">
                <div className="touch-label-row">
                  <label htmlFor="email">EMAIL</label>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=""
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {/* Rating */}
                <div className="touch-form-group">
                  <div className="touch-label-row">
                    <label>RATING</label>
                  </div>
                  <div className="rating-select-line">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`rating-number-btn ${star === formData.rating ? 'active' : ''}`}
                        onClick={() => handleRatingChange(star)}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image upload */}
                <div className="touch-form-group">
                  <div className="touch-label-row">
                    <label htmlFor="image">IMAGE</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="image" className="touch-file-upload-btn" style={{
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: 'rgba(255,255,255,0.6)',
                      border: '1px dashed rgba(255,255,255,0.2)',
                      padding: '0.5rem 1rem',
                      borderRadius: '2px',
                      transition: 'all 0.3s ease'
                    }}>
                      {formData.imageFile ? formData.imageFile.name : 'CHOOSE IMAGE'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <div className="touch-form-group">
                <div className="touch-label-row">
                  <label htmlFor="review">REVIEW</label>
                </div>
                <textarea
                  id="review"
                  name="review"
                  value={formData.review}
                  onChange={handleChange}
                  placeholder=""
                  required
                  rows="3"
                />
              </div>

              {/* Submit Arrow Row */}
              <div className="touch-submit-row">
                <button
                  type="submit"
                  className="touch-submit-btn"
                  disabled={submitting}
                  aria-label="Submit review"
                >
                  {submitting ? (
                    <span className="submit-loading-dots">...</span>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {/* Footer Address Info */}
            <div className="touch-footer-info">
              <div className="info-block">
                <h4>YOUR VOICE MATTERS</h4>
                <p>Reviews help us create better experiences for our community.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;