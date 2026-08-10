import { useState } from 'react';
import './contact.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Contact = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Thank you! Your message has been sent successfully.' });
        setFormData({ full_name: '', email: '', phone: '', message: '' });
      } else {
        const errorText = data.errors 
          ? Object.entries(data.errors).map(([key, val]) => `${key}: ${val}`).join(', ') 
          : 'Failed to send message. Please try again.';
        setStatusMsg({ type: 'error', text: errorText });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page-container">
      <div className="contact-content-wrapper">
        
        {/* Left Side Header */}
        <div className="contact-left-section">
          <div className="heading-wrapper">
            <h1 className="contact-title">
              LET'S
              <span className="contact-graphic">
                <span className="circle-dot"></span>
                <span className="semicircle-outline"></span>
              </span>
              <br />
              GET IN
              <br />
              TOUCH
            </h1>
          </div>
        </div>

        {/* Right Side Form & Info */}
        <div className="contact-right-section">
          <form className="contact-form" onSubmit={handleSubmit}>
            {statusMsg.text && (
              <div className={`form-status-alert ${statusMsg.type}`}>
                {statusMsg.text}
              </div>
            )}

            {/* Row 1: Full Name */}
            <div className="contact-form-group">
              <label htmlFor="full_name">Full Name</label>
              <div className="input-wrap-with-asterisk">
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
                <span className="required-asterisk">*</span>
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="contact-form-row">
              <div className="contact-form-group half-width">
                <label htmlFor="email">Email</label>
                <div className="input-wrap-with-asterisk">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <span className="required-asterisk">*</span>
                </div>
              </div>

              <div className="contact-form-group half-width">
                <label htmlFor="phone">Phone</label>
                <div className="input-wrap-with-asterisk">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  <span className="required-asterisk">*</span>
                </div>
              </div>
            </div>

            {/* Row 3: Message */}
            <div className="contact-form-group">
              <label htmlFor="message">Message</label>
              <div className="input-wrap-with-asterisk">
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="1"
                  required
                ></textarea>
                <span className="required-asterisk">*</span>
              </div>
            </div>

            {/* Submit Arrow Button */}
            <div className="form-submit-wrapper">
              <button 
                type="submit" 
                className="contact-submit-btn" 
                disabled={loading}
                aria-label="Send message"
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Footer Locations */}
          <div className="contact-locations-footer">
            <div className="location-card">
              <h4 className="location-name">Leduc</h4>
              <p className="location-address">
                100, 5306-50 St<br />
                Leduc, AB T9E 6Z6<br />
                780.986.8946
              </p>
            </div>
            <div className="location-card">
              <h4 className="location-name">Spruce Grove</h4>
              <p className="location-address">
                203 Church Road | P.O. Box 3038<br />
                Spruce Grove, AB T7X 3A4<br />
                780.962.3311
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
