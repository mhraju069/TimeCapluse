"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StaggeredMenu } from './menu';
import { FloatingButterfly } from '../../components/FloatingButterfly';

const logo = '/logo.svg';

const menuItems = [
    { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
    { label: 'Capsule', ariaLabel: 'Open the capsule page', link: '/capsule' },
    { label: 'Mint', ariaLabel: 'Create a new Capsule', link: '/mint' },
    // { label: 'Dashboard', ariaLabel: 'View your dashboard', link: '/dashboard' },
    { label: 'About', ariaLabel: 'Learn about us', link: '/about' },
    { label: 'Contact', ariaLabel: 'Get in touch', link: '/contact' }
];

const socialItems = [
    { label: 'Twitter', link: 'https://twitter.com' },
    { label: 'GitHub', link: 'https://github.com' },
    { label: 'LinkedIn', link: 'https://linkedin.com' },
    { label: 'Facebook', link: 'https://facebook.com' },
    { label: 'Instagram', link: 'https://instagram.com' },
    { label: 'TikTok', link: 'https://tiktok.com' }
];

const Navbar = () => {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check if user is logged in
        const checkAuth = () => {
            const token = localStorage.getItem('access_token');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                setIsLoggedIn(true);
                setUser(JSON.parse(userData));
            } else {
                setIsLoggedIn(false);
                setUser(null);
            }
        };

        // Initial check
        checkAuth();

        // Listen for storage changes (e.g., after login from callback)
        const handleStorageChange = (event) => {
            if (event.key === 'access_token' || event.key === 'user') {
                checkAuth();
            }
        };

        // Listen for custom login event from popup
        const handleLoginSuccess = () => {
            checkAuth();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('loginSuccess', handleLoginSuccess);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('loginSuccess', handleLoginSuccess);
        };
    }, []);

    const handleLoginClick = () => {
        router.push('/auth');
    };

    const handleLogoutClick = () => {
        // Clear authentication data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Update state
        setIsLoggedIn(false);
        setUser(null);

        // Redirect to home
        router.push('/');
    };

    const handleAuthClick = () => {
        // This will be called after login/logout to close the menu
    };

    return (
        <div style={{ height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 200 }}>
            {/* Small interactive area in top-right; rest of header passes pointer events through */}
            <StaggeredMenu
                position="right"
                items={menuItems}
                socialItems={socialItems}
                displaySocials
                displayItemNumbering={false}
                menuButtonColor="#ffffff"
                openMenuButtonColor="#ffffff"
                changeMenuColorOnOpen={true}
                logoUrl={logo}
                accentColor="var(--primary-color)"
                isLoggedIn={isLoggedIn}
                user={user}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
                onAuthClick={handleAuthClick}
                onMenuOpen={() => console.log('Menu opened')}
                onMenuClose={() => console.log('Menu closed')}
                closeOnClickAway={true}
            />
        </div>
    );
};

export default Navbar;