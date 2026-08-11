import React, { useEffect } from 'react';
import './NotFound.css';

const NotFound = () => {
  useEffect(() => {
    // Inject Google Fonts if not already loaded
    const fontId = 'google-font-playfair-inter';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="notfound-page">
      {/* Favicon in Top Right */}
      <a href="/" className="notfound-favicon-link">
        <img src="/favicon.svg" alt="Relic Logo" className="notfound-favicon" />
      </a>

      {/* Main Content */}
      <div className="notfound-content-wrapper">
        <div className="giant-404-container">
          <div className="digit-row">
            <span className="digit">4</span>
            <span className="digit digit-center">0</span>
            <span className="digit">4</span>
          </div>

          {/* Centered Message inside the "0" */}
          <div className="message-overlay">
            <h2 className="message-title">Page Not Available</h2>
            <p className="message-desc">
              Sorry, this page isn't available anymore or an error occurred.
            </p>
            <button onClick={handleGoBack} className="notfound-back-btn">
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
