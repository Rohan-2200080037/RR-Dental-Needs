import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { ShieldCheckIcon, TruckIcon, BanknotesIcon, CreditCardIcon, MapPinIcon, CheckIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { indiaData } from '../utils/indiaData';

const FREE_SHIPPING_THRESHOLD = 500;

const Checkout = () => {
    const { items, fetchCart, clearCartState } = useCartStore();
    const { token, user } = useAuthStore();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: user?.email || '',
        building: '',
        flat: '',
        street: '',
        area: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        latitude: null,
        longitude: null
    });
    const [locationPinned, setLocationPinned] = useState(false);
    const [locating, setLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeoutRef = useRef(null);
    const [paymentMethod, setPaymentMethod] = useState('Razorpay');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [showSavedAddresses, setShowSavedAddresses] = useState(false);
    const [shouldSaveAddress, setShouldSaveAddress] = useState(false);
    const [states] = useState(Object.keys(indiaData));
    const [cities, setCities] = useState([]);
    const [orderPlaced, setOrderPlaced] = useState(false);

    const [shippingCharge, setShippingCharge] = useState(0);
    const [shippingRate, setShippingRate] = useState(null);
    const [shippingLoading, setShippingLoading] = useState(false);
    const prevPincodeRef = useRef('');

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const qualifiesFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const totalAmount = subtotal + shippingCharge;

    const fetchRates = useCallback(async (pincode) => {
        if (!pincode || pincode.length !== 6 || qualifiesFreeShipping) {
            setShippingCharge(0);
            setShippingRate(null);
            setShippingLoading(false);
            return;
        }
        setShippingLoading(true);
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/shipping/rates`, {
                params: { pincode, weight: 0.5 },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.recommended) {
                setShippingCharge(data.recommended.rate);
                setShippingRate(data.recommended);
            } else if (data.available?.length > 0) {
                const cheapest = data.available.reduce((a, b) => (a.rate < b.rate ? a : b));
                setShippingCharge(cheapest.rate);
                setShippingRate(cheapest);
            }
        } catch (err) {
            console.error("Shipping rate fetch failed:", err);
            setShippingCharge(80);
            setShippingRate({ courier_name: 'Standard Courier', rate: 80 });
        } finally {
            setShippingLoading(false);
        }
    }, [qualifiesFreeShipping, token]);

    useEffect(() => {
        if (qualifiesFreeShipping) {
            setShippingCharge(0);
            setShippingRate(null);
            setShippingLoading(false);
        }
    }, [qualifiesFreeShipping]);

    useEffect(() => {
        const pincode = formData.pincode;
        if (pincode && pincode.length === 6 && pincode !== prevPincodeRef.current) {
            prevPincodeRef.current = pincode;
            if (!qualifiesFreeShipping) fetchRates(pincode);
        }
    }, [formData.pincode, fetchRates, qualifiesFreeShipping]);

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'state') {
            setFormData(prev => ({ ...prev, city: '' }));
        }
    };

    const selectSavedAddress = (addr) => {
        setFormData({
            name: addr.name || '',
            phone: addr.phone || '',
            email: user?.email || '',
            building: '',
            flat: '',
            street: '',
            area: addr.address || '',
            landmark: '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            latitude: addr.latitude || null,
            longitude: addr.longitude || null
        });
        setLocationPinned(!!(addr.latitude && addr.longitude));
        setShowSavedAddresses(false);
    };

    const extractAddress = (addr) => {
        const state = addr.state || addr.region || '';
        const district = addr.state_district || addr.county || addr.district || '';
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.locality || addr.suburb || district;
        return { state, city, pincode: addr.postcode || '' };
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const addr = data.address || {};
            return { ...extractAddress(addr), _raw: addr };
        } catch {
            return { state: '', city: '', pincode: '', _raw: {} };
        }
    };

    const findBestCity = (availableCities, cityName, addressParts) => {
        const key = cityName?.toLowerCase().trim() || '';
        if (!key && !addressParts?.length) return '';

        const match = (list) => {
            for (const c of list) {
                const cLower = c.toLowerCase();
                if (key && cLower === key) return c;
            }
            for (const c of list) {
                const cLower = c.toLowerCase();
                if (key && (cLower.includes(key) || key.includes(cLower))) return c;
            }
            if (addressParts) {
                for (const c of list) {
                    const cLower = c.toLowerCase();
                    for (const part of addressParts) {
                        const p = part?.toLowerCase().trim();
                        if (p && (cLower === p || cLower.includes(p) || p.includes(cLower))) return c;
                    }
                }
            }
            return '';
        };

        return match(availableCities);
    };

    const applyPinnedLocation = async (lat, lng, addressDetails) => {
        setLocationPinned(true);
        let details, addressParts;
        if (addressDetails) {
            details = extractAddress(addressDetails);
            addressParts = Object.values(addressDetails).filter(v => typeof v === 'string');
        } else {
            details = await reverseGeocode(lat, lng);
            addressParts = Object.values(details._raw || {}).filter(v => typeof v === 'string');
        }

        const stateKey = details.state?.toLowerCase().trim() || '';
        const matchedState = states.find(s => s.toLowerCase() === stateKey)
            || states.find(s => s.toLowerCase().startsWith(stateKey) || stateKey.startsWith(s.toLowerCase()))
            || '';

        const availableCities = matchedState ? (indiaData[matchedState] || []) : [];
        const matchedCity = findBestCity(availableCities, details.city, addressParts);

        if (matchedState) setCities(availableCities);
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            state: matchedState || prev.state,
            city: matchedCity || '',
            pincode: details.pincode || prev.pincode
        }));
    };

    const pinLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                await applyPinnedLocation(pos.coords.latitude, pos.coords.longitude);
                setLocating(false);
            },
            (err) => {
                setLocating(false);
                setError('Could not detect location. Please allow location access or enter your address manually.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const fetchSuggestions = useCallback(async (query) => {
        if (query.trim().length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&viewbox=76.5,19.5,84.5,12.5`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const results = await res.json();
            if (results.length < 5) {
                const fallback = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const fallbackResults = await fallback.json();
                const merged = [...results];
                for (const fb of fallbackResults) {
                    if (!merged.find(r => r.place_id === fb.place_id)) merged.push(fb);
                }
                setSuggestions(merged.slice(0, 5));
                setShowSuggestions(merged.length > 0);
            } else {
                setSuggestions(results);
                setShowSuggestions(true);
            }
        } catch {
            setSuggestions([]);
        }
    }, []);

    const debouncedFetch = useCallback((value) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => fetchSuggestions(value), 300);
    }, [fetchSuggestions]);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    const handleSelectSuggestion = async (result) => {
        setShowSuggestions(false);
        setSuggestions([]);
        setSearchQuery(result.display_name);
        setSearchingLocation(true);
        try {
            await applyPinnedLocation(parseFloat(result.lat), parseFloat(result.lon), result.address);
        } finally {
            setSearchingLocation(false);
        }
    };

    const searchAndPinLocation = async () => {
        if (!searchQuery.trim()) return;
        if (suggestions.length > 0) {
            await handleSelectSuggestion(suggestions[0]);
            return;
        }
        setSearchingLocation(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&viewbox=76.5,19.5,84.5,12.5`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const results = await res.json();
            if (results.length > 0) {
                await handleSelectSuggestion(results[0]);
            } else {
                setError('Location not found. Try a different search term.');
            }
        } catch {
            setError('Could not search for location. Please try again.');
        } finally {
            setSearchingLocation(false);
        }
    };

    const buildFullAddress = () => {
        const parts = [];
        if (formData.building) parts.push(formData.building);
        if (formData.flat) parts.push(formData.flat);
        if (formData.street) parts.push(formData.street);
        if (formData.area) parts.push(formData.area);
        if (formData.landmark) parts.push(formData.landmark.toLowerCase().includes('near') ? formData.landmark : `Near ${formData.landmark}`);
        return parts.join(', ');
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.name || !formData.phone || !formData.building || !formData.area || !formData.city || !formData.state || !formData.pincode || !formData.latitude || !formData.longitude) {
            setError("Please fill all required fields and pin your delivery location on the map.");
            setLoading(false);
            return;
        }

        const fullAddress = buildFullAddress();

        const orderPayload = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: fullAddress,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            latitude: formData.latitude,
            longitude: formData.longitude,
            paymentMethod,
            shouldSaveAddress,
            shippingCharge,
            shippingProvider: qualifiesFreeShipping ? 'Free Shipping' : 'Flat Shipping',
        };

        try {
            if (paymentMethod === 'COD') {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, orderPayload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrderPlaced(true);
                clearCartState();
                navigate('/profile?tab=orders', { state: { message: 'Order placed successfully!' } });
            } else if (paymentMethod === 'Razorpay') {
                const { data: rzpOrder } = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/create-order`,
                    { amount: totalAmount },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                    amount: rzpOrder.amount,
                    currency: rzpOrder.currency,
                    name: 'RR Dental Needs',
                    description: `Order of ${items.length} item(s)`,
                    order_id: rzpOrder.id,
                    handler: async function (response) {
                        try {
                            await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/verify`,
                                {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    order_id: null,
                                    orderDetails: orderPayload
                                },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            setOrderPlaced(true);
                            clearCartState();
                            navigate('/profile?tab=orders', { state: { message: 'Payment successful! Order placed.' } });
                        } catch (verifyErr) {
                            setError(verifyErr.response?.data?.message || 'Payment verification failed.');
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            setLoading(false);
                            setError('Payment cancelled by user.');
                        }
                    },
                    prefill: {
                        name: formData.name,
                        email: formData.email,
                        contact: formData.phone,
                    },
                    theme: {
                        color: '#0d9488'
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                    setError(response.error.description || 'Payment failed.');
                    setLoading(false);
                });
                rzp.open();
            }
        } catch (err) {
             setError(err.response?.data?.message || 'Failed to place order.');
             setLoading(false);
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
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                                    <Input label="Full Name" type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                                    <Input label="Email" type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" />
                                    <Input label="Phone Number" type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required placeholder="10-digit mobile number" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                    <Input label="Building / Apartment Name *" type="text" id="building" name="building" value={formData.building} onChange={handleChange} required placeholder="e.g. Sunshine Apartments" />
                                    <Input label="Flat / Door Number" type="text" id="flat" name="flat" value={formData.flat} onChange={handleChange} placeholder="e.g. 3B (optional)" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                    <Input label="Street / Road Name" type="text" id="street" name="street" value={formData.street} onChange={handleChange} placeholder="e.g. MG Road (optional)" />
                                    <Input label="Area / Locality *" type="text" id="area" name="area" value={formData.area} onChange={handleChange} required placeholder="e.g. Indiranagar" />
                                </div>

                                <div className="mb-5">
                                    <Input label="Nearby Landmark" type="text" id="landmark" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="e.g. Near City Hospital (optional)" />
                                </div>

                                {/* Location Picker */}
                                <div className="mb-6 bg-slate-50 rounded-xl border border-slate-200 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <MapPinIcon className="w-5 h-5 text-primary" />
                                            <span className="text-sm font-bold text-slate-900">Pin Delivery Location *</span>
                                        </div>
                                        {locationPinned && (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                Location Pinned
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                        Choose one of the options below to set your delivery location. State, City and Pincode will auto-fill.
                                    </p>

                                    {/* Option 1: Detect My Current Location */}
                                    <button
                                        type="button"
                                        onClick={pinLocation}
                                        disabled={locating}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 bg-white border-slate-300 text-slate-700 hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                                    >
                                        {locating ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></span>
                                                Detecting...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                Detect My Current Location
                                            </>
                                        )}
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or</span>
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                    </div>

                                    {/* Option 2: Search for a location */}
                                    <div className="relative">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => {
                                                        setSearchQuery(e.target.value);
                                                        debouncedFetch(e.target.value);
                                                    }}
                                                    onFocus={(e) => {
                                                        if (suggestions.length > 0) setShowSuggestions(true);
                                                    }}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') { e.preventDefault(); searchAndPinLocation(); }
                                                        if (e.key === 'Escape') setShowSuggestions(false);
                                                    }}
                                                    placeholder="Search for a location, area or landmark..."
                                                    className="w-full rounded-xl border-slate-300 text-sm focus:border-primary focus:ring focus:ring-primary/20 font-medium py-2.5 px-3.5 border pr-10"
                                                />
                                                {searchingLocation && (
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={searchAndPinLocation}
                                                disabled={searchingLocation || !searchQuery.trim()}
                                                className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                Pin It
                                            </button>
                                        </div>

                                        {/* Suggestions dropdown */}
                                        {showSuggestions && suggestions.length > 0 && (
                                            <ul className="absolute z-50 left-0 right-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                {suggestions.map((result, idx) => (
                                                    <li
                                                        key={idx}
                                                        onMouseDown={() => handleSelectSuggestion(result)}
                                                        className="flex items-start gap-2.5 px-4 py-3 hover:bg-primary/5 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                                                    >
                                                        <MapPinIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                        <div className="min-w-0">
                                                            <span className="text-sm font-medium text-slate-800 block truncate">
                                                                {result.display_name?.split(',')[0]}
                                                            </span>
                                                            <span className="text-xs text-slate-400 block truncate">
                                                                {result.display_name}
                                                            </span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Pinned location info */}
                                    {locationPinned && (
                                        <div className="mt-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                                            <div className="flex items-center gap-2 text-sm text-emerald-800 font-medium">
                                                <MapPinIcon className="w-4 h-4 text-emerald-600" />
                                                <span>{formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <a
                                                    href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-primary hover:text-primary-hover underline"
                                                >
                                                    View Map
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, latitude: null, longitude: null, state: prev.state, city: prev.city, pincode: prev.pincode }));
                                                        setLocationPinned(false);
                                                    }}
                                                    className="text-xs font-semibold text-red-500 hover:text-red-700 underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
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
                                        onClick={() => setPaymentMethod('Razorpay')}
                                        className={`group relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                                            paymentMethod === 'Razorpay' 
                                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                                            : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                                <CreditCardIcon className="w-6 h-6" />
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                paymentMethod === 'Razorpay' ? 'border-primary' : 'border-slate-200'
                                            }`}>
                                                {paymentMethod === 'Razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 tracking-tight">Razorpay (UPI / Card / Net Banking)</span>
                                            <span className="text-[11px] font-bold text-slate-500 mt-1 leading-tight">Fastest & Secure: UPI, Cards, Wallets</span>
                                        </div>
                                        {paymentMethod === 'Razorpay' && (
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
                            </Card>
                        </form>
                    </div>

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
                                    <dd className="font-semibold text-slate-900">₹{subtotal.toLocaleString()}</dd>
                                </div>

                                <div className="flex justify-between items-center">
                                    <dt>Delivery Charge</dt>
                                    <dd>
                                        {shippingLoading ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                                <span className="w-3 h-3 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></span>
                                                Calculating...
                                            </span>
                                        ) : qualifiesFreeShipping ? (
                                            <span className="font-semibold text-emerald-600 uppercase tracking-wider text-xs bg-emerald-50 px-2 py-1 rounded">
                                                FREE
                                            </span>
                                        ) : shippingCharge > 0 ? (
                                            <span className="font-semibold text-slate-900">₹{shippingCharge.toLocaleString()}</span>
                                        ) : (
                                            <span className="text-xs text-slate-400">Enter pincode</span>
                                        )}
                                    </dd>
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50 -mx-4 px-4 py-3 rounded-lg">
                                    <dt className="text-base font-bold text-slate-900">Total Amount</dt>
                                    <dd className="text-xl font-extrabold text-primary">₹{totalAmount.toLocaleString()}</dd>
                                </div>
                            </dl>

                            {!qualifiesFreeShipping && subtotal > 0 && (
                                <div className="mt-3 text-center">
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Free delivery on orders above ₹{FREE_SHIPPING_THRESHOLD.toLocaleString()}
                                    </p>
                                </div>
                            )}

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
                                    {paymentMethod === 'COD' ? 'Place Order' : totalAmount > 0 ? `Pay ₹${totalAmount.toLocaleString()}` : 'Confirm Order'}
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
