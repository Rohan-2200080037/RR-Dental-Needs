import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
            setMessage(res.data.message || 'If this email is registered, a reset link has been sent.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request reset link.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full p-8 shadow-xl border-t-4 border-t-primary animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Forgot Password</h2>
                    <p className="text-slate-500">Enter your email and we'll send you a link to get back into your account.</p>
                </div>

                <AnimatePresence>
                    {message && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex items-start text-sm font-medium">
                            <CheckCircleIcon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                            <span>{message}</span>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-start text-sm font-medium">
                            <XMarkIcon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your registered email"
                    />
                    
                    <Button type="submit" variant="primary" className="w-full h-12 text-lg shadow-md" isLoading={isLoading}>
                        Send Reset Link
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-600">
                        Remember your password?{' '}
                        <Link to="/login" className="font-bold text-primary hover:text-primary-hover transition-colors">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default ForgotPassword;
