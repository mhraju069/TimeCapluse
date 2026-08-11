"use client";

import React, { useState, useEffect } from 'react';

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
    useEffect(() => {
        // Load custom fonts for a premium design
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    return (
        <div className="font-sans transition-colors relative" style={{ height: '100vh', width: '100%', background: '#000000', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                    <div className="absolute -top-16 left-32 w-28 h-28 pointer-events-none opacity-80 hidden md:block">
                        <div className="w-6 h-6 rounded-full bg-white mb-2" />
                        <svg viewBox="0 0 100 50" className="w-24 h-12 stroke-white/50 fill-none" strokeWidth="1">
                            <path d="M 0 0 A 50 50 0 0 0 100 0 Z" />
                        </svg>
                    </div>

                    <h1 
                        className="text-white text-5xl md:text-8xl font-light tracking-tight leading-none mb-6"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                        LET'S <br />
                        GET IN <br />
                        TOUCH
                    </h1>
                    
                    <p className="text-white/60 text-base md:text-xl font-light tracking-wide max-w-xl leading-relaxed">
                        Have a project in mind or want to collaborate? Reach out and let's build something extraordinary together.
                    </p>
                </div>
            </div>
        </div>
    );
}