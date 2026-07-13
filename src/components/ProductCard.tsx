import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  offer_price?: number;
  image_url: string;
  rating?: number;
  review_count?: number;
  stock: number;
  category?: string;
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock === 0) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.offer_price || product.price,
      image_url: product.image_url,
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart 🍫`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggle(product.id);
  };

  const discount = product.offer_price
    ? Math.round(((product.price - product.offer_price) / product.price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <Link to={`/products/${product.id}`}>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)]/30 transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--accent)]/5">
          {/* Image */}
          <div className="relative overflow-hidden aspect-[4/3] bg-[var(--border)]">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400'}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {discount > 0 && (
                <span className="bg-[var(--accent)] text-[#FFFFFF] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{discount}%
                </span>
              )}
              {product.stock === 0 && (
                <span className="bg-red-900/80 text-red-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
                  Sold Out
                </span>
              )}
            </div>
            {/* Wishlist */}
            <button
              onClick={handleWishlist}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
                isWishlisted(product.id)
                  ? 'bg-red-500/90 text-[var(--text)]'
                  : 'bg-[var(--surface)]/70 text-[var(--text-2)] hover:text-red-400'
              }`}
            >
              <Heart size={15} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
            </button>
            {/* Add to Cart Overlay */}
            <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:bg-gray-700 text-[#FFFFFF] disabled:text-[#8A6F56] text-xs font-bold tracking-wider py-2.5 rounded-xl transition-colors"
              >
                <ShoppingBag size={14} />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            {product.category && (
              <p className="text-[var(--text-2)] text-[10px] tracking-[0.2em] uppercase mb-1">{product.category}</p>
            )}
            <h3 className="text-[var(--text)] font-medium text-sm leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
              {product.name}
            </h3>
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-1 mt-2">
                <Star size={12} className="text-[var(--accent)] fill-[var(--accent)]" />
                <span className="text-[var(--accent)] text-xs font-medium">{product.rating.toFixed(1)}</span>
                {product.review_count && (
                  <span className="text-[var(--text-2)] text-xs">({product.review_count})</span>
                )}
              </div>
            )}
            {/* Price */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[var(--accent)] font-bold text-base">
                ₹{(product.offer_price || product.price).toLocaleString()}
              </span>
              {product.offer_price && (
                <span className="text-[var(--text-2)] text-sm line-through">
                  ₹{product.price.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
