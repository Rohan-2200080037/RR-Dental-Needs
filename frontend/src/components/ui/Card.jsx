import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', hoverable = false, ...props }) => {
  const baseStyles = 'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden';
  
  return (
    <motion.div
      whileHover={hoverable ? { y: -4, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' } : {}}
      transition={{ duration: 0.2 }}
      className={`${baseStyles} ${hoverable ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
