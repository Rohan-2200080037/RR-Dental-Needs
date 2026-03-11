import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, EyeIcon, UserGroupIcon, ServerStackIcon, CodeBracketIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const PrivacyPolicy = () => {
    const sections = [
        {
            title: "1. Information We Collect",
            icon: EyeIcon,
            content: "The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information. If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us.",
            color: "text-blue-500",
            bg: "bg-blue-50",
            border: "border-blue-100"
        },
        {
            title: "2. How We Use Your Information",
            icon: UserGroupIcon,
            content: "We use the information we collect to provide, operate, and maintain our website; improve, personalize, and expand our website; understand how you use our website; communicate with you for customer service and marketing; and find and prevent fraud.",
            list: ["Provide, operate, and maintain our website", "Improve, personalize, and expand our website", "Communicate with you regarding orders and marketing", "Send you emails relating to your account security", "Find and prevent fraud"],
            color: "text-emerald-500",
            bg: "bg-emerald-50",
            border: "border-emerald-100"
        },
        {
            title: "3. Log Files",
            icon: ServerStackIcon,
            content: "RR Dental Needs follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected includes IP addresses, browser type, ISP, date/time stamp, referring/exit pages. These are not linked to any personally identifiable information.",
            color: "text-amber-500",
            bg: "bg-amber-50",
            border: "border-amber-100"
        },
        {
            title: "4. Cookies and Web Beacons",
            icon: CodeBracketIcon,
            content: "Like any other website, RR Dental Needs uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited to optimize the users' experience.",
            color: "text-purple-500",
            bg: "bg-purple-50",
            border: "border-purple-100"
        },
        {
            title: "5. Data Security",
            icon: ShieldCheckIcon,
            content: "We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.",
            color: "text-rose-500",
            bg: "bg-rose-50",
            border: "border-rose-100"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 pb-20 pt-20 relative px-4 text-center">
                 <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                 
                 <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 max-w-3xl mx-auto"
                 >
                    <div className="inline-flex items-center justify-center p-4 bg-teal-500/10 rounded-full mb-6 border border-teal-500/20 backdrop-blur-sm">
                        <ShieldCheckIcon className="w-10 h-10 text-teal-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Privacy Policy</h1>
                    <p className="text-teal-100/70 text-lg">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                 </motion.div>
            </div>

            {/* Content Container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-24">
                 
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-200 text-center"
                >
                    <p className="text-xl text-slate-600 leading-relaxed font-medium">
                        At RR Dental Needs, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by RR Dental Needs and how we use it.
                    </p>
                </motion.div>

                <div className="space-y-6">
                    {sections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 ${section.bg} rounded-bl-full -mr-16 -mt-16 opacity-50`}></div>
                                
                                <div className="flex items-start">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${section.bg} ${section.color} flex items-center justify-center mr-6 border ${section.border}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="relative z-10">
                                        <h2 className="text-2xl font-bold text-slate-900 mb-3">{section.title}</h2>
                                        <p className="text-slate-600 text-lg leading-relaxed mb-4">{section.content}</p>
                                        
                                        {section.list && (
                                            <ul className="space-y-2 mt-4 ml-2">
                                                {section.list.map((item, i) => (
                                                    <li key={i} className="flex items-center text-slate-600">
                                                        <span className={`w-2 h-2 ${section.bg} ${section.border} border rounded-full mr-3`}></span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 bg-slate-900 rounded-3xl p-8 text-center sm:p-12 relative overflow-hidden shadow-xl"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    
                    <div className="relative z-10">
                        <EnvelopeIcon className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
                        <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
                            If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us.
                        </p>
                        <a href="mailto:rrdentalneeds@gmail.com" className="inline-flex items-center px-8 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors">
                            Contact Privacy Team
                        </a>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default PrivacyPolicy;
