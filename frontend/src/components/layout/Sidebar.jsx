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
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ isAdmin = false, activeTab, onTabChange, onClose }) => {
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
    <div className="h-full bg-[#0f172a] text-slate-400 w-72 lg:w-64 flex flex-col transition-all duration-300 shadow-2xl lg:shadow-none border-r border-slate-800/50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

      <div className="p-8 flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center mr-3 shadow-lg shadow-teal-500/20">
              <span className="text-white text-xs font-black">RR</span>
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {isAdmin ? 'Admin' : 'Seller'}
            </span>
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mt-1">Dental Needs</p>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-all border border-slate-700/50 backdrop-blur-sm"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto relative z-10 custom-scrollbar">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onTabChange?.(link.id)}
              className="w-full relative group outline-none"
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-emerald-500/5 border-l-4 border-primary rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`
                relative flex items-center px-4 py-3.5 rounded-xl transition-all duration-300
                ${isActive ? 'text-white' : 'hover:bg-slate-800/40 hover:text-slate-200'}
              `}>
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-semibold text-sm tracking-wide text-left">{link.name}</span>
                {isActive && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(13,148,136,0.6)]"
                  />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800/50 bg-slate-900/40 backdrop-blur-md relative z-10">
        <div className="space-y-1.5">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-slate-800/60 hover:text-white transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mr-3 group-hover:bg-slate-700 transition-colors">
              <HomeIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
            </div>
            <span className="text-sm font-semibold">Store</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-all font-semibold group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mr-3 group-hover:bg-red-500/20 transition-colors">
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </div>
            <span className="text-sm uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
