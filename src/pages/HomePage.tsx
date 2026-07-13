import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Truck, Shield, Award, MessageCircle, ChevronDown, ChevronLeft, ChevronRight, Send, Quote, BadgeCheck, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

const BLOG_CATEGORY_COLORS: Record<string, string> = {
  'Craft': '#C5A880',
  'Lifestyle': '#A8784E',
  'Story': '#7A5C42',
  'Chocolate Stories': '#C5A880',
  'Recipes': '#8F6539',
  'Events': '#B8956A',
};

const DEFAULT_SETTINGS: Record<string, string> = {
  hero_title: 'Pure Indulgence',
  hero_subtitle: 'Handcrafted luxury chocolates from Kerala. Every bite tells a story.',
  hero_image_1: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600',
  hero_image_2: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1600',
  hero_image_3: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=1600',
  whatsapp_number: '919400667313',
  instagram_url: 'https://instagram.com/chocolush',
  announcement_bar: '',
  primary_color: '#C5A880',
  brownie_title: 'Customized Brownies',
  brownie_subtitle: 'For Every Occasion',
  brownie_text: 'Weddings, birthdays, corporate events — bespoke chocolate experiences tailored just for you.',
  brownie_image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=1600',
  banner_title: '',
  banner_text: '',
  banner_image: '',
  banner_link: '',
};

