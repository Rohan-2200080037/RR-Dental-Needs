import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { TruckIcon, CheckCircleIcon, ClockIcon, MapPinIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const statusIcons = {
  'Pickup': TruckIcon,
  'In Transit': TruckIcon,
  'Out for Delivery': MapPinIcon,
  'Delivered': CheckCircleIcon,
  'Pending': ClockIcon,
};

const statusColors = {
  'Pickup': 'text-blue-600 bg-blue-50 border-blue-200',
  'In Transit': 'text-amber-600 bg-amber-50 border-amber-200',
  'Out for Delivery': 'text-purple-600 bg-purple-50 border-purple-200',
  'Delivered': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Pending': 'text-slate-500 bg-slate-50 border-slate-200',
};

const TrackOrder = () => {
  const { awb } = useParams();
  const { token } = useAuthStore();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/shipping/track/${awb}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTracking(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tracking info.');
      } finally {
        setLoading(false);
      }
    };

    if (token && awb) fetchTracking();
  }, [awb, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></span>
          <p className="text-sm font-medium text-slate-500">Loading tracking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <TruckIcon className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Tracking Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Link to="/orders" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition-all">
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const scans = tracking?.scans || [];
  const reversedScans = [...scans].reverse();

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Track Shipment</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">AWB: <span className="font-mono font-bold text-slate-700">{awb}</span></p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <TruckIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
            {tracking?.courierName && (
              <span className="text-xs font-semibold text-slate-500">via {tracking.courierName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${statusColors[tracking?.status] || 'text-slate-500 bg-slate-50 border border-slate-200'}`}>
              <TruckIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{tracking?.status || 'In Transit'}</p>
              {tracking?.estimatedDelivery && (
                <p className="text-sm text-slate-500 font-medium">Est. delivery: {new Date(tracking.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Tracking History</h2>

          {reversedScans.length === 0 ? (
            <div className="text-center py-8">
              <ArchiveBoxIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No scan updates yet. Check back soon.</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
              <div className="space-y-6">
                {reversedScans.map((scan, idx) => {
                  const Icon = statusIcons[scan.status] || ClockIcon;
                  const isLatest = idx === reversedScans.length - 1;

                  return (
                    <div key={idx} className="relative flex gap-4 pl-10">
                      <div className={`absolute left-2.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm -translate-x-1/2 ${isLatest ? 'bg-primary' : 'bg-slate-300'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className={`p-3 rounded-xl border ${isLatest ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${isLatest ? 'text-primary' : 'text-slate-400'}`} />
                            <span className={`text-sm font-bold ${isLatest ? 'text-primary' : 'text-slate-700'}`}>
                              {scan.status || 'Update'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{scan.location}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {scan.time ? new Date(scan.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link to="/orders" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
            &larr; Back to My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
