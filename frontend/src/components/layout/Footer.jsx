import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-200 pt-16 pb-8 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand & Description */}
          <div>
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0 mb-6">
              <span className="text-3xl">🦷</span>
              <span className="font-bold text-white text-2xl">
                RR <span className="text-primary">Dental Needs</span>
              </span>
            </Link>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Your trusted partner for high-quality preclinical dental materials and instruments for students and professionals.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-colors">
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/category/1st%20Year" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                  <span className="mr-2">&rsaquo;</span> 1st Year Materials
                </Link>
              </li>
              <li>
                <Link to="/category/2nd%20Year" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                  <span className="mr-2">&rsaquo;</span> 2nd Year Materials
                </Link>
              </li>
              <li>
                <Link to="/category/3rd%20Year" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                  <span className="mr-2">&rsaquo;</span> 3rd Year Materials
                </Link>
              </li>
              <li>
                <Link to="/category/4th%20Year" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                  <span className="mr-2">&rsaquo;</span> 4th Year Materials
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider">Information</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                  <span className="mr-2">&rsaquo;</span> About Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                  <span className="mr-2">&rsaquo;</span> FAQ
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                  <span className="mr-2">&rsaquo;</span> Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                  <span className="mr-2">&rsaquo;</span> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                  <span className="mr-2">&rsaquo;</span> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-5">
              <li className="flex items-start"></li>
              <li className="flex items-center">
                <PhoneIcon className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                <span className="text-slate-400">+91 9876543210</span>
              </li>
              <li className="flex items-center">
                <EnvelopeIcon className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                <span className="text-slate-400">rrdentalneeds@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center bg-slate-900 border-none">
          <p className="text-slate-400 text-sm text-center md:text-left">
            &copy; {currentYear} RR Dental Needs. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
