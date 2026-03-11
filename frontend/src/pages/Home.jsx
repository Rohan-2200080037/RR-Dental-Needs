import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, ShieldCheckIcon, TruckIcon, CurrencyRupeeIcon, ClockIcon } from '@heroicons/react/24/outline';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
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
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    const categories = [
        { name: '1st Year', desc: 'Pre-clinical Prosthodontics & Dental Anatomy', icon: '🦷', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300' },
        { name: '2nd Year', desc: 'Pre-clinical Conservative & Orthodontics', icon: '🔧', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300' },
        { name: '3rd Year', desc: 'Clinical Postings & Advanced Lab', icon: '💉', color: 'bg-violet-50 text-violet-600 border-violet-100 hover:border-violet-300' },
        { name: '4th Year', desc: 'Final Year Comprehensive Care', icon: '🎓', color: 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300' }
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
                            {products.slice(0, 8).map((product) => (
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
        </div>
    );
};

export default Home;
