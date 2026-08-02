import React from 'react';
import { Link } from 'react-router-dom';
import { StaggeredMenu } from './menu';
import logo from '../../logo.svg';

const menuItems = [
    { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
    { label: 'Capsule', ariaLabel: 'Open the capsule page', link: '/capsule' },
    { label: 'Mint', ariaLabel: 'Create a new TimeCapsule', link: '/mint' },
    { label: 'About', ariaLabel: 'Learn about us', link: '/about' },
    { label: 'Contact', ariaLabel: 'Get in touch', link: '/contact' }
];

const socialItems = [
    { label: 'Twitter', link: 'https://twitter.com' },
    { label: 'GitHub', link: 'https://github.com' },
    { label: 'LinkedIn', link: 'https://linkedin.com' }
];

const Navbar = () => {
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
                onMenuOpen={() => console.log('Menu opened')}
                onMenuClose={() => console.log('Menu closed')}
            />
        </div>
    );
};

export default Navbar;