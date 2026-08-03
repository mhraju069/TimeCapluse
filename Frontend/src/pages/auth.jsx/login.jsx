import { useState } from "react";
import { useNavigate } from "react-router-dom";

const GoogleLogin = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = () => {
        setIsLoading(true);
        // Simulate Google login flow
        setTimeout(() => {
            setIsLoading(false);
            // Redirect or handle login logic here
            alert("Google login successful! (demo)");
        }, 1500);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(ellipse at 20% 50%, #1a0b2e 0%, #0a0a0a 100%)",
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Animated background particles */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "50%",
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${Math.random() * 20 + 10}s infinite ease-in-out ${Math.random() * 5}s`,
                        }}
                    />
                ))}
            </div>

            {/* Glow orbs */}
            <div
                style={{
                    position: "absolute",
                    top: "-20%",
                    right: "-10%",
                    width: "500px",
                    height: "500px",
                    background: "radial-gradient(circle, rgba(100,80,255,0.15) 0%, transparent 70%)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "-20%",
                    left: "-10%",
                    width: "500px",
                    height: "500px",
                    background: "radial-gradient(circle, rgba(255,80,150,0.1) 0%, transparent 70%)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                }}
            />

            {/* Main Card */}
            <div
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    padding: "48px 40px",
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "32px",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
                    position: "relative",
                    zIndex: 10,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)";
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
                            background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
                            border: "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "32px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                        }}
                    >
                        ✦
                    </div>
                </div>

                {/* Title */}
                <h1
                    style={{
                        color: "#fff",
                        fontSize: "2rem",
                        fontWeight: 700,
                        textAlign: "center",
                        margin: "0 0 8px 0",
                        letterSpacing: "-0.02em",
                    }}
                >
                    Welcome Back
                </h1>
                <p
                    style={{
                        color: "rgba(255,255,255,0.4)",
                        textAlign: "center",
                        fontSize: "0.95rem",
                        margin: "0 0 36px 0",
                    }}
                >
                    Sign in to continue to your capsules
                </p>

                {/* Google Login Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    style={{
                        width: "100%",
                        padding: "16px 24px",
                        background: "rgba(255,255,255,0.95)",
                        border: "none",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 4px 20px rgba(255,255,255,0.15)",
                        opacity: isLoading ? 0.6 : 1,
                        position: "relative",
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.transform = "scale(1.02)";
                            e.currentTarget.style.boxShadow = "0 8px 32px rgba(255,255,255,0.25)";
                            e.currentTarget.style.background = "#ffffff";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,255,255,0.15)";
                            e.currentTarget.style.background = "rgba(255,255,255,0.95)";
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
                            color: "#1a1a1a",
                            fontSize: "1rem",
                            fontWeight: 600,
                            letterSpacing: "0.01em",
                        }}
                    >
                        {isLoading ? "Signing in..." : "Continue with Google"}
                    </span>

                    {isLoading && (
                        <div
                            style={{
                                width: "20px",
                                height: "20px",
                                border: "2px solid rgba(0,0,0,0.1)",
                                borderTopColor: "#1a1a1a",
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
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.06em" }}>
                        SECURE
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                </div>

                {/* Features */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "24px",
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.25)",
                        letterSpacing: "0.02em",
                    }}
                >
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>●</span>
                        Encrypted
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>●</span>
                        Private
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>●</span>
                        Decentralized
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
                    color: "rgba(255,255,255,0.15)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.04em",
                    zIndex: 10,
                }}
            >
                <span>✦ Preserving memories on the blockchain</span>
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