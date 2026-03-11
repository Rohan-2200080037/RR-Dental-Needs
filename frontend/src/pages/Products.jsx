import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';
import Button from '../components/ui/Button';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [sortBy, setSortBy] = useState(''); // 'price_asc', 'price_desc', 'newest'
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search') || '';

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
                setProducts(res.data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
        window.scrollTo(0, 0);
    }, []);

    // Apply Filters & Search
    let filteredProducts = products.filter(p => {
        let matchesSearch = true;
        let matchesCategory = true;

        if (searchQuery) {
            matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        }

        if (filterCategory) {
            matchesCategory = p.category === filterCategory;
        }

        return matchesSearch && matchesCategory;
    });

    // Apply Sorting
    if (sortBy === 'price_asc') {
        filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price_desc') {
        filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'newest') {
        filteredProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const q = fd.get('q');
        if (q?.trim()) {
            navigate(`/products?search=${encodeURIComponent(q.trim())}`);
        } else {
            navigate(`/products`);
        }
    };

    const clearFilters = () => {
        setFilterCategory('');
        setSortBy('');
        navigate('/products');
    };

    const categories = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    const FilterSidebar = () => (
        <div className="space-y-8">
            {/* Search */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Search</h3>
                <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                        type="text"
                        name="q"
                        defaultValue={searchQuery}
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </form>
            </div>

            {/* Category Filter */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Category</h3>
                <div className="space-y-3">
                    {categories.map(cat => (
                        <label key={cat} className="flex items-center group cursor-pointer">
                            <input 
                                type="radio" 
                                name="category" 
                                value={cat}
                                checked={filterCategory === cat}
                                onChange={() => setFilterCategory(cat)}
                                className="w-4 h-4 text-primary bg-slate-100 border-slate-300 focus:ring-primary/50"
                            />
                            <span className={`ml-3 text-sm transition-colors ${filterCategory === cat ? 'font-medium text-primary' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                {cat} Requirements
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Sort Order */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Sort By</h3>
                <div className="space-y-3">
                    <label className="flex items-center group cursor-pointer">
                        <input 
                            type="radio" 
                            name="sort" 
                            checked={sortBy === 'price_asc'}
                            onChange={() => setSortBy('price_asc')}
                            className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                        />
                        <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900">Price: Low to High</span>
                    </label>
                    <label className="flex items-center group cursor-pointer">
                        <input 
                            type="radio" 
                            name="sort" 
                            checked={sortBy === 'price_desc'}
                            onChange={() => setSortBy('price_desc')}
                            className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                        />
                        <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900">Price: High to Low</span>
                    </label>
                    <label className="flex items-center group cursor-pointer">
                        <input 
                            type="radio" 
                            name="sort" 
                            checked={sortBy === 'newest'}
                            onChange={() => setSortBy('newest')}
                            className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                        />
                        <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900">Newest Arrivals</span>
                    </label>
                </div>
            </div>

            {(filterCategory || sortBy || searchQuery) && (
                <div className="pt-4 border-t border-slate-200">
                    <Button variant="outline" className="w-full text-sm" onClick={clearFilters}>
                        Clear All Filters
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen pt-8 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="md:flex md:items-end md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Instruments'}
                        </h1>
                        <p className="mt-2 text-slate-500">
                            Showing {filteredProducts.length} results
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 lg:hidden">
                        <Button variant="secondary" onClick={() => setIsMobileFiltersOpen(true)} className="w-full sm:w-auto">
                            <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
                            Filters
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
                            <FilterSidebar />
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {error && (
                            <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-6 font-medium">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <PageLoader />
                        ) : filteredProducts.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 border-dashed text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FunnelIcon className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
                                <p className="text-slate-500 mb-6 max-w-md mx-auto">We couldn't find any instruments matching your current search and filter criteria.</p>
                                <Button onClick={clearFilters} variant="primary">Clear All Filters</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filters Modal */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl overflow-y-auto transform transition-transform ml-auto">
                        <div className="p-4 flex items-center justify-between border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                            <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <FilterSidebar />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
