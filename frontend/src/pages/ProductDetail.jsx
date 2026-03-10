import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [cartFeedback, setCartFeedback] = useState('');
    
    // Reviews & Related Products States
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [reviewFeedback, setReviewFeedback] = useState('');

    const { isAuthenticated, token, user } = useAuthStore();
    const { addToCart, loading: cartLoading } = useCartStore();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/products/${id}`);
                setProduct(res.data);
                
                // Fetch reviews
                const revRes = await axios.get(`http://localhost:5000/api/reviews/product/${id}`);
                setReviews(revRes.data.reviews || []);
                setAverageRating(revRes.data.averageRating || 0);

                // Fetch Related Products
                const relRes = await axios.get(`http://localhost:5000/api/products/category/${res.data.category}`);
                setRelatedProducts(relRes.data.filter(p => p.id !== parseInt(id)).slice(0, 4));

                setError(null);
            } catch (err) {
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleQuantityChange = (type) => {
        if (type === 'inc' && product && quantity < product.stock_quantity) {
            setQuantity(prev => prev + 1);
        } else if (type === 'dec' && quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Sellers shouldn't really buy their own stuff, but let's just allow it for testing,
        // or prevent it if wanted. We'll allow it but Admin / Seller checking out is fine.

        try {
            await addToCart(product.id, quantity, token);
            setCartFeedback('Added to cart successfully!');
            setTimeout(() => setCartFeedback(''), 3000);
        } catch (err) {
            setCartFeedback(err.response?.data?.message || 'Failed to add to cart');
            setTimeout(() => setCartFeedback(''), 3000);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return navigate('/login');

        try {
            await axios.post('http://localhost:5000/api/reviews', {
                productId: id,
                rating: reviewForm.rating,
                comment: reviewForm.comment
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setReviewFeedback('Review submitted successfully!');
            setReviewForm({ rating: 5, comment: '' });
            
            const revRes = await axios.get(`http://localhost:5000/api/reviews/product/${id}`);
            setReviews(revRes.data.reviews || []);
            setAverageRating(revRes.data.averageRating || 0);
            
            setTimeout(() => setReviewFeedback(''), 3000);
        } catch (err) {
            setReviewFeedback(err.response?.data?.message || 'Failed to submit review');
            setTimeout(() => setReviewFeedback(''), 3000);
        }
    };

    if (loading) return <div className="container page-container loading-spinner">Loading product...</div>;
    if (error) return <div className="container page-container"><div className="alert alert-danger">{error}</div></div>;
    if (!product) return <div className="container page-container">Product not found</div>;

    const isOutOfStock = product.stock_quantity === 0;

    return (
        <div className="container page-container">
            <div className="product-detail-wrapper">
                <div className="product-detail-image-sec">
                    <img 
                        src={product.image?.startsWith('/uploads') ? `http://localhost:5000${product.image}` : (product.image || 'https://via.placeholder.com/600x400?text=Instrument')} 
                        alt={product.name} 
                        className="detail-image"
                    />
                </div>
                
                <div className="product-detail-info-sec">
                    <div className="breadcrumb">
                        <span>Products</span> / <span>{product.category}</span>
                    </div>
                    
                    <h1 className="detail-title">{product.name}</h1>
                    <div className="detail-rating" style={{ color: '#eab308', marginBottom: '10px' }}>
                        {'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))} 
                        <span style={{ color: '#666', fontSize: '14px', marginLeft: '5px' }}>({reviews.length} reviews)</span>
                    </div>

                    <div className="detail-price-stock">
                        <span className="detail-price">₹{Number(product.price).toLocaleString()}</span>
                        <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                            {isOutOfStock ? 'Out of Stock' : `In Stock: ${product.stock_quantity}`}
                        </span>
                    </div>
                    
                    <div className="detail-description">
                        <h3>Description</h3>
                        <p>{product.description}</p>
                    </div>

                    <div className="add-to-cart-sec">
                        <div className="quantity-selector">
                            <button 
                                className="qty-btn" 
                                onClick={() => handleQuantityChange('dec')}
                                disabled={quantity <= 1 || isOutOfStock}
                            >-</button>
                            <span className="qty-display">{quantity}</span>
                            <button 
                                className="qty-btn" 
                                onClick={() => handleQuantityChange('inc')}
                                disabled={quantity >= product.stock_quantity || isOutOfStock}
                            >+</button>
                        </div>
                        
                        <button 
                            className="btn btn-primary btn-add-cart"
                            onClick={handleAddToCart}
                            disabled={isOutOfStock || cartLoading}
                        >
                            {cartLoading ? 'Adding...' : 'Add to Cart'}
                        </button>
                    </div>
                    
                    {cartFeedback && (
                        <div className={`alert mt-4 ${cartFeedback.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
                            {cartFeedback}
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section" style={{ marginTop: '50px', borderTop: '1px solid #ddd', paddingTop: '30px' }}>
                <h2>Customer Reviews</h2>
                <div className="reviews-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginTop: '20px' }}>
                    <div className="review-form-container card" style={{ padding: '20px', height: 'fit-content' }}>
                        <h3>Write a Review</h3>
                        {!isAuthenticated ? (
                            <p>Please <a href="/login">login</a> to write a review.</p>
                        ) : (
                            <form onSubmit={handleReviewSubmit}>
                                <div className="form-group">
                                    <label>Rating</label>
                                    <select 
                                        className="form-input"
                                        value={reviewForm.rating}
                                        onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}
                                    >
                                        <option value={5}>5 - Excellent</option>
                                        <option value={4}>4 - Very Good</option>
                                        <option value={3}>3 - Average</option>
                                        <option value={2}>2 - Poor</option>
                                        <option value={1}>1 - Terrible</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Comment</label>
                                    <textarea 
                                        className="form-input" 
                                        rows="4"
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Submit Review</button>
                                {reviewFeedback && <div className="alert mt-2" style={{fontSize: '14px', padding: '10px'}}>{reviewFeedback}</div>}
                            </form>
                        )}
                    </div>
                    
                    <div className="reviews-list">
                        {reviews.length === 0 ? (
                            <p>No reviews yet. Be the first to review this product!</p>
                        ) : (
                            reviews.map(rev => (
                                <div key={rev.id} className="card" style={{ padding: '15px', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <strong>{rev.user_name}</strong>
                                        <span style={{ color: '#eab308' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                                    </div>
                                    <p style={{ margin: 0, color: '#444' }}>{rev.comment}</p>
                                    <small style={{ color: '#888', display: 'block', marginTop: '10px' }}>
                                        {new Date(rev.review_date).toLocaleDateString()}
                                    </small>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
                <div className="related-products" style={{ marginTop: '50px', borderTop: '1px solid #ddd', paddingTop: '30px' }}>
                    <h2>Related Products</h2>
                    <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                        {relatedProducts.map(p => (
                            <div key={p.id} className="card cursor-pointer" onClick={() => navigate(`/product/${p.id}`)} style={{ padding: '15px', textAlign: 'center' }}>
                                <img 
                                    src={p.image?.startsWith('/uploads') ? `http://localhost:5000${p.image}` : (p.image || 'https://via.placeholder.com/200')} 
                                    alt={p.name} 
                                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} 
                                />
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{p.name}</h4>
                                <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>₹{Number(p.price).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
