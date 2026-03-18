import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { ShieldCheckIcon, TruckIcon, BanknotesIcon, CreditCardIcon, MapPinIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { indiaData } from '../utils/indiaData';

const Checkout = () => {
    const { items, fetchCart, clearCartState } = useCartStore();
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('PhonePe');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [showSavedAddresses, setShowSavedAddresses] = useState(false);
    const [shouldSaveAddress, setShouldSaveAddress] = useState(false);
    const [states] = useState(Object.keys(indiaData));
    const [cities, setCities] = useState([]);
    const [orderPlaced, setOrderPlaced] = useState(false);

    useEffect(() => {
        const loadAddresses = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/addresses`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSavedAddresses(data);
                if (data.length > 0) {
                    setShowSavedAddresses(true);
                }
            } catch (err) {
                console.error("Failed to fetch addresses:", err);
            }
        };

        if (token) {
            loadAddresses();
        }
    }, [token]);

    useEffect(() => {
        if (formData.state && indiaData[formData.state]) {
            setCities(indiaData[formData.state]);
        } else {
            setCities([]);
        }
    }, [formData.state]);

    useEffect(() => {
        if (items.length === 0 && !orderPlaced) {
            navigate('/cart');
        }
    }, [items, navigate, orderPlaced]);

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'state') {
            setFormData(prev => ({ ...prev, city: '' }));
        }
    };

    const selectSavedAddress = (addr) => {
        setFormData({
            name: addr.name,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode
        });
        setShowSavedAddresses(false);
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (paymentMethod === 'PhonePe') {
                const totalAmount = calculateTotal();
                const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/phonepe-initiate`, 
                    { 
                        amount: totalAmount,
                        orderDetails: { ...formData, shouldSaveAddress }
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Store orderDetails in localStorage so we can retrieve them on the return page
                localStorage.setItem('pendingOrder', JSON.stringify({
                    ...formData,
                    items,
                    totalAmount,
                    shouldSaveAddress
                }));

                // Redirect to PhonePe
                window.location.href = data.url;
                return;
            } else if (paymentMethod === 'COD') {
                // COD Flow
                await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, 
                    { ...formData, paymentMethod, shouldSaveAddress },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                setOrderPlaced(true);
                clearCartState();
                navigate('/profile?tab=orders', { state: { message: 'Order placed successfully!' } });
            }
        } catch (err) {
             setError(err.response?.data?.message || 'Failed to place order.');
        } finally {
            if (paymentMethod !== 'Razorpay' && paymentMethod !== 'PhonePe') setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pt-8 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="flex items-center justify-center space-x-4 mb-10 border-b border-slate-200 pb-6">
                    <ShieldCheckIcon className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Secure Checkout</h1>
                </div>
                
                {error && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-8 font-medium shadow-sm">
                        {error}
                    </div>
                )}

                <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
                    
                    {/* Checkout Form */}
                    <div className="lg:col-span-8">
                        <form id="checkout-form" onSubmit={handleCheckout}>
                            <Card className="p-6 sm:p-8 mb-6 border-slate-200 shadow-sm">
                                <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                                    <h2 className="text-xl font-bold text-slate-900">Delivery Details</h2>
                                </div>
                                
                                {savedAddresses.length > 0 && (
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Deliver to:</h3>
                                            <button 
                                                type="button"
                                                onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                                                className="text-xs font-black text-primary hover:text-primary-dark transition-colors uppercase tracking-widest flex items-center"
                                            >
                                                {showSavedAddresses ? 'Enter New Address' : 'Choose Saved Address'}
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {showSavedAddresses && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                        {savedAddresses.map((addr) => (
                                                            <div 
                                                                key={addr.id}
                                                                onClick={() => selectSavedAddress(addr)}
                                                                className="relative p-4 border-2 border-slate-100 rounded-2xl hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all group"
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        <MapPinIcon className="w-4 h-4 text-primary" />
                                                                        <span className="font-black text-slate-900 text-sm">{addr.name}</span>
                                                                    </div>
                                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-primary flex items-center justify-center">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-slate-600 line-clamp-2 font-medium mb-1">{addr.address}</p>
                                                                <p className="text-xs text-slate-500 font-bold">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                                <div className="mt-2 pt-2 border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                    Phone: {addr.phone}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                    <Input label="Full Name" type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                                    <Input label="Phone Number" type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required placeholder="10-digit mobile number" />
                                </div>
                                
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="address">Address (Area and Street)</label>
                                    <textarea 
                                        id="address" 
                                        name="address" 
                                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium py-2.5 px-3.5 text-slate-900 border" 
                                        rows="3" 
                                        value={formData.address} 
                                        onChange={handleChange} 
                                        required
                                        placeholder="Enter your full local address..."
                                    ></textarea>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                                        <select
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium py-2.5 px-3.5 text-slate-900 border bg-white"
                                        >
                                            <option value="">Select State</option>
                                            {states.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">City/District</label>
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            disabled={!formData.state}
                                            className="w-full rounded-xl border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium py-2.5 px-3.5 text-slate-900 border bg-white disabled:bg-slate-50 disabled:text-slate-400"
                                        >
                                            <option value="">Select City</option>
                                            {cities.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input label="Pincode" type="text" id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="6-digit code" />
                                </div>

                                <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <input 
                                        type="checkbox" 
                                        id="saveAddress" 
                                        checked={shouldSaveAddress}
                                        onChange={(e) => setShouldSaveAddress(e.target.checked)}
                                        className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
                                    />
                                    <label htmlFor="saveAddress" className="text-sm font-black text-slate-700 cursor-pointer select-none tracking-tight">
                                        Save this address for future deliveries
                                    </label>
                                </div>
                            </Card>

                            <Card className="p-6 sm:p-8 border-slate-200 shadow-sm">
                                <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                                    <h2 className="text-xl font-bold text-slate-900">Payment Options</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label 
                                        onClick={() => setPaymentMethod('PhonePe')}
                                        className={`group relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                                            paymentMethod === 'PhonePe' 
                                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                                            : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                                <CreditCardIcon className="w-6 h-6" />
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                paymentMethod === 'PhonePe' ? 'border-primary' : 'border-slate-200'
                                            }`}>
                                                {paymentMethod === 'PhonePe' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 tracking-tight">PhonePe</span>
                                            <span className="text-[11px] font-bold text-slate-500 mt-1 leading-tight">Fastest & Secure: UPI, Cards, Wallets</span>
                                        </div>
                                        {paymentMethod === 'PhonePe' && (
                                            <motion.div layoutId="selection" className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full shadow-lg">
                                                <CheckIcon className="w-3 h-3 border-2 border-white rounded-full" />
                                            </motion.div>
                                        )}
                                    </label>
                                    
                                    <label 
                                        onClick={() => setPaymentMethod('COD')}
                                        className={`group relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                                            paymentMethod === 'COD' 
                                            ? 'border-slate-800 bg-slate-50 shadow-md shadow-slate-200' 
                                            : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:scale-110 transition-transform">
                                                <BanknotesIcon className="w-6 h-6" />
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                paymentMethod === 'COD' ? 'border-slate-800' : 'border-slate-200'
                                            }`}>
                                                {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 tracking-tight">Cash on Delivery</span>
                                            <span className="text-[11px] font-bold text-slate-500 mt-1 leading-tight">Pay at your doorstep</span>
                                        </div>
                                    </label>
                                </div>
                                <div className="mt-6 flex items-center justify-center space-x-4 opacity-50 grayscale transition-all hover:grayscale-0">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-4" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-3" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-5" />
                                </div>
                            </Card>
                        </form>
                    </div>

                    {/* Order Summary Checkout preview */}
                    <div className="lg:col-span-4 mt-8 lg:mt-0">
                        <Card className="p-6 sm:p-8 sticky top-24 border-slate-200 shadow-md">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Order Summary</h3>
                            
                            <div className="max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar space-y-4">
                                {items.map(item => (
                                    <div key={item.cart_id} className="flex gap-4">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                                            <img src={item.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${item.image}` : (item.image || 'https://via.placeholder.com/150')} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight mb-1">{item.name}</h4>
                                            <div className="text-xs text-slate-500 flex justify-between items-center mt-2">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">Qty: {item.quantity}</span>
                                                <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <dl className="space-y-4 text-sm text-slate-600 border-t border-slate-100 pt-4">
                                <div className="flex justify-between items-center">
                                    <dt>Subtotal</dt>
                                    <dd className="font-semibold text-slate-900">₹{calculateTotal().toLocaleString()}</dd>
                                </div>
                                <div className="flex justify-between items-center">
                                    <dt>Shipping estimate</dt>
                                    <dd className="font-semibold text-emerald-600 uppercase tracking-wider text-xs bg-emerald-50 px-2 py-1 rounded">Free Delivery</dd>
                                </div>
                                <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50 -mx-4 px-4 py-3 rounded-lg">
                                    <dt className="text-base font-bold text-slate-900">Total Amount</dt>
                                    <dd className="text-xl font-extrabold text-primary">₹{calculateTotal().toLocaleString()}</dd>
                                </div>
                            </dl>

                            <div className="mt-6 space-y-4 pt-4">
                                <Button 
                                    type="submit" 
                                    form="checkout-form"
                                    variant="primary"
                                    size="lg"
                                    className="w-full shadow-lg h-14 text-lg"
                                    isLoading={loading}
                                    disabled={items.length === 0}
                                >
                                    Confirm Order
                                </Button>
                                <div className="text-center flex items-center justify-center text-xs text-slate-500 font-medium space-x-1">
                                    <ShieldCheckIcon className="w-4 h-4" />
                                    <span>Secure 256-bit encryption</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
