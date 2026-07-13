import { useStoreSettings } from '../hooks/useStoreSettings';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Star, ArrowLeft, MessageCircle, Share2, Minus, Plus, Shield, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { wa: PHONE, get } = useStoreSettings();
  const { id } = useParams();
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    setProduct(data || DEMO_PRODUCT);
    setLoading(false);
    // Realtime stock
    const channel = supabase.channel(`product-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${id}` },
        (payload) => setProduct((p: any) => ({ ...p, stock: payload.new.stock })))
      .subscribe();
    // Reviews
    const { data: revData } = await supabase.from('reviews').select('*, profiles(full_name)').eq('product_id', id).eq('approved', true);
    setReviews(revData || DEMO_REVIEWS);
    // Related
    const { data: relData } = await supabase.from('products').select('*').neq('id', id).limit(4);
    setRelated(relData || []);
    return () => { supabase.removeChannel(channel); };
  };

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    for (let i = 0; i < quantity; i++) addItem({ id: product.id, name: product.name, price: product.offer_price || product.price, image_url: product.image_url, stock: product.stock });
    toast.success(`${quantity}x ${product.name} added! 🍫`);
  };

  const handleSubmitReview = async () => {
    if (!user) { toast.error('Please login to review'); return; }
    if (!reviewText.trim()) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: id, user_id: user.id, rating: reviewRating, comment: reviewText, approved: false
    });
    if (!error) { toast.success('Review submitted! It will appear after approval.'); setReviewText(''); setReviewRating(5); }
    setSubmittingReview(false);
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  if (loading) return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 flex items-center justify-center">
      <div className="text-[var(--accent)] text-lg animate-pulse">Loading...</div>
    </div>
  );

  const p = product || DEMO_PRODUCT;
  const images = [p.image_url, ...(p.gallery_images || [])].filter(Boolean);

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-16 sm:pt-24 pb-10 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-2)] mb-8">
          <Link to="/" className="hover:text-[var(--accent)]">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[var(--accent)]">Chocolates</Link>
          <span>/</span>
          <span className="text-[var(--text-2)]">{p.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Images */}
          <div>
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] mb-4"
            >
              <img src={images[selectedImage] || 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600'} alt={p.name} className="w-full h-full object-cover" />
              {p.stock === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-[var(--text)] font-bold text-lg tracking-widest uppercase">Sold Out</span>
                </div>
              )}
            </motion.div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? 'border-[var(--accent)]' : 'border-[var(--border)]'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-[var(--accent)] text-xs tracking-[0.3em] uppercase mb-2">{p.category || 'Premium Chocolate'}</p>
            <h1 className="text-3xl font-bold text-[var(--text)] mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>{p.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.round(avgRating) ? 'text-[var(--accent)] fill-[var(--accent)]' : 'text-[var(--border-2)]'} />
                ))}
              </div>
              <span className="text-[var(--accent)] text-sm font-medium">{avgRating.toFixed(1)}</span>
              <span className="text-[var(--text-2)] text-sm">({reviews.length} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-[var(--accent)]">₹{(p.offer_price || p.price).toLocaleString()}</span>
              {p.offer_price && (
                <>
                  <span className="text-xl text-[var(--text-2)] line-through">₹{p.price.toLocaleString()}</span>
                  <span className="bg-[var(--accent)]/10 text-[var(--accent)] text-xs px-2 py-0.5 rounded-full">
                    {Math.round(((p.price - p.offer_price) / p.price) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mb-6">
              {p.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-sm">In Stock ({p.stock} available)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-400 text-sm">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Description */}
            {p.description && (
              <p className="text-[var(--text-2)] text-sm leading-relaxed mb-8">{p.description}</p>
            )}

            {/* Quantity */}
            {p.stock > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[var(--text-2)] text-sm">Quantity:</span>
                <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-[var(--text-2)] hover:text-[var(--accent)]"><Minus size={16} /></button>
                  <span className="text-[var(--text)] w-8 text-center font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(p.stock, q + 1))} className="text-[var(--text-2)] hover:text-[var(--accent)]"><Plus size={16} /></button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={p.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:bg-[var(--border-2)] text-[#FFFFFF] disabled:text-[var(--text-2)] font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] text-sm tracking-wider"
              >
                <ShoppingBag size={18} />
                {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={() => toggle(p.id)}
                className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all ${isWishlisted(p.id) ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]'}`}
              >
                <Heart size={20} fill={isWishlisted(p.id) ? 'currentColor' : 'none'} />
              </button>
              <a
                href={`https://wa.me/919400667313?text=Hi!%20I%27m%20interested%20in%20${encodeURIComponent(p.name)}%20%E2%80%94%20can%20you%20help%20me%20order?`}
                target="_blank"
                rel="noreferrer"
                className="w-14 h-14 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-2)] hover:border-[#25D366] hover:text-[#25D366] transition-all"
              >
                <MessageCircle size={20} />
              </a>
            </div>

            {/* Trust */}
            <div className="flex flex-wrap gap-4 py-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                <Shield size={14} className="text-[var(--accent)]" /> WhatsApp confirmed delivery
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                <Truck size={14} className="text-[var(--accent)]" /> Kerala-wide delivery
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-8" style={{ fontFamily: 'Georgia, serif' }}>Customer Reviews</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[var(--text)] font-medium text-sm">{review.profiles?.full_name || 'Customer'}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={12} className={j < review.rating ? 'text-[var(--accent)] fill-[var(--accent)]' : 'text-[var(--border-2)]'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[var(--text-2)] text-sm">{review.comment}</p>
                </div>
              ))}
            </div>

            {/* Write Review */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-[var(--accent)] font-semibold mb-4">Write a Review</h3>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <button key={i} onClick={() => setReviewRating(i + 1)}>
                    <Star size={24} className={i < reviewRating ? 'text-[var(--accent)] fill-[var(--accent)]' : 'text-[var(--border-2)]'} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your experience with this chocolate..."
                rows={4}
                className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] p-3 rounded-lg outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm resize-none mb-4"
              />
              <button
                onClick={handleSubmitReview}
                disabled={!user || submittingReview || !reviewText.trim()}
                className="w-full bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:bg-[var(--border-2)] text-[#FFFFFF] disabled:text-[var(--text-2)] font-bold py-3 rounded-lg transition-colors text-sm"
              >
                {!user ? 'Login to Review' : submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-8" style={{ fontFamily: 'Georgia, serif' }}>You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DEMO_PRODUCT = {
  id: 'demo-1',
  name: 'Signature Kunafa Chocolate Box',
  price: 650,
  offer_price: 520,
  image_url: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600',
  gallery_images: [],
  stock: 8,
  category: 'Kunafa Special',
  description: 'Our most celebrated creation — a harmonious fusion of traditional Middle Eastern Kunafa with premium Belgian chocolate. Each piece is handcrafted with golden threads of crispy kadaifi, layered with rich cream filling, and enrobed in our signature dark chocolate shell.',
  rating: 4.8,
};

const DEMO_REVIEWS = [
  { rating: 5, comment: 'Absolutely magnificent! This is the best chocolate I have ever had. The Kunafa flavor is so unique and divine.', profiles: { full_name: 'Fatima Noor' } },
  { rating: 5, comment: 'Ordered for my daughter\'s birthday — everyone was stunned by how beautiful and delicious it was!', profiles: { full_name: 'Rahul Menon' } },
  { rating: 4, comment: 'Premium quality, premium taste. Worth every rupee. Will definitely order again!', profiles: { full_name: 'Aisha K' } },
];

export default ProductDetailPage;
