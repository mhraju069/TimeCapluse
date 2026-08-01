import React from 'react';
import { StaggeredMenu } from './menu';

const menuItems = [
    { label: 'Capsule', ariaLabel: 'Go to home page', link: '/' },
    { label: 'Legacy', ariaLabel: 'View our services', link: '/' },
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
        <div style={{ height: '86vh', background: '#1a1a1a', position: 'absolute', top: 0, left: 0, right: 0, float: 'left' }}>
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
                logoUrl="/path-to-your-logo.svg"
                accentColor="rgba(255, 81, 0, 0.99)"
                onMenuOpen={() => console.log('Menu opened')}
                onMenuClose={() => console.log('Menu closed')}
            />
        </div>
    );
};

export default Navbar;