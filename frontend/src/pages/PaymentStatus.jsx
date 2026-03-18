import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const { clearCartState } = useCartStore();
    
    const txnId = searchParams.get('txnId');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Confirming your payment details...');

    useEffect(() => {
        const verifyPayment = async () => {
            if (!txnId || !token) {
                setStatus('error');
                setMessage('Invalid payment session.');
                return;
            }

            try {
                // 1. Check PhonePe Transaction Status
                const { data: statusData } = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/payment/phonepe-status/${txnId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (statusData.success) {
                    // 2. If Success, retrieve pending order details and create real order
                    const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder'));
                    
                    if (pendingOrder) {
                        try {
                            await axios.post(
                                `${import.meta.env.VITE_API_URL}/api/payment/phonepe-verify-final`,
                                {
                                    orderDetails: { ...pendingOrder, paymentMethod: 'PhonePe' },
                                    phonepe_txn_id: txnId,
                                    // Mocking Razorpay fields for the existing order completion logic
                                    razorpay_order_id: txnId, 
                                    razorpay_payment_id: txnId,
                                    razorpay_signature: 'phonepe_verified' // Adjusted backend must handle this
                                },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            localStorage.removeItem('pendingOrder');
                            clearCartState();
                            setStatus('success');
                            setMessage('Payment successful! Your order has been placed.');
                            
                            setTimeout(() => {
                                navigate('/profile?tab=orders');
                            }, 3000);
                        } catch (orderErr) {
                            console.error("Order creation failed after payment:", orderErr);
                            setStatus('error');
                            setMessage('Payment received, but order creation failed. Please contact support.');
                        }
                    } else {
                        setStatus('success');
                        setMessage('Payment successful! Redirecting...');
                        setTimeout(() => navigate('/profile?tab=orders'), 2000);
                    }
                } else {
                    setStatus('error');
                    setMessage(statusData.message || 'Payment failed or was cancelled.');
                }
            } catch (err) {
                console.error("Verification error:", err);
                setStatus('error');
                setMessage('Could not verify payment status.');
            }
        };

        verifyPayment();
    }, [txnId, token, clearCartState, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
                {status === 'verifying' && (
                    <div className="py-12">
                        <ArrowPathIcon className="w-20 h-20 text-primary mx-auto animate-spin mb-6" />
                        <h1 className="text-2xl font-black text-slate-900 mb-2">Verifying Payment</h1>
                        <p className="text-slate-500 font-medium">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-12">
                        <CheckCircleIcon className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                        <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Received!</h1>
                        <p className="text-emerald-600 font-bold mb-6">{message}</p>
                        <p className="text-sm text-slate-400">Redirecting you to your orders...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-12">
                        <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />
                        <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Failed</h1>
                        <p className="text-red-600 font-bold mb-8">{message}</p>
                        <div className="space-y-3">
                            <button 
                                onClick={() => navigate('/checkout')}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg"
                            >
                                Try Again
                            </button>
                            <button 
                                onClick={() => navigate('/')}
                                className="w-full bg-slate-100 text-slate-600 font-black py-4 rounded-xl hover:bg-slate-200 transition-all"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentStatus;
