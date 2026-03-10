import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Products.css';

const Category = () => {
    const { category } = useParams();
    const decodedCategory = decodeURIComponent(category);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCategoryProducts = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/products/category/${encodeURIComponent(decodedCategory)}`);
                setProducts(res.data);
                setError(null);
            } catch (err) {
                setError(`Failed to fetch ${decodedCategory} products`);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryProducts();
    }, [decodedCategory]);

    return (
        <div className="container page-container">
            <div className="page-header">
                <h1>{decodedCategory} Instruments</h1>
                <p className="subtitle">Specialized tools and materials for your academic year.</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="loading-spinner">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <h3>No products available</h3>
                    <p>There are currently no instruments listed for this year.</p>
                    <Link to="/" className="btn btn-primary mt-4">Return Home</Link>
                </div>
            ) : (
                <div className="grid-cols-4 products-grid">
                    {products.map(product => (
                        <Link to={`/product/${product.id}`} key={product.id} className="card product-card">
                            <div className="product-image-container">
                                <img 
                                    src={product.image || 'https://via.placeholder.com/300x200?text=Instrument'} 
                                    alt={product.name} 
                                    className="product-image"
                                />
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

export default Category;
