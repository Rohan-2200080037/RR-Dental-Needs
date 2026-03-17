import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { TrashIcon, ShoppingBagIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { PageLoader } from '../components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = () => {
    const { items, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
    const { token } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchCart(token);
        }
    }, [token, fetchCart]);

    const handleQuantityChange = async (cartId, newQuantity, maxStock) => {
        if (newQuantity < 1) return;
        if (newQuantity > maxStock) {
            alert("Requested quantity exceeds available stock.");
            return;
        }
        await updateQuantity(cartId, newQuantity, token);
    };

    const handleRemove = async (cartId) => {
        if (window.confirm("Remove item from cart?")) {
            await removeFromCart(cartId, token);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    if (loading && items.length === 0) return <PageLoader />;

    return (
        <div className="bg-slate-50 min-h-screen pt-8 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Shopping Cart</h1>
                
                {error && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-8 font-medium shadow-sm">
                        {error}
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto mt-10">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBagIcon className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
                        <p className="text-slate-500 mb-8">Looks like you haven't added any instruments yet. Discover our top quality products for your classes.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button onClick={() => navigate('/products')} variant="primary" size="lg">Review Products</Button>
                            <Button onClick={() => navigate('/profile?tab=orders')} variant="outline" size="lg">My Orders</Button>
                        </div>
                    </div>
                ) : (
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
                        {/* Cart Items List */}
                        <div className="lg:col-span-8">
                            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden min-h-[400px]">
                                <ul className="divide-y divide-slate-200">
                                    <AnimatePresence>
                                        {items.map(item => (
                                            <motion.li 
                                                key={item.cart_id} 
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                                    <img 
                                                        src={item.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${item.image}` : (item.image || 'https://via.placeholder.com/150')} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-cover object-center"
                                                    />
                                                </div>
                                                
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-1 pl-1">
                                                                <Link to={`/product/${item.product_id}`} className="hover:text-primary transition-colors">{item.name}</Link>
                                                            </h3>
                                                            <p className="text-sm text-slate-500 mb-2 pl-1">In stock: {item.stock_quantity}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-extrabold text-primary whitespace-nowrap">₹{Number(item.price).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between mt-4 sm:mt-0">
                                                        <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                                                            <button 
                                                                onClick={() => handleQuantityChange(item.cart_id, item.quantity - 1, item.stock_quantity)}
                                                                disabled={item.quantity <= 1}
                                                                className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <MinusIcon className="w-4 h-4" />
                                                            </button>
                                                            <span className="w-10 text-center font-semibold text-slate-900 py-1 border-x border-slate-200">{item.quantity}</span>
                                                            <button 
                                                                onClick={() => handleQuantityChange(item.cart_id, item.quantity + 1, item.stock_quantity)}
                                                                disabled={item.quantity >= item.stock_quantity}
                                                                className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <PlusIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-4">
                                                            <div className="hidden sm:block text-sm font-semibold text-slate-700">
                                                                Subtotal: ₹{(item.price * item.quantity).toLocaleString()}
                                                            </div>
                                                            <button 
                                                                onClick={() => handleRemove(item.cart_id)}
                                                                className="p-2 text-slate-400 hover:text-danger hover:bg-red-50 rounded-full transition-colors group"
                                                                title="Remove item"
                                                            >
                                                                <TrashIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-4 mt-8 lg:mt-0">
                            <Card className="p-6 sm:p-8 sticky top-24 border-slate-200 shadow-md">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Order Summary</h3>
                                
                                <dl className="space-y-4 text-sm text-slate-600">
                                    <div className="flex justify-between items-center">
                                        <dt>Subtotal ({items.length} items)</dt>
                                        <dd className="font-semibold text-slate-900">₹{calculateTotal().toLocaleString()}</dd>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <dt>Shipping estimate</dt>
                                        <dd className="font-semibold text-emerald-600 uppercase tracking-wider text-xs bg-emerald-50 px-2 py-1 rounded">Free Delivery</dd>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <dt>Tax estimate</dt>
                                        <dd className="font-semibold text-slate-900">₹0</dd>
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center">
                                        <dt className="text-lg font-bold text-slate-900">Order Total</dt>
                                        <dd className="text-xl font-extrabold text-primary">₹{calculateTotal().toLocaleString()}</dd>
                                    </div>
                                </dl>

                                <div className="mt-8 space-y-4">
                                    <Button 
                                        onClick={() => navigate('/checkout')}
                                        variant="primary"
                                        size="lg"
                                        className="w-full shadow-lg"
                                    >
                                        Proceed to Checkout
                                    </Button>
                                    <div className="text-center">
                                        <p className="text-sm text-slate-500">
                                            or{' '}
                                            <Link to="/products" className="font-medium text-primary hover:text-primary-hover transition-colors">
                                                Continue Shopping
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
