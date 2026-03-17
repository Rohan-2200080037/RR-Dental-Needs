import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { HeartIcon as HeartOutline, ShoppingCartIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addingToCart, setAddingToCart] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    
    // Reviews & Related Products States
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [reviewFeedback, setReviewFeedback] = useState('');

    const { isAuthenticated, token, user } = useAuthStore();
    const { addToCart, loading: cartLoading } = useCartStore();

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            setLoading(true);
            try {
                const [prodRes, reviewsRes, recRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/products/${id}`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/reviews/product/${id}`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/products/recommend/${id}`)
                ]);
                setProduct(prodRes.data);
                setReviews(reviewsRes.data.reviews || []);
                setAverageRating(reviewsRes.data.averageRating || 0);
                setRecommendations(recRes.data);

                // Fetch Related Products based on category from prodRes
                const relRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/category/${prodRes.data.category}`);
                setRelatedProducts(relRes.data.filter(p => p.id !== parseInt(id)).slice(0, 4));

                if (isAuthenticated && token) {
                    try {
                        const wishRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/wishlist`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (wishRes.data.some(w => w.product_id === parseInt(id))) {
                            setIsInWishlist(true);
                        }
                    } catch (e) {
                        console.error("Failed to fetch wishlist status", e);
                    }
                }

                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isAuthenticated, token]);

    const handleQuantityChange = (type) => {
        if (type === 'inc' && product && quantity < product.stock_quantity) {
            setQuantity(prev => prev + 1);
        } else if (type === 'dec' && quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) return navigate('/login');
        setAddingToCart(true);
        try {
            await addToCart(product.id, quantity, token);
            setReviewFeedback('Added to cart successfully!'); // Reusing reviewFeedback for cart feedback
            setTimeout(() => setReviewFeedback(''), 3000);
        } catch (err) {
            setReviewFeedback(err.response?.data?.message || 'Failed to add to cart');
            setTimeout(() => setReviewFeedback(''), 3000);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleWishlistToggle = async () => {
        if (!isAuthenticated) return navigate('/login');
        setWishlistLoading(true);
        try {
            if (isInWishlist) {
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/wishlist/remove/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsInWishlist(false);
                setReviewFeedback('Removed from wishlist'); // Reusing reviewFeedback for wishlist feedback
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/wishlist/add`, { productId: id }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsInWishlist(true);
                setReviewFeedback('Added to wishlist'); // Reusing reviewFeedback for wishlist feedback
            }
        } catch (err) {
            setReviewFeedback('Failed to update wishlist'); // Reusing reviewFeedback for wishlist feedback
        } finally {
            setWishlistLoading(false);
            setTimeout(() => setReviewFeedback(''), 3000);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return navigate('/login');

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/reviews`, {
                productId: id,
                rating: reviewForm.rating,
                comment: reviewForm.comment
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setReviewFeedback('Review submitted successfully!');
            setReviewForm({ rating: 5, comment: '' });
            
            const revRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/reviews/product/${id}`);
            setReviews(revRes.data.reviews || []);
            setAverageRating(revRes.data.averageRating || 0);
            
            setTimeout(() => setReviewFeedback(''), 3000);
        } catch (err) {
            setReviewFeedback(err.response?.data?.message || 'Failed to submit review');
            setTimeout(() => setReviewFeedback(''), 3000);
        }
    };

    if (loading) return <PageLoader />;
    if (error) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
            <div className="bg-red-50 text-red-800 p-6 rounded-xl border border-red-100 max-w-lg text-center">
                <h3 className="text-xl font-bold mb-2">Error Loading Product</h3>
                <p>{error}</p>
                <Button className="mt-4" onClick={() => navigate('/products')}>Back to Products</Button>
            </div>
        </div>
    );
    if (!product) return <div className="min-h-[60vh] flex items-center justify-center font-semibold text-xl text-slate-500">Product not found</div>;

    const isOutOfStock = product.stock_quantity <= 0;
    const imageUrl = product.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${product.image}` : (product.image || 'https://via.placeholder.com/600x400?text=Instrument');

    return (
        <div className="bg-slate-50 min-h-screen pb-20 pt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Breadcrumbs */}
                <nav className="flex text-sm text-slate-500 mb-8 font-medium">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span className="mx-2">/</span>
                    <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
                    <span className="mx-2">/</span>
                    <Link to={`/category/${product.category}`} className="hover:text-primary transition-colors">{product.category}</Link>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className="text-slate-900 truncate max-w-[200px] sm:max-w-none">{product.name}</span>
                </nav>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-6 lg:p-12">
                        
                        {/* Image Gallery */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col space-y-4">
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in" />
                            </div>
                            {/* Thumbnails could go here if the API supported multiple images */}
                        </motion.div>

                        {/* Product Info */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
                                {product.name}
                            </h1>
                            
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <StarIcon key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-amber-400' : 'text-slate-200'}`} />
                                    ))}
                                    <span className="ml-2 text-sm font-medium text-slate-600">{Number(averageRating).toFixed(1)}</span>
                                </div>
                                <span className="text-slate-300">|</span>
                                <a href="#reviews" className="text-sm font-medium text-primary hover:underline">{reviews.length} Reviews</a>
                                <span className="text-slate-300">|</span>
                                <Badge variant="primary">{product.category}</Badge>
                            </div>

                            <div className="mb-8 flex items-end space-x-4">
                                <span className="text-4xl font-extrabold text-primary">₹{Number(product.price).toLocaleString()}</span>
                                <span className="text-lg text-slate-400 line-through mb-1">₹{Number(product.price * 1.2).toLocaleString()}</span>
                            </div>

                            <p className="text-slate-600 leading-relaxed mb-8">
                                {product.description}
                            </p>

                            {/* Stock Status */}
                            <div className="mb-6">
                                {product.stock_quantity > 0 ? (
                                    <div className="flex items-center space-x-2">
                                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                                        <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">In Stock</span>
                                        {product.stock_quantity <= (product.low_stock_threshold || 5) && (
                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                                                Only {product.stock_quantity} left!
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <span className="flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
                                        <span className="text-sm font-bold text-red-600 uppercase tracking-wider">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100 mb-8" />

                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="flex items-center border border-slate-300 rounded-xl h-12 bg-white w-full sm:w-32 flex-shrink-0">
                                    <button onClick={() => handleQuantityChange('dec')} disabled={quantity <= 1 || isOutOfStock} className="w-10 h-full flex items-center justify-center text-slate-600 hover:text-primary disabled:opacity-50 transition-colors">-</button>
                                    <input type="text" readOnly value={quantity} className="flex-1 w-8 text-center font-semibold text-slate-900 bg-transparent border-none focus:ring-0 p-0" />
                                    <button onClick={() => handleQuantityChange('inc')} disabled={quantity >= product.stock_quantity || isOutOfStock} className="w-10 h-full flex items-center justify-center text-slate-600 hover:text-primary disabled:opacity-50 transition-colors">+</button>
                                </div>

                                <Button 
                                    size="lg" 
                                    className="flex-1 h-12 text-lg shadow-md hover:shadow-lg" 
                                    isLoading={addingToCart}
                                    disabled={isOutOfStock}
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingCartIcon className="w-5 h-5 mr-2" />
                                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                </Button>

                                <Button 
                                    variant={isInWishlist ? 'secondary' : 'outline'} 
                                    className="h-12 w-12 sm:w-auto px-0 sm:px-6 flex-shrink-0 flex items-center justify-center p-0"
                                    onClick={handleWishlistToggle}
                                    disabled={wishlistLoading}
                                    title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                    {isInWishlist ? <HeartSolid className="w-6 h-6 text-danger" /> : <HeartOutline className="w-6 h-6" />}
                                    <span className="hidden sm:inline sm:ml-2">{isInWishlist ? 'Saved' : 'Add to Wishlist'}</span>
                                </Button>
                            </div>

                            {/* Feedback for cart/wishlist actions */}
                            <AnimatePresence>
                                {reviewFeedback && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`p-3 rounded-lg text-sm font-medium text-center ${reviewFeedback.includes('successfully') || reviewFeedback.includes('Added') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                        {reviewFeedback}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="flex items-center text-slate-500 text-sm">
                                    <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary" /> Genuine Instruments
                                </div>
                                <div className="flex items-center text-slate-500 text-sm">
                                    <TruckIcon className="w-5 h-5 mr-2 text-primary" /> Fast Shipping
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12" id="reviews">
                    {/* Reviews Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-6 sm:p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Customer Reviews</h2>
                            
                            <div className="space-y-6">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                        <p className="text-slate-500 pb-2">No reviews yet. Be the first to review this product!</p>
                                    </div>
                                ) : (
                                    reviews.map(rev => (
                                        <div key={rev.id} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-semibold text-slate-800 flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 font-bold">
                                                        {rev.user_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {rev.user_name}
                                                </div>
                                                <span className="text-sm text-slate-400">{new Date(rev.review_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center mb-3">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <StarIcon key={star} className={`w-4 h-4 ${star <= rev.rating ? 'text-amber-400' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                            <p className="text-slate-600 leading-relaxed text-sm lg:text-base">{rev.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Write Review Form */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Write a Review</h3>
                            {!isAuthenticated ? (
                                <div className="text-center py-6 bg-slate-50 rounded-lg">
                                    <p className="text-slate-600 mb-4 text-sm">Please log in to share your experience with this product.</p>
                                    <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>Sign In to Review</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleReviewSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                                        <select 
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            value={reviewForm.rating}
                                            onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}
                                        >
                                            <option value={5}>⭐⭐⭐⭐⭐ - Excellent</option>
                                            <option value={4}>⭐⭐⭐⭐ - Very Good</option>
                                            <option value={3}>⭐⭐⭐ - Average</option>
                                            <option value={2}>⭐⭐ - Poor</option>
                                            <option value={1}>⭐ - Terrible</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Review Comment</label>
                                        <textarea 
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" 
                                            rows="4"
                                            placeholder="What did you like or dislike?"
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                            required
                                        ></textarea>
                                    </div>
                                    <Button type="submit" variant="primary" className="w-full">Submit Review</Button>
                                    
                                    <AnimatePresence>
                                        {reviewFeedback && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} className="mt-2 text-sm text-emerald-600 bg-emerald-50 p-2 rounded text-center font-medium">
                                                {reviewFeedback}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </form>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Related Products</h2>
                            <Link to={`/category/${product.category}`} className="text-primary font-medium hover:underline flex items-center">
                                View all {product.category} <span className="ml-1">&rarr;</span>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
                {/* Recommendations Section */}
                {recommendations.length > 0 && (
                    <div className="mt-20 border-t border-slate-200 pt-16">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">You May Also Like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {recommendations.map(rec => (
                                <ProductCard key={rec.id} product={rec} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
