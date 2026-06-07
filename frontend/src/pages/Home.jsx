import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, ShieldCheckIcon, TruckIcon, CurrencyRupeeIcon, ClockIcon } from '@heroicons/react/24/outline';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { sortNumericAlpha } from '../utils/sortProducts';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
                setProducts(res.data);
            } catch (err) {
                console.error("Failed to load products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    const categories = [
        { name: '1st Year', desc: 'wax carvings,pre clinclical prosthodontics', icon: '🦷', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300' },
        { name: '2nd Year', desc: 'pre clinclical  prosthodontics and preclinical conservative dentistry ', icon: '🔬', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300' },
        { name: '3rd Year', desc: 'primary teeth wax carvings , orthodontics appliances ', icon: '🩺', color: 'bg-violet-50 text-violet-600 border-violet-100 hover:border-violet-300' },
        { name: '4th Year', desc: 'Final year orthodontic appliances', icon: '🎓', color: 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300' }
    ];

    const benefits = [
        { title: 'Quality Assured', desc: 'Standardized productsfor all clinical exercises', icon: ShieldCheckIcon },
        { title: 'Fast Delivery', desc: 'Quick shipping to your address', icon: TruckIcon },
        { title: 'Student Pricing', desc: 'Affordable rates designed for dental students', icon: CurrencyRupeeIcon },
        { title: '24/7 Support', desc: 'Always available to help with your orders', icon: ClockIcon },
    ];

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-slate-900 border-b border-slate-200 pt-24 pb-32">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="max-w-3xl mx-auto">
                        <Badge variant="primary" className="mb-6 py-1 px-3 border border-teal-200/20 bg-teal-500/10 text-white font-medium">
                            #1 Choice for Dental Students
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                            Your One-Stop <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-400">Dental Needs</span> Hub
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                            For Pre-Clinical Dental excerises of all years at reasonable prices
                        </p>

                        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-12 pr-32 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white/20 transition-all shadow-xl text-lg"
                                placeholder="Search for products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute inset-y-2 right-2">
                                <button type="submit" className="h-full px-6 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-primary/30">
                                    Search
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </section>

            {/* Benefits Section */}
            <section className="relative -mt-12 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {benefits.map((benefit, idx) => {
                        const Icon = benefit.icon;
                        return (
                            <motion.div key={idx} variants={fadeIn} className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 flex items-start space-x-4 hover:-translate-y-1 transition-transform duration-300">
                                <div className="p-3 bg-teal-50 rounded-xl text-primary">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">{benefit.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{benefit.desc}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </section>

            {/* Categories Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Browse by Academic Year</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">Find the products required for your current curriculum level.</p>
                </div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {categories.map((cat, idx) => (
                        <motion.div key={cat.name} variants={fadeIn}>
                            <Link to={`/category/${cat.name}`} className={`block h-full bg-white rounded-2xl p-8 shadow-sm border ${cat.color} transition-all duration-300 hover:shadow-md hover:-translate-y-1 group`}>
                                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{cat.icon}</div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-inherit">{cat.name} Requirement</h3>
                                <p className="text-sm opacity-80 leading-relaxed">{cat.desc}</p>
                                <div className="mt-6 flex items-center font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    Shop Now <span className="ml-2">&rarr;</span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Featured Products */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Instruments</h2>
                        <p className="text-slate-500 text-lg">Top-rated supplies by fellow students.</p>
                    </div>
                    <Link to="/products" className="hidden sm:flex items-center text-primary font-semibold hover:text-primary-hover group">
                        View all products <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </Link>
                </div>

                {loading ? (
                    <PageLoader />
                ) : (
                    <>
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8"
                        >
                            {sortNumericAlpha(products).slice(0, 8).map((product) => (
                                <motion.div key={product.id} variants={fadeIn} className="h-full">
                                    <ProductCard product={product} />
                                </motion.div>
                            ))}
                        </motion.div>

                        <div className="mt-10 text-center sm:hidden">
                            <Button variant="outline" className="w-full" onClick={() => navigate('/products')}>
                                View All Products
                            </Button>
                        </div>
                    </>
                )}
            </section>

            {/* WhatsApp Floating Popup */}
            <a
                href="https://wa.me/7207063315"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-4 left-4 z-50 bg-green-500 text-white p-3 rounded-full shadow-xl hover:bg-green-600 transition-all hover:scale-110 hover:shadow-green-500/30 group"
                title="Chat on WhatsApp"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white text-green-600 text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Get in touch with us on WhatsApp
                </span>
            </a>

            {/* PWA Install Prompt */}
            {showInstallPrompt && (
                <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 max-w-sm flex items-start space-x-4 animate-premium">
                    <div className="bg-teal-50 p-2 rounded-xl flex items-center justify-center">
                        <span className="text-2xl leading-none">📱</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm">Install RR Dental App</h4>
                        <p className="text-xs text-slate-500 mt-1 mb-3">There is an app for this store and you can install it for a better experience!</p>
                        <div className="flex space-x-2">
                            <button 
                                onClick={handleInstallClick}
                                className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                Install App
                            </button>
                            <button 
                                onClick={() => setShowInstallPrompt(false)}
                                className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
