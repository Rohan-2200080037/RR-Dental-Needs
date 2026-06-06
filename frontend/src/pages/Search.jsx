import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';

const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        year: searchParams.get('year') || '',
        category: searchParams.get('category') || ''
    });

    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const categories = [
        { value: 'permanent teeth wax carvings', label: 'Permanent Teeth Wax Carvings' },
        { value: 'preclinical prosthodontics', label: 'Preclinical Prosthodontics' },
        { value: 'primary teeth wax carvings', label: 'Primary Teeth Wax Carvings' },
        { value: 'Orthodontics', label: 'Preclinical Orthodontics' }
    ];

    const fetchSearchResults = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.year) params.append('year', filters.year);
            if (filters.category) params.append('category', filters.category);

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/search?${params.toString()}`);
            setProducts(res.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSearchResults();
    }, [query, searchParams]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = () => {
        const newParams = new URLSearchParams(searchParams);
        if (filters.year) newParams.set('year', filters.year);
        else newParams.delete('year');
        if (filters.category) newParams.set('category', filters.category);
        else newParams.delete('category');
        setSearchParams(newParams);
        fetchSearchResults();
    };

    const clearFilters = () => {
        setFilters({ minPrice: '', maxPrice: '', year: '', category: '' });
        setSearchParams({ q: query });
    };

    const hasFilters = filters.year || filters.category || filters.minPrice || filters.maxPrice;

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <MagnifyingGlassIcon className="w-5 h-5 text-teal-200" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                                Search Results
                            </h1>
                            <p className="text-sm text-teal-100/70 mt-0.5">
                                {products.length} {products.length === 1 ? 'product' : 'products'} found for "<span className="text-teal-200 font-medium">{query}</span>"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Link to="/products" className="text-xs font-medium text-teal-600 hover:underline">
                                All Products
                            </Link>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs text-slate-500">
                                Showing results for <span className="font-semibold text-slate-700">"{query}"</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                <div className="flex items-center text-sm font-bold text-slate-700">
                                    <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1.5" />
                                    Filters
                                </div>
                                {hasFilters && (
                                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                                )}
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Year</label>
                                    <select
                                        name="year"
                                        className="w-full rounded-lg border-slate-300 text-sm focus:ring-teal-500/20 focus:border-teal-400 bg-white py-2"
                                        value={filters.year}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Years</option>
                                        {years.map(yr => (
                                            <option key={yr} value={yr}>{yr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                                    <select
                                        name="category"
                                        className="w-full rounded-lg border-slate-300 text-sm focus:ring-teal-500/20 focus:border-teal-400 bg-white py-2"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Price Range</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            name="minPrice"
                                            placeholder="Min"
                                            className="w-full rounded-lg border-slate-300 text-sm focus:ring-teal-500/20 focus:border-teal-400 bg-white py-2"
                                            value={filters.minPrice}
                                            onChange={handleFilterChange}
                                        />
                                        <span className="text-slate-400 text-sm">-</span>
                                        <input
                                            type="number"
                                            name="maxPrice"
                                            placeholder="Max"
                                            className="w-full rounded-lg border-slate-300 text-sm focus:ring-teal-500/20 focus:border-teal-400 bg-white py-2"
                                            value={filters.maxPrice}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>

                                <Button className="w-full" variant="primary" size="sm" onClick={applyFilters}>
                                    Apply Filters
                                </Button>

                                {hasFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="w-full text-xs font-medium text-slate-500 hover:text-red-600 py-2 border border-slate-200 rounded-lg hover:border-red-200 hover:bg-red-50 transition-all"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <PageLoader />
                        ) : products.length === 0 ? (
                            <div className="bg-white py-16 rounded-2xl border border-slate-200 text-center">
                                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                                    <MagnifyingGlassIcon className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 mb-1">No products match your search</p>
                                <p className="text-xs text-slate-400 mb-5">Try different keywords or adjust your filters.</p>
                                <Button variant="outline" size="sm" className="border-slate-300 text-slate-600" onClick={clearFilters}>
                                    Clear All Filters
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {products.map((product, idx) => (
                                    <ProductCard key={product.id} product={product} index={idx} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Search;
