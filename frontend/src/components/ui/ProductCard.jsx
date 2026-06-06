import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Card from './Card';
import Button from './Button';

const ProductCard = ({ product, index = 0 }) => {
  const rating = product.rating || 4.5;
  const reviewCount = product.reviews_count || Math.floor(Math.random() * 50) + 10;
  const discountPercent = Math.round(((product.price * 1.2 - product.price) / (product.price * 1.2)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="flex flex-col h-full group overflow-hidden" hoverable>
        <Link to={`/product/${product.id}`} className="relative block overflow-hidden aspect-square bg-slate-100">
          <img
            src={product.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${product.image}` : (product.image || 'https://via.placeholder.com/300x200?text=Instrument')}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discountPercent > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-md shadow-sm">
                -{discountPercent}%
              </span>
            )}
            {product.stock_quantity === 0 && (
              <span className="px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-bold rounded-md shadow-sm backdrop-blur-sm">
                Out of Stock
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {product.year && <span className="px-2 py-0.5 bg-white/90 text-teal-700 text-[10px] font-bold rounded-md shadow-sm backdrop-blur-sm">{product.year}</span>}
            <span className="px-2 py-0.5 bg-white/90 text-purple-700 text-[10px] font-bold rounded-md shadow-sm backdrop-blur-sm capitalize">{product.category}</span>
          </div>
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="px-2 py-1 bg-amber-50/90 backdrop-blur-sm text-amber-700 text-[10px] font-bold rounded-md border border-amber-200/50 text-center">
                Only {product.stock_quantity} left
              </div>
            </div>
          )}
        </Link>

        <div className="p-4 flex flex-col flex-grow">
          <Link to={`/product/${product.id}`}>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2 group-hover:text-teal-600 transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIconSolid key={star} className={`w-3 h-3 ${star <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-[11px] font-medium text-slate-500">({reviewCount})</span>
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-teal-600">₹{Number(product.price).toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 line-through ml-1.5">₹{Number(product.price * 1.2).toLocaleString()}</span>
            </div>
            <Link to={`/product/${product.id}`}>
              <Button variant="outline" size="sm" className="rounded-lg text-[11px] px-3 py-1.5 border-slate-300 text-slate-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600">
                <ShoppingCartIcon className="w-3.5 h-3.5 mr-1" />
                View
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
