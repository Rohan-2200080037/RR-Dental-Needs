import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import useAuthStore from './store/authStore';
import useCartStore from './store/cartStore';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import UserProfile from './pages/UserProfile';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';

import AboutUs from './pages/AboutUs';
import FAQ from './pages/FAQ';
import TermsConditions from './pages/TermsConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { checkAuth, isAuthenticated, token } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCart(token);
    }
  }, [isAuthenticated, token, fetchCart]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="products" element={<Products />} />
          <Route path="search" element={<Search />} />
          <Route path="category/:category" element={<Category />} />
          <Route path="product/:id" element={<ProductDetail />} />
          
          <Route path="about" element={<AboutUs />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="terms" element={<TermsConditions />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="contact" element={<ContactUs />} />
          
          <Route path="cart" element={
             <ProtectedRoute>
                <Cart />
             </ProtectedRoute>
          } />
          
          <Route path="checkout" element={
             <ProtectedRoute>
                <Checkout />
             </ProtectedRoute>
          } />
          
          <Route path="profile" element={
             <ProtectedRoute>
                <UserProfile />
             </ProtectedRoute>
          } />

          <Route path="orders" element={
             <ProtectedRoute>
                <OrderHistory />
             </ProtectedRoute>
          } />

          <Route path="order/:id" element={
             <ProtectedRoute>
                <OrderDetails />
             </ProtectedRoute>
          } />
        </Route>

        <Route path="seller/*" element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
        } />

        <Route path="admin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
