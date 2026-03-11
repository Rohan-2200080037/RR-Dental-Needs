import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const SellerDashboard = () => {
    const { token, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('analytics');
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
                if (activeTab === 'products' || activeTab === 'add-product') {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/seller/my-products`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProducts(res.data);
                    if (activeTab === 'add-product') {
                        setShowForm(true);
                        setEditingId(null);
                        setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '1st Year', image: ''});
                    } else {
                        setShowForm(false);
                    }
                } else if (activeTab === 'orders') {
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
            setOrders(orders.map(o => o.order_id === orderId ? { ...o, order_status: newStatus } : o));
            setFeedback(`Status updated to ${newStatus}`);
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
             setFeedback('Failed to update status');
        }
    };

    if (error && !user?.sellerId) {
        return (
            <DashboardLayout isAdmin={false}>
                <div className="flex flex-col items-center justify-center p-12 mt-12 bg-red-50 rounded-xl border border-red-100 max-w-2xl mx-auto text-center">
                    <h3 className="text-xl font-bold text-red-800 mb-2">Account Pending Approval</h3>
                    <p className="text-red-600">{error}</p>
                </div>
            </DashboardLayout>
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

    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
                activeTab === id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            {label}
        </button>
    );

    return (
        <DashboardLayout isAdmin={false} activeTab={activeTab === 'add-product' ? 'add-product' : showForm ? 'add-product' : activeTab} onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'products' && tab !== 'add-product') setShowForm(false);
        }}>
            <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Seller Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your inventory, track orders, and view sales performance.</p>
                    </div>
                    {activeTab === 'products' && (
                        <Button 
                            variant={showForm ? 'outline' : 'primary'}
                            onClick={() => {
                                setShowForm(!showForm);
                                if (!showForm) {
                                    setEditingId(null);
                                    setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '1st Year', image: ''});
                                }
                            }}
                        >
                            {showForm ? 'Cancel' : 'Add New Product'}
                        </Button>
                    )}
                </div>
                
                {feedback && (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-lg flex items-center">
                        <span className="font-medium">{feedback}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-lg flex items-center">
                        <span className="font-medium">{error}</span>
                    </div>
                )}



                <div className="mt-6">
                    {activeTab === 'orders' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="p-6">
                                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Total Revenue</p>
                                <p className="text-3xl font-bold text-primary">₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </Card>
                            <Card className="p-6">
                                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Total Orders</p>
                                <p className="text-3xl font-bold text-slate-900">{totalOrders}</p>
                            </Card>
                            <Card className="p-6">
                                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Products Sold</p>
                                <p className="text-3xl font-bold text-slate-900">{productsSold}</p>
                            </Card>
                        </div>
                    )}

                    {(activeTab === 'products' || activeTab === 'add-product') ? (
                        <div className="space-y-6">
                            {showForm && (
                                <Card className="p-6 animate-fade-in-down mb-8 border-t-4 border-t-primary">
                                    <h3 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                                    <form onSubmit={handleFormSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input label="Name" name="name" value={formData.name} onChange={handleFormChange} required />
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                                <select name="category" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-slate-900" value={formData.category} onChange={handleFormChange}>
                                                    <option value="1st Year">1st Year</option>
                                                    <option value="2nd Year">2nd Year</option>
                                                    <option value="3rd Year">3rd Year</option>
                                                    <option value="4th Year">4th Year</option>
                                                </select>
                                            </div>
                                            <Input label="Price (₹)" type="number" name="price" value={formData.price} onChange={handleFormChange} required min="0" step="0.01" />
                                            <Input label="Stock Quantity" type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleFormChange} required min="0" />
                                            
                                            <div className="md:col-span-2">
                                                <Input label="Image URL" type="url" name="image" value={formData.image} onChange={handleFormChange} placeholder="https://example.com/image.jpg" />
                                                {formData.image && (
                                                    <div className="mt-3">
                                                        <img src={formData.image} alt="Preview" className="h-32 object-cover rounded-lg shadow-sm border border-slate-200" onError={(e) => e.target.style.display='none'} />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                                <textarea 
                                                    name="description" 
                                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans" 
                                                    value={formData.description} 
                                                    onChange={handleFormChange} 
                                                    required 
                                                    rows="4"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4 border-t border-slate-100">
                                            <Button type="button" variant="ghost" className="mr-3" onClick={() => setShowForm(false)}>Cancel</Button>
                                            <Button type="submit" variant="primary">{editingId ? 'Update Product' : 'Save Product'}</Button>
                                        </div>
                                    </form>
                                </Card>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <Card className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {products.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                <img className="h-10 w-10 rounded-md object-cover border border-slate-200" src={p.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${p.image}` : (p.image || 'https://via.placeholder.com/100')} alt="" />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="font-medium text-slate-900">{p.name}</div>
                                                                <div className="text-slate-500 text-xs mt-0.5">#{p.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">{p.category}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">₹{Number(p.price).toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={p.stock_quantity > 10 ? 'success' : p.stock_quantity > 0 ? 'warning' : 'danger'}>
                                                            {p.stock_quantity}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        <button className="text-slate-400 hover:text-primary transition-colors inline-block p-1" onClick={() => handleEdit(p)} title="Edit">
                                                            <PencilSquareIcon className="h-5 w-5" />
                                                        </button>
                                                        <button className="text-slate-400 hover:text-danger transition-colors inline-block p-1" onClick={() => handleDeleteProduct(p.id)} title="Delete">
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {products.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                        No products listed yet. Click "Add New Product" to get started.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div className="orders-view">
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <Card className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Order ID</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Date</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Customer Details</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Items</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {orders.map(o => (
                                                <tr key={o.order_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">#{o.order_id}</td>
                                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(o.order_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-slate-900">{o.customer_name}</p>
                                                        <a href={`mailto:${o.customer_email}`} className="text-primary hover:underline block text-xs my-0.5">{o.customer_email}</a>
                                                        <p className="text-slate-600 text-xs mb-1">{o.phone}</p>
                                                        <p className="text-slate-500 text-xs leading-relaxed max-w-xs">{o.address}, {o.city}, {o.state} - {o.pincode}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <ul className="space-y-1">
                                                            {o.items?.map((i, idx) => (
                                                                <li key={idx} className="text-slate-600 flex items-center text-xs">
                                                                    <span className="font-medium text-slate-900 mr-1">{i.quantity}x</span> {i.name}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <select 
                                                            className={`block w-full text-sm rounded-lg border border-slate-300 py-1.5 pl-3 pr-8 focus:border-primary focus:ring-primary ${
                                                                o.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-800' : 
                                                                o.order_status === 'Shipped' ? 'bg-blue-50 text-blue-800' :
                                                                'bg-slate-50 text-slate-800'
                                                            }`}
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
                                            {orders.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                        No orders received yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SellerDashboard;
