import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-section">
                    <h3>RR Dental Needs</h3>
                    <p>Your trusted marketplace for high-quality dental Products</p>
                </div>

                <div className="footer-section">
                    <h3>Quick Links</h3>
                    <ul className="footer-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/products">Products</Link></li>
                        <li><Link to="/cart">Cart</Link></li>
                        <li><Link to="/profile">Wishlist</Link></li>
                        <li><Link to="/login">Login</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h3>Contact Us</h3>
                    <ul className="footer-contact">
                        <li><strong>Email:</strong> rrdentalneeds@gmail.com</li>
                        <li><strong>Phone:</strong> +91 98765 43210</li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} RR Dental Needs. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
