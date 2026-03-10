import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Auth.css';

const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const query = useQuery();
    const token = query.get('token');
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
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, { token, password: newPassword });
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
        <div className="auth-container">
            <div className="card auth-card">
                <div className="auth-header">
                    <h2>Reset Password</h2>
                    <p>Enter your new password below</p>
                </div>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                {token ? (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                className="form-input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="form-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button type="submit" className="btn btn-primary auth-btn" disabled={isLoading}>
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                ) : (
                    <div className="alert alert-danger">
                        Invalid or missing reset token. Ensure you clicked the full link from your email.
                    </div>
                )}

                <div className="auth-footer">
                    <p><Link to="/login" className="auth-link">Back to Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
