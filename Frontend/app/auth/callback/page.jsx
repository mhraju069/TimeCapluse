"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AUTH_ENDPOINT = '/auth/api/v1/login/';

// Headers needed for ngrok and Django API
const getApiHeaders = (token = null) => {
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const AuthCallback = () => {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Extract access token from URL hash
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const accessToken = params.get('access_token');
                const error = params.get('error');

                // If in popup, process and close immediately
                if (window.opener) {
                    if (error) {
                        console.error('OAuth error:', error);
                        window.opener.postMessage({ type: 'LOGIN_ERROR', error: 'Authentication was denied' }, window.location.origin);
                        setTimeout(() => window.close(), 100);
                        return;
                    }

                    if (!accessToken) {
                        console.error('No access token found');
                        window.opener.postMessage({ type: 'LOGIN_ERROR', error: 'No access token received' }, window.location.origin);
                        setTimeout(() => window.close(), 100);
                        return;
                    }

                    try {
                        // Send access token to backend
                        const res = await fetch(`${API_BASE_URL}${AUTH_ENDPOINT}`, {
                            method: 'POST',
                            headers: getApiHeaders(),
                            body: JSON.stringify({ access: accessToken }),
                        });

                        const data = await res.json();

                        if (res.ok) {
                            // Store tokens in localStorage
                            localStorage.setItem('access_token', data.access);
                            localStorage.setItem('refresh_token', data.refresh);
                            localStorage.setItem('user', JSON.stringify(data.user));

                            // Dispatch custom event for same-window listeners
                            window.dispatchEvent(new Event('loginSuccess'));

                            // Notify parent window and close
                            window.opener.postMessage({ type: 'LOGIN_SUCCESS' }, window.location.origin);
                            setTimeout(() => window.close(), 100);
                        } else {
                            const errorMsg = data.error || data.detail || 'Login failed';
                            console.error('Login failed:', errorMsg);
                            window.opener.postMessage({ type: 'LOGIN_ERROR', error: errorMsg }, window.location.origin);
                            setTimeout(() => window.close(), 100);
                        }
                    } catch (fetchError) {
                        console.error('=== FETCH ERROR ===', fetchError);
                        let errorMsg = 'Cannot connect to server. ';
                        if (fetchError.message.includes('Failed to fetch')) {
                            errorMsg += 'Network error - check if backend is running and accessible.';
                        } else {
                            errorMsg += fetchError.message;
                        }

                        window.opener.postMessage({ type: 'LOGIN_ERROR', error: errorMsg }, window.location.origin);
                        setTimeout(() => window.close(), 100);
                    }
                } else {
                    // If not in popup, redirect to capsule
                    window.location.href = '/capsule';
                }
            } catch (err) {
                console.error("Callback error:", err);
                const errorMessage = err.message || 'Failed to complete authentication';
                if (window.opener) {
                    window.opener.postMessage({ type: 'LOGIN_ERROR', error: errorMessage }, window.location.origin);
                    setTimeout(() => window.close(), 100);
                } else {
                    window.location.href = '/auth';
                }
            }
        };

        handleCallback();
    }, []);

    // Don't render anything if in popup - just process and close
    if (typeof window !== 'undefined' && window.opener) {
        return null;
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #000000 0%, #000000 100%)",
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    color: "#ffffff",
                }}
            >
                <div
                    style={{
                        width: "40px",
                        height: "40px",
                        border: "3px solid rgba(255, 255, 255, 0.2)",
                        borderTopColor: "#ffffff",
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
