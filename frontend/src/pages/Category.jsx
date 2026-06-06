import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';
import Button from '../components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const Category = () => {
    const { category } = useParams();
    const decodedCategory = decodeURIComponent(category);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategoryProducts = async () => {
            setLoading(true);
            try {
                const isYear = ['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(decodedCategory);
                const endpoint = isYear ? 'year' : 'category';
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${endpoint}/${encodeURIComponent(decodedCategory)}`);
                setProducts(res.data);
                setError(null);
            } catch (err) {
                setError(`Failed to fetch ${decodedCategory} products`);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryProducts();
        window.scrollTo(0, 0);
    }, [decodedCategory]);

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center text-sm font-medium text-teal-100 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                        Back
                    </button>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                        {decodedCategory}{' '}
                        <span className="text-teal-200">
                            {['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(decodedCategory) ? 'Requirements' : 'Instruments'}
                        </span>
                    </h1>
                    <p className="text-teal-100/80 text-base sm:text-lg max-w-2xl">
                        Specialized tools and materials tailored for your academic journey. All products sourced from verified sellers for the highest quality.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">{products.length}</span>
                        {products.length === 1 ? 'product' : 'products'} found
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-8 text-sm font-medium">
                        {error}
                    </div>
                )}

                {loading ? (
                    <PageLoader />
                ) : products.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <span className="text-2xl">🔍</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No products available</h3>
                        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                            There are currently no instruments listed for {decodedCategory}. Check back later or browse other categories.
                        </p>
                        <Button variant="outline" size="sm" className="border-slate-300 text-slate-600" onClick={() => navigate('/products')}>
                            Browse All Products
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {products.map((product, idx) => (
                            <ProductCard key={product.id} product={product} index={idx} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Category;
