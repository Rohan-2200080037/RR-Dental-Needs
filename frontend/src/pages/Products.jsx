import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';
import Button from '../components/ui/Button';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterYear, setFilterYear] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [sortBy, setSortBy] = useState('');
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

    let filteredProducts = products.filter(p => {
        let matchesSearch = true;
        let matchesYear = true;
        let matchesCategory = true;

        if (searchQuery) {
            matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase());
        }

        if (filterYear) {
            matchesYear = p.year === filterYear;
        }

        if (filterCategory) {
            matchesCategory = p.category === filterCategory;
        }

        return matchesSearch && matchesYear && matchesCategory;
    });

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
            navigate('/products');
        }
    };

    const clearFilters = () => {
        setFilterYear('');
        setFilterCategory('');
        setSortBy('');
        navigate('/products');
    };

    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const categories = [
        { value: 'permanent teeth wax carvings', label: 'Permanent Teeth Wax Carvings' },
        { value: 'preclinical prosthodontics', label: 'Preclinical Prosthodontics' },
        { value: 'primary teeth wax carvings', label: 'Primary Teeth Wax Carvings' },
        { value: 'Orthodontics', label: 'Preclinical Orthodontics' }
    ];

    const sortOptions = [
        { value: '', label: 'Newest' },
        { value: 'price_asc', label: 'Price: Low to High' },
        { value: 'price_desc', label: 'Price: High to Low' },
    ];

    const hasActiveFilters = filterYear || filterCategory || sortBy || searchQuery;

    const FilterSidebar = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Year</h3>
                <div className="space-y-1">
                    {years.map(yr => (
                        <button
                            key={yr}
                            onClick={() => setFilterYear(filterYear === yr ? '' : yr)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${filterYear === yr
                                    ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                }`}
                        >
                            {yr}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Category</h3>
                <div className="space-y-1">
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setFilterCategory(filterCategory === cat.value ? '' : cat.value)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all capitalize ${filterCategory === cat.value
                                    ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className="w-full py-2.5 text-sm font-medium text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg hover:border-red-200 hover:bg-red-50 transition-all"
                >
                    Clear All Filters
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                                {searchQuery ? (
                                    <>
                                        Results for "<span className="text-teal-200">{searchQuery}</span>"
                                    </>
                                ) : (
                                    'All Instruments'
                                )}
                            </h1>
                            <p className="mt-3 text-teal-100/80 text-base sm:text-lg max-w-xl">
                                Browse our complete collection of dental instruments and materials for every academic year.
                            </p>
                        </div>
                        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
                            <input
                                type="text"
                                name="q"
                                defaultValue={searchQuery}
                                placeholder="Search instruments..."
                                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-teal-200/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 text-sm"
                            />
                            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-teal-200/60" />
                        </form>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">{filteredProducts.length}</span>
                            {filteredProducts.length === 1 ? 'product' : 'products'} found
                        </div>

                        <div className="flex items-center gap-2 sm:ml-auto">
                            {years.map(yr => (
                                <button
                                    key={yr}
                                    onClick={() => setFilterYear(filterYear === yr ? '' : yr)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterYear === yr
                                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                                            : 'text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                                        }`}
                                >
                                    {yr}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 cursor-pointer"
                                >
                                    {sortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>
                            <button
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                            >
                                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Filters</h2>
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                                )}
                            </div>
                            <FilterSidebar />
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 min-w-0">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <PageLoader />
                        ) : filteredProducts.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <FunnelIcon className="w-7 h-7 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">No products found</h3>
                                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                    {searchQuery
                                        ? `No results for "${searchQuery}". Try adjusting your search or filters.`
                                        : 'No instruments match your current filters. Try a different combination.'}
                                </p>
                                <Button onClick={clearFilters} variant="outline" size="sm" className="border-slate-300 text-slate-600">
                                    Clear All Filters
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredProducts.map((product, idx) => (
                                    <ProductCard key={product.id} product={product} index={idx} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filters Drawer */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl ml-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900">Filters</h2>
                            <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <FilterSidebar />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
