import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { TrashIcon } from '@heroicons/react/24/outline'; // v2 outline
import './Cart.css';

const Cart = () => {
    const { items, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
    const { token } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchCart(token);
        }
    }, [token, fetchCart]);

    const handleQuantityChange = async (cartId, newQuantity, maxStock) => {
        if (newQuantity < 1) return;
        if (newQuantity > maxStock) {
            alert("Requested quantity exceeds available stock.");
            return;
        }
        await updateQuantity(cartId, newQuantity, token);
    };

    const handleRemove = async (cartId) => {
        if (window.confirm("Remove item from cart?")) {
            await removeFromCart(cartId, token);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    if (loading && items.length === 0) return <div className="container page-container loading-spinner">Loading cart...</div>;

    return (
        <div className="container page-container">
            <h1 className="page-title">Shopping Cart</h1>
            {error && <div className="alert alert-danger">{error}</div>}

            {items.length === 0 ? (
                <div className="empty-cart-state">
                    <div className="empty-cart-icon">🛒</div>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added any instruments yet.</p>
                    <Link to="/products" className="btn btn-primary mt-4">Browse Instruments</Link>
                </div>
            ) : (
                <div className="cart-layout">
                    <div className="cart-items-section">
                        {items.map(item => (
                            <div key={item.cart_id} className="cart-item-card">
                                <img 
                                    src={item.image?.startsWith('/uploads') ? `http://localhost:5000${item.image}` : (item.image || 'https://via.placeholder.com/150')} 
                                    alt={item.name} 
                                    className="cart-item-img"
                                />
                                <div className="cart-item-details">
                                    <Link to={`/product/${item.product_id}`} className="cart-item-name">{item.name}</Link>
                                    <p className="cart-item-price">₹{Number(item.price).toLocaleString()}</p>
                                    
                                    <div className="cart-item-actions">
                                        <div className="quantity-selector-sm">
                                            <button 
                                                onClick={() => handleQuantityChange(item.cart_id, item.quantity - 1, item.stock_quantity)}
                                                disabled={item.quantity <= 1}
                                            >-</button>
                                            <span>{item.quantity}</span>
                                            <button 
                                                onClick={() => handleQuantityChange(item.cart_id, item.quantity + 1, item.stock_quantity)}
                                                disabled={item.quantity >= item.stock_quantity}
                                            >+</button>
                                        </div>
                                        <button 
                                            className="btn-remove-item"
                                            onClick={() => handleRemove(item.cart_id)}
                                            title="Remove item"
                                        >
                                            <TrashIcon className="trash-icon" />
                                        </button>
                                    </div>
                                </div>
                                <div className="cart-item-subtotal">
                                    ₹{(item.price * item.quantity).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary-section">
                        <div className="card summary-card">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal ({items.length} items)</span>
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
                                className="btn btn-primary btn-checkout"
                                onClick={() => navigate('/checkout')}
                            >
                                Proceed to Checkout
                            </button>
                            
                            <Link to="/products" className="btn btn-secondary btn-continue">Continue Shopping</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
