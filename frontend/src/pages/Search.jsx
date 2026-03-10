import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import './Products.css';

const Search = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    
    const query = new URLSearchParams(location.search).get('q');

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // Fetch all and filter client side for simplicity, or we could add a backend search route.
                // Since this is a demo, client side filter on all products is fine for small DB.
                const res = await axios.get('http://localhost:5000/api/products');
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
    }, [query]);

    return (
        <div className="container page-container">
            <h1 className="page-title">Search Results for "{query}"</h1>
            
            {loading ? (
                <div className="loading-spinner">Searching...</div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : results.length === 0 ? (
                <div className="empty-state">
                    <h3>No products found</h3>
                    <p>Try adjusting your search terms.</p>
                </div>
            ) : (
                <div className="products-grid">
                    {results.map(product => (
                        <div key={product.id} className="product-card card">
                            <div className="product-image-wrapper">
                                <img 
                                    src={product.image?.startsWith('/uploads') ? `http://localhost:5000${product.image}` : (product.image || 'https://via.placeholder.com/300')} 
                                    alt={product.name} 
                                    className="product-image"
                                />
                                {product.stock_quantity === 0 && (
                                    <div className="out-of-stock-overlay">Out of Stock</div>
                                )}
                            </div>
                            <div className="product-info">
                                <span className="product-category">{product.category}</span>
                                <h3 className="product-title">{product.name}</h3>
                                <div className="product-footer">
                                    <span className="product-price">₹{Number(product.price).toLocaleString()}</span>
                                    <Link to={`/product/${product.id}`} className="btn btn-primary btn-sm">View Details</Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Search;
