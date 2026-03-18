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
        <div className="min-h-screen bg-slate-50 py-12 print:bg-white print:py-0">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">
                <div className="flex items-center justify-between mb-6 no-print">
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <Link to="/orders" className="hover:text-primary font-medium">Orders</Link>
                        <span>/</span>
                        <span className="font-bold text-slate-800">Order #{order.id}</span>
                    </div>
                </div>

                {/* Strictly Tabular Print Layout */}
                <div className="print-only invoice-container">
                    <table className="invoice-header-table">
                        <tbody>
                            <tr>
                                <td style={{ width: '70%', border: 'none', padding: 0 }}>
                                    <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: 0 }}>RR Dental Needs</h2>
                                    <p style={{ margin: 0 }}>Vijayawada, Andhra Pradesh</p>
                                    <p style={{ margin: 0 }}>Email: rrdentalneeds@gmail.com</p>
                                    <p style={{ margin: 0 }}>Phone: +91 9948533315</p>
                                </td>
                                <td style={{ width: '30%', border: 'none', padding: 0, textAlign: 'right' }}>
                                    <div style={{ display: 'inline-block', width: '60px', height: '60px', backgroundColor: '#0d9488', color: 'white', borderRadius: '8px', lineHeight: '60px', textAlign: 'center', fontWeight: '900', fontSize: '24pt' }}>RR</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <h1 className="invoice-main-title">Order Invoice</h1>

                    <table style={{ width: '100%', marginBottom: '2rem', border: 'none' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '50%', border: 'none', verticalAlign: 'top', padding: 0 }}>
                                    <h3 style={{ color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt', marginBottom: '8px' }}>Bill To</h3>
                                    <p style={{ fontWeight: 'bold', fontSize: '12pt', margin: 0 }}>{order.delivery_name}</p>
                                    <p style={{ margin: 0 }}>{order.address}</p>
                                    <p style={{ margin: 0 }}>{order.city}, {order.state} - {order.pincode}</p>
                                </td>
                                <td style={{ width: '50%', border: 'none', verticalAlign: 'top', padding: 0 }}>
                                    <div style={{ float: 'right', textAlign: 'right' }}>
                                        <p style={{ margin: '2px 0' }}><span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Invoice #</span> {String(order.id).padStart(7, '0')}</p>
                                        <p style={{ margin: '2px 0' }}><span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Invoice date:</span> {new Date(order.order_date).toLocaleDateString()}</p>
                                        <p style={{ margin: '2px 0' }}><span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Payment Method:</span> {order.payment_method}</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #1e3a8a', marginTop: '2rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1e3a8a', color: 'white', WebkitPrintColorAdjust: 'exact' }}>
                                <th style={{ padding: '12px', border: '1px solid #1e3a8a', textAlign: 'center', textTransform: 'uppercase', width: '10%' }}>QTY</th>
                                <th style={{ padding: '12px', border: '1px solid #1e3a8a', textAlign: 'left', textTransform: 'uppercase', width: '60%' }}>Description</th>
                                <th style={{ padding: '12px', border: '1px solid #1e3a8a', textAlign: 'right', textTransform: 'uppercase', width: '15%' }}>Unit Price</th>
                                <th style={{ padding: '12px', border: '1px solid #1e3a8a', textAlign: 'right', textTransform: 'uppercase', width: '15%' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>{item.name}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{Number(item.price).toLocaleString()}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>₹{Number(item.price * item.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                            {/* Unified Totals Section */}
                            <tr>
                                <td colSpan="3" style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact' }}>Subtotal</td>
                                <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>₹{Number(order.total_price).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td colSpan="3" style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact' }}>Shipping Charges</td>
                                <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>₹0.00</td>
                            </tr>
                            <tr style={{ backgroundColor: '#1e3a8a', color: 'white', WebkitPrintColorAdjust: 'exact' }}>
                                <td colSpan="3" style={{ padding: '15px', border: '1px solid #1e3a8a', textAlign: 'right', fontWeight: '900', fontSize: '12pt', textTransform: 'uppercase' }}>Grand Total (INR)</td>
                                <td style={{ padding: '15px', border: '1px solid #1e3a8a', textAlign: 'right', fontWeight: '900', fontSize: '14pt' }}>₹{Number(order.total_price).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ marginTop: '3rem' }}>
                        <h3 style={{ color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9pt', margin: '0 0 10px 0' }}>Terms and Conditions</h3>
                        <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>This is a system-generated invoice for RR Dental Needs. We appreciate your purchase.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
                    {/* Main Order Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Vertical Timeline Card */}
                        <Card className="p-10 no-print">
                            <h2 className="text-xl font-black text-slate-900 mb-10 flex items-center">
                                <span className="w-2 h-8 bg-primary rounded-full mr-3"></span>
                                Order Journey
                            </h2>
                            {isCancelled ? (
                                <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center text-red-800 font-bold">
                                    <XMarkIcon className="w-8 h-8 mr-4" /> This order has been cancelled.
                                </div>
                            ) : (
                                <div className="space-y-0 relative">
                                    {/* Vertical Connecting Line */}
                                    <div className="absolute left-[23px] top-2 bottom-2 w-1 bg-slate-100 rounded-full"></div>
                                    <div 
                                        className="absolute left-[23px] top-2 w-1 bg-primary rounded-full transition-all duration-1000 ease-in-out"
                                        style={{ height: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%` }}
                                    ></div>
                                    
                                    <div className="flex flex-col gap-10">
                                        {steps.map((step, idx) => {
                                            const isCompleted = idx <= currentIdx;
                                            const isActive = idx === currentIdx;
                                            
                                            return (
                                                <div key={step.name} className="flex items-start relative z-10 group">
                                                    {/* Timeline Icon Node */}
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all duration-500 border-4 border-white flex-shrink-0 ${
                                                        isCompleted ? 'bg-primary text-white' : 'bg-slate-50 text-slate-300'
                                                    } ${isActive ? 'scale-110 ring-4 ring-primary/10' : ''}`}>
                                                        <step.icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                                                    </div>

                                                    {/* Status Content */}
                                                    <div className="ml-6 pt-1">
                                                        <p className={`font-black text-lg transition-colors duration-500 ${
                                                            isCompleted ? 'text-slate-900' : 'text-slate-300'
                                                        }`}>
                                                            {step.name}
                                                        </p>
                                                        <p className={`text-sm font-bold tracking-tight transition-colors duration-500 ${
                                                            isCompleted ? 'text-primary' : 'text-slate-400'
                                                        }`}>
                                                            {step.label}
                                                        </p>
                                                        {isActive && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                className="mt-3 px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl inline-flex items-center"
                                                            >
                                                                <span className="relative flex h-2 w-2 mr-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                                </span>
                                                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Currently processing</span>
                                                            </motion.div>
                                                        )}
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
                                    <div key={idx} className="p-6 sm:p-8 flex items-center space-x-6 hover:bg-slate-50/50 transition-colors bg-white">
                                        <div className="w-20 h-20 flex-shrink-0">
                                            <img 
                                                src={item.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${item.image}` : (item.image || 'https://via.placeholder.com/150')} 
                                                alt={item.name}
                                                className="w-full h-full object-cover rounded-xl shadow-sm border border-slate-200"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-slate-900 truncate">{item.name}</h3>
                                            <p className="text-slate-500 font-medium tracking-tight">ID: #{item.product_id || idx} | Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Price Per Unit</p>
                                            <p className="text-lg font-black text-slate-900">₹{Number(item.price).toLocaleString()}</p>
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
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Delivery Address</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-lg font-bold text-slate-900 mb-1">{order.delivery_name}</p>
                                    <p className="text-slate-600 font-medium leading-relaxed">
                                        {order.address}<br />
                                        {order.city}, {order.state} - <span className="font-bold">{order.pincode}</span>
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Contact Information</p>
                                    <p className="font-bold text-slate-800">{order.phone}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Payment Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Method</span>
                                    <Badge variant="primary">{order.payment_method}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Status</span>
                                    <Badge variant={order.payment_status === 'Paid' ? 'success' : 'warning'}>
                                        {order.payment_status || 'Pending'}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-4">
                            {order.order_status === 'Delivered' ? (
                                <Button 
                                    className="w-full text-lg h-14 shadow-xl shadow-primary/20" 
                                    variant="primary" 
                                    onClick={() => window.print()}
                                >
                                    <TruckIcon className="w-6 h-6 mr-2" />
                                    Download Full Invoice
                                </Button>
                            ) : (
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs font-bold text-center">
                                    Invoice will be available once the order is delivered.
                                </div>
                            )}
                            
                            <Button 
                                className="w-full h-12 text-slate-500" 
                                variant="ghost" 
                                onClick={() => navigate('/orders')}
                            >
                                Back to All Orders
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
