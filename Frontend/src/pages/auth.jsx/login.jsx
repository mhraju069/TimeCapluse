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
                        justifyContent: "space-between",
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

                        {/* Geometric Butterfly Icon */}
                        <div style={{ position: 'relative', width: '100px', height: '100px', marginTop: '10px', opacity: 0.95 }}>
                            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                                <g transform="translate(-16, -10) scale(0.48)">
                                    <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M250.426 215.978C254.209 215.749 257.494 216.131 261.027 217.554C290.766 229.535 327.845 306.278 340.481 336.176C337.767 338.066 334.364 339.863 331.429 341.854C330.769 339.556 329.908 337.322 328.856 335.175C325.838 328.968 320.5 321.036 316.579 315.337C305.035 298.886 292.986 282.794 280.449 267.086C275.024 260.192 269.656 253.203 263.933 246.562C260.503 242.582 255.246 241.916 250.699 244.435C248.241 245.781 246.457 248.091 245.775 250.809C244.889 254.348 245.995 260.379 246.736 263.959C250.437 281.836 258.441 298.866 267.343 314.693C269.813 319.083 272.572 323.153 275.083 327.467C272.099 330.012 268.222 332.873 265.084 335.393C257.301 341.523 249.761 347.953 242.478 354.67C238.26 358.615 226.721 369.582 228.019 374.798C229.859 382.19 252.883 374.653 256.927 373.553L283.682 366.209L314.935 357.581C321.002 355.902 326.954 354.214 332.983 352.4C341.257 349.91 345.275 343.441 352.112 338.683C354.085 337.311 356.059 335.775 357.835 334.168C367.373 323.861 375.541 312.163 381.661 299.512C384.836 293.23 387.319 285.521 388.402 278.603C388.918 275.308 388.488 270.156 389.839 267.33C391.256 264.367 394.866 260.281 397.013 257.651C397.704 281.707 382.882 304.84 369.615 323.952C367.704 326.705 365.618 329.31 363.421 331.841C366.908 330.393 372.08 328.666 375.878 329.546C376.86 329.774 377.79 330.294 378.22 331.258C378.803 332.569 378.409 334.269 377.942 335.55C377.057 337.981 375.469 340.095 373.906 342.125C368.612 349 361.717 354.935 353.313 357.551C348.465 359.061 343.245 358.981 338.991 362.103C334.057 365.724 330.099 375.208 326.773 380.662C323.157 386.591 305.319 414.03 299.84 416.178C299.151 416.448 298.838 416.414 298.196 416.093C296.802 412.462 305.854 394.43 307.707 390.108C312.045 379.989 315.495 369.296 323.963 361.878C319.609 363.64 315.459 364.938 311.013 366.914C287.921 377.177 263.95 390.208 238.252 391.64C234.141 391.869 228.313 390.848 224.373 389.618C217.242 387.392 207.958 383.744 204.227 376.733C202.552 373.584 202.64 369.225 203.872 366.071C210.75 348.461 242.74 330.394 258.604 322.647C256.76 319.991 253.906 314.492 252.415 311.553C244.966 296.814 238.376 281.504 234.428 265.43C230.136 247.958 227.922 221.299 250.426 215.978Z"/>
                                    <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M308.212 221.621C311.231 210.181 317.323 191.396 327.281 184.583C335.095 179.237 343.442 191.269 346.14 197.492C359.576 228.482 362.743 264.235 360.667 297.659C359.74 312.59 356.616 313.908 352.113 326.101C353.044 302.623 344.102 233.122 328.228 215.794C326.595 214.01 324.511 212.365 321.994 212.254C319.474 212.144 317.304 213.604 315.577 215.298C312.929 217.895 310.757 221.427 309.141 224.738L308.559 224.403C308.056 223.583 308.205 222.631 308.212 221.621Z"/>
                                    <path fill="#ffffff" fillOpacity="0.92" transform="scale(0.586667 0.586667)" d="M309.141 224.738C307.062 229.074 305.753 232.905 303.966 237.339L303.678 237.527C303.706 238.008 303.763 237.793 303.533 238.179C303.617 236.995 307.638 223.476 308.212 221.621C308.205 222.631 308.056 223.583 308.559 224.403L309.141 224.738Z"/>
                                </g>
                            </svg>
                        </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div style={{ display: "flex", gap: "40px", color: "#ffffff", textAlign: "left" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.9 }}>Archiving</span>
                            <span style={{ fontSize: "0.75rem", opacity: 0.5, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                                Secure Credentials<br />
                                Permanent Records<br />
                                Direct Navigation
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
                            <label className="premium-form-label" htmlFor="provider">Complete Authentication *</label>
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