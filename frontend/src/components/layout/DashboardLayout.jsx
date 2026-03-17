import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const DashboardLayout = ({ isAdmin = false, activeTab, onTabChange, children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 transform lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar 
          isAdmin={isAdmin} 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            onTabChange(tab);
            setIsMobileOpen(false);
          }} 
          onClose={() => setIsMobileOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden glass-panel h-16 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm border-b-white/10">
          <div className="flex items-center">
             <div className="h-9 w-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-teal-500/20">
                <span className="text-white font-black text-sm">RR</span>
             </div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                {isAdmin ? 'Admin' : 'Seller'}
              </span>
          </div>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2.5 text-slate-600 bg-white shadow-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto w-full scroll-smooth">
          <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
