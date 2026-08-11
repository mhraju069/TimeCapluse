"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// HeartIcon could be kept to avoid any compilation errors.
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white group-hover:text-pink-500 transition-colors">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
</svg>;

// These are verified working random image IDs
const initialItems = Array.from({ length: 80 }, (_, i) => {
    const width = 200 + Math.floor(Math.random() * 400);
    const height = 200 + Math.floor(Math.random() * 100);
    return {
        imageUrl: `https://picsum.photos/${width}/${height}?random=${i + 1}`
    };
});

const GridItem = ({ item }) => {
    return <div className="mb-0 break-inside-avoid relative">
        <img src={item.imageUrl} alt="" className="w-full h-auto shadow-lg" onError={e => {
            const target = e.target;
            target.onerror = null;
            target.src = `https://placehold.co/400x300/fecaca/333333?text=Image+Not+Found`;
        }} />
    </div>;
};

const MasonryGrid = ({ items }) => {
    return <div className="columns-2 gap-0 sm:columns-3 md:columns-4 lg:columns-6 xl:columns-8 2xl:columns-10" style={{
        columnWidth: '160px'
    }}>
        {items.map((item, idx) => <GridItem key={idx} item={item} />)}
    </div>;
};

export default function Masonary() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load custom fonts for a premium design
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        return () => {
            document.head.removeChild(link);
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="font-sans transition-colors relative" style={{ height: '100vh', width: '100%', background: '#000000', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Loading Spinner Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
            )}

            {/* Background Masonry Grid */}
            <div className="absolute inset-0 w-full h-full overflow-hidden opacity-50 z-0 pointer-events-none">
                <MasonryGrid items={initialItems} />
            </div>

            {/* Dark Overlay Background */}
            <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    background: 'linear-gradient(to left, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 60%, rgba(0, 0, 0, 0.95) 100%)'
                }}
            />

            {/* Hero Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-20 py-12 md:py-24 text-white">
                <div className="max-w-3xl relative">
                    {/* Abstract Circle & Semi-circle Graphic */}
                    <div style={{
                        position: 'absolute',
                        top: '-90px',
                        left: '245px',
                        opacity: 0.95,
                        zIndex: 1,
                        pointerEvents: 'none'
                    }}>
                        <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
                            <g transform="translate(116, -10) scale(-0.38, 0.38)">
                                <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M250.426 215.978C254.209 215.749 257.494 216.131 261.027 217.554C290.766 229.535 327.845 306.278 340.481 336.176C337.767 338.066 334.364 339.863 331.429 341.854C330.769 339.556 329.908 337.322 328.856 335.175C325.838 328.968 320.5 321.036 316.579 315.337C305.035 298.886 292.986 282.794 280.449 267.086C275.024 260.192 269.656 253.203 263.933 246.562C260.503 242.582 255.246 241.916 250.699 244.435C248.241 245.781 246.457 248.091 245.775 250.809C244.889 254.348 245.995 260.379 246.736 263.959C250.437 281.836 258.441 298.866 267.343 314.693C269.813 319.083 272.572 323.153 275.083 327.467C272.099 330.012 268.222 332.873 265.084 335.393C257.301 341.523 249.761 347.953 242.478 354.67C238.26 358.615 226.721 369.582 228.019 374.798C229.859 382.19 252.883 374.653 256.927 373.553L283.682 366.209L314.935 357.581C321.002 355.902 326.954 354.214 332.983 352.4C341.257 349.91 345.275 343.441 352.112 338.683C354.085 337.311 356.059 335.775 357.835 334.168C367.373 323.861 375.541 312.163 381.661 299.512C384.836 293.23 387.319 285.521 388.402 278.603C388.918 275.308 388.488 270.156 389.839 267.33C391.256 264.367 394.866 260.281 397.013 257.651C397.704 281.707 382.882 304.84 369.615 323.952C367.704 326.705 365.618 329.31 363.421 331.841C366.908 330.393 372.08 328.666 375.878 329.546C376.86 329.774 377.79 330.294 378.22 331.258C378.803 332.569 378.409 334.269 377.942 335.55C377.057 337.981 375.469 340.095 373.906 342.125C368.612 349 361.717 354.935 353.313 357.551C348.465 359.061 343.245 358.981 338.991 362.103C334.057 365.724 330.099 375.208 326.773 380.662C323.157 386.591 305.319 414.03 299.84 416.178C299.151 416.448 298.838 416.414 298.196 416.093C296.802 412.462 305.854 394.43 307.707 390.108C312.045 379.989 315.495 369.296 323.963 361.878C319.609 363.64 315.459 364.938 311.013 366.914C287.921 377.177 263.95 390.208 238.252 391.64C234.141 391.869 228.313 390.848 224.373 389.618C217.242 387.392 207.958 383.744 204.227 376.733C202.552 373.584 202.64 369.225 203.872 366.071C210.75 348.461 242.74 330.394 258.604 322.647C256.76 319.991 253.906 314.492 252.415 311.553C244.966 296.814 238.376 281.504 234.428 265.43C230.136 247.958 227.922 221.299 250.426 215.978Z" />
                                <path fill="#ffffff" transform="scale(0.586667 0.586667)" d="M308.212 221.621C311.231 210.181 317.323 191.396 327.281 184.583C335.095 179.237 343.442 191.269 346.14 197.492C359.576 228.482 362.743 264.235 360.667 297.659C359.74 312.59 356.616 313.908 352.113 326.101C353.044 302.623 344.102 233.122 328.228 215.794C326.595 214.01 324.511 212.365 321.994 212.254C319.474 212.144 317.304 213.604 315.577 215.298C312.929 217.895 310.757 221.427 309.141 224.738L308.559 224.403C308.056 223.583 308.205 222.631 308.212 221.621Z" />
                                <path fill="#ffffff" fillOpacity="0.92" transform="scale(0.586667 0.586667)" d="M309.141 224.738C307.062 229.074 305.753 232.905 303.966 237.339L303.678 237.527C303.706 238.008 303.763 237.793 303.533 238.179C303.617 236.995 307.638 223.476 308.212 221.621C308.205 222.631 308.205 222.631 308.559 224.403L309.141 224.738Z" />
                            </g>
                        </svg>
                    </div>

                    <h1
                        className="text-white text-7xl md:text-8xl font-bold tracking-tight leading-none mb-6"
                        style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.1em' }}
                    >
                        RELIC
                    </h1>

                    <p className="text-white/60 italic text-base md:text-3xl font-light tracking-wide max-w-xl leading-relaxed" style={{ fontFamily: "var(--font-family)" }}>
                        Where moments find a place to live.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <button className="px-8 py-3.5 rounded-full border border-white/20 bg-black/40 text-white font-medium hover:bg-white/10 transition-all text-sm md:text-base cursor-pointer" onClick={() => navigate('/capsule')}>
                            Capsule
                        </button>
                        <button className="px-8 py-3.5 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-all text-sm md:text-base cursor-pointer" onClick={() => navigate('/mint')}>
                            Mint
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}