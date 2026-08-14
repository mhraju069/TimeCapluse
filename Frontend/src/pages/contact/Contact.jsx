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
          <div className="heading-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
            <h1 className="contact-title" style={{ margin: 0, position: 'relative', zIndex: 2 }}>
              LET'S<br />
              GET IN<br />
              TOUCH
            </h1>
            {/* Favicon standing on the top right corner */}
            <div className="absolute top-[10px] left-[130px] sm:left-[245px] opacity-95 z-1 pointer-events-none">
              <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
                <g transform="translate(116, -10) scale(-0.38, 0.38)">
                  <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M250.426 215.978C254.209 215.749 257.494 216.131 261.027 217.554C290.766 229.535 327.845 306.278 340.481 336.176C337.767 338.066 334.364 339.863 331.429 341.854C330.769 339.556 329.908 337.322 328.856 335.175C325.838 328.968 320.5 321.036 316.579 315.337C305.035 298.886 292.986 282.794 280.449 267.086C275.024 260.192 269.656 253.203 263.933 246.562C260.503 242.582 255.246 241.916 250.699 244.435C248.241 245.781 246.457 248.091 245.775 250.809C244.889 254.348 245.995 260.379 246.736 263.959C250.437 281.836 258.441 298.866 267.343 314.693C269.813 319.083 272.572 323.153 275.083 327.467C272.099 330.012 268.222 332.873 265.084 335.393C257.301 341.523 249.761 347.953 242.478 354.67C238.26 358.615 226.721 369.582 228.019 374.798C229.859 382.19 252.883 374.653 256.927 373.553L283.682 366.209L314.935 357.581C321.002 355.902 326.954 354.214 332.983 352.4C341.257 349.91 345.275 343.441 352.112 338.683C354.085 337.311 356.059 335.775 357.835 334.168C367.373 323.861 375.541 312.163 381.661 299.512C384.836 293.23 387.319 285.521 388.402 278.603C388.918 275.308 388.488 270.156 389.839 267.33C391.256 264.367 394.866 260.281 397.013 257.651C397.704 281.707 382.882 304.84 369.615 323.952C367.704 326.705 365.618 329.31 363.421 331.841C366.908 330.393 372.08 328.666 375.878 329.546C376.86 329.774 377.79 330.294 378.22 331.258C378.803 332.569 378.409 334.269 377.942 335.55C377.057 337.981 375.469 340.095 373.906 342.125C368.612 349 361.717 354.935 353.313 357.551C348.465 359.061 343.245 358.981 338.991 362.103C334.057 365.724 330.099 375.208 326.773 380.662C323.157 386.591 305.319 414.03 299.84 416.178C299.151 416.448 298.838 416.414 298.196 416.093C296.802 412.462 305.854 394.43 307.707 390.108C312.045 379.989 315.495 369.296 323.963 361.878C319.609 363.64 315.459 364.938 311.013 366.914C287.921 377.177 263.95 390.208 238.252 391.64C234.141 391.869 228.313 390.848 224.373 389.618C217.242 387.392 207.958 383.744 204.227 376.733C202.552 373.584 202.64 369.225 203.872 366.071C210.75 348.461 242.74 330.394 258.604 322.647C256.76 319.991 253.906 314.492 252.415 311.553C244.966 296.814 238.376 281.504 234.428 265.43C230.136 247.958 227.922 221.299 250.426 215.978Z" />
                  <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M308.212 221.621C311.231 210.181 317.323 191.396 327.281 184.583C335.095 179.237 343.442 191.269 346.14 197.492C359.576 228.482 362.743 264.235 360.667 297.659C359.74 312.59 356.616 313.908 352.113 326.101C353.044 302.623 344.102 233.122 328.228 215.794C326.595 214.01 324.511 212.365 321.994 212.254C319.474 212.144 317.304 213.604 315.577 215.298C312.929 217.895 310.757 221.427 309.141 224.738L308.559 224.403C308.559 224.403 308.559 224.403 308.559 224.403L308.559 224.403Z" />
                  <path fill="#ffffff" fillOpacity="0.92" transform="scale(0.586667 0.586667)" d="M309.141 224.738C307.062 229.074 305.753 232.905 303.966 237.339L303.678 237.527C303.706 238.008 303.763 237.793 303.533 238.179C303.617 236.995 307.638 223.476 308.212 221.621C308.212 221.621 308.212 221.621 308.212 221.621L308.212 221.621Z" />
                </g>
              </svg>
            </div>
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
            <div className="premium-form-group">
              <label className="premium-form-label" htmlFor="full_name">Full Name</label>
              <span className="premium-asterisk">*</span>
              <div className="premium-input-wrap">
                <input
                  className="premium-form-input"
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="contact-form-row">
              <div className="premium-form-group half-width">
                <label className="premium-form-label" htmlFor="email">Email</label>
                <span className="premium-asterisk">*</span>
                <div className="premium-input-wrap">
                  <input
                    className="premium-form-input"
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="premium-form-group half-width">
                <label className="premium-form-label" htmlFor="phone">Phone</label>
                <span className="premium-asterisk">*</span>
                <div className="premium-input-wrap">
                  <input
                    className="premium-form-input"
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Message */}
            <div className="premium-form-group">
              <label className="premium-form-label" htmlFor="message">Message</label>
              <span className="premium-asterisk">*</span>
              <div className="premium-input-wrap">
                <textarea
                  className="premium-form-input"
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="1"
                  required
                ></textarea>
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
              <h4 className="location-name">STAY CONNECTED</h4>
              <p className="location-address">
                Have a question, idea, or just want to say hello?<br />
                We'd love to hear from you.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
