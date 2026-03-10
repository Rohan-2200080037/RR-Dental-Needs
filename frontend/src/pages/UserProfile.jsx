import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import './Dashboard.css';

const UserProfile = () => {
    const { user, token } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [activeTab, setActiveTab] = useState('orders');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');
    const location = useLocation();
    const successMessage = location.state?.message;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [ordersResult, wishlistResult] = await Promise.allSettled([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/orders/my-orders`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/wishlist`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (ordersResult.status === 'fulfilled') {
                    setOrders(ordersResult.value.data);
                } else {
                    setError('Failed to fetch orders: ' + (ordersResult.reason?.response?.data?.message || ordersResult.reason?.message || 'Unknown error'));
                }

                if (wishlistResult.status === 'fulfilled') {
                    setWishlist(wishlistResult.value.data);
                }
                // wishlist failure is silently ignored so orders still show
            } catch (err) {
                setError('Failed to fetch user data.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchUserData();
        }
    }, [token]);


    const getStatusClass = (status) => {
        switch(status) {
            case 'Pending': return 'status-pending';
            case 'Packed': return 'status-packed';
            case 'Shipped': return 'status-shipped';
            case 'Delivered': return 'status-delivered';
            default: return '';
        }
    };

    const handleMoveToCart = async (wishlistId) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/wishlist/${wishlistId}/move-to-cart`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlist(wishlist.filter(w => w.wishlist_id !== wishlistId));
            setFeedback('Item moved to cart!');
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Failed to move to cart');
            setTimeout(() => setFeedback(''), 3000);
        }
    };

    const handleRemoveWishlist = async (wishlistId) => {
        if(!window.confirm("Remove item from wishlist?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/wishlist/${wishlistId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlist(wishlist.filter(w => w.wishlist_id !== wishlistId));
            setFeedback('Item removed from wishlist.');
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Failed to remove from wishlist');
            setTimeout(() => setFeedback(''), 3000);
        }
    };

    return (
        <div className="container page-container">
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {feedback && <div className="alert alert-success">{feedback}</div>}
            
            <div className="dashboard-header">
                <h1>My Profile</h1>
                <div className="user-details-card card">
                    <div className="user-avatar">{user?.name?.charAt(0)}</div>
                    <div>
                        <h3>{user?.name}</h3>
                        <p>{user?.email}</p>
                        <span className="role-badge">Student</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-tabs" style={{marginTop: '20px'}}>
                <button 
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Order History
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wishlist')}
                >
                    My Wishlist
                </button>
            </div>

            <section className="dashboard-content">
                {activeTab === 'orders' && (
                    <>
                        <h2>Order History</h2>
                        
                        {loading ? (
                            <div className="loading-spinner">Loading orders...</div>
                        ) : error ? (
                            <div className="alert alert-danger">{error}</div>
                        ) : orders.length === 0 ? (
                            <div className="empty-state card">
                                <h3>No orders yet</h3>
                                <p>When you purchase instruments, they will appear here.</p>
                            </div>
                        ) : (
                            <div className="orders-list">
                                {orders.map(order => (
                                    <div key={order.id} className="order-card card">
                                        <div className="order-header">
                                            <div>
                                                <span className="order-id">Order #{order.id}</span>
                                                <span className="order-date">{new Date(order.order_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="order-status-wrapper" style={{ width: '100%', marginTop: '15px' }}>
                                                <div className="order-timeline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', width: '100%' }}>
                                                    {['Pending', 'Packed', 'Shipped', 'Delivered'].map((step, index, array) => {
                                                        const currentStatusIndex = array.indexOf(order.order_status);
                                                        const isCompleted = index <= currentStatusIndex;
                                                        const isActive = index === currentStatusIndex;
                                                        
                                                        return (
                                                            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                                                                <div 
                                                                    style={{ 
                                                                        width: '20px', height: '20px', borderRadius: '50%', 
                                                                        backgroundColor: isCompleted ? 'var(--primary-color)' : '#ddd',
                                                                        boxShadow: isActive ? '0 0 0 3px rgba(0, 150, 255, 0.3)' : 'none',
                                                                        marginBottom: '5px'
                                                                    }}
                                                                ></div>
                                                                <span style={{ fontSize: '12px', color: isCompleted ? 'var(--text-color)' : '#999', fontWeight: isActive ? 'bold' : 'normal' }}>
                                                                    {step}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                    {/* Progress Line */}
                                                    <div style={{ position: 'absolute', top: '10px', left: '10%', right: '10%', height: '2px', backgroundColor: '#ddd', zIndex: 0 }}>
                                                        <div style={{ 
                                                            height: '100%', 
                                                            backgroundColor: 'var(--primary-color)', 
                                                            width: `${(['Pending', 'Packed', 'Shipped', 'Delivered'].indexOf(order.order_status) / 3) * 100}%`,
                                                            transition: 'width 0.3s ease'
                                                        }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="order-items">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="order-item-row">
                                                    <div className="order-item-info">
                                                        <span className="item-qty">{item.quantity}x</span>
                                                        <span className="item-name">{item.name}</span>
                                                    </div>
                                                    <span className="item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="order-footer">
                                            <div className="delivery-info">
                                                <strong>Delivery to:</strong>
                                                <p>{order.delivery_name}, {order.address}, {order.city}</p>
                                            </div>
                                            <div className="order-total">
                                                <span>Total:</span>
                                                <strong>₹{Number(order.total_price).toLocaleString()}</strong>
                                                <small className="payment-method">({order.payment_method})</small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'wishlist' && (
                    <>
                        <h2>My Wishlist</h2>
                        {loading ? (
                            <div className="loading-spinner">Loading wishlist...</div>
                        ) : wishlist.length === 0 ? (
                            <div className="empty-state card">
                                <h3>Wishlist is empty</h3>
                                <p>Save items you like for later purchase.</p>
                            </div>
                        ) : (
                            <div className="data-table-wrapper card">
                                 <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Product Name</th>
                                            <th>Price</th>
                                            <th>Stock Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wishlist.map(item => (
                                            <tr key={item.wishlist_id}>
                                                <td>
                                                    <img 
                                                        src={item.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${item.image}` : (item.image || 'https://via.placeholder.com/50')} 
                                                        alt={item.name} 
                                                        className="table-img" 
                                                    />
                                                </td>
                                                <td>{item.name}</td>
                                                <td>₹{Number(item.price).toLocaleString()}</td>
                                                <td>
                                                    <span className={`stock-badge-sm ${item.stock_quantity > 0 ? 'bg-success' : 'bg-danger'}`}>
                                                        {item.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                </td>
                                                <td className="table-actions">
                                                    <button 
                                                        className="btn btn-primary btn-sm" 
                                                        onClick={() => handleMoveToCart(item.wishlist_id)}
                                                        disabled={item.stock_quantity <= 0}
                                                    >
                                                        Move to Cart
                                                    </button>
                                                    <button 
                                                        className="btn btn-danger btn-sm" 
                                                        onClick={() => handleRemoveWishlist(item.wishlist_id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};

export default UserProfile;
