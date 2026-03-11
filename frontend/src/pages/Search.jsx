import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';
import Button from '../components/ui/Button';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Search = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Support both 'q' and 'search' query params for backward compatibility
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q') || urlParams.get('search');

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
                const filtered = res.data.filter(p => 
                    p.name.toLowerCase().includes(query.toLowerCase()) || 
                    p.description.toLowerCase().includes(query.toLowerCase()) ||
                    p.category.toLowerCase().includes(query.toLowerCase())
                );
                setResults(filtered);
                setError(null);
            } catch (err) {
                setError('Failed to fetch search results.');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
        window.scrollTo(0, 0);
    }, [query]);

    return (
        <div className="bg-slate-50 min-h-screen pt-12 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Search Results
                    </h1>
                    {query ? (
                        <p className="text-lg text-slate-500">
                            Showing results for <span className="font-semibold text-primary">"{query}"</span>
                        </p>
                    ) : (
                        <p className="text-lg text-slate-500">
                            Enter a term to search for instruments.
                        </p>
                    )}
                </div>
                
                {error && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-8 font-medium shadow-sm max-w-3xl mx-auto text-center">
                        {error}
                    </div>
                )}

                {loading ? (
                    <PageLoader />
                ) : !query ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-3xl mx-auto">
                         <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                         <h3 className="text-xl font-bold text-slate-900 mb-2">Search our catalog</h3>
                         <p className="text-slate-500 mb-6">Type something in the search bar above to begin.</p>
                         <Button onClick={() => navigate('/products')} variant="primary">Browse All Products</Button>
                    </div>
                ) : results.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-3xl mx-auto">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MagnifyingGlassIcon className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No matching instruments found</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">We couldn't find any instruments matching "{query}". Try adjusting your search terms or browse our categories.</p>
                        <Button variant="primary" onClick={() => navigate('/products')}>Browse Full Catalog</Button>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-slate-600 font-medium">{results.length} Products Found</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {results.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
