// searchResult.jsx
import { useState, useEffect, useMemo } from "react";
import { galleryData } from "../capsule/galleryData";
import AdvancedSearchModal from "../capsule/search";
import { CapsuleDetailModal } from "../capsule/cardDetails";

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const SearchResult = () => {
    const [modalOpen, setModalOpen] = useState(true);

    // Use the same robust filter state structure as the grid component
    const EMPTY_FILTERS = { text: '', location: '', year: '', month: '', dateFrom: '', dateTo: '', imageFile: null, imagePreview: '' };
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
    const [selectedCard, setSelectedCard] = useState(null);

    const hasActive = activeFilters.text || activeFilters.location || activeFilters.year || activeFilters.month ||
        activeFilters.dateFrom || activeFilters.dateTo || activeFilters.imageFile;

    // Full filter logic matching the grid implementation
    const filteredGallery = useMemo(() => {
        if (!galleryData) return [];
        let result = galleryData;

        if (activeFilters.text?.trim()) {
            const q = activeFilters.text.toLowerCase().trim();
            result = result.filter(item => item.title?.toLowerCase().includes(q));
        }
        if (activeFilters.location?.trim()) {
            const q = activeFilters.location.toLowerCase().trim();
            result = result.filter(item => item.location?.toLowerCase().includes(q));
        }
        if (activeFilters.year) {
            result = result.filter(item => item.year === Number(activeFilters.year));
        }
        if (activeFilters.month) {
            result = result.filter(item => item.month === Number(activeFilters.month));
        }
        if (activeFilters.dateFrom) {
            result = result.filter(item => item.date && item.date >= activeFilters.dateFrom);
        }
        if (activeFilters.dateTo) {
            result = result.filter(item => item.date && item.date <= activeFilters.dateTo);
        }

        return result.length ? result : galleryData; // fallback
    }, [activeFilters]);

    return (
        <>
            <div
                style={{
                    scrollBehavior: 'smooth',
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "0px",
                    width: "100%",
                    minHeight: "100vh",
                    background: "radial-gradient(ellipse at center, #1a1a1a 0%, #000000 100%)",
                    // paddingTop: "80px",
                }}
            >
                {/* Search Bar Pill – styling identical to infinite-grid */}
                <div
                    style={{
                        position: 'fixed',
                        top: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 30,
                        width: '50%',               /* Uses 92% of the screen width on smaller devices */
                        maxWidth: '480px',          /* Caps the width at 480px for larger desktops */
                        padding: '0 8px',           /* Slightly tighter padding for mobile safety */
                        pointerEvents: 'none',
                        boxSizing: 'border-box',    /* Ensures padding doesn't push the width out */
                    }}
                >
                    <div
                        onClick={() => setModalOpen(true)}
                        onMouseDown={e => e.stopPropagation()}
                        onTouchStart={e => e.stopPropagation()}
                        style={{
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            background: 'rgba(0,0,0,0)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: hasActive ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '999px',
                            padding: '10px 18px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                            transition: 'border-color 0.2s',
                        }}
                    >
                        {/* search icon */}
                        <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>

                        <span style={{
                            flex: 1,
                            color: hasActive ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {hasActive
                                ? [
                                    activeFilters.text && `"${activeFilters.text}"`,
                                    activeFilters.location && `📍 ${activeFilters.location}`,
                                    activeFilters.year && `📅 ${activeFilters.year}`,
                                    activeFilters.month && `🗓 ${MONTHS[activeFilters.month - 1]}`,
                                    (activeFilters.dateFrom || activeFilters.dateTo) && `📆 ${activeFilters.dateFrom || '…'} → ${activeFilters.dateTo || '…'}`,
                                    activeFilters.imageFile && `🖼 Image`,
                                ].filter(Boolean).join('  ·  ')
                                : 'Search capsules…'}
                        </span>

                        {/* filter badge / clear */}
                        {hasActive ? (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    setFilters(EMPTY_FILTERS);
                                    setActiveFilters(EMPTY_FILTERS);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                    borderRadius: '999px',
                                    padding: '3px 8px',
                                    cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    flexShrink: 0,
                                }}
                            >
                                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear
                            </button>
                        ) : (
                            <div></div>
                        )}
                    </div>
                </div>

                {/* Gallery Grid */}
                {filteredGallery.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => setSelectedCard(item)}
                        style={{
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            aspectRatio: "1",
                        }}
                    >
                        <img
                            src={item.thumb_src}
                            alt={item.title}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Advanced Search Modal */}
            {modalOpen && (
                <AdvancedSearchModal
                    filters={filters}
                    onChange={setFilters}
                    onApply={applied => {
                        setFilters(applied);
                        setActiveFilters(applied);
                    }}
                    onClose={() => setModalOpen(false)}
                />
            )}

            {/* Capsule Detail Modal */}
            {selectedCard && (
                <CapsuleDetailModal
                    descriptor={selectedCard}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </>
    );
};

export default SearchResult;