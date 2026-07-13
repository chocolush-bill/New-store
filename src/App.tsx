import React, { useEffect, useState } from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Link, useParams as useRouterParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import OrdersPageNew from './pages/OrdersPageNew';
import ReferralPage from './pages/ReferralPage';
import {
  ProfilePage, WishlistPage,
  AboutPage, ContactPage, BlogPage, CategoriesPage,
} from './pages/OtherPages';
import { supabase } from './lib/supabase';
import { ArrowRight } from 'lucide-react';

const DEMO_BLOG = {
  id: '1', title: 'The Art of Kunafa Chocolate', slug: 'art-of-kunafa', category: 'Craft',
  image_url: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800',
  content: '<p>Discover how we blend Middle Eastern Kunafa with premium Belgian chocolate.</p>',
  created_at: new Date().toISOString(),
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BlogPostPage = () => {
  const { id } = useRouterParams();
  const [blog, setBlog] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setBlog(null);

    const query = UUID_RE.test(id)
      ? supabase.from('blog_posts').select('*').eq('id', id).limit(1)
      : supabase.from('blog_posts').select('*').eq('slug', id).limit(1);

    query.then(({ data, error }) => {
      if (error) console.warn('Blog fetch error:', error.message);
      setBlog(data?.[0] || DEMO_BLOG);
      setLoading(false);
    });

    supabase.from('blog_posts').select('*').eq('published', true).limit(4)
      .then(({ data }) => setRelated((data || []).filter((b: any) => b.id !== id && b.slug !== id).slice(0, 3)));
  }, [id]);

  if (loading) return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 flex items-center justify-center">
      <div className="text-[var(--accent)] text-lg animate-pulse">Loading...</div>
    </div>
  );
  const b = blog || DEMO_BLOG;
  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/blog" className="inline-flex items-center gap-2 text-[var(--text-2)] hover:text-[var(--accent)] text-sm mb-8 transition-colors">← Back to Journal</Link>
        <div className="rounded-2xl overflow-hidden aspect-video mb-8">
          <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
        </div>
        <p className="text-[var(--accent)] text-xs tracking-[0.3em] uppercase mb-3">{b.category || 'Chocolate Stories'}</p>
        <h1 className="text-4xl font-bold text-[var(--text)] mb-4" style={{ fontFamily: 'Georgia, serif' }}>{b.title}</h1>
        <p className="text-[var(--text-2)] text-sm mb-10">{new Date(b.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="text-[var(--text-2)] leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: b.content || b.excerpt || '' }} />
        {related.length > 0 && (
          <div className="mt-16 border-t border-[var(--border)] pt-12">
            <h3 className="text-2xl font-bold text-[var(--text)] mb-8" style={{ fontFamily: 'Georgia, serif' }}>Related Articles</h3>
            <div className="grid grid-cols-3 gap-6">
              {related.map((rb: any) => (
                <Link key={rb.id} to={`/blog/${rb.slug || rb.id}`} className="group">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)]/20 transition-colors">
                    <div className="aspect-video overflow-hidden">
                      <img src={rb.image_url} alt={rb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-4">
                      <p className="text-[var(--text)] text-sm font-medium group-hover:text-[var(--accent)] line-clamp-2">{rb.title}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NotFoundPage = () => (
  <div className="bg-[var(--bg)] min-h-screen pt-24 flex items-center justify-center text-center px-4">
    <div>
      <p className="text-8xl mb-6">🍫</p>
      <h1 className="text-4xl font-bold text-[var(--text)] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Page Not Found</h1>
      <p className="text-[var(--text-2)] mb-8">This page melted away... but our chocolates haven't!</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-[var(--accent-2)] text-[#FFFFFF] font-bold px-8 py-3 rounded-full hover:bg-[var(--accent-2-hover)] transition-colors">
        Back to Home <ArrowRight size={16} />
      </Link>
    </div>
  </div>
);

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="flex flex-col min-h-screen bg-[var(--bg)]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/orders" element={<OrdersPageNew />} />
                <Route path="/referrals" element={<ReferralPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            <WhatsAppButton />
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: '#EDE3D3', color: '#2D1A12', border: '1px solid #E0D2BC' },
                success: { iconTheme: { primary: '#C5A880', secondary: '#FFFFFF' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#FFFFFF' } },
              }}
            />
          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
