import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // For the home page, just get all products or a few
                const res = await axios.get('http://localhost:5000/api/products');
                setProducts(res.data);
            } catch (err) {
                console.error("Failed to load products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    const categories = [
        { name: '1st Year', desc: 'Pre-clinical Prosthodontics & Dental Anatomy', icon: '🦷' },
        { name: '2nd Year', desc: 'Pre-clinical Conservative & Orthodontics', icon: '🔧' },
        { name: '3rd Year', desc: 'Clinical Postings & Advanced Lab', icon: '💉' },
        { name: '4th Year', desc: 'Final Year Comprehensive Care', icon: '🎓' }
    ];

    return (
        <div className="home-page">
            <section className="hero">
                <div className="container hero-content">
                    <h1>Your One-Stop Dental Instrument Shop</h1>
                    <p>High-quality specialized orthodontic and dental laboratory instruments for students of all years.</p>
                    
                    <form className="hero-search" onSubmit={handleSearch}>
                        <input 
                            type="text" 
                            placeholder="Search for instruments..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input search-input"
                        />
                        <button type="submit" className="btn btn-primary">Search</button>
                    </form>
                </div>
            </section>

            <section className="categories-section container">
                <h2>Browse by Year</h2>
                <div className="grid-cols-4 categories-grid">
                    {categories.map(cat => (
                        <Link to={`/category/${cat.name}`} key={cat.name} className="card category-card">
                            <div className="category-icon">{cat.icon}</div>
                            <h3>{cat.name}</h3>
                            <p>{cat.desc}</p>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="featured-section container">
                <h2>Featured Instruments</h2>
                {loading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : (
                    <div className="grid-cols-4 products-grid">
                        {products.slice(0, 8).map(product => (
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
            </section>
        </div>
    );
};

export default Home;
