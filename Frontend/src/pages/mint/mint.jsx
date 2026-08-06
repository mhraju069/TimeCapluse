import { useState } from "react";

const Mint = () => {
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        dob: "",
        story: "",
    });
    const [coverImage, setCoverImage] = useState(null);
    const [profileImage, setProfileImage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (type === "cover") setCoverImage(event.target.result);
            else setProfileImage(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Minting capsule:", { ...formData, coverImage, profileImage });
        alert("Capsule minted! (demo)");
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
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "100vw",
                    height: "90vh",
                    maxHeight: "900px",
                    // background: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    // border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "40px",
                    // boxShadow: "0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
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
                                color: "#fff",
                                fontSize: "1.8rem",
                                fontWeight: 700,
                                letterSpacing: "-0.02em",
                                margin: "0 0 4px 0",
                            }}
                        >
                            ✦ New Capsule
                        </h2>
                        <p
                            style={{
                                color: "rgba(255,255,255,0.4)",
                                fontSize: "0.9rem",
                                margin: "0 0 24px 0",
                            }}
                        >
                            Preserve your story forever
                        </p>
                    </div>

                    {/* Live preview card — same design as capsule card details */}
                    <div
                        style={{
                            flex: 1,
                            overflow: "hidden",
                            position: "relative",
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
                                    border: '3px solid #12131f',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                }}>
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '1.2rem' }}>+</div>
                                    )}
                                </div>

                                {/* Like button */}
                                <button style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '999px', padding: '7px 14px',
                                    cursor: 'pointer', color: '#fff', fontSize: '0.82rem', fontWeight: 600,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="0">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                    Like
                                </button>
                            </div>

                            {/* Stats row */}
                            <div style={{
                                display: 'flex', justifyContent: 'flex-end', gap: '18px',
                                padding: '15px 20px 0',
                                color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem',
                            }}>
                                <span><strong style={{ color: '#fff' }}>—</strong> likes</span>
                                <span><strong style={{ color: '#fff' }}>—</strong> views</span>
                            </div>

                            {/* Name + bio */}
                            <div style={{ padding: '0px 20px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{formData.name || "Your Name"}</span>
                                </div>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', lineHeight: 1.55 }}>{formData.bio || "A short bio"}</p>
                            </div>

                            {/* DOB */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px 0' }}>
                                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>{formData.dob ? `Born: ${new Date(formData.dob).toLocaleDateString()}` : "Date of birth"}</span>
                            </div>

                            {/* Story */}
                            {formData.story && (
                                <p style={{
                                    padding: '8px 20px 0', color: 'rgba(255,255,255,0.6)',
                                    fontSize: '0.8rem', margin: 0,
                                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                }}>
                                    {formData.story}
                                </p>
                            )}
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
                                        letterSpacing: "0.08em",
                                        color: "rgba(255,255,255,0.5)",
                                        marginBottom: "6px",
                                    }}
                                >
                                    Profile Image
                                </label>
                                <div
                                    style={{
                                        width: "160px",
                                        height: "160px",
                                        borderRadius: "50%",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px dashed rgba(255,255,255,0.2)",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "border-color 0.2s",
                                    }}
                                    onClick={() => document.getElementById("profileUpload").click()}
                                >
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>+</span>
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
                                        letterSpacing: "0.08em",
                                        color: "rgba(255,255,255,0.5)",
                                        marginBottom: "6px",
                                    }}
                                >
                                    Cover Image
                                </label>
                                <div
                                    style={{
                                        width: "100%",
                                        height: "180px",
                                        borderRadius: "16px",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px dashed rgba(255,255,255,0.2)",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "border-color 0.2s",
                                    }}
                                    onClick={() => document.getElementById("coverUpload").click()}
                                >
                                    {coverImage ? (
                                        <img src={coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>Upload cover</span>
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
                                        letterSpacing: "0.08em",
                                        color: "rgba(255,255,255,0.5)",
                                        marginBottom: "6px",
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
                                    style={{
                                        width: "100%",
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "14px",
                                        padding: "14px 18px",
                                        color: "#fff",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        transition: "border-color 0.2s, box-shadow 0.2s",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "rgba(255,255,255,0.3)";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.05)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(255,255,255,0.1)";
                                        e.target.style.boxShadow = "none";
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
                                        letterSpacing: "0.08em",
                                        color: "rgba(255,255,255,0.5)",
                                        marginBottom: "6px",
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
                                    style={{
                                        width: "100%",
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "14px",
                                        padding: "14px 18px",
                                        color: "#fff",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        transition: "border-color 0.2s, box-shadow 0.2s",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "rgba(255,255,255,0.3)";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.05)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(255,255,255,0.1)";
                                        e.target.style.boxShadow = "none";
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
                                        letterSpacing: "0.08em",
                                        color: "rgba(255,255,255,0.5)",
                                        marginBottom: "6px",
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
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "14px",
                                        padding: "14px 18px",
                                        color: "#fff",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        colorScheme: "dark",
                                        transition: "border-color 0.2s, box-shadow 0.2s",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "rgba(255,255,255,0.3)";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.05)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(255,255,255,0.1)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </div>

                            {/* Story (spans two columns) */}
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                        color: "rgba(255,255,255,0.5)",
                                        marginBottom: "6px",
                                    }}
                                >
                                    Your Story
                                </label>
                                <textarea
                                    name="story"
                                    value={formData.story}
                                    onChange={handleChange}
                                    placeholder="Tell your story…"
                                    rows="10"
                                    style={{
                                        width: "100%",
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "14px",
                                        padding: "14px 18px",
                                        color: "#fff",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        resize: "vertical",
                                        fontFamily: "inherit",
                                        transition: "border-color 0.2s, box-shadow 0.2s",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "rgba(255,255,255,0.3)";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.05)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "rgba(255,255,255,0.1)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </div>
                        </div>

                        {/* Mint Button */}
                        <button
                            type="submit"
                            style={{
                                marginTop: "32px",
                                padding: "16px",
                                background: "linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%)",
                                border: "none",
                                borderRadius: "20px",
                                color: "#000",
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "transform 0.15s ease, box-shadow 0.2s",
                                boxShadow: "0 4px 24px rgba(255,255,255,0.15)",
                                letterSpacing: "0.02em",
                                width: "100%",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = "scale(1.02)";
                                e.target.style.boxShadow = "0 8px 40px rgba(255,255,255,0.25)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = "scale(1)";
                                e.target.style.boxShadow = "0 4px 24px rgba(255,255,255,0.15)";
                            }}
                        >
                            Mint Capsule ✦
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