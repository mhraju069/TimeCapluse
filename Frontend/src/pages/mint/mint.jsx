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
                        maxWidth: "500px",
                        width: "100%",
                        padding: "40px",
                        background: "rgba(20, 18, 27, 0.7)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "24px",
                        textAlign: "center",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    }}
                >
                    <div style={{ fontSize: "3rem", color: "#ffffff", marginBottom: "16px" }}>✦</div>
                    <h2 style={{ color: "#ffffff", fontSize: "1.8rem", marginBottom: "12px" }}>
                        Capsule Already Created
                    </h2>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                        <button
                            onClick={() => navigate("/dashboard")}
                            style={{
                                padding: "12px 24px",
                                background: "rgba(255,255,255,0.08)",
                                color: "#ffffff",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                transition: "all 0.2s ease"
                            }}
                        >
                            Go to Dashboard
                        </button>
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
                    maxWidth: "100vw",
                    height: "90vh",
                    maxHeight: "900px",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderRadius: "40px",
                    display: "flex",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "height 0.3s ease",
                }}
            >
                {/* LEFT PANEL — Visuals & Typography */}
                <div
                    className="mint-left"
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

                        {/* Geometric Shape */}
                        <div style={{ position: 'relative', width: '120px', height: '120px', marginTop: '10px' }}>
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                <circle cx="35" cy="35" r="16" fill="#ffffff" />
                                <path d="M15,50 C15,85 85,85 85,50" stroke="#ffffff" strokeWidth="1" fill="none" transform="rotate(-15 50 50)" />
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
                        padding: "60px 48px",
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