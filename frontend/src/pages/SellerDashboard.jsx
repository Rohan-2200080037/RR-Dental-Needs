import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { PencilSquareIcon, TrashIcon, ShoppingBagIcon, ClipboardDocumentListIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const SellerDashboard = () => {
    const { token, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('analytics');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [orderSubTab, setOrderSubTab] = useState('to-deliver'); // 'to-deliver' or 'delivered'

    // Product Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [yearFilter, setYearFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Product Form State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', stock_quantity: '', year: '1st Year', category: 'permanent teeth wax carvings', image: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');

    // Shipping management states
    const [shippingSubTab, setShippingSubTab] = useState('pending'); // 'pending', 'shipped', 'delivered'
    const [editingShipping, setEditingShipping] = useState(null);
    const [shippingForm, setShippingForm] = useState({
        courier_name: '',
        tracking_number: '',
        shipping_status: 'Pending'
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const getPreviewSrc = () => {
        if (imagePreviewUrl) {
            return imagePreviewUrl;
        }
        if (formData.image) {
            return formData.image.startsWith('/uploads')
                ? `${import.meta.env.VITE_API_URL}${formData.image}`
                : formData.image;
        }
        return '';
    };

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
                        setFormData({ name: '', description: '', price: '', stock_quantity: '', year: '1st Year', category: 'permanent teeth wax carvings', image: '' });
                        setImageFile(null);
                        setImagePreviewUrl('');
                    } else {
                        setShowForm(false);
                    }
                } else if (activeTab === 'orders' || activeTab === 'logistics') {
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
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('description', formData.description);
            submitData.append('price', formData.price);
            submitData.append('stock_quantity', formData.stock_quantity);
            submitData.append('year', formData.year);
            submitData.append('category', formData.category);

            if (imageFile) {
                submitData.append('image', imageFile);
            } else if (formData.image) {
                submitData.append('image', formData.image);
            }

            if (editingId) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${editingId}`, submitData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setFeedback("Product updated successfully");
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, submitData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setFeedback("Product created successfully");
            }

            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', description: '', price: '', stock_quantity: '', year: '1st Year', category: 'permanent teeth wax carvings', image: '' });
            setImageFile(null);
            setImagePreviewUrl('');

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
            year: product.year || '1st Year',
            category: product.category || 'permanent teeth wax carvings',
            image: product.image || ''
        });
        setImageFile(null);
        setImagePreviewUrl('');
        setEditingId(product.id);
        setShowForm(true);
        setTimeout(() => {
            const formElement = document.getElementById('product-form');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
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
            setTimeout(() => setFeedback(''), 3000);
        }
    };

    const handlePaymentStatusUpdate = async (orderId) => {
        if (!window.confirm("Mark this order as Paid? This action cannot be reversed.")) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/payment-status`, { status: 'Completed' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(orders.map(o => o.order_id === orderId ? { ...o, payment_status: 'Completed' } : o));
            setFeedback("Payment marked as Completed");
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Failed to update payment status');
            setTimeout(() => setFeedback(''), 3000);
        }
    };

    const handleCreateShipment = async (orderId) => {
        try {
            setLoading(true);
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/shipping/create/${orderId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedback(`Shipment created! SR ID: ${data.shipmentId}`);
            await refreshOrders();
            setTimeout(() => setFeedback(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create shipment');
            setTimeout(() => setError(null), 5000);
        } finally { setLoading(false); }
    };

    const handleAssignAWB = async (shipmentId, courierId) => {
        try {
            setLoading(true);
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/shipping/assign-awb/${shipmentId}`, { courierId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedback(`AWB assigned: ${data.awb}`);
            await refreshOrders();
            setTimeout(() => setFeedback(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign AWB');
            setTimeout(() => setError(null), 5000);
        } finally { setLoading(false); }
    };

    const handleRequestPickup = async (shipmentId) => {
        try {
            setLoading(true);
            await axios.post(`${import.meta.env.VITE_API_URL}/api/shipping/pickup/${shipmentId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedback("Pickup requested!");
            await refreshOrders();
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request pickup');
            setTimeout(() => setError(null), 5000);
        } finally { setLoading(false); }
    };

    const handleGenerateLabel = async (shipmentId) => {
        try {
            setLoading(true);
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/shipping/label/${shipmentId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.open(data.labelUrl, '_blank');
            setFeedback("Label generated!");
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate label');
            setTimeout(() => setError(null), 5000);
        } finally { setLoading(false); }
    };

    const handleUpdateShipping = async (orderId) => {
        try {
            setLoading(true);
            await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/shipping`, shippingForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedback("Shipping info updated successfully!");
            await refreshOrders();
            setEditingShipping(null);
            setShippingForm({ courier_name: '', tracking_number: '', shipping_status: 'Pending' });
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update shipping info');
            setTimeout(() => setError(null), 5000);
        } finally { setLoading(false); }
    };

    const refreshOrders = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/seller-orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
    };

    const openShippingForm = (order) => {
        setEditingShipping(order.order_id);
        setShippingForm({
            courier_name: order.courier_name || '',
            tracking_number: order.tracking_number || '',
            shipping_status: order.shipping_status || 'Pending'
        });
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
    const activeOrders = orders.filter(o => o.order_status !== 'Cancelled');
    const deliveredOrders = orders.filter(o => o.order_status === 'Delivered');

    const totalOrders = activeOrders.length;
    const totalRevenue = deliveredOrders.reduce((acc, order) => {
        const orderTotal = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        return acc + orderTotal;
    }, 0);
    const productsSold = deliveredOrders.reduce((acc, order) => {
        const itemsSold = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return acc + itemsSold;
    }, 0);

    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === id
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Seller Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your inventory, track orders, and view sales performance.</p>
                    </div>
                    {activeTab === 'products' && (
                        <div className="flex sm:justify-end">
                            <Button
                                variant={showForm ? 'outline' : 'primary'}
                                className="w-full sm:w-auto shadow-lg shadow-primary/20"
                                onClick={() => {
                                    setShowForm(!showForm);
                                    if (!showForm) {
                                        setEditingId(null);
                                        setFormData({ name: '', description: '', price: '', stock_quantity: '', year: '1st Year', category: 'permanent teeth wax carvings', image: '' });
                                        setImageFile(null);
                                        setImagePreviewUrl('');
                                    }
                                }}
                            >
                                {showForm ? 'Cancel' : 'Add New Product'}
                            </Button>
                        </div>
                    )}
                </div>

                {feedback && (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex items-center animate-fade-in shadow-sm">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                            <Card className="premium-card p-6 relative overflow-hidden group animate-premium bg-gradient-to-br from-teal-600 to-emerald-700 border-none">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full transition-transform group-hover:scale-150 duration-700"></div>
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-teal-100 uppercase tracking-widest mb-1">Monthly Revenue</p>
                                    <p className="text-3xl font-black text-white">₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <div className="mt-4 flex items-center text-[10px] font-bold text-white bg-white/20 w-fit px-2 py-1 rounded-full">
                                        <span>Verified Earnings</span>
                                    </div>
                                </div>
                            </Card>
                            <Card className="premium-card p-6 relative overflow-hidden group animate-premium" style={{ animationDelay: '0.1s' }}>
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-700"></div>
                                <div className="relative z-10 text-center sm:text-left">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                                    <p className="text-3xl font-black text-slate-900">{totalOrders}</p>
                                    <div className="mt-4 flex items-center justify-center sm:justify-start">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-200"></div>)}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 ml-3">Active Pipeline</span>
                                    </div>
                                </div>
                            </Card>
                            <Card className="premium-card p-6 relative overflow-hidden group animate-premium" style={{ animationDelay: '0.2s' }}>
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full transition-transform group-hover:scale-150 duration-700"></div>
                                <div className="relative z-10 text-center sm:text-left">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Products Sold</p>
                                    <p className="text-3xl font-black text-slate-900">{productsSold}</p>
                                    <div className="mt-4 flex items-center justify-center sm:justify-start text-[10px] font-bold text-indigo-500 bg-indigo-500/10 w-fit px-2 py-1 rounded-full">
                                        <span>Inventory Velocity</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}                    {(activeTab === 'products' || activeTab === 'add-product') ? (
                        <div className="space-y-8">
                            {showForm && (
                                <Card id="product-form" className="border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-white">
                                        <h3 className="text-base font-semibold text-slate-800">
                                            {editingId ? 'Edit Product' : 'New Product'}
                                        </h3>
                                    </div>
                                    <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <Input label="Product Name" name="name" value={formData.name} onChange={handleFormChange} required placeholder="e.g. Dental Mirror" />
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Year</label>
                                                <select name="year" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm text-slate-700 transition-all" value={formData.year} onChange={handleFormChange}>
                                                    <option value="1st Year">1st Year</option>
                                                    <option value="2nd Year">2nd Year</option>
                                                    <option value="3rd Year">3rd Year</option>
                                                    <option value="4th Year">4th Year</option>
                                                </select>
                                            </div>
                                            <Input label="Price (₹)" type="number" name="price" value={formData.price} onChange={handleFormChange} required min="0" step="0.01" />
                                            <Input label="Stock Quantity" type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleFormChange} required min="0" />
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
                                                <select name="category" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm text-slate-700 transition-all" value={formData.category} onChange={handleFormChange}>
                                                    <option value="permanent teeth wax carvings">Permanent Teeth Wax Carvings</option>
                                                    <option value="preclinical prosthodontics">Preclinical Prosthodontics</option>
                                                    <option value="primary teeth wax carvings">Primary Teeth Wax Carvings</option>
                                                    <option value="Orthodontics">Preclinical Orthodontics</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Product Photo</label>
                                                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-colors" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                                                <textarea name="description" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm min-h-[80px]" value={formData.description} onChange={handleFormChange} required placeholder="Describe the product..." />
                                            </div>
                                        </div>
                                        {getPreviewSrc() && (
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <img src={getPreviewSrc()} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                                                <span className="text-xs text-slate-500">Image preview</span>
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setImageFile(null); setImagePreviewUrl(''); }}>Cancel</Button>
                                            <Button type="submit" variant="primary" size="sm">{editingId ? 'Update' : 'Create'}</Button>
                                        </div>
                                    </form>
                                </Card>
                            )}

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Inventory...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                        <div className="relative flex-1 min-w-[180px]">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or ID..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 bg-white text-sm text-slate-700 placeholder:text-slate-400 transition-all"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                        </div>
                                        <select
                                            value={yearFilter}
                                            onChange={(e) => setYearFilter(e.target.value)}
                                            className={`px-3 py-2 rounded-lg border text-xs font-medium appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${yearFilter !== 'all'
                                                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                                                    : 'bg-white border-slate-200 text-slate-600'
                                                }`}
                                        >
                                            <option value="all">All Years</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className={`px-3 py-2 rounded-lg border text-xs font-medium appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${categoryFilter !== 'all'
                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                    : 'bg-white border-slate-200 text-slate-600'
                                                }`}
                                        >
                                            <option value="all">All Categories</option>
                                            <option value="permanent teeth wax carvings">Permanent Teeth Wax Carvings</option>
                                            <option value="preclinical prosthodontics">Preclinical Prosthodontics</option>
                                            <option value="primary teeth wax carvings">Primary Teeth Wax Carvings</option>
                                            <option value="Orthodontics">Preclinical Orthodontics</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-xs font-medium text-slate-500">
                                            {products.filter(p => {
                                                const ms = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || String(p.id).includes(searchQuery);
                                                const my = yearFilter === 'all' || p.year === yearFilter;
                                                const mc = categoryFilter === 'all' || p.category === categoryFilter;
                                                return ms && my && mc;
                                            }).length} of {products.length} products
                                        </span>
                                        {(searchQuery || yearFilter !== 'all' || categoryFilter !== 'all') && (
                                            <button
                                                onClick={() => { setSearchQuery(''); setYearFilter('all'); setCategoryFilter('all'); }}
                                                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </div>
                                    <Card className="overflow-hidden border border-slate-200 shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-600">
                                                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px] w-12">#</th>
                                                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Product</th>
                                                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Price</th>
                                                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Stock</th>
                                                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px] hidden md:table-cell">Category</th>
                                                        <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[10px] w-24">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {products
                                                        .filter(p => {
                                                            const matchesSearch = !searchQuery ||
                                                                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                String(p.id).includes(searchQuery);
                                                            const matchesYear = yearFilter === 'all' || p.year === yearFilter;
                                                            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
                                                            return matchesSearch && matchesYear && matchesCategory;
                                                        })
                                                        .map((p, idx) => (
                                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                                <td className="px-4 py-3 text-xs font-medium text-slate-400">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                                                                            <img
                                                                                src={p.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${p.image}` : (p.image || 'https://via.placeholder.com/100')}
                                                                                className="w-full h-full object-cover"
                                                                                alt=""
                                                                            />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{p.name}</div>
                                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{p.year}</span>
                                                                                <span className="text-[10px] text-slate-400">#{p.id}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="text-sm font-semibold text-slate-800">₹{Number(p.price).toLocaleString()}</span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`inline-block w-2 h-2 rounded-full ${p.stock_quantity > 10 ? 'bg-emerald-500' : p.stock_quantity > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                                                        <span className={`text-xs font-medium ${p.stock_quantity === 0 ? 'text-red-500' : 'text-slate-600'}`}>
                                                                            {p.stock_quantity}
                                                                        </span>
                                                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">units</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 hidden md:table-cell">
                                                                    <span className="inline-block text-[9px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 whitespace-nowrap max-w-[140px] truncate">{p.category}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <button
                                                                            onClick={() => handleEdit(p)}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                                                                            title="Edit Product"
                                                                        >
                                                                            <PencilSquareIcon className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteProduct(p.id)}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                            title="Delete Product"
                                                                        >
                                                                            <TrashIcon className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {products.filter(p => {
                                                        const matchesSearch = !searchQuery ||
                                                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                            String(p.id).includes(searchQuery);
                                                        const matchesYear = yearFilter === 'all' || p.year === yearFilter;
                                                        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
                                                        return matchesSearch && matchesYear && matchesCategory;
                                                    }).length === 0 && (
                                                            <tr>
                                                                <td colSpan="6" className="px-4 py-16 text-center">
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-100">
                                                                            {(searchQuery || yearFilter !== 'all' || categoryFilter !== 'all') ? (
                                                                                <MagnifyingGlassIcon className="w-6 h-6 text-slate-300" />
                                                                            ) : (
                                                                                <ShoppingBagIcon className="w-6 h-6 text-slate-300" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm font-medium text-slate-400">
                                                                            {(searchQuery || yearFilter !== 'all' || categoryFilter !== 'all') ? 'No products match your filters' : 'No products yet'}
                                                                        </p>
                                                                        {(searchQuery || yearFilter !== 'all' || categoryFilter !== 'all') && (
                                                                            <button
                                                                                onClick={() => { setSearchQuery(''); setYearFilter('all'); setCategoryFilter('all'); }}
                                                                                className="mt-3 text-xs font-medium text-primary hover:text-primary/80 underline underline-offset-4"
                                                                            >
                                                                                Clear filters
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'logistics' ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 flex-wrap">
                                {[
                                    { id: 'pending', label: 'Pending' },
                                    { id: 'shipped', label: 'Shipped' },
                                    { id: 'delivered', label: 'Delivered' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setShippingSubTab(tab.id)}
                                        className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${shippingSubTab === tab.id
                                                ? 'bg-slate-800 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <Card className="border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-600">
                                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px] w-10">#</th>
                                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Order</th>
                                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Customer</th>
                                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Shipping</th>
                                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Status</th>
                                                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[10px]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {orders
                                                .filter(o => {
                                                    const st = o.shipping_status || 'Pending';
                                                    if (shippingSubTab === 'delivered') return st === 'Delivered';
                                                    if (shippingSubTab === 'shipped') return st === 'Shipped';
                                                    return st === 'Pending' || st === 'Packed';
                                                })
                                                .map((o, idx) => (
                                                    <tr key={o.order_id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-4 py-3 text-xs text-slate-400">{idx + 1}</td>
                                                        <td className="px-4 py-3">
                                                             <div className="font-medium text-sm text-slate-800">#{o.order_id}</div>
                                                             <div className="text-[10px] text-slate-400 mt-0.5">{new Date(o.order_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                                             <div className="text-[9px] text-slate-400 mt-0.5">
                                                                 <span className="block">Order Value: ₹{Number(o.total_price - (o.shipping_charge || 0)).toLocaleString()}</span>
                                                                 <span className="block text-slate-500">Shipping: {Number(o.shipping_charge) > 0 ? `₹${Number(o.shipping_charge).toLocaleString()}` : 'FREE'}</span>
                                                                 <span className="block font-semibold text-slate-700">Total: ₹{Number(o.total_price || 0).toLocaleString()}</span>
                                                             </div>
                                                         </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm font-medium text-slate-700">{o.customer_name}</div>
                                                            <div className="text-[10px] text-slate-400">{o.phone}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {editingShipping === o.order_id ? (
                                                                <div className="space-y-2 min-w-[160px]">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Courier name"
                                                                        value={shippingForm.courier_name}
                                                                        onChange={(e) => setShippingForm({ ...shippingForm, courier_name: e.target.value })}
                                                                        className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Tracking number"
                                                                        value={shippingForm.tracking_number}
                                                                        onChange={(e) => setShippingForm({ ...shippingForm, tracking_number: e.target.value })}
                                                                        className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                                    />
                                                                    <select
                                                                        value={shippingForm.shipping_status}
                                                                        onChange={(e) => setShippingForm({ ...shippingForm, shipping_status: e.target.value })}
                                                                        className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                                                                    >
                                                                        <option value="Pending">Pending</option>
                                                                        <option value="Packed">Packed</option>
                                                                        <option value="Shipped">Shipped</option>
                                                                        <option value="Delivered">Delivered</option>
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-slate-600">
                                                                    <p>{o.courier_name || <span className="text-slate-400 italic">Not set</span>}</p>
                                                                    <p className="font-mono text-[10px] mt-0.5">{o.tracking_number || ''}</p>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant={
                                                                o.shipping_status === 'Delivered' ? 'success' :
                                                                o.shipping_status === 'Shipped' ? 'info' :
                                                                o.shipping_status === 'Packed' ? 'warning' :
                                                                'warning'
                                                            }>
                                                                {o.shipping_status || 'Pending'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                                {editingShipping === o.order_id ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleUpdateShipping(o.order_id)}
                                                                            disabled={loading}
                                                                            className="px-2 py-1.5 text-[9px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm uppercase tracking-wider"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setEditingShipping(null); }}
                                                                            className="px-2 py-1.5 text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors uppercase tracking-wider"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {(o.shipping_status === 'Pending' || !o.shipping_status) && (
                                                                            <button
                                                                                onClick={() => handleCreateShipment(o.order_id)}
                                                                                disabled={loading}
                                                                                className="px-2.5 py-1.5 text-[9px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm uppercase tracking-wider"
                                                                            >
                                                                                Create Shipment
                                                                            </button>
                                                                        )}
                                                                        {o.shipping_status === 'Shipped' && o.tracking_number && (
                                                                            <button
                                                                                onClick={() => window.open(`/track/${o.tracking_number}`, '_blank')}
                                                                                className="px-2.5 py-1.5 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wider"
                                                                            >
                                                                                Track
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => openShippingForm(o)}
                                                                            className="px-2.5 py-1.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors uppercase tracking-wider"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            {orders.filter(o => {
                                                const st = o.shipping_status || 'Pending';
                                                if (shippingSubTab === 'delivered') return st === 'Delivered';
                                                if (shippingSubTab === 'shipped') return st === 'Shipped';
                                                return st === 'Pending' || st === 'Packed';
                                            }).length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-16 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <TruckIcon className="w-8 h-8 text-slate-300 mb-2" />
                                                            <p className="text-sm text-slate-400 font-medium">No orders found in this category</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                                {[
                                    { id: 'to-deliver', label: 'Processing' },
                                    { id: 'delivered', label: 'Delivered' },
                                    { id: 'cancelled', label: 'Cancelled' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setOrderSubTab(tab.id)}
                                        className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${orderSubTab === tab.id
                                                ? 'bg-slate-800 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <Card className="border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-600">
                                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px] w-10">#</th>
                                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Order</th>
                                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">Items</th>
                                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px] hidden sm:table-cell">Customer</th>
                                                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[10px]">Manage</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {orders
                                                .filter(o => {
                                                    if (orderSubTab === 'delivered') return o.order_status === 'Delivered';
                                                    if (orderSubTab === 'cancelled') return o.order_status === 'Cancelled';
                                                    return ['Pending', 'Packed', 'Shipped'].includes(o.order_status);
                                                })
                                                .map((o, idx) => (
                                                    <tr key={o.order_id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-4 py-3 text-xs text-slate-400">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                             <div className="font-medium text-sm text-slate-800">#{o.order_id}</div>
                                                             <div className="text-[10px] text-slate-400 mt-0.5">{new Date(o.order_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                                             <div className="text-[9px] text-slate-400 mt-0.5">
                                                                 <span>Ship: {Number(o.shipping_charge) > 0 ? `₹${Number(o.shipping_charge).toLocaleString()}` : 'FREE'} | Total: ₹{Number(o.total_price || 0).toLocaleString()}</span>
                                                             </div>
                                                         </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                {o.items?.slice(0, 2).map((i, itemIdx) => (
                                                                    <span key={itemIdx} className="inline-block px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[9px] font-medium">
                                                                        {i.quantity}x {i.name.length > 20 ? i.name.slice(0, 20) + '...' : i.name}
                                                                    </span>
                                                                ))}
                                                                {o.items?.length > 2 && <span className="text-[9px] text-slate-400 self-center">+{o.items.length - 2} more</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 hidden sm:table-cell">
                                                            <div className="text-sm font-medium text-slate-700">{o.customer_name}</div>
                                                            <div className="text-[10px] text-slate-400">{o.phone}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {o.order_status === 'Cancelled' ? (
                                                                <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-medium uppercase tracking-wider">Voided</span>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <select
                                                                        className={`text-[9px] font-medium rounded-lg border py-1.5 pl-2 pr-6 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer bg-white ${o.order_status === 'Delivered' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' :
                                                                                o.order_status === 'Shipped' ? 'text-blue-700 border-blue-200 bg-blue-50' :
                                                                                    'text-slate-600 border-slate-200'
                                                                            }`}
                                                                        value={o.order_status}
                                                                        onChange={(e) => handleOrderStatusUpdate(o.order_id, e.target.value)}
                                                                    >
                                                                        <option value="Pending">Pending</option>
                                                                        <option value="Packed">Packed</option>
                                                                        <option value="Shipped">Shipped</option>
                                                                        <option value="Delivered">Delivered</option>
                                                                    </select>
                                                                    {o.payment_status !== 'Completed' && (
                                                                        <button
                                                                            onClick={() => handlePaymentStatusUpdate(o.order_id)}
                                                                            className="px-2 py-1.5 text-[9px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap"
                                                                        >
                                                                            Mark Paid
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            {orders.filter(o => {
                                                if (orderSubTab === 'delivered') return o.order_status === 'Delivered';
                                                if (orderSubTab === 'cancelled') return o.order_status === 'Cancelled';
                                                return ['Pending', 'Packed', 'Shipped'].includes(o.order_status);
                                            }).length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-16 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <ClipboardDocumentListIcon className="w-8 h-8 text-slate-300 mb-2" />
                                                            <p className="text-sm text-slate-400 font-medium">No orders found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SellerDashboard;
