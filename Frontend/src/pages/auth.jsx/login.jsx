import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const GoogleLogin = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Load Google API client
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");

        try {
            // Google OAuth 2.0 configuration
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
            const redirectUri = `${window.location.origin}/auth/callback`;

            // Generate random state for CSRF protection
            const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('google_oauth_state', state);

            // Request scopes for user info
            const scope = 'openid profile email https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.phonenumbers.read';

            // Build Google OAuth URL
            const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            googleAuthUrl.searchParams.append('client_id', clientId);
            googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
            googleAuthUrl.searchParams.append('response_type', 'token');
            googleAuthUrl.searchParams.append('scope', scope);
            googleAuthUrl.searchParams.append('state', state);
            googleAuthUrl.searchParams.append('include_granted_scopes', 'true');

            // Open popup
            const width = 500;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const popup = window.open(
                googleAuthUrl.toString(),
                'Google Login',
                `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );

            if (!popup) {
                throw new Error('Popup blocked. Please allow popups for this site.');
            }

            // Listen for messages from popup
            const messageHandler = (event) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'LOGIN_SUCCESS') {
                    // Store tokens from localStorage (already stored in callback)
                    const token = localStorage.getItem('access_token');
                    const userData = localStorage.getItem('user');

                    if (token && userData) {
                        // Redirect to capsule page
                        window.location.href = '/capsule';
                    }

                    clearInterval(checkInterval);
                    window.removeEventListener('message', messageHandler);
                } else if (event.data.type === 'LOGIN_ERROR') {
                    setError(event.data.error || 'Login failed');
                    clearInterval(checkInterval);
                    window.removeEventListener('message', messageHandler);
                    setIsLoading(false);
                }
            };

            window.addEventListener('message', messageHandler);

            // Listen for the popup to close
            const checkInterval = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkInterval);
                    window.removeEventListener('message', messageHandler);
                    setIsLoading(false);
                }
            }, 500);

        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "Failed to initiate login. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #000000 0%, #000000 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "1000px",
                    height: "80vh",
                    maxHeight: "600px",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderRadius: "40px",
                    display: "flex",
                    overflow: "hidden",
                    transition: "height 0.3s ease",
                }}
            >
                {/* LEFT PANEL — Visuals & Typography */}
                <div
                    style={{
                        flex: "0 0 45%",
                        padding: "60px 48px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-evenly",
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                        background: "#000000",
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {/* Giant Serif Typography */}
                        <h1 style={{
                            fontFamily: "'Playfair Display', 'Georgia', serif",
                            fontSize: "4rem",
                            fontWeight: 400,
                            lineHeight: 1.05,
                            color: "#ffffff",
                            textTransform: "uppercase",
                            margin: 0
                        }}>
                            Let's<br />
                            Preserve<br />
                            Stories
                        </h1>
                    </div>

                    {/* Bottom Metadata */}
                    <div style={{ display: "flex", gap: "40px", color: "#ffffff", textAlign: "left" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.9 }}>Archiving</span>
                            <span style={{ fontSize: "0.75rem", opacity: 0.5, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                                Name, Image and<br />
                                Secure Credentials<br />
                                <br />
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL — Form */}
                <div
                    style={{
                        flex: 1,
                        padding: "60px 48px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        background: "#000000",
                    }}
                >
                    {error && (
                        <div style={{
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                            borderRadius: "12px",
                            padding: "12px 16px",
                            marginBottom: "20px",
                            color: "#ffffff",
                            fontSize: "0.9rem",
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                        <div className="premium-form-group">
                            <label className="premium-form-label" htmlFor="provider">Complete the authentication *</label>
                        </div>

                        {/* Submit Arrow Button */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#ffffff",
                                    fontSize: "2rem",
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    transition: "transform 0.3s ease",
                                    opacity: isLoading ? 0.5 : 1,
                                    padding: 0,
                                    lineHeight: 1
                                }}
                                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = "translateX(8px)")}
                                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.transform = "translateX(0)")}
                            >
                                {isLoading ? "Connecting to Google..." : "Continue with Google →"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Keyframes for animations */}
            <style>
                {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          @media (max-width: 768px) {
             div[style*="max-width: 1000px"] {
                 flex-direction: column !important;
                 height: auto !important;
                 max-height: none !important;
             }
             div[style*="flex: 0 0 45%"] {
                 flex: 1 1 auto !important;
                 border-right: none !important;
                 border-bottom: 1px solid rgba(255,255,255,0.06) !important;
                 padding: 40px 24px !important;
             }
             div[style*="padding: 60px 48px"] {
                 padding: 40px 24px !important;
             }
          }
        `}
            </style>
        </div>
    );
};

export default GoogleLogin;