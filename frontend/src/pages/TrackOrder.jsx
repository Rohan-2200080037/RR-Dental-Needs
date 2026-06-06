import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, TruckIcon } from '@heroicons/react/24/outline';

const TrackOrder = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <TruckIcon className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Tracking Unavailable</h2>
                <p className="text-sm text-slate-500 mb-6">Live tracking is being updated. Check your order details for the latest shipping status.</p>
                <Link to="/orders" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-all">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to My Orders
                </Link>
            </div>
        </div>
    );
};

export default TrackOrder;
