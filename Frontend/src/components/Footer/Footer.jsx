import React from 'react';
import './Footer.css';

const Footer = ({ text = "Relic" }) => {
  return (
    <footer className="brand-gradient-footer">
      <div className="giant-text-container">
        <h1 className="giant-gradient-text">{text}</h1>
      </div>
    </footer>
  );
};

export default Footer;
