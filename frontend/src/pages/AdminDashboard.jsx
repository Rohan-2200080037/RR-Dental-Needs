import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import './Dashboard.css';

const AdminDashboard = () => {
    const { token } = useAuthStore();
    const [activeTab, setActiveTab] = useState('analytics');
    
    // Data states
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'analytics') {
                const res = await axios.get('http://localhost:5000/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } });
                setAnalytics(res.data);
            } else if (activeTab === 'users') {
                const res = await axios.get('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
                setUsers(res.data);
            } else if (activeTab === 'sellers') {
                const res = await axios.get('http://localhost:5000/api/admin/sellers', { headers: { Authorization: `Bearer ${token}` } });
                setSellers(res.data);
            } else if (activeTab === 'products') {
                const res = await axios.get('http://localhost:5000/api/products'); // Public, but admin views it here
                setProducts(res.data);
            } else if (activeTab === 'orders') {
               const res = await axios.get('http://localhost:5000/api/orders/all', { headers: { Authorization: `Bearer ${token}` } });
               setOrders(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, token]);

    const showFeedback = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 3000);
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Delete this user permanently? This will cascade delete their cart, orders, etc.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            setUsers(users.filter(u => u.id !== id));
            showFeedback("User deleted successfully.");
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Deletion failed.');
        }
    };

    const handleSellerStatusUpdate = async (sellerId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/sellers/${sellerId}/status`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSellers(sellers.map(s => s.seller_id === sellerId ? { ...s, approved_status: newStatus } : s));
            showFeedback(`Seller status updated to ${newStatus}.`);
        } catch (err) {
            showFeedback('Failed to update seller status.');
        }
    };

    const handleOrderStatusUpdate = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
            showFeedback(`Order status updated.`);
        } catch (err) {
             showFeedback('Failed to update order status');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Delete this product permanently?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            setProducts(products.filter(p => p.id !== id));
            showFeedback("Product deleted successfully.");
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Deletion failed.');
        }
    };

    return (
        <div className="container page-container">
            <h1 className="page-title">Admin Dashboard</h1>
            
            {feedback && <div className="alert alert-success">{feedback}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="dashboard-tabs">
                <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
                <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
                <button className={`tab-btn ${activeTab === 'sellers' ? 'active' : ''}`} onClick={() => setActiveTab('sellers')}>Sellers</button>
                <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
                <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>All Orders</button>
            </div>

            <div className="dashboard-content">
                {loading ? <div className="loading-spinner">Loading System Data...</div> : (
                    <>
                        {activeTab === 'analytics' && analytics && (
                            <div className="analytics-view">
                                <h2>System Overview</h2>
                                <div className="analytics-grid mt-4">
                                    <div className="card stat-card">
                                        <div className="stat-title">Total Users</div>
                                        <div className="stat-value">{analytics.totalUsers}</div>
                                    </div>
                                    <div className="card stat-card">
                                        <div className="stat-title">Registered Sellers</div>
                                        <div className="stat-value">{analytics.totalSellers}</div>
                                    </div>
                                    <div className="card stat-card">
                                        <div className="stat-title">Total Orders Placed</div>
                                        <div className="stat-value">{analytics.totalOrders}</div>
                                    </div>
                                    <div className="card stat-card">
                                        <div className="stat-title">Platform Revenue</div>
                                        <div className="stat-value">₹{Number(analytics.totalRevenue).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="data-table-wrapper card">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Created At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>#{u.id}</td>
                                                <td>{u.name}</td>
                                                <td>{u.email}</td>
                                                <td><span className="role-badge" style={{marginTop: 0}}>{u.role}</span></td>
                                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    {u.role !== 'admin' && (
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id)}>Delete</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'sellers' && (
                            <div className="data-table-wrapper card">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Seller ID</th>
                                            <th>User Info</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sellers.map(s => (
                                            <tr key={s.seller_id}>
                                                <td>#{s.seller_id}</td>
                                                <td>
                                                    <strong>{s.name}</strong><br/>
                                                    <small className="text-secondary">{s.email}</small>
                                                </td>
                                                <td>
                                                     <span className={`stock-badge-sm ${s.approved_status === 'approved' ? 'bg-success' : s.approved_status === 'rejected' ? 'bg-danger' : 'bg-warning'}`} style={{ backgroundColor: s.approved_status === 'pending' ? '#eab308' : undefined}}>
                                                        {s.approved_status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="table-actions">
                                                    {s.approved_status !== 'approved' && (
                                                        <button className="btn btn-primary btn-sm" onClick={() => handleSellerStatusUpdate(s.seller_id, 'approved')}>Approve</button>
                                                    )}
                                                    {s.approved_status !== 'rejected' && (
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleSellerStatusUpdate(s.seller_id, 'rejected')}>Reject</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'products' && (
                            <div className="data-table-wrapper card">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product ID</th>
                                            <th>Name</th>
                                            <th>Seller ID</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id}>
                                                <td>#{p.id}</td>
                                                <td>{p.name}</td>
                                                <td>#{p.seller_id}</td>
                                                <td>₹{Number(p.price).toLocaleString()}</td>
                                                <td>{p.stock_quantity}</td>
                                                <td className="table-actions">
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                             <div className="data-table-wrapper card">
                             <table className="data-table">
                                 <thead>
                                     <tr>
                                         <th>Order ID</th>
                                         <th>Date</th>
                                         <th>User Email</th>
                                         <th>Total Price</th>
                                         <th>Method</th>
                                         <th>Status</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {orders.map(o => (
                                         <tr key={o.id}>
                                             <td>#{o.id}</td>
                                             <td>{new Date(o.order_date).toLocaleDateString()}</td>
                                             <td>{o.user_email}</td>
                                             <td>₹{Number(o.total_price).toLocaleString()}</td>
                                             <td>{o.payment_method}</td>
                                             <td>
                                                 <select 
                                                     className={`form-input status-select ${o.order_status.toLowerCase()}`}
                                                     value={o.order_status}
                                                     onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                                                 >
                                                     <option value="Pending">Pending</option>
                                                     <option value="Packed">Packed</option>
                                                     <option value="Shipped">Shipped</option>
                                                     <option value="Delivered">Delivered</option>
                                                 </select>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                             {orders.length === 0 && <div className="p-4 text-center">No orders received yet.</div>}
                         </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
