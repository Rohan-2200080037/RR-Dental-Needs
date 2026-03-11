import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SparklesIcon, HeartIcon, AcademicCapIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

const AboutUs = () => {
    const values = [
        { icon: AcademicCapIcon, title: "Student First", desc: "Designed to meet curriculum needs from first year to final year.", color: "text-blue-500", bg: "bg-blue-50" },
        { icon: SparklesIcon, title: "Quality Materials", desc: "Standardized instruments that give you the best clinical practice.", color: "text-amber-500", bg: "bg-amber-50" },
        { icon: CurrencyRupeeIcon, title: "Affordability", desc: "We know student budgets are tight, so we keep margins low.", color: "text-emerald-500", bg: "bg-emerald-50" },
        { icon: HeartIcon, title: "Dedicated Support", desc: "Always here to assist with replacements and queries.", color: "text-rose-500", bg: "bg-rose-50" }
    ];

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-24 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="text-center max-w-3xl mx-auto">
                        <span className="text-teal-400 font-semibold tracking-wider uppercase text-sm mb-4 block">Our Story</span>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                            Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Dental Students</span>
                        </h1>
                        <p className="text-xl text-slate-300 leading-relaxed text-center">
                            We are your trusted partner for high-quality preclinical dental materials and instruments, serving students and professionals alike.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                                Founded with a mission to make dental education more accessible, we provide standardized, reliable materials tailored for all clinical exercises across every academic year.
                            </p>
                            <Link to="/products" className="inline-flex items-center px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all hover:shadow-md">
                                Explore Our Products
                            </Link>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative h-full min-h-[300px] rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center p-8">
                            {/* Decorative representation instead of an image since we don't have one */}
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-sky-100 opacity-50"></div>
                            <div className="text-9xl relative z-10 drop-shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                                🦷
                            </div>
                        </motion.div>
                    </div>

                    <hr className="my-16 border-slate-100" />

                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Core Values</h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">The principles that guide everything we do.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((v, idx) => {
                            const Icon = v.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="text-center p-6"
                                >
                                    <div className={`w-16 h-16 mx-auto ${v.bg} ${v.color} rounded-2xl flex items-center justify-center mb-6 transform transition-transform hover:scale-110 hover:rotate-3`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-3">{v.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{v.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
