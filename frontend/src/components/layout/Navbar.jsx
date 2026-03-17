import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { ShoppingCartIcon, UserCircleIcon, ArrowRightOnRectangleIcon, HeartIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';
import Badge from '../ui/Badge';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, clearCartState } = useCartStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { token } = useAuthStore();

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [token]);

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
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4 md:gap-6 lg:gap-8">
          <div className="flex items-center md:space-x-8 lg:space-x-12">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-2xl">🦷</span>
              <span className="font-bold text-slate-800 text-lg sm:text-xl">
                RR <span className="text-primary">Dental Needs</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-slate-600 hover:text-primary font-medium transition-colors whitespace-nowrap"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <form
            className="hidden lg:flex flex-1 max-w-md mx-8 relative"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
          >
            <input
              type="text"
              placeholder="Search instruments..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          </form>

          {/* Nav Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!isAuthenticated ? (
              <div className="hidden sm:flex space-x-3">
                <Link to="/login" className="px-4 py-2 text-primary font-medium hover:bg-teal-50 rounded-lg transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-3">
                <Link to="/profile" state={{ tab: 'wishlist' }} className="p-2 text-slate-600 hover:text-primary hover:bg-teal-50 rounded-full transition-colors">
                  <HeartIcon className="w-6 h-6" />
                </Link>

                <Link to="/cart" className="relative p-2 text-slate-600 hover:text-primary hover:bg-teal-50 rounded-full transition-colors">
                  <ShoppingCartIcon className="w-6 h-6" />
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-danger text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </Link>

                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 text-slate-600 hover:text-primary hover:bg-teal-50 rounded-full transition-colors focus:outline-none"
                  >
                    <BellIcon className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                          <h3 className="font-bold text-slate-800">Notifications</h3>
                          <Badge variant="primary" size="sm">{unreadCount} New</Badge>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <BellIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div 
                                key={notif.id} 
                                className={`px-4 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-teal-50/30' : ''}`}
                                onClick={() => !notif.is_read && markAsRead(notif.id)}
                              >
                                <p className={`text-sm ${!notif.is_read ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
                                  {new Date(notif.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="px-4 py-2 border-t border-slate-50 text-center">
                           <button className="text-xs font-bold text-primary hover:underline">Clear all</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <UserCircleIcon className="w-8 h-8 text-slate-600" />
                    <span className="hidden lg:block font-medium text-slate-700">
                      Hi, {user.name?.split(' ')[0]}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2"
                        onMouseLeave={() => setIsProfileDropdownOpen(false)}
                      >
                        {user.role === 'admin' && (
                          <Link to="/admin" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary">Admin Dashboard</Link>
                        )}
                        {user.role === 'seller' && (
                          <Link to="/seller" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary">Seller Dashboard</Link>
                        )}
                        <Link to="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary">My Profile</Link>
                        <hr className="my-1 border-slate-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50 flex items-center"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-primary focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              <form
                className="mb-4 relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Search instruments..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-primary bg-slate-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              </form>

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary hover:bg-teal-50"
                >
                  {link.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center px-4 py-2 border border-primary text-primary font-medium rounded-lg hover:bg-teal-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
