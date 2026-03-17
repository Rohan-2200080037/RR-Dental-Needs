import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { PencilSquareIcon, TrashIcon, ShoppingBagIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const SellerDashboard = () => {
    const { token, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('analytics');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [orderSubTab, setOrderSubTab] = useState('to-deliver'); // 'to-deliver' or 'delivered'

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
                                        setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '1st Year', image: ''});
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
                                        {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-200"></div>)}
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
                                <Card className="premium-card p-0 overflow-hidden animate-premium border-t-4 border-t-primary shadow-2xl">
                                    <div className="p-8 bg-slate-50/50 border-b border-slate-100">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                            {editingId ? 'Edit Product Details' : 'Create New Product'}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Product Information</p>
                                    </div>
                                    <form onSubmit={handleFormSubmit} className="p-8 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-1">
                                                <Input label="Product Name" name="name" value={formData.name} onChange={handleFormChange} required placeholder="e.g. Dental Mirror High Quality" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Category</label>
                                                <select name="category" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 bg-white text-slate-900 font-medium transition-all" value={formData.category} onChange={handleFormChange}>
                                                    <option value="1st Year">1st Year</option>
                                                    <option value="2nd Year">2nd Year</option>
                                                    <option value="3rd Year">3rd Year</option>
                                                    <option value="4th Year">4th Year</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Input label="Price (₹)" type="number" name="price" value={formData.price} onChange={handleFormChange} required min="0" step="0.01" />
                                            </div>
                                            <div className="space-y-1">
                                                <Input label="Available Stock" type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleFormChange} required min="0" />
                                            </div>
                                            
                                            <div className="md:col-span-2 space-y-1">
                                                <Input label="Image URL" type="url" name="image" value={formData.image} onChange={handleFormChange} placeholder="https://images.unsplash.com/..." />
                                                {formData.image && (
                                                    <div className="mt-4 p-2 bg-slate-50 rounded-2xl border border-slate-100 inline-block">
                                                        <img src={formData.image} alt="Preview" className="h-40 w-40 object-cover rounded-xl shadow-lg" onError={(e) => e.target.style.display='none'} />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Full Description</label>
                                                <textarea 
                                                    name="description" 
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium min-h-[120px]" 
                                                    value={formData.description} 
                                                    onChange={handleFormChange} 
                                                    required 
                                                    placeholder="Describe the product features, materials, and usage..."
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-6 border-t border-slate-100 gap-4">
                                            <Button type="button" variant="ghost" className="px-8 rounded-xl font-bold" onClick={() => setShowForm(false)}>Discard</Button>
                                            <Button type="submit" variant="primary" className="px-10 rounded-xl font-bold shadow-lg shadow-primary/30">
                                                {editingId ? 'Update Product' : 'List Product'}
                                            </Button>
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
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <h3 className="font-black text-slate-800 tracking-tight">Inventory Status</h3>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                                            {products.length} Products Active
                                        </div>
                                    </div>
                                    <Card className="premium-card overflow-hidden animate-premium">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-200/50 text-slate-800">
                                                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[11px]">S.No</th>
                                                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[11px]">Product Details</th>
                                                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[11px]">Price</th>
                                                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[11px]">Inventory</th>
                                                        <th className="px-8 py-5 text-right font-bold uppercase tracking-widest text-[11px]">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {products.map((p, idx) => (
                                                        <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group even:bg-slate-100/80 border-b border-slate-200 last:border-0">
                                                            <td className="px-8 py-5 font-bold text-slate-500 bg-slate-200/50 group-hover:bg-transparent transition-colors shadow-inner">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center">
                                                                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden mr-5 border border-slate-200/50 shadow-sm group-hover:shadow-md transition-all duration-500">
                                                                        <img 
                                                                            src={p.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${p.image}` : (p.image || 'https://via.placeholder.com/100')} 
                                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                                            alt="" 
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-extrabold text-slate-900 leading-tight group-hover:text-primary transition-colors">{p.name}</div>
                                                                        <div className="flex items-center mt-1.5">
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.category}</span>
                                                                            <span className="mx-2 text-slate-200">|</span>
                                                                            <span className="text-[10px] font-mono text-slate-300">ID: #{p.id}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 bg-teal-100/30 group-hover:bg-transparent transition-colors">
                                                                <div className="font-black text-slate-900 border-l-4 border-teal-500/30 pl-3">₹{Number(p.price).toLocaleString()}</div>
                                                            </td>
                                                            <td className="px-8 py-5 bg-blue-100/40 group-hover:bg-transparent transition-colors">
                                                                <div className="flex items-center">
                                                                    <div className={`w-2.5 h-2.5 rounded-full mr-2.5 ${p.stock_quantity > 10 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : p.stock_quantity > 0 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                                                                    <span className={`font-black text-sm ${p.stock_quantity === 0 ? 'text-red-500' : 'text-slate-700'}`}>{p.stock_quantity}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 ml-1.5 uppercase">Left</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right bg-slate-200/30 group-hover:bg-transparent transition-colors">
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                                    <button 
                                                                        onClick={() => handleEdit(p)}
                                                                        className="p-2.5 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                                        title="Edit Product"
                                                                    >
                                                                        <PencilSquareIcon className="w-5 h-5" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteProduct(p.id)}
                                                                        className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                                        title="Delete Product"
                                                                    >
                                                                        <TrashIcon className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {products.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" className="px-8 py-24 text-center">
                                                                <div className="flex flex-col items-center">
                                                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                                                                        <ShoppingBagIcon className="w-8 h-8 text-slate-200" />
                                                                    </div>
                                                                    <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">Inventory Empty</h4>
                                                                    <p className="text-slate-300 text-xs mt-1">Start by adding your first dental product</p>
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
                    ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-2 pb-2">
                                        {[
                                            { id: 'to-deliver', label: 'processing' },
                                            { id: 'delivered', label: 'delivered' },
                                            { id: 'cancelled', label: 'cancelled' }
                                        ].map(tab => (
                                            <button 
                                                key={tab.id}
                                                onClick={() => setOrderSubTab(tab.id)}
                                                className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                                                    orderSubTab === tab.id 
                                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 ring-2 ring-slate-900/10' 
                                                    : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-slate-100'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <Card className="premium-card overflow-hidden animate-premium">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-200/50 text-slate-800">
                                                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[11px]">S.No</th>
                                                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[11px]">Reference</th>
                                                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[11px]">Customer</th>
                                                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[11px]">Items</th>
                                                        <th className="px-8 py-5 text-right font-bold uppercase tracking-widest text-[11px]">Management</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {orders
                                                        .filter(o => {
                                                            if (orderSubTab === 'delivered') return o.order_status === 'Delivered';
                                                            if (orderSubTab === 'cancelled') return o.order_status === 'Cancelled';
                                                            return ['Pending', 'Packed', 'Shipped'].includes(o.order_status);
                                                        })
                                                        .map((o, idx) => (
                                                        <tr key={o.order_id} className="hover:bg-blue-50/50 transition-colors group even:bg-slate-100/80">
                                                            <td className="px-8 py-5 font-bold text-slate-500 bg-slate-200/50 group-hover:bg-transparent transition-colors">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="px-8 py-5 bg-white group-hover:bg-transparent transition-colors">
                                                                <div className="font-black text-slate-900 tracking-tight">#{o.order_id}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                                    {new Date(o.order_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{o.customer_name}</div>
                                                                <div className="text-xs text-slate-500 mt-0.5">{o.phone}</div>
                                                            </td>
                                                            <td className="px-8 py-5 bg-teal-100/10 group-hover:bg-transparent transition-colors">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {o.items?.map((i, idx) => (
                                                                        <span key={idx} className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                                                            {i.quantity}x {i.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right bg-blue-100/40 group-hover:bg-transparent transition-colors">
                                                                {o.order_status === 'Cancelled' ? (
                                                                    <Badge variant="danger" className="rounded-lg font-black uppercase tracking-widest text-[10px] px-3">Voided</Badge>
                                                                ) : (
                                                                    <div className="relative inline-block w-40">
                                                                        <select 
                                                                            className={`w-full text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 py-2.5 pl-3 pr-8 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer ${
                                                                                o.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                                                o.order_status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                                'bg-white text-slate-700'
                                                                            }`}
                                                                            value={o.order_status}
                                                                            onChange={(e) => handleOrderStatusUpdate(o.order_id, e.target.value)}
                                                                        >
                                                                            <option value="Pending">Pending</option>
                                                                            <option value="Packed">Packed</option>
                                                                            <option value="Shipped">Shipped</option>
                                                                            <option value="Delivered">Delivered</option>
                                                                        </select>
                                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {orders.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" className="px-8 py-24 text-center">
                                                                <div className="flex flex-col items-center">
                                                                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                                        <ClipboardDocumentListIcon className="w-8 h-8 text-slate-200" />
                                                                     </div>
                                                                     <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Records Found</p>
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
