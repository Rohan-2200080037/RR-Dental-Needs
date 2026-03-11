import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "How long does delivery take?",
            answer: "Delivery typically takes 3-5 business days depending on your location. We offer expedited shipping options at checkout for faster delivery."
        },
        {
            question: "Do you offer student discounts?",
            answer: "Yes, our pricing is specifically tailored for dental students to remain affordable. We occasionally run special promotions at the start of the academic year."
        },
        {
            question: "Can I return an item if it's defective?",
            answer: "Absolutely. If you receive a defective or incorrect item, please contact our support team within 7 days of delivery for a full refund or replacement."
        },
        {
            question: "Are your instruments standardized for exams?",
            answer: "Yes, all our instruments meet the standard requirements for preclinical and clinical exercises across most dental universities."
        }
    ];

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-24 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-64 bg-slate-900">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold text-white mb-4"
                    >
                        Frequently Asked Questions
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-300"
                    >
                        Find answers to common questions about our products and services.
                    </motion.p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            key={index}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full text-left px-6 py-5 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors focus:outline-none"
                            >
                                <span className={`text-lg font-semibold ${openIndex === index ? 'text-primary' : 'text-slate-800'}`}>
                                    {faq.question}
                                </span>
                                <motion.div animate={{ rotate: openIndex === index ? 180 : 0 }}>
                                    <ChevronDownIcon className={`w-6 h-6 ${openIndex === index ? 'text-primary' : 'text-slate-400'}`} />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    >
                                        <div className="px-6 pb-5 pt-0 border-t border-slate-100 mt-2 text-slate-600 leading-relaxed text-lg">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 text-center bg-white p-10 rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-teal-50 rounded-full blur-2xl opacity-50"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                            💬
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Still have questions?</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg hover:text-slate-600">
                            Can't find the answer you're looking for? Contact our friendly support team.
                        </p>
                        <a href="mailto:rrdentalneeds@gmail.com" className="inline-flex items-center px-8 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                            Email Support
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FAQ;
