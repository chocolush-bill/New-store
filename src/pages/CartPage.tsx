import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <ShoppingBag size={64} className="text-[var(--border-2)] mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Your Cart is Empty</h2>
        <p className="text-[var(--text-2)] mb-8">Add some luxury chocolates to get started!</p>
        <Link to="/products" className="inline-flex items-center gap-2 bg-[var(--accent-2)] text-[#FFFFFF] font-bold px-8 py-3 rounded-full transition-all hover:bg-[var(--accent-2-hover)]">
          Shop Now <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-1">Your</p>
            <h1 className="text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>Shopping Cart</h1>
          </div>
          <button onClick={clearCart} className="text-[var(--text-2)] hover:text-red-400 text-sm transition-colors">Clear All</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex gap-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)]/20 transition-colors"
                >
                  <Link to={`/products/${item.id}`} className="shrink-0">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=200'} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.id}`} className="text-[var(--text)] font-medium text-sm hover:text-[var(--accent)] transition-colors line-clamp-2">{item.name}</Link>
                    <p className="text-[var(--accent)] font-bold mt-1">₹{item.price.toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-2 bg-[var(--border)] rounded-lg px-3 py-1.5">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-[var(--text-2)] hover:text-[var(--accent)]"><Minus size={14} /></button>
                        <span className="text-[var(--text)] text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} className="text-[var(--text-2)] hover:text-[var(--accent)] disabled:opacity-30"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-[var(--text-2)] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[var(--accent)] font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sticky top-24">
              <h3 className="text-[var(--accent)] font-bold text-lg mb-6" style={{ fontFamily: 'Georgia, serif' }}>Order Summary</h3>
              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[var(--text-2)] truncate max-w-[60%]">{item.name} ×{item.quantity}</span>
                    <span className="text-[var(--text-2)]">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border)] pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-[var(--text)] font-bold">Total</span>
                  <span className="text-[var(--accent)] font-bold text-xl">₹{total.toLocaleString()}</span>
                </div>
                <p className="text-[var(--text-2)] text-xs mt-1">Payment via GPay / COD after WhatsApp confirmation</p>
              </div>
              <Link
                to="/checkout"
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-[#FFFFFF] font-bold py-4 rounded-xl transition-colors text-sm tracking-wider"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </Link>
              <Link to="/products" className="w-full flex items-center justify-center gap-2 mt-3 text-[var(--text-2)] hover:text-[var(--text-2)] text-sm transition-colors">
                <ArrowLeft size={16} /> Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
