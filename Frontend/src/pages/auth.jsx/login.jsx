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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #07070b 0%, #14121b 100%)",
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                position: "relative",
                overflow: "hidden",
                padding: "20px",
            }}
        >
            {/* Subtle background pattern */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(circle at 20% 50%, rgba(212, 165, 116, 0.03) 0%, transparent 50%)",
                    pointerEvents: "none",
                }}
            />

            {/* Main Card */}
            <div
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    padding: "48px 40px",
                    background: "rgba(0, 0, 0, 0.3)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(212, 165, 116, 0.15)",
                    borderRadius: "32px",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212, 165, 116, 0.1)",
                    position: "relative",
                    zIndex: 10,
                }}
            >
                {/* Logo/Icon */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "24px",
                    }}
                >
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, rgba(212, 165, 116, 0.15), rgba(212, 165, 116, 0.05))",
                            border: "1px solid rgba(212, 165, 116, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "32px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                            color: "#d4a574",
                            fontFamily: "'Georgia', serif",
                        }}
                    >
                        ✦
                    </div>
                </div>

                {/* Title */}
                <h1
                    style={{
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        color: "#f5f0e8",
                        fontSize: "2.4rem",
                        fontWeight: 400,
                        textAlign: "center",
                        margin: "0 0 8px 0",
                        letterSpacing: "-0.02em",
                    }}
                >
                    Welcome
                </h1>
                <p
                    style={{
                        color: "rgba(245, 240, 232, 0.5)",
                        textAlign: "center",
                        fontSize: "0.95rem",
                        margin: "0 0 36px 0",
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        fontStyle: "italic",
                    }}
                >
                    Sign in to preserve your story
                </p>

                {/* Error Message */}
                {error && (
                    <div
                        style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "12px",
                            padding: "12px 16px",
                            marginBottom: "20px",
                            color: "#ef4444",
                            fontSize: "0.9rem",
                            textAlign: "center",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Google Login Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    style={{
                        width: "100%",
                        padding: "16px 24px",
                        background: "rgba(212, 165, 116, 0.1)",
                        border: "1px solid rgba(212, 165, 116, 0.3)",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 20px rgba(212, 165, 116, 0.2)",
                        opacity: isLoading ? 0.6 : 1,
                        position: "relative",
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 32px rgba(212, 165, 116, 0.35)";
                            e.currentTarget.style.background = "rgba(212, 165, 116, 0.15)";
                            e.currentTarget.style.borderColor = "rgba(212, 165, 116, 0.5)";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 20px rgba(212, 165, 116, 0.2)";
                            e.currentTarget.style.background = "rgba(212, 165, 116, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(212, 165, 116, 0.3)";
                        }
                    }}
                >
                    {/* Google Icon */}
                    <svg width="20" height="20" viewBox="0 0 48 48">
                        <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                    </svg>

                    <span
                        style={{
                            color: "#f5f0e8",
                            fontSize: "1rem",
                            fontWeight: 600,
                            letterSpacing: "0.01em",
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                        }}
                    >
                        {isLoading ? "Signing in..." : "Continue with Google"}
                    </span>

                    {isLoading && (
                        <div
                            style={{
                                width: "20px",
                                height: "20px",
                                border: "2px solid rgba(212, 165, 116, 0.2)",
                                borderTopColor: "#d4a574",
                                borderRadius: "50%",
                                animation: "spin 0.6s linear infinite",
                                position: "absolute",
                                right: "20px",
                            }}
                        />
                    )}
                </button>

                {/* Divider */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        margin: "28px 0 20px 0",
                    }}
                >
                    <div style={{ flex: 1, height: "1px", background: "rgba(212, 165, 116, 0.15)" }} />
                    <span style={{ color: "rgba(212, 165, 116, 0.4)", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.1em" }}>
                        CURATED AUTHENTICATION
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "rgba(212, 165, 116, 0.15)" }} />
                </div>

                {/* Features */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "24px",
                        fontSize: "0.75rem",
                        color: "rgba(212, 165, 116, 0.4)",
                        letterSpacing: "0.02em",
                    }}
                >
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "rgba(212, 165, 116, 0.3)" }}>✦</span>
                        Encrypted
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "rgba(212, 165, 116, 0.3)" }}>✦</span>
                        Private
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "rgba(212, 165, 116, 0.3)" }}>✦</span>
                        Secure
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    position: "absolute",
                    bottom: "24px",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    color: "rgba(212, 165, 116, 0.3)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.04em",
                    zIndex: 10,
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontStyle: "italic",
                }}
            >
                <span>✦ Preserving memories for future generations</span>
            </div>

            {/* Keyframes for animations */}
            <style>
                {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-30px) scale(1.5);
              opacity: 0.6;
            }
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
            </style>
        </div>
    );
};

export default GoogleLogin;