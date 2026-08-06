import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Extract access token from URL hash
                const hash = location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const accessToken = params.get('access_token');
                const error = params.get('error');

                if (error) {
                    console.error('OAuth error:', error);
                    navigate('/login', { 
                        state: { error: 'Authentication was denied or failed.' }
                    });
                    return;
                }

                if (!accessToken) {
                    console.error('No access token found');
                    navigate('/login', { 
                        state: { error: 'No access token received from Google.' }
                    });
                    return;
                }

                // Send access token to backend
                const res = await fetch(`${API_BASE_URL}/auth/login/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ access: accessToken }),
                });

                const data = await res.json();

                if (res.ok) {
                    // Store tokens
                    localStorage.setItem('access_token', data.access);
                    localStorage.setItem('refresh_token', data.refresh);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Redirect to home
                    navigate('/');
                } else {
                    console.error('Backend error:', data);
                    navigate('/login', { 
                        state: { error: data.error || 'Login failed' }
                    });
                }
            } catch (err) {
                console.error("Callback error:", err);
                navigate('/login', { 
                    state: { error: 'Failed to complete authentication.' }
                });
            }
        };

        handleCallback();
    }, [location, navigate]);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #07070b 0%, #14121b 100%)",
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    color: "#d4a574",
                }}
            >
                <div
                    style={{
                        width: "40px",
                        height: "40px",
                        border: "3px solid rgba(212, 165, 116, 0.2)",
                        borderTopColor: "#d4a574",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                        margin: "0 auto 20px auto",
                    }}
                />
                <p
                    style={{
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        fontSize: "1.1rem",
                        color: "rgba(245, 240, 232, 0.7)",
                    }}
                >
                    Completing authentication...
                </p>
            </div>

            <style>
                {`
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

export default AuthCallback;