import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Mint = () => {
    const navigate = useNavigate();
    const [existingCapsule, setExistingCapsule] = useState(null);
    const [checkingCapsule, setCheckingCapsule] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        dob: "",
        location: "",
        is_public: true,
    });
    const [coverImage, setCoverImage] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [profileFile, setProfileFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const checkUserCapsule = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                navigate("/auth");
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/capsules/mine/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "ngrok-skip-browser-warning": "true",
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.has_capsule && data.capsule) {
                        setExistingCapsule(data.capsule);
                    }
                }
            } catch (err) {
                console.error("Error checking user capsule status:", err);
            } finally {
                setCheckingCapsule(false);
            }
        };

        checkUserCapsule();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (type === "cover") {
                setCoverImage(event.target.result);
                setCoverFile(file);
            } else {
                setProfileImage(event.target.result);
                setProfileFile(file);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!profileFile || !coverFile) {
            setError("Please upload both profile and cover images");
            return;
        }

        setLoading(true);

        try {
            // Get auth token from localStorage
            const token = localStorage.getItem("access_token");
            if (!token) {
                navigate("/auth");
                setLoading(false);
                return;
            }

            // Create FormData for multipart upload
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name);
            formDataToSend.append("bio", formData.bio);
            formDataToSend.append("location", formData.location || "");
            formDataToSend.append("dob", formData.dob || "2025-01-01");
            formDataToSend.append("is_public", formData.is_public ? "true" : "false");
            formDataToSend.append("profile", profileFile);
            formDataToSend.append("cover", coverFile);

            console.log("Sending request to create capsule...");

            const response = await fetch(`${API_BASE_URL}/api/capsules/create/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error response:", errorData);
                throw new Error(errorData.errors?.message || errorData.errors?.detail || errorData.errors?.non_field_errors?.[0] || "Failed to create capsule");
            }

            const data = await response.json();
            console.log("Capsule created:", data);
            alert("Capsule minted successfully! ✦");

            // Redirect to dashboard
            navigate("/dashboard");


        } catch (err) {
            console.error("Error creating capsule:", err);
            setError(err.message || "Failed to create capsule. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingCapsule) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #000000 0%, #000000 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontFamily: "'Inter', sans-serif"
            }}>
                <div style={{ textAlign: "center" }}>
                    <div className="loading-spinner" style={{ margin: "0 auto 16px" }} />
                    <p style={{ color: "rgba(255,255,255,0.6)" }}>Checking capsule status...</p>
                </div>
            </div>
        );
    }

    if (existingCapsule) {
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
                        maxWidth: "1280px",
                        height: "90vh",
                        maxHeight: "900px",
                        background: "#000000",
                        borderRadius: "40px",
                        display: "flex",
                        overflow: "hidden",
                    }}
                >
                    {/* LEFT PANEL */}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            <h1 style={{
                                fontFamily: "'Playfair Display', 'Georgia', serif",
                                fontSize: "4.5rem",
                                fontWeight: 400,
                                lineHeight: 1.05,
                                color: "#ffffff",
                                textTransform: "uppercase",
                                margin: 0
                            }}>
                                Already<br />
                                Preserved
                            </h1>
                            {/* Geometric Butterfly Icon */}
                            <div style={{ position: 'relative', width: '120px', height: '120px', marginTop: '10px', opacity: 0.95 }}>
                                <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                                    <g transform="translate(-16, -10) scale(0.48)">
                                        <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M250.426 215.978C254.209 215.749 257.494 216.131 261.027 217.554C290.766 229.535 327.845 306.278 340.481 336.176C337.767 338.066 334.364 339.863 331.429 341.854C330.769 339.556 329.908 337.322 328.856 335.175C325.838 328.968 320.5 321.036 316.579 315.337C305.035 298.886 292.986 282.794 280.449 267.086C275.024 260.192 269.656 253.203 263.933 246.562C260.503 242.582 255.246 241.916 250.699 244.435C248.241 245.781 246.457 248.091 245.775 250.809C244.889 254.348 245.995 260.379 246.736 263.959C250.437 281.836 258.441 298.866 267.343 314.693C269.813 319.083 272.572 323.153 275.083 327.467C272.099 330.012 268.222 332.873 265.084 335.393C257.301 341.523 249.761 347.953 242.478 354.67C238.26 358.615 226.721 369.582 228.019 374.798C229.859 382.19 252.883 374.653 256.927 373.553L283.682 366.209L314.935 357.581C321.002 355.902 326.954 354.214 332.983 352.4C341.257 349.91 345.275 343.441 352.112 338.683C354.085 337.311 356.059 335.775 357.835 334.168C367.373 323.861 375.541 312.163 381.661 299.512C384.836 293.23 387.319 285.521 388.402 278.603C388.918 275.308 388.488 270.156 389.839 267.33C391.256 264.367 394.866 260.281 397.013 257.651C397.704 281.707 382.882 304.84 369.615 323.952C367.704 326.705 365.618 329.31 363.421 331.841C366.908 330.393 372.08 328.666 375.878 329.546C376.86 329.774 377.79 330.294 378.22 331.258C378.803 332.569 378.409 334.269 377.942 335.55C377.057 337.981 375.469 340.095 373.906 342.125C368.612 349 361.717 354.935 353.313 357.551C348.465 359.061 343.245 358.981 338.991 362.103C334.057 365.724 330.099 375.208 326.773 380.662C323.157 386.591 305.319 414.03 299.84 416.178C299.151 416.448 298.838 416.414 298.196 416.093C296.802 412.462 305.854 394.43 307.707 390.108C312.045 379.989 315.495 369.296 323.963 361.878C319.609 363.64 315.459 364.938 311.013 366.914C287.921 377.177 263.95 390.208 238.252 391.64C234.141 391.869 228.313 390.848 224.373 389.618C217.242 387.392 207.958 383.744 204.227 376.733C202.552 373.584 202.64 369.225 203.872 366.071C210.75 348.461 242.74 330.394 258.604 322.647C256.76 319.991 253.906 314.492 252.415 311.553C244.966 296.814 238.376 281.504 234.428 265.43C230.136 247.958 227.922 221.299 250.426 215.978Z" />
                                        <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M308.212 221.621C311.231 210.181 317.323 191.396 327.281 184.583C335.095 179.237 343.442 191.269 346.14 197.492C359.576 228.482 362.743 264.235 360.667 297.659C359.74 312.59 356.616 313.908 352.113 326.101C353.044 302.623 344.102 233.122 328.228 215.794C326.595 214.01 324.511 212.365 321.994 212.254C319.474 212.144 317.304 213.604 315.577 215.298C312.929 217.895 310.757 221.427 309.141 224.738L308.559 224.403C308.056 223.583 308.205 222.631 308.212 221.621Z" />
                                        <path fill="#ffffff" fillOpacity="0.92" transform="scale(0.586667 0.586667)" d="M309.141 224.738C307.062 229.074 305.753 232.905 303.966 237.339L303.678 237.527C303.706 238.008 303.763 237.793 303.533 238.179C303.617 236.995 307.638 223.476 308.212 221.621C308.205 222.631 308.056 223.583 308.559 224.403L309.141 224.738Z" />
                                    </g>
                                </svg>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "40px", color: "#ffffff", textAlign: "left" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.9 }}>Status</span>
                                <span style={{ fontSize: "0.75rem", opacity: 0.5, lineHeight: 1.5 }}>
                                    Time Capsule Created<br />
                                    Security Verified<br />
                                    Metadata Confirmed
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
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
                        <div /> {/* Spacer */}

                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <h2 style={{
                                color: "#ffffff",
                                fontSize: "2rem",
                                fontWeight: 500,
                                letterSpacing: "-0.5px",
                                margin: 0
                            }}>
                                You have already created a capsule.
                            </h2>
                            <p style={{
                                color: "rgba(255,255,255,0.6)",
                                fontSize: "1rem",
                                lineHeight: 1.6,
                                margin: 0,
                                maxWidth: "420px"
                            }}>
                                Your digital identity is already recorded and now you can preserve your memories on the timeline.
                            </p>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => navigate("/dashboard")}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#ffffff",
                                    fontSize: "2.5rem",
                                    cursor: "pointer",
                                    transition: "transform 0.3s ease",
                                    padding: 0,
                                    lineHeight: 1,
                                    paddingRight: "10%"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateX(8px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                    maxWidth: "90vw",
                    height: "90vh",
                    maxHeight: "900px",
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
                    className="mint-left"
                    style={{
                        flex: "0 0 40%",
                        padding: "60px 48px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                        borderRight: "1px solid rgba(245, 0, 0, 0.06)",
                        background: "#000000",
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {/* Giant Serif Typography */}
                        <h1 style={{
                            fontFamily: "'Playfair Display', 'Georgia', serif",
                            fontSize: "4.5rem",
                            fontWeight: 400,
                            lineHeight: 1.05,
                            color: "#ffffff",
                            textTransform: "uppercase",
                            margin: 0
                        }}>
                            Mint<br />
                            Your<br />
                            Capsule
                        </h1>

                        {/* Geometric Butterfly Icon */}
                        <div style={{ position: 'relative', width: '120px', height: '120px', marginTop: '10px', opacity: 0.95 }}>
                            <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                                <g transform="translate(-16, -10) scale(0.48)">
                                    <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M250.426 215.978C254.209 215.749 257.494 216.131 261.027 217.554C290.766 229.535 327.845 306.278 340.481 336.176C337.767 338.066 334.364 339.863 331.429 341.854C330.769 339.556 329.908 337.322 328.856 335.175C325.838 328.968 320.5 321.036 316.579 315.337C305.035 298.886 292.986 282.794 280.449 267.086C275.024 260.192 269.656 253.203 263.933 246.562C260.503 242.582 255.246 241.916 250.699 244.435C248.241 245.781 246.457 248.091 245.775 250.809C244.889 254.348 245.995 260.379 246.736 263.959C250.437 281.836 258.441 298.866 267.343 314.693C269.813 319.083 272.572 323.153 275.083 327.467C272.099 330.012 268.222 332.873 265.084 335.393C257.301 341.523 249.761 347.953 242.478 354.67C238.26 358.615 226.721 369.582 228.019 374.798C229.859 382.19 252.883 374.653 256.927 373.553L283.682 366.209L314.935 357.581C321.002 355.902 326.954 354.214 332.983 352.4C341.257 349.91 345.275 343.441 352.112 338.683C354.085 337.311 356.059 335.775 357.835 334.168C367.373 323.861 375.541 312.163 381.661 299.512C384.836 293.23 387.319 285.521 388.402 278.603C388.918 275.308 388.488 270.156 389.839 267.33C391.256 264.367 394.866 260.281 397.013 257.651C397.704 281.707 382.882 304.84 369.615 323.952C367.704 326.705 365.618 329.31 363.421 331.841C366.908 330.393 372.08 328.666 375.878 329.546C376.86 329.774 377.79 330.294 378.22 331.258C378.803 332.569 378.409 334.269 377.942 335.55C377.057 337.981 375.469 340.095 373.906 342.125C368.612 349 361.717 354.935 353.313 357.551C348.465 359.061 343.245 358.981 338.991 362.103C334.057 365.724 330.099 375.208 326.773 380.662C323.157 386.591 305.319 414.03 299.84 416.178C299.151 416.448 298.838 416.414 298.196 416.093C296.802 412.462 305.854 394.43 307.707 390.108C312.045 379.989 315.495 369.296 323.963 361.878C319.609 363.64 315.459 364.938 311.013 366.914C287.921 377.177 263.95 390.208 238.252 391.64C234.141 391.869 228.313 390.848 224.373 389.618C217.242 387.392 207.958 383.744 204.227 376.733C202.552 373.584 202.64 369.225 203.872 366.071C210.75 348.461 242.74 330.394 258.604 322.647C256.76 319.991 253.906 314.492 252.415 311.553C244.966 296.814 238.376 281.504 234.428 265.43C230.136 247.958 227.922 221.299 250.426 215.978Z" />
                                    <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M308.212 221.621C311.231 210.181 317.323 191.396 327.281 184.583C335.095 179.237 343.442 191.269 346.14 197.492C359.576 228.482 362.743 264.235 360.667 297.659C359.74 312.59 356.616 313.908 352.113 326.101C353.044 302.623 344.102 233.122 328.228 215.794C326.595 214.01 324.511 212.365 321.994 212.254C319.474 212.144 317.304 213.604 315.577 215.298C312.929 217.895 310.757 221.427 309.141 224.738L308.559 224.403C308.056 223.583 308.205 222.631 308.212 221.621Z" />
                                    <path fill="#ffffff" fillOpacity="0.92" transform="scale(0.586667 0.586667)" d="M309.141 224.738C307.062 229.074 305.753 232.905 303.966 237.339L303.678 237.527C303.706 238.008 303.763 237.793 303.533 238.179C303.617 236.995 307.638 223.476 308.212 221.621C308.205 222.631 308.056 223.583 308.559 224.403L309.141 224.738Z" />
                                </g>
                            </svg>
                        </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div style={{ display: "flex", gap: "40px", color: "#ffffff", textAlign: "left" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.9 }}>Decentralized</span>
                            <span style={{ fontSize: "0.75rem", opacity: 0.5, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                                Permanent Storage<br />
                                Arweave Network<br />
                                Zero Expiry
                            </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.9 }}>Security</span>
                            <span style={{ fontSize: "0.75rem", opacity: 0.5, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                                End-to-End Encryption<br />
                                Private Access Keys<br />
                                User Owned Data
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL — Form */}
                <div
                    className="mint-right"
                    style={{
                        flex: 1,
                        padding: "60px 250px 60px 0",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
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

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {/* Two‑column grid for fields */}
                        <div
                            className="mint-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "28px 32px",
                                flex: 1,
                                alignContent: "start",
                            }}
                        >
                            {/* Profile Image Upload */}
                            <div className="premium-form-group">
                                <label className="premium-form-label" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Profile Image</label>
                                <div
                                    style={{
                                        width: "120px",
                                        height: "120px",
                                        borderRadius: "50%",
                                        background: "rgba(255, 255, 255, 0.04)",
                                        border: "1px dashed rgba(255, 255, 255, 0.15)",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.3s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                                    }}
                                    onClick={() => document.getElementById("profileUpload").click()}
                                >
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "1.2rem" }}>✦</span>
                                    )}
                                    <input
                                        id="profileUpload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={(e) => handleImageUpload(e, "profile")}
                                    />
                                </div>
                            </div>

                            {/* Cover Image Upload */}
                            <div className="premium-form-group">
                                <label className="premium-form-label" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Cover Image</label>
                                <div
                                    style={{
                                        width: "100%",
                                        height: "120px",
                                        borderRadius: "14px",
                                        background: "rgba(255, 255, 255, 0.04)",
                                        border: "1px dashed rgba(255, 255, 255, 0.15)",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.3s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                                    }}
                                    onClick={() => document.getElementById("coverUpload").click()}
                                >
                                    {coverImage ? (
                                        <img src={coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.8rem", fontStyle: "italic" }}>Upload cover</span>
                                    )}
                                    <input
                                        id="coverUpload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={(e) => handleImageUpload(e, "cover")}
                                    />
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="premium-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="premium-form-label" htmlFor="name">Name</label>
                                <span className="premium-asterisk">*</span>
                                <div className="premium-input-wrap">
                                    <input name="name" id="name" value={formData.name} onChange={handleChange} placeholder="Your name" className="premium-form-input" required />
                                </div>
                            </div>
                            <div className="premium-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="premium-form-label" htmlFor="bio">Bio</label>
                                <span className="premium-asterisk">*</span>
                                <div className="premium-input-wrap">
                                    <input name="bio" id="bio" value={formData.bio} onChange={handleChange} placeholder="Short bio" className="premium-form-input" required maxLength={250} />
                                </div>
                            </div>
                            <div className="premium-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="premium-form-label" htmlFor="location">Location</label>
                                <div className="premium-input-wrap">
                                    <input name="location" id="location" value={formData.location} onChange={handleChange} placeholder="City, Country" className="premium-form-input" />
                                </div>
                            </div>
                            <div className="premium-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="premium-form-label" htmlFor="dob">Date of Birth</label>
                                <div className="premium-input-wrap">
                                    <input type="date" name="dob" id="dob" value={formData.dob} onChange={handleChange} className="premium-form-input" />
                                </div>
                            </div>
                        </div>

                        {/* Submit Arrow Button */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "40px" }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#ffffff",
                                    fontSize: "2.5rem",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    transition: "transform 0.3s ease",
                                    opacity: loading ? 0.5 : 1,
                                    padding: 0,
                                    lineHeight: 1
                                }}
                                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateX(8px)")}
                                onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = "translateX(0)")}
                            >
                                {loading ? "..." : "→"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Responsive adjustments via media queries in a style tag */}
            <style>{`
        @media (max-width: 1024px) {
          .mint-container {
            height: auto !important;
            max-height: none !important;
            flex-direction: column !important;
            border-radius: 28px !important;
          }
          .mint-left {
            flex: 1 !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
            padding: 24px !important;
          }
          .mint-right {
            padding: 28px 20px !important;
          }
          .mint-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .mint-story {
            grid-column: 1 !important;
          }
        }
        @media (max-width: 600px) {
          .mint-left {
            display: none !important;
          }
          .mint-right {
            padding: 20px 16px !important;
          }
          .mint-container {
            height: 90vh !important;
            border-radius: 20px !important;
          }
          .mint-grid {
            gap: 14px !important;
          }
          input, textarea {
            font-size: 0.9rem !important;
            padding: 12px 14px !important;
          }
          button {
            font-size: 1rem !important;
            padding: 14px !important;
          }
        }
      `}</style>
        </div>
    );
};

export default Mint;