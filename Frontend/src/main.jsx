import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Global Client-side Rate Limiting & Ngrok Bypass Interceptor
const RATE_LIMIT = parseInt(import.meta.env.VITE_RATE_LIMIT_PER_MIN || '50', 10);
const requestTimestamps = [];

const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  const url = typeof input === 'string' ? input : (input?.url || '');
  
  // Ensure init and headers are set up
  init = init || {};
  let headers = init.headers || {};
  
  // Automatically inject the ngrok bypass header to prevent interstitial warning pages
  if (headers instanceof Headers) {
    headers.set('ngrok-skip-browser-warning', 'true');
  } else if (Array.isArray(headers)) {
    if (!headers.some(h => h[0].toLowerCase() === 'ngrok-skip-browser-warning')) {
      headers.push(['ngrok-skip-browser-warning', 'true']);
    }
  } else {
    headers['ngrok-skip-browser-warning'] = 'true';
  }
  init.headers = headers;

  // Track and limit only API and token endpoint calls
  if (url.includes('/api/') || url.includes('/token/')) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clear timestamps older than 1 minute
    while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
      requestTimestamps.shift();
    }
    
    if (requestTimestamps.length >= RATE_LIMIT) {
      console.warn(`[Client Rate Limit] Request blocked. Limit of ${RATE_LIMIT} requests/min reached.`);
      alert(`Too Many Requests: Client-side rate limit of ${RATE_LIMIT} requests per minute reached. Please wait before trying again.`);
      
      return new Response(
        JSON.stringify({ detail: `Request limit of ${RATE_LIMIT} per minute exceeded (Client-side).` }),
        {
          status: 429,
          statusText: 'Too Many Requests',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    requestTimestamps.push(now);
  }
  
  return originalFetch.call(this, input, init);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
