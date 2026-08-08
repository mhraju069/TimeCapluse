import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Mint = () => {
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
                setError("Please login to mint a capsule");
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

            // Reset form
            setFormData({
                name: "",
                bio: "",
                dob: "",
                location: "",
                is_public: true,
            });
            setCoverImage(null);
            setProfileImage(null);
            setCoverFile(null);
            setProfileFile(null);

        } catch (err) {
            console.error("Error creating capsule:", err);
            setError(err.message || "Failed to create capsule. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #07070b 0%, #14121b 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                fontFamily: "'Verdana', sans-serif",
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
                    transition: "height 0.3s ease",
                }}
            >
                {/* LEFT PANEL — Preview & Visuals */}
                <div
                    style={{
                        flex: "0 0 40%",
                        padding: "32px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(0,0,0,0.2)",
                    }}
                >
                    <div>

                        <h2
                            style={{
                                fontFamily: "'Verdana', sans-serif",
                                fontSize: "2.4rem",
                                fontWeight: 400,
                                lineHeight: 1.1,
                                margin: "0 0 8px 0",
                                color: "#ffffff",
                            }}
                        >
                            The <span style={{
                                fontStyle: "italic",
                                color: "#d4a574",
                                fontWeight: 400
                            }}>millennium</span>
                        </h2>
                        <p
                            style={{
                                color: "rgba(255,255,255,0.45)",
                                fontSize: "0.85rem",
                                lineHeight: 1.6,
                                margin: "0",
                                fontFamily: "'Verdana', sans-serif",
                                paddingBottom: "20px"
                            }}
                        >
                            Preserve your experiences for future generations.
                        </p>
                    </div>

                    {/* Live preview card — same design as capsule card details */}
                    <div
                        style={{
                            flex: 1,
                            overflow: "hidden",
                            position: "relative",
                            borderRadius: "20px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        }}
                    >
                        {/* Background — blurred cover */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundImage: coverImage ? `url(${coverImage})` : "linear-gradient(135deg, #2a1a3a, #1a1a2e)",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                zIndex: 0,
                            }}
                        />

                        {/* Blur overlay */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                background:
                                    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0, 0, 0, 1) 100%)",
                                maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                                WebkitMaskImage:
                                    "linear-gradient(to bottom, transparent 0%, black 100%)",
                                zIndex: 1,
                                borderRadius: "20px",
                                pointerEvents: "none",
                            }}
                        />

                        {/* Content */}
                        <div style={{ position: "relative", zIndex: 2 }}>
                            {/* Cover image area */}
                            <div style={{ position: 'relative', height: '80px', overflowY: 'visible' }}>
                                <div style={{ position: 'absolute', inset: 0 }} />
                            </div>

                            {/* Avatar + Like */}
                            <div style={{
                                display: 'flex', alignItems: 'flex-end',
                                justifyContent: 'space-between',
                                padding: '0 20px',
                                marginTop: '-36px',
                                position: 'relative',
                            }}>
                                {/* Avatar */}
                                <div style={{
                                    width: '72px', height: '72px',
                                    borderRadius: '50%',
                                    border: '3px solid rgba(212, 165, 116, 0.3)',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                                }}>
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'rgba(212, 165, 116, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(212, 165, 116, 0.6)', fontSize: '1.5rem', fontFamily: "'Verdana', sans-serif" }}>✦</div>
                                    )}
                                </div>

                                {/* Like button */}
                                <button style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'rgba(212, 165, 116, 0.1)',
                                    border: '1px solid rgba(212, 165, 116, 0.25)',
                                    borderRadius: '999px', padding: '7px 14px',
                                    cursor: 'pointer', color: '#ffffff', fontSize: '0.82rem', fontWeight: 600,
                                    fontFamily: "'Verdana', sans-serif",
                                    transition: 'all 0.2s ease',
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(212, 165, 116, 0.2)';
                                        e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(212, 165, 116, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.25)';
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#d4a574" stroke="#d4a574" strokeWidth="0">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                    Like
                                </button>
                            </div>

                            {/* Stats row */}
                            <div style={{
                                display: 'flex', justifyContent: 'flex-end', gap: '18px',
                                padding: '15px 20px 0',
                                color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem',
                                fontFamily: "'Verdana', sans-serif",
                            }}>
                                <span><strong style={{ color: '#d4a574' }}>—</strong> likes</span>
                                <span><strong style={{ color: '#d4a574' }}>—</strong> views</span>
                            </div>

                            {/* Name + bio */}
                            <div style={{ padding: '0px 20px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        fontSize: '1.15rem',
                                        fontFamily: "'Verdana', sans-serif"
                                    }}>{formData.name || "Your Name"}</span>
                                </div>
                                <p style={{
                                    margin: 0,
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.6,
                                    fontFamily: "'Verdana', sans-serif"
                                }}>{formData.bio || "A short bio"}</p>
                            </div>

                            {/* DOB */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px 0' }}>
                                <span style={{
                                    color: 'rgba(212, 165, 116, 0.6)',
                                    fontSize: '0.8rem',
                                    fontFamily: "'Verdana', sans-serif",
                                    fontStyle: 'italic'
                                }}>{formData.dob ? `Born: ${new Date(formData.dob).toLocaleDateString()}` : "Date of birth"}</span>
                            </div>

                         </div>
                    </div>

                    {/* Decorative hint */}
                    <div
                        style={{
                            marginTop: "16px",
                            fontSize: "0.7rem",
                            color: "rgba(255,255,255,0.2)",
                            textAlign: "center",
                            letterSpacing: "0.06em",
                        }}
                    >
                        Live preview updates as you type
                    </div>
                </div>

                {/* RIGHT PANEL — Form */}
                <div
                    style={{
                        flex: 1,
                        padding: "40px 36px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {error && (
                        <div style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "12px",
                            padding: "12px 16px",
                            marginBottom: "20px",
                            color: "#ef4444",
                            fontSize: "0.9rem",
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {/* Two‑column grid for fields */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "24px 28px",
                                flex: 1,
                                alignContent: "start",
                            }}
                        >
                            {/* Profile Image Upload */}
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.12em",
                                        color: "#d4a574",
                                        marginBottom: "8px",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                >
                                    Profile Image
                                </label>
                                <div
                                    style={{
                                        width: "160px",
                                        height: "160px",
                                        borderRadius: "50%",
                                        background: "rgba(212, 165, 116, 0.08)",
                                        border: "1px solid rgba(212, 165, 116, 0.25)",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.3s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(212, 165, 116, 0.5)";
                                        e.currentTarget.style.background = "rgba(212, 165, 116, 0.12)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(212, 165, 116, 0.25)";
                                        e.currentTarget.style.background = "rgba(212, 165, 116, 0.08)";
                                    }}
                                    onClick={() => document.getElementById("profileUpload").click()}
                                >
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ color: "rgba(212, 165, 116, 0.5)", fontSize: "1.5rem", fontFamily: "'Verdana', sans-serif" }}>✦</span>
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
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.12em",
                                        color: "#d4a574",
                                        marginBottom: "8px",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                >
                                    Cover Image
                                </label>
                                <div
                                    style={{
                                        width: "100%",
                                        height: "180px",
                                        borderRadius: "16px",
                                        background: "rgba(212, 165, 116, 0.08)",
                                        border: "1px solid rgba(212, 165, 116, 0.25)",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.3s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(212, 165, 116, 0.5)";
                                        e.currentTarget.style.background = "rgba(212, 165, 116, 0.12)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(212, 165, 116, 0.25)";
                                        e.currentTarget.style.background = "rgba(212, 165, 116, 0.08)";
                                    }}
                                    onClick={() => document.getElementById("coverUpload").click()}
                                >
                                    {coverImage ? (
                                        <img src={coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ color: "rgba(212, 165, 116, 0.5)", fontSize: "0.85rem", fontFamily: "'Verdana', sans-serif", fontStyle: "italic" }}>Upload cover image</span>
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

                            {/* Name */}
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.12em",
                                        color: "#d4a574",
                                        marginBottom: "8px",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                >
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    required
                                    style={{
                                        width: "100%",
                                        background: "rgba(212, 165, 116, 0.06)",
                                        border: "1px solid rgba(212, 165, 116, 0.2)",
                                        borderRadius: "14px",
                                        padding: "14px 18px",
                                        color: "#ffffff",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        transition: "all 0.2s ease",
                                        boxSizing: "border-box",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "rgba(212, 165, 116, 0.5)";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(212, 165, 116, 0.1)";
                                        e.target.style.background = "rgba(212, 165, 116, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(212, 165, 116, 0.2)";
                                        e.target.style.boxShadow = "none";
                                        e.target.style.background = "rgba(212, 165, 116, 0.06)";
                                    }}
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.12em",
                                        color: "#d4a574",
                                        marginBottom: "8px",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                >
                                    Bio
                                </label>
                                <input
                                    type="text"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Short bio"
                                    required
                                    style={{
                                        width: "100%",
                                        background: "rgba(212, 165, 116, 0.06)",
                                        border: "1px solid rgba(212, 165, 116, 0.2)",
                                        borderRadius: "14px",
                                        padding: "14px 18px",
                                        color: "#ffffff",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        transition: "all 0.2s ease",
                                        boxSizing: "border-box",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "rgba(212, 165, 116, 0.5)";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(212, 165, 116, 0.1)";
                                        e.target.style.background = "rgba(212, 165, 116, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(212, 165, 116, 0.2)";
                                        e.target.style.boxShadow = "none";
                                        e.target.style.background = "rgba(212, 165, 116, 0.06)";
                                    }}
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.12em",
                                        color: "#d4a574",
                                        marginBottom: "8px",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                >
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="City, Country"
                                    style={{
                                        width: "100%",
                                        background: "rgba(212, 165, 116, 0.06)",
                                        border: "1px solid rgba(212, 165, 116, 0.2)",
                                        borderRadius: "14px",
                                        padding: "14px 18px",
                                        color: "#ffffff",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        transition: "all 0.2s ease",
                                        boxSizing: "border-box",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "rgba(212, 165, 116, 0.5)";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(212, 165, 116, 0.1)";
                                        e.target.style.background = "rgba(212, 165, 116, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(212, 165, 116, 0.2)";
                                        e.target.style.boxShadow = "none";
                                        e.target.style.background = "rgba(212, 165, 116, 0.06)";
                                    }}
                                />
                            </div>

                            {/* DOB */}
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.12em",
                                        color: "#d4a574",
                                        marginBottom: "8px",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                >
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    style={{
                                        width: "100%",
                                        background: "rgba(212, 165, 116, 0.06)",
                                        border: "1px solid rgba(212, 165, 116, 0.2)",
                                        borderRadius: "14px",
                                        padding: "14px 18px",
                                        color: "#ffffff",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        colorScheme: "dark",
                                        transition: "all 0.2s ease",
                                        boxSizing: "border-box",
                                        fontFamily: "'Verdana', sans-serif",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "rgba(212, 165, 116, 0.5)";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(212, 165, 116, 0.1)";
                                        e.target.style.background = "rgba(212, 165, 116, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(212, 165, 116, 0.2)";
                                        e.target.style.boxShadow = "none";
                                        e.target.style.background = "rgba(212, 165, 116, 0.06)";
                                    }}
                                />
                            </div>

                        </div>

                        {/* Mint Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: "32px",
                                padding: "18px",
                                background: loading
                                    ? "linear-gradient(135deg, #888 0%, #666 100%)"
                                    : "linear-gradient(135deg, #d4a574 0%, #b8956a 100%)",
                                border: "none",
                                borderRadius: "20px",
                                color: "#0a0a0f",
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "all 0.3s ease",
                                boxShadow: loading
                                    ? "0 4px 24px rgba(136, 136, 136, 0.3)"
                                    : "0 4px 24px rgba(212, 165, 116, 0.3)",
                                letterSpacing: "0.05em",
                                width: "100%",
                                fontFamily: "'Verdana', sans-serif",
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? "Minting..." : "✦ Mint Capsule ✦"}
                        </button>
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