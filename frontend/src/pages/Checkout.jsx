import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { ShieldCheckIcon, TruckIcon, BanknotesIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (items.length === 0) {
            navigate('/cart');
        }
    }, [items, navigate]);

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (paymentMethod === 'Razorpay') {
                // 1. Create Razorpay order on backend
                const totalAmount = calculateTotal();
                const { data: orderData } = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/create-order`, 
                    { amount: totalAmount },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // 2. Open Razorpay modal
                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "RR Dental Needs",
                    description: "Purchase instruments",
                    order_id: orderData.id,
                    handler: async (response) => {
                        try {
                            // 3. Verify payment and create final order
                            await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/verify`, {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderDetails: { ...formData, paymentMethod: 'Razorpay' }
                            }, { headers: { Authorization: `Bearer ${token}` } });

                            clearCartState();
                            navigate('/profile', { state: { message: 'Order placed successfully!', tab: 'orders' } });
                        } catch (err) {
                            setError(err.response?.data?.message || 'Payment verification failed.');
                        }
                    },
                    prefill: {
                        name: formData.name,
                        contact: formData.phone
                    },
                    theme: { color: "#0d9488" }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
                setLoading(false);
            } else {
                // COD Flow
                await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, 
                    { ...formData, paymentMethod },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                clearCartState();
                navigate('/profile', { state: { message: 'Order placed successfully!', tab: 'orders' } });
            }
        } catch (err) {
             setError(err.response?.data?.message || 'Failed to place order.');
        } finally {
            if (paymentMethod !== 'Razorpay') setLoading(false);
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
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <Input label="City/District" type="text" id="city" name="city" value={formData.city} onChange={handleChange} required placeholder="e.g. Chennai" />
                                    <Input label="State" type="text" id="state" name="state" value={formData.state} onChange={handleChange} required placeholder="e.g. Tamil Nadu" />
                                    <Input label="Pincode" type="text" id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="6-digit code" />
                                </div>
                            </Card>

                            <Card className="p-6 sm:p-8 border-slate-200 shadow-sm">
                                <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                                    <h2 className="text-xl font-bold text-slate-900">Payment Options</h2>
                                </div>
                                
                                <div className="space-y-4">
                                    <label className={`block relative border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex items-center">
                                            <input 
                                                type="radio" 
                                                name="payment" 
                                                value="COD" 
                                                checked={paymentMethod === 'COD'} 
                                                onChange={(e) => setPaymentMethod(e.target.value)} 
                                                className="h-5 w-5 text-primary border-slate-300 focus:ring-primary"
                                            />
                                            <div className="ml-4 flex flex-col">
                                                <span className="block text-sm font-bold text-slate-900 flex items-center">
                                                    <BanknotesIcon className="w-5 h-5 mr-2 text-primary" />
                                                    Cash on Delivery (COD)
                                                </span>
                                                <span className="block text-sm font-medium text-slate-500 mt-1">Pay when your order is delivered.</span>
                                            </div>
                                        </div>
                                    </label>
                                    
                                    <label className={`block relative border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'Razorpay' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex items-center">
                                            <input 
                                                type="radio" 
                                                name="payment" 
                                                value="Razorpay" 
                                                checked={paymentMethod === 'Razorpay'} 
                                                onChange={(e) => setPaymentMethod(e.target.value)} 
                                                className="h-5 w-5 text-primary border-slate-300 focus:ring-primary"
                                            />
                                            <div className="ml-4 flex flex-col">
                                                <span className="block text-sm font-bold text-slate-900 flex items-center">
                                                    <CreditCardIcon className="w-5 h-5 mr-2 text-primary" />
                                                    Online Payment (Razorpay)
                                                </span>
                                                <span className="block text-sm font-medium text-slate-500 mt-1">Cards, UPI, Netbanking & more.</span>
                                            </div>
                                        </div>
                                    </label>
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
