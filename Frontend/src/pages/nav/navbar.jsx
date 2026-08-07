import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StaggeredMenu } from './menu';
import logo from '../../logo.svg';

const menuItems = [
    { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
    { label: 'Capsule', ariaLabel: 'Open the capsule page', link: '/capsule' },
    { label: 'Mint', ariaLabel: 'Create a new TimeCapsule', link: '/mint' },
    { label: 'Dashboard', ariaLabel: 'View your dashboard', link: '/dashboard' },
    { label: 'About', ariaLabel: 'Learn about us', link: '/about' },
    { label: 'Contact', ariaLabel: 'Get in touch', link: '/contact' }
];

const socialItems = [
    { label: 'Twitter', link: 'https://twitter.com' },
    { label: 'GitHub', link: 'https://github.com' },
    { label: 'LinkedIn', link: 'https://linkedin.com' }
];

const Navbar = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            setIsLoggedIn(true);
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLoginClick = () => {
        // Navigation will be handled by the menu component after closing
        window.location.href = '/auth';
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
        window.location.href = '/';
    };
    
    const handleAuthClick = () => {
        // This will be called after login/logout to close the menu
        // The menu will handle its own closing via the closeOnClickAway prop
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
                colors={['#B497CF', '#5227FF']}
                logoUrl={logo}
                accentColor="rgba(255, 81, 0, 0.99)"
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