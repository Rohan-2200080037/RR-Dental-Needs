import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

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
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } });
                setAnalytics(res.data);
            } else if (activeTab === 'users') {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
                setUsers(res.data);
            } else if (activeTab === 'sellers') {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/sellers`, { headers: { Authorization: `Bearer ${token}` } });
                setSellers(res.data);
            } else if (activeTab === 'products') {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
                setProducts(res.data);
            } else if (activeTab === 'orders') {
               const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/all`, { headers: { Authorization: `Bearer ${token}` } });
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
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            setUsers(users.filter(u => u.id !== id));
            showFeedback("User deleted successfully.");
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Deletion failed.');
        }
    };

    const handleSellerStatusUpdate = async (sellerId, newStatus) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/sellers/${sellerId}/status`, 
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
            await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`, { status: newStatus }, {
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
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            setProducts(products.filter(p => p.id !== id));
            showFeedback("Product deleted successfully.");
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Deletion failed.');
        }
    };

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
        <DashboardLayout isAdmin={true}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage users, sellers, products, and system settings.</p>
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

                <div className="flex flex-wrap gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <TabButton id="analytics" label="Analytics" />
                    <TabButton id="users" label="Users" />
                    <TabButton id="sellers" label="Sellers" />
                    <TabButton id="products" label="Products" />
                    <TabButton id="orders" label="All Orders" />
                </div>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'analytics' && analytics && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-slate-800">System Overview</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <Card className="p-6">
                                            <p className="text-sm font-medium text-slate-500 mb-1">Total Users</p>
                                            <p className="text-3xl font-bold text-slate-900">{analytics.totalUsers}</p>
                                        </Card>
                                        <Card className="p-6">
                                            <p className="text-sm font-medium text-slate-500 mb-1">Registered Sellers</p>
                                            <p className="text-3xl font-bold text-slate-900">{analytics.totalSellers}</p>
                                        </Card>
                                        <Card className="p-6">
                                            <p className="text-sm font-medium text-slate-500 mb-1">Total Orders Placed</p>
                                            <p className="text-3xl font-bold text-slate-900">{analytics.totalOrders}</p>
                                        </Card>
                                        <Card className="p-6 border-l-4 border-l-primary">
                                            <p className="text-sm font-medium text-slate-500 mb-1">Platform Revenue</p>
                                            <p className="text-3xl font-bold text-primary">₹{Number(analytics.totalRevenue).toLocaleString()}</p>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <Card className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">ID</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Name</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Email</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Role</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Created At</th>
                                                <th className="px-6 py-4 text-right font-semibold text-slate-900">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {users.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 font-medium">#{u.id}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                                                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={u.role === 'admin' ? 'primary' : u.role === 'seller' ? 'warning' : 'default'}>
                                                            {u.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        {u.role !== 'admin' && (
                                                            <Button variant="ghost" size="sm" className="text-danger hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteUser(u.id)}>Delete</Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Card>
                            )}

                            {activeTab === 'sellers' && (
                                <Card className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">ID</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">User Info</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Status</th>
                                                <th className="px-6 py-4 text-right font-semibold text-slate-900">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {sellers.map(s => (
                                                <tr key={s.seller_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 font-medium">#{s.seller_id}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900">{s.name}</div>
                                                        <div className="text-slate-500 text-xs mt-0.5">{s.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={s.approved_status === 'approved' ? 'success' : s.approved_status === 'rejected' ? 'danger' : 'warning'}>
                                                            {s.approved_status.toUpperCase()}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        {s.approved_status !== 'approved' && (
                                                            <Button variant="outline" size="sm" onClick={() => handleSellerStatusUpdate(s.seller_id, 'approved')}>Approve</Button>
                                                        )}
                                                        {s.approved_status !== 'rejected' && (
                                                            <Button variant="ghost" className="text-danger hover:bg-red-50" size="sm" onClick={() => handleSellerStatusUpdate(s.seller_id, 'rejected')}>Reject</Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Card>
                            )}

                            {activeTab === 'products' && (
                                <Card className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">ID</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Name</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Seller ID</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Price</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Stock</th>
                                                <th className="px-6 py-4 text-right font-semibold text-slate-900">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {products.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 font-medium">#{p.id}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                                                    <td className="px-6 py-4 text-slate-500">#{p.seller_id}</td>
                                                    <td className="px-6 py-4 font-semibold">₹{Number(p.price).toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={p.stock_quantity > 10 ? 'success' : p.stock_quantity > 0 ? 'warning' : 'danger'}>
                                                            {p.stock_quantity} in stock
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="sm" className="text-danger hover:bg-red-50" onClick={() => handleDeleteProduct(p.id)}>Delete</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Card>
                            )}

                            {activeTab === 'orders' && (
                                <Card className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">ID</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Date</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">User Email</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Total Price</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {orders.map(o => (
                                                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 font-medium">#{o.id}</td>
                                                    <td className="px-6 py-4 text-slate-500">{new Date(o.order_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-slate-600 font-medium">{o.user_email}</td>
                                                    <td className="px-6 py-4 font-semibold text-primary">₹{Number(o.total_price).toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <select 
                                                            className={`block w-full text-sm rounded-lg border-slate-300 py-1.5 pl-3 pr-8 focus:border-primary focus:ring-primary ${
                                                                o.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-800' : 
                                                                o.order_status === 'Shipped' ? 'bg-blue-50 text-blue-800' :
                                                                'bg-slate-50 text-slate-800'
                                                            }`}
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
                                    {orders.length === 0 && <div className="p-8 text-center text-slate-500">No orders received yet.</div>}
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
