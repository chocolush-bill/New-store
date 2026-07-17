import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Package, Heart, LogOut, Edit, ExternalLink, MessageCircle, Mail, MapPin, Phone, ArrowRight, Star, Gift } from 'lucide-react';
import { useStoreSettings } from '../hooks/useStoreSettings';
import { supabase, INSTAGRAM_HANDLE } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

// ─── PROFILE PAGE ───────────────────────────────────────────────────────────
export const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { setProfile(data); setForm({ full_name: data?.full_name || '', phone: data?.phone || '', address: data?.address || '' }); });
  }, [user]);

  const handleSave = async () => {
    await supabase.from('profiles').upsert({ id: user!.id, ...form });
    setProfile((p: any) => ({ ...p, ...form }));
    setEditing(false);
    toast.success('Profile updated!');
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-2">Account</p>
          <h1 className="text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>My Profile</h1>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center">
              <User size={28} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-[var(--text)] font-bold text-xl">{profile?.full_name || 'Chocolush Customer'}</p>
              <p className="text-[var(--text-2)] text-sm">{user?.email}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              {[
                { key: 'full_name', label: 'Full Name', placeholder: 'Your name' },
                { key: 'phone', label: 'Phone', placeholder: '+91 XXXXX XXXXX' },
                { key: 'address', label: 'Address', placeholder: 'Your address' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-1.5">{f.label}</label>
                  <input value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] px-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={handleSave} className="flex-1 bg-[var(--accent)] text-[#FFFFFF] font-bold py-3 rounded-xl text-sm">Save Changes</button>
                <button onClick={() => setEditing(false)} className="flex-1 border border-[var(--border-2)] text-[var(--text-2)] py-3 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Name', value: profile?.full_name },
                { label: 'Email', value: user?.email },
                { label: 'Phone', value: profile?.phone },
                { label: 'Address', value: profile?.address },
              ].map(f => f.value && (
                <div key={f.label} className="flex gap-4">
                  <span className="text-[var(--text-2)] text-sm w-20">{f.label}</span>
                  <span className="text-[var(--text-2)] text-sm">{f.value}</span>
                </div>
              ))}
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-[var(--accent)] text-sm mt-4 hover:text-[var(--text-2)]">
                <Edit size={14} /> Edit Profile
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Link to="/orders" className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)]/30 transition-colors">
            <Package size={24} className="text-[var(--accent)] mb-3" />
            <p className="text-[var(--text)] font-medium">My Orders</p>
            <p className="text-[var(--text-2)] text-xs">Track your orders</p>
          </Link>
          <Link to="/wishlist" className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)]/30 transition-colors">
            <Heart size={24} className="text-[var(--accent)] mb-3" />
            <p className="text-[var(--text)] font-medium">Wishlist</p>
            <p className="text-[var(--text-2)] text-xs">Saved items</p>
          </Link>
        </div>

        <Link to="/referrals" className="block bg-gradient-to-r from-[#2D1A12] to-[#4a3324] rounded-2xl p-5 mb-6 hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold flex items-center gap-2"><Gift size={18} className="text-[var(--accent)]"/> Refer & Earn</p>
              <p className="text-[var(--accent)]/80 text-xs mt-1">Share Chocolush, earn sweet rewards</p>
            </div>
            <span className="text-[var(--accent)] text-sm">→</span>
          </div>
        </Link>

        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 border border-red-900/50 text-red-400 py-3 rounded-xl hover:bg-red-900/10 transition-colors text-sm">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
};


