"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const GoogleLogin = () => {
    const router = useRouter();
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
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '448578986925-1f6mkqnh46hgannikqtrkbq92921b6vb.apps.googleusercontent.com';
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
                border: "none",
                overflow: "hidden"
            }}
        >
            <div className="auth-container">
                {/* LEFT PANEL — Visuals & Typography */}
                <div className="auth-left">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', }}>
                        {/* Giant Serif Typography */}
                        <h1 style={{
                            fontFamily: "var(--font-main)",
                            fontSize: "4rem",
                            fontWeight: 400,
                            lineHeight: 1.05,
                            color: "#ffffff",
                            textTransform: "uppercase",
                            margin: 0,
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
                <div className="auth-right">
                    {error && (
                        <div style={{
                            background: "rgba(255, 255, 255, 0.1)",
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
                                    width: "100%",
                                    border: "none",
                                    color: "#ffffff",
                                    fontSize: "2.3rem",
                                    textAlign: "left",
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
          .auth-container {
              width: 100%;
              max-width: 1000px;
              height: 80vh;
              max-height: 600px;
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border-radius: 40px;
              display: flex;
              transition: height 0.3s ease;
          }
          .auth-left {
              flex: 0 0 45%;
              padding: 60px 48px;
              display: flex;
              flex-direction: column;
              justify-content: space-evenly;
              border-right: 1px solid rgba(255,255,255,0.06);
              background: #000000;
          }
          .auth-right {
              flex: 1;
              padding: 60px 48px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              background: #000000;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          @media (max-width: 768px) {
             .auth-container {
                 flex-direction: column !important;
                 height: auto !important;
                 max-height: none !important;
                 border-radius: 24px !important;
                 margin: 20px 0;
             }
            .auth-left h1{
                font-weight:600;
                font-size:3.3rem;
            }
             .auth-left {
                 flex: 1 1 auto !important;
                 border-right: none !important;
                 border-bottom: 1px solid rgba(255,255,255,0.06) !important;
                 padding: 40px 24px !important;
             }
            .auth-right {
                 padding: 40px 24px !important;
            }
          }
        `}
            </style>
        </div>
    );
};

export default GoogleLogin;
