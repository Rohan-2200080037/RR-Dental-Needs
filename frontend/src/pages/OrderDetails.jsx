import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { CheckCircleIcon, XMarkIcon, TruckIcon, ClipboardDocumentCheckIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Loader';

const OrderDetails = () => {
    const { id } = useParams();
    const { token } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrder(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch order details');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchOrderDetails();
        else navigate('/login');
    }, [id, token, navigate]);

    if (loading) return <PageLoader />;
    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
            <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
    );

    const steps = [
        { name: 'Pending', icon: ClipboardDocumentCheckIcon, label: 'Order Received' },
        { name: 'Packed', icon: ArchiveBoxIcon, label: 'Packed & Ready' },
        { name: 'Shipped', icon: TruckIcon, label: 'In Transit' },
        { name: 'Delivered', icon: CheckCircleIcon, label: 'Delivered' }
    ];

    const currentIdx = steps.findIndex(s => s.name === order.order_status);
    const isCancelled = order.order_status === 'Cancelled';

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
                    <Link to="/orders" className="hover:text-primary font-medium">Orders</Link>
                    <span>/</span>
                    <span className="font-bold text-slate-800">Order</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Order Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Timeline Card */}
                        <Card className="p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-8">Order Status</h2>
                            {isCancelled ? (
                                <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center text-red-800 font-bold">
                                    <XMarkIcon className="w-8 h-8 mr-4" /> This order has been cancelled.
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200 rounded-full hidden sm:block"></div>
                                    <div 
                                        className="absolute top-6 left-6 h-1 bg-primary rounded-full transition-all duration-700 ease-out hidden sm:block"
                                        style={{ width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%` }}
                                    ></div>
                                    
                                    <div className="flex flex-col sm:flex-row justify-between relative z-10 gap-8 sm:gap-0">
                                        {steps.map((step, idx) => {
                                            const isCompleted = idx <= currentIdx;
                                            const isPast = idx < currentIdx;
                                            const isActive = idx === currentIdx;
                                            
                                            return (
                                                <div key={step.name} className="flex sm:flex-col items-center sm:w-1/4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 border-4 border-white ${
                                                        isCompleted ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                                                    } ${isActive ? 'scale-110 ring-4 ring-primary/20' : ''}`}>
                                                        <step.icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="ml-4 sm:ml-0 sm:mt-4 text-left sm:text-center">
                                                        <p className={`font-bold text-sm ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{step.name}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{step.label}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Items List */}
                        <Card className="overflow-hidden">
                            <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-900">Order Items</h2>
                                <span className="text-slate-500 font-bold">{order.items.length} Items</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="p-6 sm:p-8 flex items-center space-x-6 hover:bg-slate-50/50 transition-colors">
                                        <img 
                                            src={item.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${item.image}` : (item.image || 'https://via.placeholder.com/150')} 
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded-xl shadow-sm border border-slate-200"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-slate-900 truncate">{item.name}</h3>
                                            <p className="text-slate-500 font-medium">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Price</p>
                                            <p className="text-lg font-black text-slate-900 font-display">₹{Number(item.price).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-8 bg-slate-50/50 border-t border-slate-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold text-lg uppercase tracking-wider">Total Amount Paid</span>
                                    <span className="text-3xl font-black text-primary">₹{Number(order.total_price).toLocaleString()}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar: Details */}
                    <div className="space-y-8">
                        <Card className="p-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Delivery Address</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-lg font-bold text-slate-900 mb-1">{order.delivery_name}</p>
                                    <p className="text-slate-600 font-medium leading-relaxed">
                                        {order.address}<br />
                                        {order.city}, {order.state} - {order.pincode}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</p>
                                    <p className="font-bold text-slate-800">{order.phone}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Payment Info</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Method</span>
                                    <Badge variant="primary">{order.payment_method}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Status</span>
                                    <Badge variant={order.payment_status === 'Paid' ? 'success' : 'warning'}>
                                        {order.payment_status || 'Pending'}
                                    </Badge>
                                </div>
                                {order.razorpay_payment_id && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Transaction ID</p>
                                        <p className="font-mono text-xs text-slate-600 break-all bg-slate-50 p-2 rounded">{order.razorpay_payment_id}</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Button 
                            className="w-full text-lg h-14" 
                            variant="outline" 
                            onClick={() => window.print()}
                        >
                            Download Invoice
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
