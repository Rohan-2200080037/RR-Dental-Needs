import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminDashboard = () => {
    const { token } = useAuthStore();
    const [activeTab, setActiveTab] = useState('analytics');
    
    // Data states
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [reviews, setReviews] = useState([]);
    
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
            } else if (activeTab === 'messages') {
               const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/contact`, { headers: { Authorization: `Bearer ${token}` } });
               setMessages(res.data);
            } else if (activeTab === 'reviews') {
               const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/reviews`, { headers: { Authorization: `Bearer ${token}` } });
               setReviews(res.data);
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

    const handleDeleteReview = async (id) => {
        if (!window.confirm("Delete this review permanently?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/reviews/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            setReviews(reviews.filter(r => r.id !== id));
            showFeedback("Review deleted successfully.");
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Deletion failed.');
        }
    };

    const exportMessagesToExcel = () => {
        if (messages.length === 0) {
            showFeedback("No messages to export.");
            return;
        }

        const dataToExport = messages.map(msg => ({
            ID: msg.id,
            Date: new Date(msg.created_at).toLocaleString(),
            Name: msg.name,
            Email: msg.email,
            Subject: msg.subject || 'N/A',
            Message: msg.message
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Contact Messages");
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, `Contact_Messages_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
        showFeedback("Excel file downloaded successfully.");
    };



    return (
        <DashboardLayout isAdmin={true} activeTab={activeTab} onTabChange={setActiveTab}>
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

                                    {/* Charts Section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                        <Card className="p-6">
                                            <h3 className="text-lg font-bold text-slate-900 mb-6">Top Selling Products</h3>
                                            <div className="h-80 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={analytics.topProducts || []}
                                                        layout="vertical"
                                                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                        <XAxis type="number" hide />
                                                        <YAxis 
                                                            dataKey="name" 
                                                            type="category" 
                                                            width={100}
                                                            tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                                                        />
                                                        <Tooltip 
                                                            cursor={{ fill: '#f8fafc' }}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                        />
                                                        <Bar dataKey="total_sold" radius={[0, 4, 4, 0]}>
                                                            {(analytics.topProducts || []).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={['#0d9488', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'][index % 5]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>

                                        <Card className="p-6">
                                            <h3 className="text-lg font-bold text-slate-900 mb-6">Sales Distribution</h3>
                                            <div className="space-y-4">
                                                {(analytics.topProducts || []).map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: ['#0d9488', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'][idx % 5] }}></div>
                                                            <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{item.name}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className="text-xs font-bold text-slate-400">{item.total_sold} Sold</span>
                                                            <span className="text-sm font-bold text-slate-900">₹{Number(item.revenue).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!analytics.topProducts || analytics.topProducts.length === 0) && (
                                                    <p className="text-slate-500 text-center py-10">No sales data available yet.</p>
                                                )}
                                            </div>
                                        </Card>
                                        <Card className="p-6">
                                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                                <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                                                Low Stock Alerts
                                            </h3>
                                            <div className="space-y-4">
                                                {(analytics.lowStockProducts || []).map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800">{item.name}</span>
                                                            <span className="text-xs text-slate-500">Threshold: {item.low_stock_threshold}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm font-extrabold text-red-600">{item.stock_quantity} available</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!analytics.lowStockProducts || analytics.lowStockProducts.length === 0) && (
                                                    <p className="text-slate-500 text-center py-10 italic">Inventory levels are healthy.</p>
                                                )}
                                            </div>
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
                                                        {o.order_status === 'Cancelled' ? (
                                                            <div className="px-3 py-1.5 bg-red-50 text-red-700 font-bold text-xs uppercase rounded-lg border border-red-100 text-center">
                                                                Cancelled
                                                            </div>
                                                        ) : (
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
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {orders.length === 0 && <div className="p-8 text-center text-slate-500">No orders received yet.</div>}
                                </Card>
                            )}

                            {activeTab === 'messages' && (
                                <Card className="overflow-x-auto">
                                    <div className="p-4 flex justify-between items-center border-b border-slate-200">
                                        <h2 className="text-lg font-semibold text-slate-900">Contact Form Messages</h2>
                                        <Button 
                                            onClick={exportMessagesToExcel} 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center shadow-md"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            Download as Excel
                                        </Button>
                                    </div>
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900 w-32">Date</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900 w-48">From</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900 w-48">Subject</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Message</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {messages.map(msg => (
                                                <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                        <div className="font-medium">{new Date(msg.created_at).toLocaleDateString()}</div>
                                                        <div className="text-xs mt-0.5">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900">{msg.name}</div>
                                                        <a href={`mailto:${msg.email}`} className="text-primary hover:underline text-xs mt-0.5">{msg.email}</a>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-800 font-medium">
                                                        {msg.subject || <span className="text-slate-400 italic">No subject</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        <div className="max-w-md md:max-w-lg lg:max-w-2xl whitespace-pre-wrap">{msg.message}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {messages.length === 0 && <div className="p-8 text-center text-slate-500">No messages received yet.</div>}
                                </Card>
                            )}

                            {activeTab === 'reviews' && (
                                <Card className="overflow-x-auto">
                                    <div className="p-4 border-b border-slate-200">
                                        <h2 className="text-lg font-semibold text-slate-900">Product Reviews</h2>
                                    </div>
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900 w-32">Date</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900 w-48">Product & User</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900 w-24">Rating</th>
                                                <th className="px-6 py-4 text-left font-semibold text-slate-900">Comment</th>
                                                <th className="px-6 py-4 text-right font-semibold text-slate-900 w-24">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {reviews.map(r => (
                                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                        <div className="font-medium">{new Date(r.review_date).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900">{r.product_name}</div>
                                                        <div className="text-slate-500 text-xs mt-0.5">By {r.user_name}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <span className="font-bold text-slate-900 mr-1">{r.rating}</span>
                                                            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        <div className="max-w-md whitespace-pre-wrap">{r.comment || <span className="text-slate-400 italic">No comment provided</span>}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="sm" className="text-danger hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteReview(r.id)}>Delete</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {reviews.length === 0 && <div className="p-8 text-center text-slate-500">No reviews found.</div>}
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
