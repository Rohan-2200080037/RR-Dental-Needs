import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { ShoppingCartIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'; // v2 outline
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, clearCartState } = useCartStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    clearCartState();
    navigate('/login');
  };

  const navLinks = [
    { name: '1st Year', path: '/category/1st%20Year' },
    { name: '2nd Year', path: '/category/2nd%20Year' },
    { name: '3rd Year', path: '/category/3rd%20Year' },
    { name: '4th Year', path: '/category/4th%20Year' },
  ];

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">🦷</span> RR <span className="brand-highlight">Dental Needs</span>
          </Link>
        </div>

        <div className="nav-links desktop-only">
          {navLinks.map(link => (
            <Link key={link.name} to={link.path} className="nav-link">
              {link.name}
            </Link>
          ))}
        </div>

        <form
          className="search-form desktop-only"
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', marginRight: '20px' }}
        >
          <input
            type="text"
            placeholder="Search instruments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none', width: '250px' }}
          />
        </form>

        <div className="nav-actions">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          ) : (
            <>
              <Link to="/cart" className="action-icon-wrapper cart-icon">
                <ShoppingCartIcon className="action-icon" />
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>

              <div className="user-menu-dropdown">
                <div className="action-icon-wrapper">
                  <UserCircleIcon className="action-icon" />
                  <span className="user-greeting desktop-only">Hi, {user.name.split(' ')[0]}</span>
                </div>
                <div className="dropdown-content">
                  {user.role === 'admin' && <Link to="/admin" className="dropdown-item">Admin Dashboard</Link>}
                  {user.role === 'seller' && <Link to="/seller" className="dropdown-item">Seller Dashboard</Link>}
                  <Link to="/profile" className="dropdown-item">My Orders</Link>
                  <button onClick={handleLogout} className="dropdown-item text-danger">
                    <ArrowRightOnRectangleIcon className="dropdown-icon" /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
