import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import './Cart.css'; // Reusing some layout styles

const Checkout = () => {
    const { items, fetchCart, clearCartState } = useCartStore();
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (items.length === 0) {
            navigate('/cart');
        }
    }, [items, navigate]);

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post('http://localhost:5000/api/orders', 
                { ...formData, paymentMethod: 'COD' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            clearCartState();
            navigate('/profile', { state: { message: 'Order placed successfully!' } });
        } catch (err) {
             setError(err.response?.data?.message || 'Failed to place order.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container page-container">
            <h1 className="page-title">Checkout</h1>
            
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="checkout-layout">
                <div className="checkout-form-section">
                    <div className="card padding-xl">
                        <h2>Delivery Details</h2>
                        <form id="checkout-form" onSubmit={handleCheckout} className="mt-4">
                            <div className="grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="name">Full Name</label>
                                    <input type="text" id="name" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="phone">Phone Number</label>
                                    <input type="tel" id="phone" name="phone" className="form-input" value={formData.phone} onChange={handleChange} required />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label" htmlFor="address">Address</label>
                                <textarea id="address" name="address" className="form-input" rows="3" value={formData.address} onChange={handleChange} required></textarea>
                            </div>
                            
                            <div className="grid-cols-3">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="city">City</label>
                                    <input type="text" id="city" name="city" className="form-input" value={formData.city} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="state">State</label>
                                    <input type="text" id="state" name="state" className="form-input" value={formData.state} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="pincode">Pincode</label>
                                    <input type="text" id="pincode" name="pincode" className="form-input" value={formData.pincode} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="payment-method-sec mt-4">
                                <h3>Payment Method</h3>
                                <div className="payment-option selected">
                                    <input type="radio" id="cod" name="payment" checked readOnly />
                                    <label htmlFor="cod">Cash on Delivery (COD) Only</label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="checkout-summary-section">
                    <div className="card summary-card sticky-sidebar">
                        <h3>Order Summary</h3>
                        <div className="checkout-items-preview">
                            {items.map(item => (
                                <div key={item.cart_id} className="preview-item">
                                    <span className="preview-name">{item.name} x {item.quantity}</span>
                                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <hr className="summary-divider" />
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{calculateTotal().toLocaleString()}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span className="text-success">Free</span>
                        </div>
                        <hr className="summary-divider" />
                        <div className="summary-row total-row">
                            <span>Total</span>
                            <span>₹{calculateTotal().toLocaleString()}</span>
                        </div>
                        
                        <button 
                            type="submit" 
                            form="checkout-form"
                            className="btn btn-primary btn-checkout mt-4"
                            disabled={loading || items.length === 0}
                        >
                            {loading ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
