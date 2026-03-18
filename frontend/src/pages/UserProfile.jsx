import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { ShoppingBagIcon, HeartIcon, UserCircleIcon, XMarkIcon, CheckCircleIcon, ArrowPathIcon, MapPinIcon, PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/ui/Loader';
import { indiaData } from '../utils/indiaData';

const UserProfile = () => {
    const { user, token } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('tab') || location.state?.tab || 'orders';
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [addresses, setAddresses] = useState([]);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressFormData, setAddressFormData] = useState({
        name: '', phone: '', address: '', city: '', state: '', pincode: ''
    });
    const [states] = useState(Object.keys(indiaData));
    const [cities, setCities] = useState([]);
    const successMessage = location.state?.message;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [ordersResult, wishlistResult, addressesResult] = await Promise.allSettled([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/orders/my-orders`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/wishlist`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/addresses`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (ordersResult.status === 'fulfilled') {
                    setOrders(ordersResult.value.data);
                } else {
                    setError('Failed to fetch orders: ' + (ordersResult.reason?.response?.data?.message || ordersResult.reason?.message || 'Unknown error'));
                }

                if (wishlistResult.status === 'fulfilled') {
                    setWishlist(wishlistResult.value.data);
                }

                if (addressesResult.status === 'fulfilled') {
                    setAddresses(addressesResult.value.data);
                }
            } catch (err) {
                setError('Failed to fetch user data.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchUserData();
        } else {
             navigate('/login');
        }
    }, [token, navigate]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab') || location.state?.tab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [location.search, location.state]);

    useEffect(() => {
        if (addressFormData.state && indiaData[addressFormData.state]) {
            setCities(indiaData[addressFormData.state]);
        } else {
            setCities([]);
        }
    }, [addressFormData.state]);

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/cancel/${orderId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: 'Cancelled' } : o));
            setFeedback('Order cancelled successfully!');
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Failed to cancel order');
            setTimeout(() => setFeedback(''), 3000);
        }
    };

    const handleMoveToCart = async (wishlistId) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/wishlist/${wishlistId}/move-to-cart`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlist(wishlist.filter(w => w.wishlist_id !== wishlistId));
            setFeedback('Item moved to cart!');
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Failed to move to cart');
            setTimeout(() => setFeedback(''), 3000);
        }
    };

    const handleRemoveWishlist = async (wishlistId) => {
        if(!window.confirm("Remove item from wishlist?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/wishlist/${wishlistId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlist(wishlist.filter(w => w.wishlist_id !== wishlistId));
            setFeedback('Item removed from wishlist.');
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Failed to remove from wishlist');
            setTimeout(() => setFeedback(''), 3000);
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm("Delete this address?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/addresses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddresses(addresses.filter(a => a.id !== id));
            setFeedback('Address deleted successfully.');
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Failed to delete address');
            setTimeout(() => setFeedback(''), 3000);
        }
    };

    const handleEditAddress = (addr) => {
        setEditingAddress(addr);
        setAddressFormData({
            name: addr.name,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode
        });
        setIsAddressModalOpen(true);
    };

    const handleUpdateAddress = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/addresses/${editingAddress.id}`, addressFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddresses(addresses.map(a => a.id === editingAddress.id ? { ...a, ...addressFormData } : a));
            setIsAddressModalOpen(false);
            setFeedback('Address updated successfully!');
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            setFeedback(err.response?.data?.message || 'Failed to update address');
        }
    };

    const handleAddressFormChange = (e) => {
        setAddressFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (e.target.name === 'state') {
            setAddressFormData(prev => ({ ...prev, city: '' }));
        }
    };

    const TabButton = ({ id, label, icon: Icon, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
            {count !== undefined && (
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-semibold ${activeTab === id ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                </span>
            )}
        </button>
    );

    const OrderTracker = ({ status }) => {
        const steps = ['Pending', 'Packed', 'Shipped', 'Delivered'];
        const isCancelled = status === 'Cancelled';
        
        if (isCancelled) {
             return (
                 <div className="py-4 px-6 bg-red-50 rounded-xl border border-red-100 flex items-center text-red-700 font-medium">
                     <XMarkIcon className="w-5 h-5 mr-2" /> Order Cancelled
                 </div>
             );
        }

        const currentIdx = steps.indexOf(status);
        
        return (
            <div className="relative pt-4 pb-8">
                {/* Progress bar background */}
                <div className="absolute top-7 left-[10%] right-[10%] h-1 bg-slate-200 rounded-full"></div>
                {/* Active progress bar */}
                <div 
                    className="absolute top-7 left-[10%] h-1 bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 80}%` }}
                ></div>
                
                <div className="flex justify-between relative z-10 w-full">
                    {steps.map((step, idx) => {
                        const isCompleted = idx <= currentIdx;
                        const isActive = idx === currentIdx;
                        return (
                            <div key={step} className="flex flex-col items-center w-1/4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                                    isCompleted ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'
                                } ${isActive ? 'ring-4 ring-primary/20' : ''}`}>
                                    {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>}
                                </div>
                                <span className={`text-xs font-medium ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{step}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) return <PageLoader />;

    return (
        <div className="min-h-screen bg-slate-50 py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Feedback Messages */}
                <AnimatePresence>
                    {(successMessage || feedback || error) && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
                            {(successMessage || feedback) && (
                                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex items-center shadow-sm">
                                    <CheckCircleIcon className="w-5 h-5 mr-3" />
                                    <span className="font-medium">{successMessage || feedback}</span>
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl flex items-center shadow-sm">
                                    <XMarkIcon className="w-5 h-5 mr-3" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile Header */}
                <Card className="mb-8 overflow-hidden border-0 shadow-md">
                    <div className="h-32 bg-gradient-to-r from-primary to-secondary"></div>
                    <div className="px-8 pb-8 flex flex-col sm:flex-row items-center sm:items-center sm:space-x-6 text-center sm:text-left">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-4xl sm:text-5xl font-bold text-primary shadow-sm -mt-12 sm:-mt-16 bg-white overflow-hidden shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="mt-4 sm:mt-6 flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{user?.name}</h1>
                            <p className="text-slate-500 mb-3">{user?.email}</p>
                            <div className="flex justify-center sm:justify-start">
                                <Badge variant="primary">Student</Badge>
                                {user?.role === 'seller' && <Badge variant="warning" className="ml-2">Seller Access</Badge>}
                                {user?.role === 'admin' && <Badge variant="danger" className="ml-2">Admin</Badge>}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                    <div className="border-b border-slate-200 overflow-x-auto custom-scrollbar">
                        <div className="flex px-4 min-w-max">
                            <TabButton id="orders" label="Order History" icon={ShoppingBagIcon} count={orders.length} />
                            <TabButton id="wishlist" label="My Wishlist" icon={HeartIcon} count={wishlist.length} />
                            <TabButton id="addresses" label="Saved Addresses" icon={MapPinIcon} count={addresses.length} />
                            {/* Additional tabs can be added here easily */}
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 bg-slate-50/50">
                        {activeTab === 'orders' && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                {orders.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                                        <ShoppingBagIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">No orders yet</h3>
                                        <p className="text-slate-500 mb-6 font-medium">When you purchase instruments, they will appear here.</p>
                                        <Button variant="primary" onClick={() => navigate('/products')}>Browse Products</Button>
                                    </div>
                                ) : (
                                    orders.map(order => (
                                        <Card key={order.id} className="overflow-hidden border-slate-200 hover:border-slate-300 transition-colors">
                                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                <div>
                                                    <div className="flex items-center space-x-3 mb-1">
                                                        <span className="font-bold text-slate-900 text-lg">Order</span>
                                                        <Badge variant={order.order_status === 'Delivered' ? 'success' : order.order_status === 'Cancelled' ? 'danger' : 'warning'}>
                                                            {order.order_status}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-500">Placed on {new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <div className="text-sm font-medium text-slate-500 mb-1">Total Amount</div>
                                                    <div className="font-bold text-xl text-primary">₹{Number(order.total_price).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6 border-b border-slate-100">
                                                <OrderTracker status={order.order_status} />
                                            </div>
                                            
                                            <div className="p-6 bg-white">
                                                <h4 className="font-bold text-slate-900 mb-4 flex items-center text-sm uppercase tracking-wider">
                                                    Order Items
                                                </h4>
                                                <div className="space-y-3 mb-6">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="font-medium text-slate-900">{item.name}</div>
                                                                <span className="text-slate-400 text-sm">x{item.quantity}</span>
                                                            </div>
                                                            <span className="font-semibold text-slate-700">₹{(item.price * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 border-t border-slate-100">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider">Delivery To</h4>
                                                        <p className="text-sm font-medium text-slate-700">{order.delivery_name}</p>
                                                        <p className="text-sm text-slate-500 max-w-sm">{order.address}, {order.city}</p>
                                                        <p className="text-xs text-slate-400 mt-1 uppercase">Payment: {order.payment_method}</p>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-3">
                                                        {order.order_status === 'Delivered' && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                className="text-xs font-bold uppercase tracking-widest px-4"
                                                                onClick={() => navigate(`/order/${order.id}`)}
                                                            >
                                                                Receipt
                                                            </Button>
                                                        )}
                                                        {(order.order_status === 'Pending' || order.order_status === 'Packed') && (
                                                            <Button 
                                                                variant="outline-danger" 
                                                                size="sm"
                                                                onClick={() => handleCancelOrder(order.id)}
                                                            >
                                                                Cancel Order
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            className="text-slate-500 font-bold text-xs uppercase"
                                                            onClick={() => navigate(`/order/${order.id}`)}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'wishlist' && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                                {wishlist.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                                        <HeartIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Wishlist is empty</h3>
                                        <p className="text-slate-500 mb-6 font-medium">Save items you like for later purchase.</p>
                                        <Button variant="primary" onClick={() => navigate('/products')}>Discover Products</Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {wishlist.map(item => (
                                            <Card key={item.wishlist_id} className="flex flex-col h-full group hover:border-primary/50 transition-colors">
                                                <div className="relative aspect-video bg-slate-100 border-b border-slate-100 overflow-hidden rounded-t-xl">
                                                    <img 
                                                        src={item.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${item.image}` : (item.image || 'https://via.placeholder.com/300x200')} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <button 
                                                        onClick={() => handleRemoveWishlist(item.wishlist_id)}
                                                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur text-slate-400 hover:text-danger rounded-full shadow-sm hover:bg-white transition-all z-10"
                                                        title="Remove from wishlist"
                                                    >
                                                        <XMarkIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="p-4 flex flex-col flex-1">
                                                    <Link to={`/product/${item.product_id}`} className="hover:text-primary transition-colors">
                                                        <h3 className="font-bold text-slate-900 line-clamp-2 mb-1">{item.name}</h3>
                                                    </Link>
                                                    <div className="text-lg font-extrabold text-primary mb-3">₹{Number(item.price).toLocaleString()}</div>
                                                    
                                                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                                                        <Badge variant={item.stock_quantity > 0 ? 'success' : 'danger'} size="sm">
                                                            {item.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                                        </Badge>
                                                        
                                                        <Button 
                                                            variant="primary" 
                                                            size="sm" 
                                                            className="rounded-full shadow-md"
                                                            onClick={() => handleMoveToCart(item.wishlist_id)}
                                                            disabled={item.stock_quantity <= 0}
                                                        >
                                                            Add to Cart
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'addresses' && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                {addresses.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                                        <MapPinIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">No saved addresses</h3>
                                        <p className="text-slate-500 mb-6 font-medium">Addresses you save during checkout will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {addresses.map(addr => (
                                            <Card key={addr.id} className="p-6 border-slate-200 hover:border-primary/30 transition-all relative group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                            <MapPinIcon className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">{addr.name}</h3>
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{addr.phone}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleEditAddress(addr)}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                            title="Edit Address"
                                                        >
                                                            <PencilSquareIcon className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteAddress(addr.id)}
                                                            className="p-2 text-slate-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-all"
                                                            title="Delete Address"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-slate-600 font-medium">{addr.address}</p>
                                                    <p className="text-sm text-slate-800 font-bold">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Address Modal */}
            <AnimatePresence>
                {isAddressModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddressModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-xl font-bold text-slate-900">Edit Delivery Address</h3>
                                <button onClick={() => setIsAddressModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <XMarkIcon className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleUpdateAddress} className="p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                    <Input label="Full Name" name="name" value={addressFormData.name} onChange={handleAddressFormChange} required />
                                    <Input label="Phone Number" name="phone" value={addressFormData.phone} onChange={handleAddressFormChange} required />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Address (Area and Street)</label>
                                    <textarea 
                                        name="address"
                                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium py-2.5 px-3.5 text-slate-900 border"
                                        rows="3"
                                        value={addressFormData.address}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                                        <select
                                            name="state"
                                            value={addressFormData.state}
                                            onChange={handleAddressFormChange}
                                            required
                                            className="w-full rounded-xl border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium py-2.5 px-3.5 text-slate-900 border bg-white"
                                        >
                                            <option value="">Select State</option>
                                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">City/District</label>
                                        <select
                                            name="city"
                                            value={addressFormData.city}
                                            onChange={handleAddressFormChange}
                                            required
                                            disabled={!addressFormData.state}
                                            className="w-full rounded-xl border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium py-2.5 px-3.5 text-slate-900 border bg-white disabled:bg-slate-50"
                                        >
                                            <option value="">Select City</option>
                                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <Input label="Pincode" name="pincode" value={addressFormData.pincode} onChange={handleAddressFormChange} required />
                                </div>
                                
                                <div className="flex space-x-4">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddressModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1">Update Address</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserProfile;
