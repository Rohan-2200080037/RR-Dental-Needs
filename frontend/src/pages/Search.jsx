import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';

const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        category: searchParams.get('category') || ''
    });

    const categories = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Endodontics', 'Orthodontics', 'General'];

    const fetchSearchResults = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
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
        if (filters.category) newParams.set('category', filters.category);
        else newParams.delete('category');
        setSearchParams(newParams);
        fetchSearchResults();
    };

    return (
        <div className="bg-slate-50 min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                            <MagnifyingGlassIcon className="w-6 h-6 mr-2 text-primary" />
                            Search Results for "{query}"
                        </h1>
                        <p className="text-slate-500 mt-1">{products.length} products found</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center mb-6 text-slate-800 font-bold">
                                <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
                                Filters
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                                    <select 
                                        name="category"
                                        className="w-full rounded-lg border-slate-300 text-sm focus:ring-primary focus:border-primary"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Price Range</label>
                                    <div className="flex items-center space-x-2">
                                        <input 
                                            type="number" 
                                            name="minPrice"
                                            placeholder="Min"
                                            className="w-full rounded-lg border-slate-300 text-sm focus:ring-primary focus:border-primary"
                                            value={filters.minPrice}
                                            onChange={handleFilterChange}
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input 
                                            type="number" 
                                            name="maxPrice"
                                            placeholder="Max"
                                            className="w-full rounded-lg border-slate-300 text-sm focus:ring-primary focus:border-primary"
                                            value={filters.maxPrice}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>

                                <Button className="w-full" variant="primary" onClick={applyFilters}>Apply Filters</Button>
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <PageLoader />
                        ) : products.length === 0 ? (
                            <div className="bg-white py-20 rounded-2xl border border-slate-200 text-center">
                                <p className="text-slate-500 font-medium">No products match your search/filters.</p>
                                <Button variant="ghost" className="mt-4" onClick={() => {
                                    setFilters({ minPrice: '', maxPrice: '', category: '' });
                                    setSearchParams({ q: query });
                                }}>Clear All Filters</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} />
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
