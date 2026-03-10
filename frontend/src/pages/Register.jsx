import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

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
            setSuccess('Registration successful! Please login.');
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
        <div className="auth-container">
            <div className="card auth-card">
                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Join OdonticStore today</p>
                </div>
                
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
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
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary auth-btn" disabled={isLoading}>
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login" className="auth-link">Sign in here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