const HomePage = () => {
  const { user } = useAuth();
  const [heroIndex, setHeroIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' });
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const getSetting = (key: string) => storeSettings[key] || DEFAULT_SETTINGS[key] || '';

  const displayReviews = reviews.length > 0 ? reviews : DEMO_TESTIMONIALS;
  const avgRating = displayReviews.length > 0
    ? displayReviews.reduce((sum: number, r: any) => sum + (r.rating ?? 5), 0) / displayReviews.length
    : 5;
  const ratingCounts = [5, 4, 3, 2, 1].map(star => displayReviews.filter((r: any) => Math.round(r.rating ?? 5) === star).length);

  const heroImages = [
    getSetting('hero_image_1'),
    getSetting('hero_image_2'),
    getSetting('hero_image_3'),
  ].filter(Boolean);

  useEffect(() => {
    const interval = setInterval(() => setHeroIndex(i => (i + 1) % Math.max(1, heroImages.length)), 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    fetchAll();

    // Realtime subscriptions
    const channel = supabase.channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, fetchBlogs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, fetchCampaign)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, fetchStoreSettings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchReviews)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchProducts(), fetchCategories(), fetchBlogs(), fetchCampaign(), fetchStoreSettings(), fetchReviews()]);
    setLoading(false);
  };

  const fetchStoreSettings = async () => {
    try {
      const { data } = await supabase.from('store_settings').select('*');
      if (data && data.length > 0) {
        const mapped: Record<string, string> = { ...DEFAULT_SETTINGS };
        data.forEach((row: any) => {
          try {
            mapped[row.key] = typeof row.value === 'string'
              ? row.value.replace(/^"|"$/g, '')
              : String(row.value ?? '');
          } catch { mapped[row.key] = ''; }
        });
        setStoreSettings(mapped);
      }
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from('products').select('*').eq('is_featured', true).gt('stock', 0).limit(8);
      if (data && data.length > 0) setFeaturedProducts(data);
      else setFeaturedProducts(DEMO_PRODUCTS);
    } catch { setFeaturedProducts(DEMO_PRODUCTS); }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('categories').select('*').eq('active', true).order('sort_order').limit(6);
      if (data && data.length > 0) setCategories(data);
      else setCategories(DEMO_CATEGORIES);
    } catch { setCategories(DEMO_CATEGORIES); }
  };

  const fetchBlogs = async () => {
    try {
      const { data } = await supabase.from('blog_posts').select('*').eq('published', true).order('created_at', { ascending: false }).limit(3);
      if (data && data.length > 0) setBlogs(data);
      else setBlogs(DEMO_BLOGS);
    } catch { setBlogs(DEMO_BLOGS); }
  };

  const fetchCampaign = async () => {
    try {
      const { data } = await supabase.from('campaigns').select('*').eq('active', true).limit(1).single();
      setCampaign(data || null);
    } catch { setCampaign(null); }
  };

  const fetchReviews = async () => {
    try {
      // Get all approved reviews + current user's own (even unapproved)
      const { data: approved, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;

      // Also fetch the logged-in user's own pending reviews so they can edit/delete
      let ownPending: any[] = [];
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: own } = await supabase
          .from('reviews')
          .select('*, profiles(full_name)')
          .eq('user_id', currentUser.id)
          .eq('approved', false)
          .order('created_at', { ascending: false });
        ownPending = own || [];
      }

      const combined = [...(approved || []), ...ownPending.filter(r => !approved?.find((a: any) => a.id === r.id))];
      setReviews(combined.length ? combined : []);
    } catch (e) {
      console.warn('Reviews fetch:', e);
      setReviews([]);
    }
  };

  const submitReview = async () => {
    if (!user) { toast.error('Please login to write a review'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a few words about your experience'); return; }
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        product_id: null,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        approved: false,
      });
      if (error) throw error;
      toast.success('Thank you! Your review has been submitted for approval 🍫');
      setReviewForm({ rating: 5, comment: '' });
    } catch (e: any) {
      toast.error('Could not submit review: ' + (e?.message || 'Unknown error'));
    }
    setSubmittingReview(false);
  };

  const deleteReview = async (reviewId: string) => {
    setDeletingReviewId(reviewId);
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      // Update local state immediately for instant UI feedback
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      // Scroll carousel to first card if active card was deleted
      setActiveCard(0);
      toast.success('Review deleted ✓');
    } catch (e: any) {
      console.error('Delete error:', e);
      toast.error('Could not delete: ' + (e?.message || 'Try again'));
    }
    setDeletingReviewId(null);
  };

  const openEditReview = (r: any) => {
    setEditingReview(r);
    setEditForm({ rating: r.rating ?? 5, comment: r.comment || '' });
  };

  const saveEditReview = async () => {
    if (!editingReview || !editForm.comment.trim()) { toast.error('Comment cannot be empty'); return; }
    try {
      const { error } = await supabase.from('reviews')
        .update({ rating: editForm.rating, comment: editForm.comment.trim(), approved: false })
        .eq('id', editingReview.id);
      if (error) throw error;
      setReviews(prev => prev.map(r => r.id === editingReview.id
        ? { ...r, rating: editForm.rating, comment: editForm.comment.trim(), approved: false }
        : r
      ));
      setEditingReview(null);
      toast.success('Review updated! Pending re-approval 🍫');
    } catch (e: any) {
      console.error('Edit error:', e);
      toast.error('Could not update: ' + (e?.message || 'Try again'));
    }
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen">
      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {heroImages.map((img, i) => (
          <motion.div key={i} animate={{ opacity: i === heroIndex ? 1 : 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
            <img src={img} alt="Hero" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-b from-[#2D1A12]/70 via-[#2D1A12]/40 to-[#2D1A12]/75"/>
          </motion.div>
        ))}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-[var(--accent)] text-xs tracking-[0.5em] uppercase mb-6">✦ Premium Artisan Chocolates ✦</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="text-4xl sm:text-6xl lg:text-8xl font-bold text-white leading-tight mb-4 sm:mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            CHOCO<span style={{ color: getSetting('primary_color') }}>LUSH</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="text-[#EDE3D3] text-sm sm:text-lg max-w-xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2">
            {getSetting('hero_subtitle')}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            className="flex flex-col xs:flex-row gap-3 justify-center px-4 sm:px-0">
            <Link to="/products" className="flex items-center justify-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-[#FFFFFF] font-bold px-8 py-4 rounded-full transition-all hover:scale-105 text-sm tracking-wider w-full xs:w-auto">
              Explore Collection <ArrowRight size={18}/>
            </Link>
            <a href={`https://wa.me/${getSetting('whatsapp_number').replace(/\D/g, '')}?text=Hello%20Chocolush!%20Bulk%20order%20inquiry.`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 border-2 border-white/70 text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-[var(--text)] px-8 py-4 rounded-full transition-all text-sm tracking-wider font-semibold">
              <MessageCircle size={18}/> Bulk Orders
            </a>
          </motion.div>
        </div>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--accent)]/50">
          <ChevronDown size={28}/>
        </motion.div>
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, i) => (
            <button key={i} onClick={() => setHeroIndex(i)} className={`h-1.5 rounded-full transition-all ${i === heroIndex ? 'bg-[var(--accent)] w-6' : 'bg-white/30 w-1.5'}`}/>
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {[
              { icon: <Award size={20}/>, label: 'Premium Quality', sub: 'Artisan crafted' },
              { icon: <Truck size={20}/>, label: 'Fast Delivery', sub: 'Kerala-wide' },
              { icon: <Shield size={20}/>, label: 'Secure Orders', sub: 'WhatsApp confirmed' },
              { icon: <Star size={20}/>, label: 'Loved by Many', sub: '500+ happy customers' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="text-[var(--accent)]">{item.icon}</div>
                <p className="text-[var(--text)] text-xs font-semibold tracking-wider uppercase">{item.label}</p>
                <p className="text-[var(--text-2)] text-xs">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 sm:py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-3">Explore</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>Our Collections</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {categories.map((cat: any, i: number) => (
            <motion.div key={cat.id || i} whileHover={{ y: -4 }} className="group">
              <Link to={`/categories?cat=${cat.id}`}>
                <div className="relative rounded-2xl overflow-hidden aspect-square bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all duration-300">
                  <img src={cat.image_url || 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300'} alt={cat.name}
                    loading="lazy" decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2D1A12]/70 via-transparent to-transparent"/>
                  <p className="absolute bottom-3 inset-x-0 text-center text-white text-xs font-semibold tracking-wider group-hover:text-[var(--accent)] transition-colors">{cat.name}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-3">Handpicked</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>Featured Chocolates</h2>
          </div>
          <Link to="/products" className="hidden md:flex items-center gap-2 text-[var(--accent)] hover:text-[var(--text-2)] text-sm tracking-wider transition-colors">
            View All <ArrowRight size={16}/>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="bg-[var(--surface)] rounded-2xl aspect-[4/5] animate-pulse"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map((product: any) => <ProductCard key={product.id} product={product}/>)}
          </div>
        )}
        <div className="text-center mt-12">
          <Link to="/products" className="inline-flex items-center gap-2 border border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[#FFFFFF] px-8 py-3 rounded-full transition-all text-sm tracking-wider">
            Explore Full Collection <ArrowRight size={16}/>
          </Link>
        </div>
      </section>

      {/* Campaign Banner (if active) */}
      {campaign && (
        <section className="px-4 max-w-7xl mx-auto my-12">
          <div className="relative rounded-3xl overflow-hidden bg-[#2D1A12]">
            {campaign.banner_url && (
              <img src={campaign.banner_url} alt={campaign.name} loading="lazy" decoding="async"
                className="absolute inset-0 w-full h-full object-cover opacity-25"/>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2D1A12] via-[#2D1A12]/95 to-[#2D1A12]/70"/>
            <div className="relative z-10 px-8 py-14 sm:py-16 text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 border border-[var(--accent)]/40 text-[var(--accent)] text-xs tracking-[0.3em] uppercase px-4 py-1.5 rounded-full mb-5">
                ✦ Limited Time Offer
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>{campaign.name}</h2>
              {campaign.description && <p className="text-[#EDE3D3] text-base mb-6">{campaign.description}</p>}
              {campaign.discount_percent > 0 && (
                <p className="text-5xl font-bold text-[var(--accent)] mb-6" style={{ fontFamily: 'Georgia, serif' }}>{campaign.discount_percent}% OFF</p>
              )}
              <Link to="/products" className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[#B8956A] text-[var(--text)] font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105 text-sm tracking-wider">
                Shop the Collection <ArrowRight size={16}/>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Customized Brownies Banner (dynamic) */}
      <section className="relative py-16 sm:py-32 overflow-hidden my-4 sm:my-8">
        <img src={getSetting('brownie_image')} alt="Chocolate" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-[#2D1A12]/55"/>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <p className="text-[var(--accent)] text-xs tracking-[0.5em] uppercase mb-4">Special Service</p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            {getSetting('brownie_title')}<br/><span className="text-[var(--accent)]">{getSetting('brownie_subtitle')}</span>
          </h2>
          <p className="text-[#EDE3D3] text-lg mb-8">{getSetting('brownie_text')}</p>
          <a href={`https://wa.me/${getSetting('whatsapp_number').replace(/\D/g, '')}?text=Hello%20Chocolush!%20I%20would%20like%20CUSTOMIZED%20BROWNIES.`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-[#FFFFFF] font-bold px-8 py-4 rounded-full transition-all hover:scale-105 text-sm tracking-wider">
            <MessageCircle size={18}/> Chat on WhatsApp
          </a>
        </div>
      </section>

      {/* General Store Banner (optional, admin-controlled) */}
      {getSetting('banner_title') && (
        <section className="relative py-24 overflow-hidden my-8">
          {getSetting('banner_image') && <img src={getSetting('banner_image')} alt={getSetting('banner_title')} className="absolute inset-0 w-full h-full object-cover"/>}
          <div className="absolute inset-0 bg-[#2D1A12]/60"/>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>{getSetting('banner_title')}</h2>
            {getSetting('banner_text') && <p className="text-[#EDE3D3] text-lg mb-6">{getSetting('banner_text')}</p>}
            {getSetting('banner_link') && (
              <Link to={getSetting('banner_link')} className="inline-flex items-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-white font-bold px-8 py-3 rounded-full transition-all hover:scale-105 text-sm tracking-wider">
                Explore <ArrowRight size={16}/>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Blog */}
      {blogs.length > 0 && (
        <section className="py-12 sm:py-20 px-4 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-3">Editorial</p>
              <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>From Our Journal</h2>
            </div>
            <Link to="/blog" className="hidden md:flex items-center gap-2 text-[var(--accent-2)] hover:text-[var(--text-2)] text-sm tracking-wider transition-colors">All Articles <ArrowRight size={16}/></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 sm:gap-x-8 gap-y-8 sm:gap-y-12">
            {blogs.map((blog: any, i: number) => {
              const catColor = BLOG_CATEGORY_COLORS[blog.category as string] || '#C5A880';
              return (
                <motion.div key={blog.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="group">
                  <Link to={`/blog/${blog.slug || blog.id}`}>
                    <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[16/10]">
                      <img src={blog.image_url || 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600'} alt={blog.title}
                        loading="lazy" decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ color: catColor, backgroundColor: catColor + '1A' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                        {blog.category || 'Chocolate Stories'}
                      </span>
                      <span className="text-[var(--text-3)] text-xs">
                        {new Date(blog.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-[#1F140D] font-bold text-lg leading-snug mb-3 group-hover:text-[var(--accent-2)] transition-colors line-clamp-2">{blog.title}</h3>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ fontFamily: 'Georgia, serif' }}>C</div>
                      <span className="text-[var(--text-2)] text-sm">Chocolush Team</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Reviews — Horizontal Card Carousel */}
      <section className="py-24 overflow-hidden bg-[var(--surface-alt)] border-y border-[var(--border)]">
        {/* Section Header */}
        <div className="max-w-6xl mx-auto px-4 mb-14 relative">
          {/* Giant decorative quote */}
          <span className="absolute -top-4 left-0 text-[80px] sm:text-[160px] leading-none font-serif text-[var(--border)] select-none pointer-events-none" style={{ fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</span>
          <div className="relative z-10 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text)] mb-3" style={{ fontFamily: 'Georgia, serif' }}>What Our Customers Say</h2>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {[...Array(5)].map((_, j) => <Star key={j} size={14} className={j < Math.round(avgRating) ? "text-[var(--accent)] fill-[var(--accent)]" : "text-[var(--border-2)] fill-[var(--border-2)]"}/>)}
              <span className="text-[var(--text-2)] text-sm ml-1 font-medium">{avgRating.toFixed(1)} · {displayReviews.length} reviews</span>
            </div>
            <div className="w-12 h-0.5 bg-[var(--accent-2)] mx-auto mt-4 rounded-full"/>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div ref={carouselRef} className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6 px-[max(1rem,calc((100vw-1152px)/2))]"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={e => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / (el.scrollWidth / displayReviews.length));
              setActiveCard(Math.min(idx, displayReviews.length - 1));
            }}>
            {displayReviews.map((t: any, i: number) => {
              const reviewerName = t.profiles?.full_name || t.name || 'Chocolush Customer';
              const initial = reviewerName.trim().charAt(0).toUpperCase() || 'C';
              const isCenter = i === activeCard;
              return (
                <motion.div key={t.id || i}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  animate={{ scale: isCenter ? 1 : 0.93, opacity: isCenter ? 1 : 0.7 }}
                  className="snap-center shrink-0 w-[260px] sm:w-[300px] md:w-[340px] bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)] relative cursor-pointer"
                  style={{ transition: 'scale 0.3s ease, opacity 0.3s ease' }}
                  onClick={() => {
                    setActiveCard(i);
                    if (carouselRef.current) {
                      const card = carouselRef.current.children[i] as HTMLElement;
                      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                  }}>
                  {/* Decorative open quote */}
                  <span className="absolute top-5 left-6 text-6xl text-[var(--border)] font-serif leading-none select-none pointer-events-none" style={{ fontFamily: 'Georgia, serif' }}>"</span>
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--text-2)] flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-md ring-4 ring-[var(--surface-alt)]" style={{ fontFamily: 'Georgia, serif' }}>
                    {initial}
                  </div>
                  <p className="text-[var(--text)] font-bold text-base mb-2">{reviewerName}</p>
                  {t.approved === false && user && t.user_id === user.id && (
                    <span className="text-[10px] font-semibold tracking-wider uppercase bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full mb-2">Pending Approval</span>
                  )}
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(5)].map((_, j) => <Star key={j} size={12} className={j < (t.rating ?? 5) ? "text-[var(--accent)] fill-[var(--accent)]" : "text-[var(--border-2)] fill-[var(--border-2)]"}/>)}
                  </div>
                  <p className="text-[var(--text-2)] text-sm leading-relaxed italic flex-1">"{t.comment || t.review}"</p>
                  <div className="relative z-20 flex items-center justify-between w-full mt-5">
                    {t.created_at && (
                      <p className="text-[var(--accent)] text-xs">{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    )}
                    {user && t.user_id === user.id && (
                      <div className="flex items-center gap-1.5 ml-auto" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); openEditReview(t); }}
                          className="w-7 h-7 rounded-full bg-[var(--surface-alt)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-2)] transition-colors" title="Edit">
                          <Pencil size={12}/>
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); deleteReview(t.id); }} disabled={deletingReviewId === t.id}
                          className="w-7 h-7 rounded-full bg-[var(--surface-alt)] hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors disabled:opacity-50" title="Delete">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Closing quote */}
                  <span className="absolute bottom-5 right-6 text-6xl text-[var(--border)] font-serif leading-none select-none pointer-events-none -z-10" style={{ fontFamily: 'Georgia, serif' }}>"</span>
                </motion.div>
              );
            })}
          </div>

          {/* Arrow buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={() => {
              if (carouselRef.current) {
                const newIdx = Math.max(0, activeCard - 1);
                setActiveCard(newIdx);
                const card = carouselRef.current.children[newIdx] as HTMLElement;
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
            }} className="w-11 h-11 rounded-full border-2 border-[var(--border-2)] bg-[var(--surface)] hover:border-[var(--accent-2)] hover:bg-[var(--accent-2)] hover:text-white text-[var(--text-2)] flex items-center justify-center transition-all shadow-sm group">
              <ChevronLeft size={18}/>
            </button>
            {/* Dot indicators */}
            <div className="flex gap-2">
              {displayReviews.map((_, i) => (
                <button key={i} onClick={() => {
                  setActiveCard(i);
                  if (carouselRef.current) {
                    const card = carouselRef.current.children[i] as HTMLElement;
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }
                }} className={`rounded-full transition-all ${i === activeCard ? 'bg-[var(--accent-2)] w-6 h-2' : 'bg-[var(--border-2)] w-2 h-2 hover:bg-[var(--accent)]'}`}/>
              ))}
            </div>
            <button onClick={() => {
              if (carouselRef.current) {
                const newIdx = Math.min(displayReviews.length - 1, activeCard + 1);
                setActiveCard(newIdx);
                const card = carouselRef.current.children[newIdx] as HTMLElement;
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
            }} className="w-11 h-11 rounded-full border-2 border-[var(--border-2)] bg-[var(--surface)] hover:border-[var(--accent-2)] hover:bg-[var(--accent-2)] hover:text-white text-[var(--text-2)] flex items-center justify-center transition-all shadow-sm">
              <ChevronRight size={18}/>
            </button>
          </div>
        </div>

        {/* Write a Comment */}
        <div className="max-w-2xl mx-auto px-4 mt-14">
          <div className="bg-[var(--surface)] rounded-3xl shadow-[0_4px_32px_rgba(45,26,18,0.08)] overflow-hidden">
            <div className="bg-[var(--chocolate)] px-8 py-5 flex items-center justify-between border-b border-[var(--border)]">
              <div>
                <p className="text-[var(--accent)] text-xs tracking-[0.3em] uppercase mb-0.5">Share your thoughts</p>
                <h3 className="text-[var(--text)] font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>Write a Review</h3>
              </div>
              <span className="text-6xl text-[var(--accent)]/20 font-serif leading-none select-none" style={{ fontFamily: 'Georgia, serif' }}>"</span>
            </div>
            <div className="p-7">
              {user ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-white font-bold shrink-0" style={{ fontFamily: 'Georgia, serif' }}>
                      {(user.email || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[var(--text)] text-sm font-semibold">{user.email?.split('@')[0]}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button" onClick={() => setReviewForm(p => ({ ...p, rating: star }))}>
                            <Star size={16} className={star <= reviewForm.rating ? "text-[var(--accent)] fill-[var(--accent)]" : "text-[var(--border-2)] fill-[var(--border-2)]"}/>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                    placeholder="Add a public comment about Chocolush..." rows={3}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-2)] text-[var(--text)] px-4 py-3 rounded-2xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/10 placeholder-[var(--accent)]/60 text-sm mb-4 resize-none"/>
                  <div className="flex items-center justify-between">
                    <p className="text-[var(--text-3)] text-xs">Your review will appear after approval.</p>
                    <button onClick={submitReview} disabled={submittingReview}
                      className="inline-flex items-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                      <Send size={14}/> {submittingReview ? 'Posting...' : 'Submit'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <BadgeCheck size={28} className="text-[var(--accent)] mx-auto mb-3"/>
                  <p className="text-[var(--text-2)] text-sm mb-4">Login to leave a verified review</p>
                  <Link to="/login" className="inline-flex items-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                    Login to Comment
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Edit Review Modal */}
      <AnimatePresence>
        {editingReview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[var(--surface)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-[var(--chocolate)] px-7 py-5 flex items-center justify-between border-b border-[var(--border)]">
                <h3 className="text-[var(--text)] font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>Edit Your Review</h3>
                <button onClick={() => setEditingReview(null)} className="text-[var(--accent)] hover:text-[var(--text)] transition-colors"><X size={20}/></button>
              </div>
              <div className="p-7 space-y-4">
                <div>
                  <p className="text-[var(--text-2)] text-xs uppercase tracking-wider mb-2">Rating</p>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setEditForm(p => ({ ...p, rating: star }))}>
                        <Star size={22} className={star <= editForm.rating ? "text-[var(--accent)] fill-[var(--accent)]" : "text-[var(--border-2)] fill-[var(--border-2)]"}/>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[var(--text-2)] text-xs uppercase tracking-wider mb-2">Your Comment</p>
                  <textarea value={editForm.comment} onChange={e => setEditForm(p => ({ ...p, comment: e.target.value }))}
                    rows={4} className="w-full bg-[var(--surface-alt)] border border-[var(--border-2)] text-[var(--text)] px-4 py-3 rounded-2xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/10 placeholder-[var(--accent)]/60 text-sm resize-none"/>
                </div>
                <p className="text-[var(--text-3)] text-xs">Your edited review will need re-approval before showing publicly.</p>
                <div className="flex gap-3 pt-1">
                  <button onClick={saveEditReview}
                    className="flex-1 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    Save Changes
                  </button>
                  <button onClick={() => setEditingReview(null)}
                    className="px-5 border border-[var(--border)] text-[var(--text-2)] py-3 rounded-xl text-sm hover:bg-[var(--surface-alt)] transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>

  );
};

const DEMO_PRODUCTS = Array.from({ length: 8 }, (_, i) => ({
  id: `demo-${i}`, name: ['Kunafa Chocolate Box','Dark Truffle Collection','Rose Gold Pralines','Hazelnut Dream Bar','Sea Salt Caramel','Pistachio Bark','Belgian Milk Box','Saffron Ganache'][i],
  price: [450,680,520,380,290,420,550,620][i], offer_price: i % 2 === 0 ? [380,null,420,null,240,null,480,null][i] : undefined,
  image_url: `https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400`, stock: i === 3 ? 0 : 10,
  category: 'Chocolate', rating: 4.5, review_count: 20, is_featured: true,
}));

const DEMO_CATEGORIES = [
  { id:'1', name:'Kunafa', image_url:'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300' },
  { id:'2', name:'Dark Chocolate', image_url:'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=300' },
  { id:'3', name:'Brownies', image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300' },
  { id:'4', name:'Truffles', image_url:'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300' },
  { id:'5', name:'Gift Boxes', image_url:'https://images.unsplash.com/photo-1587049352851-8d4e89dc8296?w=300' },
  { id:'6', name:'Milk Chocolate', image_url:'https://images.unsplash.com/photo-1548907994-e9c2f8e4d35e?w=300' },
];

const DEMO_BLOGS = [
  { id:'1', title:'The Art of Kunafa Chocolate', slug:'art-of-kunafa', category:'Craft', image_url:'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600', excerpt:'How we blend Kunafa with Belgian chocolate.' },
  { id:'2', title:'Chocolate Gifting Guide 2025', slug:'gifting-guide', category:'Lifestyle', image_url:'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600', excerpt:'The ultimate luxury guide to gifting chocolate.' },
  { id:'3', title:'Behind the Brownie — Our Story', slug:'our-story', category:'Story', image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', excerpt:'How Chocolush was born in Kerala.' },
];

const DEMO_TESTIMONIALS = [
  { name:'Fatima Noor', location:'Kasaragod, Kerala', review:'Absolutely divine! The Kunafa chocolate is unlike anything I\'ve ever tasted. Ordered for my wedding and everyone was in love!' },
  { name:'Rahul Menon', location:'Kozhikode, Kerala', review:'Premium quality chocolates delivered fresh. The packaging alone screams luxury. Will definitely order again!' },
  { name:'Aisha Rahman', location:'Kannur, Kerala', review:'The customized brownie box for my daughter\'s birthday was perfect. Chocolush never disappoints!' },
];

export default HomePage;
