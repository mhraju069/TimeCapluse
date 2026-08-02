import { useState, useEffect } from "react";
import { galleryData } from "../capsule/galleryData";
import AdvancedSearchModal from "../capsule/search";
const SearchResult = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [activeFilters, setActiveFilters] = useState({});
    const handleSearchClick = () => setModalOpen(true);
    const hasActive = activeFilters.text || activeFilters.location || activeFilters.year || activeFilters.month ||
        activeFilters.dateFrom || activeFilters.dateTo || activeFilters.imageFile;


    {
        modalOpen && (
            <AdvancedSearchModal
                filters={filters}
                onChange={setFilters}
                onApply={applied => {
                    setFilters(applied);
                    setActiveFilters(applied);
                }}
                onClose={() => setModalOpen(false)}
            />
        )
    }
    return (
        <div
            style={{
                scrollBehavior: 'smooth',
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "0px",
                width: "100%",
            }}
        >
            <div
                style={{
                    position: 'absolute', top: '24px',
                    left: '50%', transform: 'translateX(-50%)',
                    zIndex: 30, width: '100%', maxWidth: '480px',
                    padding: '0 16px', pointerEvents: 'none',
                }}
            >
                <div
                    onClick={() => setModalOpen(true)}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    style={{
                        pointerEvents: 'auto', display: 'flex', alignItems: 'center',
                        gap: '10px', cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: hasActive ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '999px', padding: '10px 18px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                        transition: 'border-color 0.2s',
                    }}
                >
                    {/* search icon */}
                    <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>

                    <span style={{ flex: 1, color: hasActive ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '0.875rem', fontWeight: 500, userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

                    {/* filter badge */}
                    {hasActive ? (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                const reset = { text: '', location: '', year: '', month: '', dateFrom: '', dateTo: '', imageFile: null, imagePreview: '' };
                                setFilters(reset);
                                setActiveFilters(reset);
                            }}
                            style={{
                                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                                borderRadius: '999px', padding: '3px 8px', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                            }}
                        >
                            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear
                        </button>
                    ) : (
                        <div ></div>
                    )}
                </div>
            </div>
            {galleryData.map((item, index) => (
                <img
                    key={index}
                    src={item.thumb_src}
                    alt={item.title}
                    style={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ))}
        </div>
    );
};

export default SearchResult;