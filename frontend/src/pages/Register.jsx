import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, formData);
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full p-8 shadow-xl border-t-4 border-t-primary animate-fade-in-up">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Create Account</h2>
                    <p className="text-slate-500">Join the best store for dental students</p>
                </div>
                
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-start text-sm font-medium">
                            <XMarkIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex items-start text-sm font-medium">
                            <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{success}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Full Name"
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="you@student.com"
                    />
                    <Input
                        label="Password"
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Min 6 characters"
                        minLength="6"
                    />
                    
                    <Button type="submit" variant="primary" className="w-full h-12 text-lg shadow-md mt-4" isLoading={isLoading}>
                        Create Account
                    </Button>
                </form>
                
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-primary hover:text-primary-hover transition-colors">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Register;
