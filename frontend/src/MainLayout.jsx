import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
         <div className="container">
            <p>&copy; {new Date().getFullYear()} Odontic Store. For Dental Students, by Dental Students.</p>
         </div>
      </footer>
    </div>
  );
};

export default MainLayout;
