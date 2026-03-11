import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { CheckCircleIcon, XMarkIcon, KeyIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (!token) {
            return setError('Reset token is missing from the URL');
        }

        setIsLoading(true);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`, { password: newPassword });
            setMessage('Password reset successful. You can now login.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset link is invalid or expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full p-8 shadow-xl border-t-4 border-t-primary animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Reset Password</h2>
                    <p className="text-slate-500">Enter your new password below to regain access.</p>
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

                {token ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="New Password"
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                            minLength="6"
                        />
                        <Input
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter new password"
                            minLength="6"
                        />
                        
                        <Button type="submit" variant="primary" className="w-full h-12 text-lg shadow-md" isLoading={isLoading}>
                            Reset Password
                        </Button>
                    </form>
                ) : (
                    <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-center text-sm font-medium mb-6">
                        Invalid or missing reset token. Ensure you clicked the full link from your email.
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-600">
                        <Link to="/login" className="font-bold text-primary hover:text-primary-hover transition-colors">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default ResetPassword;
