import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import './Auth.css';

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
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Sign in to access your account</p>
                </div>
                
                {error && <div className="alert alert-danger">{error}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            autoComplete="email"
                            className="form-input"
                            value={credentials.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            className="form-input"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary auth-btn" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <Link to="/forgot-password" style={{ color: '#0056b3', textDecoration: 'none', fontSize: '14px' }}>Forgot Password?</Link>
                    </div>
                </form>
                
                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register" className="auth-link">Register here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
