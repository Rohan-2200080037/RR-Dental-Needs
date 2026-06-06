import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { HeartIcon as HeartOutline, ShoppingCartIcon, ShieldCheckIcon, TruckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Loader';
import { getEstimatedDelivery } from '../utils/deliveryLogic';

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
    const [isImageOpen, setIsImageOpen] = useState(false);

    useEffect(() => {
        if (isImageOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsImageOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isImageOpen]);

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [pincode, setPincode] = useState('');
    const [deliveryEstimate, setDeliveryEstimate] = useState(getEstimatedDelivery(''));

    const { isAuthenticated, token, user } = useAuthStore();
    const { addToCart } = useCartStore();

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
            setReviewFeedback('Added to cart successfully!');
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
                setReviewFeedback('Removed from wishlist');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/wishlist/add`, { productId: id }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsInWishlist(true);
                setReviewFeedback('Added to wishlist');
            }
        } catch (err) {
            setReviewFeedback('Failed to update wishlist');
        } finally {
            setWishlistLoading(false);
            setTimeout(() => setReviewFeedback(''), 3000);
        }
    };

    const handlePincodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPincode(value);
        if (value.length === 6) {
            setDeliveryEstimate(getEstimatedDelivery(value));
        } else if (value.length === 0) {
            setDeliveryEstimate(getEstimatedDelivery(''));
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
                <h3 className="text-lg font-bold mb-2">Error Loading Product</h3>
                <p className="text-sm">{error}</p>
                <Button className="mt-4" onClick={() => navigate('/products')}>Back to Products</Button>
            </div>
        </div>
    );
    if (!product) return <div className="min-h-[60vh] flex items-center justify-center font-semibold text-xl text-slate-500">Product not found</div>;

    const isOutOfStock = product.stock_quantity <= 0;
    const imageUrl = product.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${product.image}` : (product.image || 'https://via.placeholder.com/600x400?text=Instrument');
    const discountPercent = Math.round(((product.price * 1.2 - product.price) / (product.price * 1.2)) * 100);

    return (
        <div className="min-h-screen pb-20">
            {/* Top Gradient Bar */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 h-1" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

                {/* Breadcrumbs */}
                <nav className="flex items-center text-sm text-slate-500 mb-8">
                    <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
                    <span className="mx-2 text-slate-300">/</span>
                    <Link to="/products" className="hover:text-teal-600 transition-colors">Products</Link>
                    <span className="mx-2 text-slate-300">/</span>
                    <Link to={`/category/${product.year}`} className="hover:text-teal-600 transition-colors">{product.year}</Link>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className="text-slate-800 font-medium truncate max-w-[200px]">{product.name}</span>
                </nav>

                {/* Main Product Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-6 lg:p-10">

                        {/* Image */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col space-y-4">
                            <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group cursor-pointer relative">
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onClick={() => setIsImageOpen(true)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
                                        Click to enlarge
                                    </span>
                                </div>
                                {discountPercent > 0 && (
                                    <span className="absolute top-4 left-4 px-2.5 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm">
                                        -{discountPercent}%
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        {/* Product Info */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
                                {product.name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 mb-5">
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <StarIcon key={star} className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'text-amber-400' : 'text-slate-200'}`} />
                                    ))}
                                    <span className="ml-2 text-sm font-semibold text-slate-600">{Number(averageRating).toFixed(1)}</span>
                                </div>
                                <span className="text-slate-300 text-sm">|</span>
                                <a href="#reviews" className="text-sm font-medium text-teal-600 hover:underline">{reviews.length} Review{reviews.length !== 1 ? 's' : ''}</a>
                                <span className="text-slate-300 text-sm">|</span>
                                {product.year && (
                                    <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-md border border-teal-200">
                                        {product.year}
                                    </span>
                                )}
                                <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-md border border-purple-200 capitalize">
                                    {product.category}
                                </span>
                            </div>

                            <div className="mb-6 flex items-end gap-3">
                                <span className="text-3xl sm:text-4xl font-extrabold text-teal-600">₹{Number(product.price).toLocaleString()}</span>
                                <span className="text-base text-slate-400 line-through mb-1">₹{Number(product.price * 1.2).toLocaleString()}</span>
                                {discountPercent > 0 && (
                                    <span className="mb-1 px-2 py-0.5 bg-green-50 text-green-600 text-[11px] font-bold rounded-md border border-green-200">
                                        Save {discountPercent}%
                                    </span>
                                )}
                            </div>

                            <p className="text-slate-600 leading-relaxed mb-6 text-sm sm:text-base">
                                {product.description}
                            </p>

                            {/* Stock Status */}
                            <div className="mb-6">
                                {product.stock_quantity > 0 ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                            <span className="text-sm font-bold text-emerald-600">In Stock</span>
                                        </div>
                                        {product.stock_quantity <= (product.low_stock_threshold || 5) && (
                                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                Only {product.stock_quantity} left
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                                        <span className="text-sm font-bold text-red-600">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            {/* Delivery Estimation */}
                            <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        <TruckIcon className="w-4 h-4 mr-1.5 text-teal-600" />
                                        Delivery Info
                                    </div>
                                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                                        {deliveryEstimate.range}
                                    </span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="Enter Pincode"
                                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
                                            value={pincode}
                                            onChange={handlePincodeChange}
                                            maxLength={6}
                                        />
                                        <TruckIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center bg-teal-50/50 px-3.5 py-2 rounded-lg border border-teal-100">
                                        <p className="text-sm font-bold text-slate-900">
                                            {deliveryEstimate.dateRange}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-500">
                                            {pincode.length === 6 ? `Estimated for ${pincode}` : 'Check delivery to your pincode'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100 mb-6" />

                            <div className="flex flex-col sm:flex-row gap-3 mb-3">
                                <div className="flex items-center border border-slate-300 rounded-lg h-12 bg-white w-full sm:w-32 flex-shrink-0">
                                    <button onClick={() => handleQuantityChange('dec')} disabled={quantity <= 1 || isOutOfStock} className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-teal-600 disabled:opacity-30 transition-colors font-bold text-lg">-</button>
                                    <input type="text" readOnly value={quantity} className="flex-1 w-8 text-center font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 text-base" />
                                    <button onClick={() => handleQuantityChange('inc')} disabled={quantity >= product.stock_quantity || isOutOfStock} className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-teal-600 disabled:opacity-30 transition-colors font-bold text-lg">+</button>
                                </div>

                                <Button
                                    size="lg"
                                    className="flex-1 h-12 text-base font-bold shadow-lg shadow-teal-500/20 hover:shadow-xl transition-all"
                                    isLoading={addingToCart}
                                    disabled={isOutOfStock}
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingCartIcon className="w-5 h-5 mr-2" />
                                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                </Button>

                                <Button
                                    variant={isInWishlist ? 'secondary' : 'outline'}
                                    className="h-12 w-full sm:w-14 px-0 flex-shrink-0 flex items-center justify-center"
                                    onClick={handleWishlistToggle}
                                    disabled={wishlistLoading}
                                    title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={isInWishlist ? 'saved' : 'save'}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            className="flex items-center"
                                        >
                                            {isInWishlist ? <HeartSolid className="w-5 h-5 text-red-500" /> : <HeartOutline className="w-5 h-5" />}
                                        </motion.div>
                                    </AnimatePresence>
                                </Button>
                            </div>

                            <AnimatePresence>
                                {reviewFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`p-3 rounded-lg text-sm font-medium text-center ${
                                            reviewFeedback.includes('successfully') || reviewFeedback.includes('Added') || reviewFeedback.includes('submitted')
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}
                                    >
                                        {reviewFeedback}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <div className="flex items-center text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                                    <ShieldCheckIcon className="w-4 h-4 mr-2 text-teal-600 flex-shrink-0" /> Genuine Instruments
                                </div>
                                <div className="flex items-center text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                                    <ClockIcon className="w-4 h-4 mr-2 text-teal-600 flex-shrink-0" /> Fast Shipping
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10" id="reviews">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-5">Customer Reviews</h2>
                            <div className="space-y-5">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <StarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm text-slate-500 mb-1">No reviews yet.</p>
                                        <p className="text-xs text-slate-400">Be the first to share your experience!</p>
                                    </div>
                                ) : (
                                    reviews.map((rev, idx) => (
                                        <motion.div
                                            key={rev.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="pb-5 border-b border-slate-100 last:border-0 last:pb-0"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-semibold text-slate-800 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">
                                                        {rev.user_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="text-sm">{rev.user_name}</span>
                                                </div>
                                                <span className="text-xs text-slate-400">{new Date(rev.review_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <StarIcon key={star} className={`w-3.5 h-3.5 ${star <= rev.rating ? 'text-amber-400' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Write Review */}
                    <div>
                        <Card className="p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Write a Review</h3>
                            {!isAuthenticated ? (
                                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <p className="text-sm text-slate-600 mb-4">Please sign in to share your experience.</p>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/login')}>
                                        Sign In to Review
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleReviewSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rating</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
                                            value={reviewForm.rating}
                                            onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                                        >
                                            <option value={5}>5 - Excellent</option>
                                            <option value={4}>4 - Very Good</option>
                                            <option value={3}>3 - Average</option>
                                            <option value={2}>2 - Poor</option>
                                            <option value={1}>1 - Terrible</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Comment</label>
                                        <textarea
                                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none bg-white"
                                            rows="4"
                                            placeholder="Share your thoughts..."
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" variant="primary" className="w-full">Submit Review</Button>

                                    <AnimatePresence>
                                        {reviewFeedback && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} className="text-sm text-emerald-600 bg-emerald-50 p-2.5 rounded-lg text-center font-medium border border-emerald-200">
                                                {reviewFeedback}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </form>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mb-14">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Related Products</h2>
                            <Link to={`/category/${product.category}`} className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 capitalize">
                                View all <span>&rarr;</span>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {relatedProducts.map((p, idx) => (
                                <ProductCard key={p.id} product={p} index={idx} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className="border-t border-slate-200 pt-10">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">You May Also Like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {recommendations.map((rec, idx) => (
                                <ProductCard key={rec.id} product={rec} index={idx} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Image Lightbox */}
            <AnimatePresence>
                {isImageOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 md:p-8"
                        onClick={() => setIsImageOpen(false)}
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setIsImageOpen(false)}
                            className="absolute top-4 right-4 text-white p-2.5 rounded-full bg-slate-900/65 hover:bg-slate-900 border border-slate-800 transition-all z-50 shadow-lg cursor-pointer focus:outline-none"
                            aria-label="Close image viewer"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </motion.button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="relative max-w-full max-h-[85vh] flex flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-slate-800 select-none"
                            />
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="mt-4 text-center text-white text-xs sm:text-sm font-bold bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur-sm max-w-max mx-auto shadow-md truncate"
                            >
                                {product.name}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetail;
