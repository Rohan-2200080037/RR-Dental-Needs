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
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/category/${encodeURIComponent(decodedCategory)}`);
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
        <div className="bg-slate-50 min-h-screen pt-8 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-10">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-6 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Back
                    </button>
                    
                    <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 text-center relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-secondary/5 rounded-full blur-3xl"></div>
                        
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4 relative z-10">
                            {decodedCategory} Requirements
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto relative z-10">
                            Specialized tools and materials tailored for your academic year. All products are sourced from verified sellers to ensure the highest quality.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-8 font-medium shadow-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <PageLoader />
                ) : products.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">📭</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No products available</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">There are currently no instruments listed for this year in our catalog. Please check back later.</p>
                        <Button variant="primary" onClick={() => navigate('/')}>Return Home</Button>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-slate-600 font-medium">{products.length} Products Found</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Category;
