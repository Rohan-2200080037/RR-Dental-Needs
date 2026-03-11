import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  UsersIcon, 
  ShoppingBagIcon, 
  ClipboardDocumentListIcon, 
  StarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ isAdmin = false, activeTab, onTabChange }) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

    const adminLinks = [
    { name: 'Dashboard', id: 'analytics', icon: HomeIcon },
    { name: 'Users', id: 'users', icon: UsersIcon },
    { name: 'Sellers', id: 'sellers', icon: UsersIcon },
    { name: 'Products', id: 'products', icon: ShoppingBagIcon },
    { name: 'Orders', id: 'orders', icon: ClipboardDocumentListIcon },
    { name: 'Messages', id: 'messages', icon: ClipboardDocumentListIcon },
    { name: 'Reviews', id: 'reviews', icon: StarIcon },
  ];

  const sellerLinks = [
    { name: 'Dashboard', id: 'analytics', icon: HomeIcon },
    { name: 'My Products', id: 'products', icon: ShoppingBagIcon },
    { name: 'Add Product', id: 'add-product', icon: ShoppingBagIcon },
    { name: 'Orders', id: 'orders', icon: ClipboardDocumentListIcon },
  ];

  const links = isAdmin ? adminLinks : sellerLinks;

  return (
    <div className="h-full bg-slate-900 text-slate-300 w-64 flex flex-col transition-all duration-300">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2">
          {isAdmin ? 'Admin Panel' : 'Seller Panel'}
        </h2>
        <p className="text-sm text-slate-500">RR Dental Needs</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.id}
              onClick={() => onTabChange?.(link.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === link.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="font-medium text-left">{link.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all text-slate-400"
          >
            <HomeIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium">Back to Store</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-red-500/10 text-danger hover:text-red-400 transition-all font-medium"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
