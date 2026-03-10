import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Products.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    
    // Get search query from URL
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search') || '';

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
                let data = res.data;

                // Apply Search Filter locally if standard API doesn't support query params
                if (searchQuery) {
                    data = data.filter(p => 
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.description.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                }

                setProducts(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchQuery]);

    const filteredProducts = filterCategory 
        ? products.filter(p => p.category === filterCategory)
        : products;

    return (
        <div className="container page-container">
            <div className="page-header">
                <h1>{searchQuery ? `Search Results for "${searchQuery}"` : 'All Instruments'}</h1>
                
                <div className="filter-controls">
                    <label htmlFor="category-filter" className="filter-label">Filter by Year:</label>
                    <select 
                        id="category-filter"
                        className="form-input filter-select"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                    </select>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="loading-spinner">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            ) : (
                <div className="grid-cols-4 products-grid">
                    {filteredProducts.map(product => (
                        <Link to={`/product/${product.id}`} key={product.id} className="card product-card">
                            <div className="product-image-container">
                                <img 
                                    src={product.image || 'https://via.placeholder.com/300x200?text=Instrument'} 
                                    alt={product.name} 
                                    className="product-image"
                                />
                                <span className="product-category-badge">{product.category}</span>
                            </div>
                            <div className="product-info">
                                <h3 className="product-name" title={product.name}>{product.name}</h3>
                                <p className="product-price">₹{Number(product.price).toLocaleString()}</p>
                                <button className="btn btn-secondary btn-sm product-view-btn">View Details</button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Products;
