import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCartIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';

const ProductCard = ({ product }) => {
  // Mock rating if not available
  const rating = product.rating || 4.5;
  const reviewCount = product.reviews_count || Math.floor(Math.random() * 50) + 10;
  
  return (
    <Card className="flex flex-col h-full group" hoverable>
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden aspect-[4/3] bg-slate-100">
        <img
          src={product.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${product.image}` : (product.image || 'https://via.placeholder.com/300x200?text=Instrument')}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
           <Badge variant="primary" className="shadow-sm">{product.category}</Badge>
           {product.stock_quantity < 5 && product.stock_quantity > 0 && (
             <Badge variant="warning" className="shadow-sm">Only {product.stock_quantity} left</Badge>
           )}
           {product.stock_quantity === 0 && (
             <Badge variant="danger" className="shadow-sm">Out of Stock</Badge>
           )}
        </div>
      </Link>
      
      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-semibold text-slate-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center space-x-1 mb-3">
          <StarIconSolid className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-700">{rating}</span>
          <span className="text-sm text-slate-500">({reviewCount})</span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 line-through">₹{Number(product.price * 1.2).toLocaleString()}</span>
            <span className="text-xl font-bold text-primary">₹{Number(product.price).toLocaleString()}</span>
          </div>
          
          <Link to={`/product/${product.id}`}>
            <Button variant="secondary" size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-primary sm:w-auto sm:px-4 sm:rounded-lg sm:h-auto sm:py-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                <ShoppingCartIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">View</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
