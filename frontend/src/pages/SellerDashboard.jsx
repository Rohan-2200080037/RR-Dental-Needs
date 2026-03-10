import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import './Dashboard.css';

const SellerDashboard = () => {
    const { token, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');

    // Product Form State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', stock_quantity: '', category: '1st Year', image: ''
    });

    useEffect(() => {
        if (!user?.sellerId) {
             setError("Your seller account is pending approval by an admin. You cannot access seller features yet.");
             setLoading(false);
             return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'products') {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/seller/my-products`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProducts(res.data);
                } else {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/seller-orders`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setOrders(res.data);
                }
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, token, user?.sellerId]);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFeedback('');
        try {
            if (editingId) {
                 await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${editingId}`, formData, {
                     headers: { Authorization: `Bearer ${token}` }
                 });
                 setFeedback("Product updated successfully");
            } else {
                 await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, formData, {
                     headers: { Authorization: `Bearer ${token}` }
                 });
                 setFeedback("Product created successfully");
            }
            
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '1st Year', image: ''});
            
            // Refresh products
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/seller/my-products`, {
                        headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(res.data);
            
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Action failed');
        }
    };

    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            stock_quantity: product.stock_quantity,
            category: product.category,
            image: product.image || ''
        });
        setEditingId(product.id);
        setShowForm(true);
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(products.filter(p => p.id !== id));
            setFeedback("Product deleted successfully");
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Delete failed');
        }
    };

    const handleOrderStatusUpdate = async (orderId, newStatus) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setOrders(orders.map(o => o.order_id === orderId ? { ...o, order_status: newStatus } : o));
            setFeedback(`Status updated to ${newStatus}`);
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
             setFeedback('Failed to update status');
        }
    };

    if (error && !user?.sellerId) {
        return (
            <div className="container page-container">
                <div className="alert alert-danger empty-state">
                    <h3>Account Pending Approval</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Calculate Analytics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, order) => {
        const orderTotal = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        return acc + orderTotal;
    }, 0);
    const productsSold = orders.reduce((acc, order) => {
        const itemsSold = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return acc + itemsSold;
    }, 0);

    return (
        <div className="container page-container">
            <h1 className="page-title">Seller Dashboard</h1>
            
            {feedback && <div className="alert alert-success">{feedback}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="dashboard-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    My Products
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Order Management
                </button>
            </div>

            <div className="dashboard-content">
                <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                    <div className="card text-center" style={{ padding: '20px' }}>
                        <h3 className="text-secondary" style={{ fontSize: '14px', textTransform: 'uppercase' }}>Total Revenue</h3>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary-color)' }}>₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="card text-center" style={{ padding: '20px' }}>
                        <h3 className="text-secondary" style={{ fontSize: '14px', textTransform: 'uppercase' }}>Total Orders</h3>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalOrders}</div>
                    </div>
                    <div className="card text-center" style={{ padding: '20px' }}>
                        <h3 className="text-secondary" style={{ fontSize: '14px', textTransform: 'uppercase' }}>Products Sold</h3>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{productsSold}</div>
                    </div>
                </div>

                {activeTab === 'products' ? (
                    <div className="products-view">
                        <div className="action-bar">
                            <h2>My Inventory</h2>
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowForm(!showForm);
                                    if(!showForm) {
                                        setEditingId(null);
                                        setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '1st Year', image: ''});
                                    }
                                }}
                            >
                                {showForm ? 'Cancel' : 'Add New Product'}
                            </button>
                        </div>

                        {showForm && (
                            <div className="card form-card mb-4">
                                <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                                <form onSubmit={handleFormSubmit}>
                                    <div className="grid-cols-2">
                                        <div className="form-group">
                                            <label className="form-label">Name</label>
                                            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleFormChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Category</label>
                                            <select name="category" className="form-input" value={formData.category} onChange={handleFormChange}>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                                <option value="4th Year">4th Year</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Price (₹)</label>
                                            <input type="number" name="price" className="form-input" value={formData.price} onChange={handleFormChange} required min="0" step="0.01" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Stock Quantity</label>
                                            <input type="number" name="stock_quantity" className="form-input" value={formData.stock_quantity} onChange={handleFormChange} required min="0" />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                             <label className="form-label">Image URL</label>
                                             <input type="url" name="image" className="form-input" value={formData.image} onChange={handleFormChange} placeholder="https://example.com/image.jpg" />
                                             {formData.image && (
                                                 <img src={formData.image} alt="Preview" style={{ marginTop: '8px', maxHeight: '100px', borderRadius: '6px', objectFit: 'cover' }} onError={(e) => e.target.style.display='none'} />
                                             )}
                                         </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="form-label">Description</label>
                                            <textarea name="description" className="form-input" value={formData.description} onChange={handleFormChange} required rows="3"></textarea>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary">Save Product</button>
                                </form>
                            </div>
                        )}

                        {loading ? <div className="loading-spinner">Loading...</div> : (
                            <div className="data-table-wrapper card">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Image</th>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id}>
                                                <td>#{p.id}</td>
                                                <td><img src={p.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${p.image}` : (p.image || 'https://via.placeholder.com/50')} alt={p.name} className="table-img" /></td>
                                                <td>{p.name}</td>
                                                <td>{p.category}</td>
                                                <td>₹{Number(p.price).toLocaleString()}</td>
                                                <td>
                                                    <span className={`stock-badge-sm ${p.stock_quantity > 0 ? 'bg-success' : 'bg-danger'}`}>
                                                        {p.stock_quantity}
                                                    </span>
                                                </td>
                                                <td className="table-actions">
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {products.length === 0 && <div className="p-4 text-center">No products listed yet.</div>}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="orders-view">
                        <h2>Order Management</h2>
                        {loading ? <div className="loading-spinner">Loading...</div> : (
                             <div className="data-table-wrapper card">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Customer Details</th>
                                            <th>Items</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o.order_id}>
                                                <td>#{o.order_id}</td>
                                                <td>{new Date(o.order_date).toLocaleDateString()}</td>
                                                <td>
                                                    <strong>{o.customer_name}</strong><br />
                                                    <a href={`mailto:${o.customer_email}`} className="text-primary">{o.customer_email}</a><br />
                                                    {o.phone}<br />
                                                    <small className="text-secondary">{o.address}, {o.city}, {o.state} - {o.pincode}</small>
                                                </td>
                                                <td>
                                                    <ul className="item-list-sm">
                                                        {o.items?.map((i, idx) => (
                                                            <li key={idx}>{i.quantity}x {i.name}</li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td>
                                                    <select 
                                                        className={`form-input status-select ${o.order_status.toLowerCase()}`}
                                                        value={o.order_status}
                                                        onChange={(e) => handleOrderStatusUpdate(o.order_id, e.target.value)}
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;
