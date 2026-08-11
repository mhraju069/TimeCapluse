"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white group-hover:text-pink-500 transition-colors">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
</svg>;

// These are verified working Unsplash image IDs
const initialItems = Array.from({ length: 80 }, (_, i) => {
    const width = 200 + Math.floor(Math.random() * 400);
    const height = 200 + Math.floor(Math.random() * 100);

    return {
        imageUrl: `https://picsum.photos/${width}/${height}?random=${i + 1}`
    };
});


const GridItem = ({
    item
}) => {
    return <div className="mb-0 break-inside-avoid relative cursor-pointer">
        <img src={item.imageUrl} alt={item.title} className="w-full h-auto shadow-lg" onError={e => {
            const target = e.target;
            target.onerror = null;
            target.src = `https://placehold.co/400x300/fecaca/333333?text=Image+Not+Found`;
        }} />
    </div>;
};
const MasonryGrid = ({
    items
}) => {
    return <div className="columns-2 gap-0 sm:columns-3 md:columns-4 lg:columns-6 xl:columns-8 2xl:columns-10" style={{
        columnWidth: '160px'
    }}>
        {items.map(item => <GridItem key={item.id} item={item} />)}
    </div>;
};
export default function Masonary() {
    return <div className="font-sans transition-colors" style={{ minHeight: '100vh', width: '100%', background: '#000000', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full " style={{ flex: 1, maxWidth: '100%' }}>
            <main>
                <MasonryGrid items={initialItems} />
            </main>
        </div>
    </div>;
}