import React from 'react';
import { motion } from 'framer-motion';
import { DocumentTextIcon, ShieldExclamationIcon, CurrencyDollarIcon, ShoppingBagIcon, BookOpenIcon, ClockIcon } from '@heroicons/react/24/outline';

const TermsConditions = () => {
    const sections = [
        {
            id: "introduction",
            icon: DocumentTextIcon,
            title: "1. Introduction",
            content: "Welcome to RR Dental Needs. By accessing this website, we assume you accept these terms and conditions. Do not continue to use RR Dental Needs if you do not agree to take all of the terms and conditions stated on this page."
        },
        {
            id: "products",
            icon: ShoppingBagIcon,
            title: "2. Products and Pricing",
            content: "All products are subject to availability. We reserve the right to discontinue any product at any time. Prices for our products are subject to change without notice. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service."
        },
        {
            id: "accounts",
            icon: BookOpenIcon,
            title: "3. User Accounts",
            content: "When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service."
        },
        {
            id: "shipping",
            icon: ClockIcon,
            title: "4. Shipping and Returns",
            content: "Please review our FAQ or Shipping Policy for information on processing times and delivery expectations. Returns are accepted within 7 days of delivery for defective items only. Contact support for Return Authorization."
        },
        {
            id: "liability",
            icon: ShieldExclamationIcon,
            title: "5. Limitation of Liability",
            content: "In no event shall RR Dental Needs, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. RR Dental Needs, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website."
        },
        {
            id: "changes",
            icon: CurrencyDollarIcon,
            title: "6. Changes to Terms",
            content: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 pb-20 pt-20 relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-xl border border-white/20"
                    >
                        <DocumentTextIcon className="w-8 h-8 text-teal-400" />
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight"
                    >
                        Terms & Conditions
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-slate-400 text-lg"
                    >
                        Last updated: {new Date().toLocaleDateString()}
                    </motion.p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-24">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12"
                >
                    <div className="prose prose-slate prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed">
                        
                        <div className="space-y-12">
                            {sections.map((section, idx) => {
                                const Icon = section.icon;
                                return (
                                    <div key={section.id} className="relative pl-0 md:pl-16">
                                        <div className="hidden md:flex absolute left-0 top-1 w-10 h-10 bg-teal-50 text-teal-600 rounded-xl items-center justify-center shadow-sm border border-teal-100">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                                            <Icon className="w-6 h-6 mr-3 md:hidden text-teal-500" />
                                            {section.title}
                                        </h2>
                                        <p className="text-slate-600 text-lg leading-relaxed">{section.content}</p>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                    
                    <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500 text-lg">
                            If you have any questions about these Terms, please contact us.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsConditions;
