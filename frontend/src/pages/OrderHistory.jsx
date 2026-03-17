import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { ShoppingBagIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Loader';

const OrderHistory = () => {
    const { token } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/my-orders`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch orders');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchOrders();
        else navigate('/login');
    }, [token, navigate]);

    if (loading) return <PageLoader />;

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Your Orders</h1>
                        <p className="text-slate-500 mt-2 font-medium">Track and manage your recent purchases.</p>
                    </div>
                    <ShoppingBagIcon className="w-12 h-12 text-slate-200" />
                </div>

                {error && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100 mb-6">
                        {error}
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <ShoppingBagIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto">Looks like you haven't placed any orders yet. Start shopping to see them here!</p>
                        <Button variant="primary" size="lg" onClick={() => navigate('/products')}>Go to Shop</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="hover:border-primary/30 transition-all group overflow-hidden">
                                    <Link to={`/order/${order.id}`} className="block">
                                        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="text-lg font-bold text-slate-900">Order</span>
                                                    <Badge variant={
                                                        order.order_status === 'Delivered' ? 'success' : 
                                                        order.order_status === 'Cancelled' ? 'danger' : 
                                                        'warning'
                                                    }>
                                                        {order.order_status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">
                                                    Placed on {new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                                <div className="mt-4 flex -space-x-2 overflow-hidden">
                                                    {order.items.slice(0, 4).map((item, idx) => (
                                                        <img
                                                            key={idx}
                                                            className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover bg-slate-100"
                                                            src={item.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${item.image}` : (item.image || 'https://via.placeholder.com/100')}
                                                            alt={item.name}
                                                        />
                                                    ))}
                                                    {order.items.length > 4 && (
                                                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 ring-2 ring-white text-xs font-bold text-slate-500">
                                                            +{order.items.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0">
                                                <div className="mb-0 sm:mb-2 text-left sm:text-right">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total</p>
                                                    <p className="text-xl font-black text-primary">₹{Number(order.total_price).toLocaleString()}</p>
                                                </div>
                                                <div className="p-2 transition-transform group-hover:translate-x-1">
                                                    <ChevronRightIcon className="w-6 h-6 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