// ─── WISHLIST PAGE ───────────────────────────────────────────────────────────
export const WishlistPage = () => {
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlist.length === 0) { setProducts([]); setLoading(false); return; }
    supabase.from('products').select('*').in('id', wishlist).then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, [wishlist]);

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-2">Saved</p>
          <h1 className="text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>My Wishlist</h1>
          <p className="text-[var(--text-2)] mt-1">{wishlist.length} items</p>
        </div>
        {wishlist.length === 0 ? (
          <div className="text-center py-24">
            <Heart size={64} className="text-[var(--border-2)] mx-auto mb-4" />
            <p className="text-[var(--text)] text-xl mb-2">Your wishlist is empty</p>
            <Link to="/products" className="inline-flex items-center gap-2 text-[var(--accent)] text-sm mt-4 hover:text-[var(--text-2)]">
              Discover Chocolates <ArrowRight size={16} />
            </Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-[var(--surface)] rounded-2xl aspect-[3/4] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ABOUT PAGE ──────────────────────────────────────────────────────────────
export const AboutPage = () => {
  const { get: getAbout } = useStoreSettings();
  const [about, setAbout] = useState({
    title: 'About Chocolush',
    text: "Chocolush was born from a simple belief: that chocolate should be an experience, not just a treat.",
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=1200',
  });

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const { data } = await supabase.from('store_settings').select('*')
          .in('key', ['about_title', 'about_text', 'about_image']);
        if (data?.length) {
          const map: Record<string, string> = {};
          data.forEach((row: any) => {
            map[row.key] = typeof row.value === 'string' ? row.value.replace(/^"|"$/g, '') : String(row.value ?? '');
          });
          setAbout(prev => ({
            title: map.about_title || prev.title,
            text: map.about_text || prev.text,
            image: map.about_image || prev.image,
          }));
        }
      } catch {}
    };
    fetchAbout();
    const channel = supabase.channel('about-settings-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, fetchAbout)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
  <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20">
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center mb-16">
        <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-4">Our Story</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text)] mb-6" style={{ fontFamily: 'Georgia, serif' }}>{about.title}</h1>
        <p className="text-[var(--text-2)] text-lg leading-relaxed">{about.text}</p>
      </div>

      <div className="relative rounded-3xl overflow-hidden mb-16 aspect-video shadow-md">
        <img src={about.image} alt="Chocolush Story" className="w-full h-full object-cover" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Our Craft</h2>
          <p className="text-[var(--text-2)] leading-relaxed mb-4">Chocolush was born from a simple belief: that chocolate should be an experience, not just a treat. Based in the lush green heart of Kerala, we blend traditional Middle Eastern flavors with premium Belgian chocolate to create something truly magical.</p>
          <p className="text-[var(--text-2)] leading-relaxed">Our signature Kunafa Chocolate — a harmonious fusion of golden crispy kadaifi and rich Belgian chocolate — has captured the hearts of chocolate lovers across Kerala and beyond.</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Our Promise</h2>
          <p className="text-[var(--text-2)] leading-relaxed mb-4">Every piece that leaves our kitchen carries our promise of quality, freshness, and love. We use only premium ingredients, and each chocolate is handcrafted with meticulous attention to detail.</p>
          <p className="text-[var(--text-2)] leading-relaxed">From intimate gift boxes to grand wedding orders, we pour the same dedication into every creation — because you deserve nothing less than extraordinary.</p>
        </div>
      </div>

      {/* Instagram */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-10 text-center mb-16">
        <ExternalLink size={32} className="text-[var(--accent)] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Follow Our Journey</h3>
        <p className="text-[var(--text-2)] mb-6">Behind-the-scenes, new launches, and chocolate inspiration every day.</p>
        <a
          href="' + getS('instagram_url') + '"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2D1B14] via-[#4E342E] to-[#8B6B3F] text-white font-bold px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl text-sm tracking-wider">
          <ExternalLink size={18} /> {INSTAGRAM_HANDLE} — Follow Us
        </a>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '🍫', title: 'Premium Ingredients', desc: 'Finest Belgian chocolate, real kadaifi, natural flavors — no shortcuts ever.' },
          { icon: '🤝', title: 'Handcrafted with Love', desc: 'Every piece is made by hand with passion and precision.' },
          { icon: '🌟', title: 'Luxury Experience', desc: 'From packaging to delivery, every detail is designed for delight.' },
        ].map((v, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-center">
            <span className="text-4xl mb-4 block">{v.icon}</span>
            <h4 className="text-[var(--accent)] font-bold mb-2">{v.title}</h4>
            <p className="text-[var(--text-2)] text-sm">{v.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
export const ContactPage = () => {
  const { get: getS, wa } = useStoreSettings();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleWhatsApp = () => {
    const msg = `Hi Chocolush! 🍫\n\nName: ${form.name}\nSubject: ${form.subject}\n\n${form.message}`;
    window.open(`https://wa.me/919400667313?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-4">Say Hello</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text)] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Get In Touch</h1>
          <p className="text-[var(--text-2)]">We'd love to hear from you — whether it's an order, a question, or just a chocolate chat.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info */}
          <div>
            <div className="space-y-6 mb-10">
              {[
                { icon: <MessageCircle size={20} />, label: 'WhatsApp', value: '+91 9400667313', link: 'https://wa.me/919400667313', color: '#25D366' },
                { icon: <ExternalLink size={20} />, label: 'Instagram', value: INSTAGRAM_HANDLE, link: '' + getS('instagram_url') + '', color: '#E1306C' },
                { icon: <MapPin size={20} />, label: 'Location', value: getS('contact_address'), link: null, color: '#C5A880' },
              ].map(item => (
                <div key={item.label} className="flex gap-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)]/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--border)]" style={{ color: item.color }}>{item.icon}</div>
                  <div>
                    <p className="text-[var(--text-2)] text-xs tracking-widest uppercase">{item.label}</p>
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-[var(--text)] font-medium hover:text-[var(--accent)] transition-colors">{item.value}</a>
                    ) : (
                      <p className="text-[var(--text)] font-medium">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="text-[var(--accent)] font-bold mb-3">Bulk Orders & Customization</h3>
              <p className="text-[var(--text-2)] text-sm leading-relaxed mb-4">Planning a wedding, corporate event, or special celebration? We create bespoke chocolate experiences for every occasion.</p>
              <a href="https://wa.me/919400667313?text=Hi! I'd like to discuss a bulk/custom order." target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-[var(--text)] font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:bg-[#20B85A]">
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
            <h3 className="text-[var(--accent)] font-bold text-xl mb-6" style={{ fontFamily: 'Georgia, serif' }}>Send a Message</h3>
            <div className="space-y-4">
              {[
                { name: 'name', label: 'Your Name', type: 'input', placeholder: 'Full name' },
                { name: 'email', label: 'Email', type: 'input', placeholder: 'your@email.com' },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-1.5">{f.label}</label>
                  <input name={f.name} value={form[f.name as keyof typeof form]} onChange={handleChange} placeholder={f.placeholder}
                    className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] px-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
                </div>
              ))}
              <div>
                <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-1.5">Subject</label>
                <select name="subject" value={form.subject} onChange={handleChange} className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] px-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 text-sm">
                  <option value="">Select subject</option>
                  <option>General Inquiry</option>
                  <option>Bulk Order</option>
                  <option>Customized Brownie</option>
                  <option>Order Support</option>
                  <option>Feedback</option>
                </select>
              </div>
              <div>
                <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-1.5">Message</label>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Your message..." rows={5}
                  className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] px-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm resize-none" />
              </div>
              <button onClick={handleWhatsApp} className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20B85A] text-[var(--text)] font-bold py-4 rounded-xl transition-colors text-sm">
                <MessageCircle size={18} /> Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── BLOG PAGES ───────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Craft': '#C5A880',
  'Lifestyle': '#A8784E',
  'Story': '#7A5C42',
  'Chocolate Stories': '#C5A880',
  'Recipes': '#8F6539',
  'Events': '#B8956A',
};
const getCategoryColor = (cat?: string) => CATEGORY_COLORS[cat || ''] || '#C5A880';

export const BlogPage = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('published', true).order('created_at', { ascending: false })
      .then(({ data }) => { setBlogs(data?.length ? data : DEMO_BLOGS); setLoading(false); });
    const channel = supabase.channel('blogs').on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => {
      supabase.from('blog_posts').select('*').eq('published', true).order('created_at', { ascending: false })
        .then(({ data }) => setBlogs(data?.length ? data : DEMO_BLOGS));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const categories = ['All', ...Array.from(new Set(blogs.map(b => b.category || 'Chocolate Stories')))];
  const filteredBlogs = activeCategory === 'All' ? blogs : blogs.filter(b => (b.category || 'Chocolate Stories') === activeCategory);

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-4">Stories</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text)] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Our Journal</h1>
          <p className="text-[var(--text-2)]">Chocolate stories, craft insights, and luxury living from Chocolush.</p>
        </div>

        {/* Category Tabs */}
        {categories.length > 1 && (
          <div className="flex items-center justify-center gap-1 mb-12 border-b border-[var(--border)] overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat ? 'text-[var(--text)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                }`}
              >
                {cat}
                {activeCategory === cat && (
                  <motion.div layoutId="blogTabUnderline" className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--accent-2)] rounded-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-[var(--surface)] rounded-2xl aspect-[3/4] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
            {filteredBlogs.map((blog, i) => {
              const catColor = getCategoryColor(blog.category);
              const isFeatured = i === 0 && activeCategory === 'All';
              return (
                <motion.div key={blog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="group">
                  <Link to={`/blog/${blog.slug || blog.id}`}>
                    <div className={`relative rounded-2xl overflow-hidden mb-4 aspect-[16/10] ${
                      isFeatured ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]' : ''
                    }`}>
                      <img src={blog.image_url || 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600'} alt={blog.title}
                        loading="lazy" decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                    <h3 className="text-[#1F140D] font-bold text-xl leading-snug mb-3 group-hover:text-[var(--accent-2)] transition-colors">
                      {blog.title}
                    </h3>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ fontFamily: 'Georgia, serif' }}>
                        C
                      </div>
                      <span className="text-[#5A4632] text-sm">Chocolush Team</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && filteredBlogs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[var(--text-3)] text-sm">No stories in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};


const DEMO_BLOGS = [
  { id: '1', title: 'The Art of Kunafa Chocolate', slug: 'art-of-kunafa', category: 'Craft', image_url: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600', excerpt: 'How we blend Kunafa with Belgian chocolate.' },
  { id: '2', title: 'Chocolate Gifting Guide 2025', slug: 'gifting-guide', category: 'Lifestyle', image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600', excerpt: 'The ultimate luxury guide to gifting chocolate.' },
  { id: '3', title: 'Behind the Brownie', slug: 'our-story', category: 'Story', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', excerpt: 'How Chocolush was born in Kerala.' },
];

const DEMO_CATS = [
  { id: '1', name: 'Kunafa', image_url: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300' },
  { id: '2', name: 'Dark Chocolate', image_url: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=300' },
  { id: '3', name: 'Brownies', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300' },
  { id: '4', name: 'Truffles', image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300' },
  { id: '5', name: 'Gift Boxes', image_url: 'https://images.unsplash.com/photo-1587049352851-8d4e89dc8296?w=300' },
  { id: '6', name: 'Milk Chocolate', image_url: 'https://images.unsplash.com/photo-1548907994-e9c2f8e4d35e?w=300' },
];

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data?.length ? data : DEMO_CATS));
  }, []);

  useEffect(() => {
    let query = supabase.from('products').select('*');
    if (selectedCat) query = (query as any).eq('category_id', selectedCat);
    (query as any).limit(12).then(({ data }: any) => setProducts(data || []));
  }, [selectedCat]);

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-3">Collections</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>All Categories</h1>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <button onClick={() => setSelectedCat('')} className={`px-5 py-2 rounded-full text-sm transition-colors ${!selectedCat ? 'bg-[var(--accent)] text-[#FFFFFF] font-bold' : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--accent)]/30'}`}>All</button>
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={`px-5 py-2 rounded-full text-sm transition-colors ${selectedCat === cat.id ? 'bg-[var(--accent)] text-[#FFFFFF] font-bold' : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--accent)]/30'}`}>{cat.name}</button>
          ))}
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p: any) => (
              <motion.div key={p.id} whileHover={{ y: -4 }}>
                <Link to={`/products/${p.id}`}>
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)]/30 transition-all">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={p.image_url || 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400'} alt={p.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <p className="text-[var(--text)] font-medium text-sm">{p.name}</p>
                      <p className="text-[var(--accent)] font-bold mt-1">₹{(p.offer_price || p.price)?.toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat: any, i: number) => (
              <motion.div key={cat.id || i} whileHover={{ y: -4 }}>
                <button onClick={() => setSelectedCat(cat.id)} className="group w-full">
                  <div className="relative rounded-2xl overflow-hidden aspect-square bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all">
                    <img src={cat.image_url || 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300'} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2D1A12]/70 via-transparent to-transparent" />
                    <p className="absolute bottom-3 inset-x-0 text-center text-white text-xs font-semibold tracking-wider group-hover:text-[var(--accent)] transition-colors">{cat.name}</p>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
