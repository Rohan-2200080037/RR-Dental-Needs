import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, credentials);
            const data = res.data;
            
            login({
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role,
                sellerId: data.sellerId
            }, data.accessToken);

            if (data.role === 'admin') navigate('/admin');
            else if (data.role === 'seller') navigate('/seller');
            else navigate('/');
            
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full p-8 shadow-xl border-t-4 border-t-primary animate-fade-in-up">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
                    <p className="text-slate-500">Sign in to access your account</p>
                </div>
                
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-start text-sm font-medium">
                            <XMarkIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Email Address"
                        type="email"
                        id="email"
                        name="email"
                        autoComplete="email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                        placeholder="you@student.com"
                    />
                    <Input
                        label="Password"
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                    />
                    
                    <div className="flex items-center justify-between mt-2">
                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-hover transition-colors">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>
                    
                    <Button type="submit" variant="primary" className="w-full h-12 text-lg shadow-md" isLoading={isLoading}>
                        Sign In
                    </Button>
                </form>
                
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold text-primary hover:text-primary-hover transition-colors">
                            Register here
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
