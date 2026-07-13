import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Search, Menu, X, User, LogOut, Sun, Moon, Sparkles, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const NAV_LINKS = [
  { label: 'Shop', href: '/products' },
  { label: 'Categories', href: '/categories' },
  { label: 'About', href: '/about' },
  { label: 'Journal', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const Navbar = () => {
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [topMessage, setTopMessage] = useState('');
  const [topBarDismissed, setTopBarDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fetchTopBar = async () => {
      try {
        const [{ data: settingsRows }, { data: campaignRows }] = await Promise.all([
          supabase.from('store_settings').select('value').eq('key', 'announcement_bar').limit(1),
          supabase.from('campaigns').select('name, badge_text, discount_percent').eq('active', true).limit(1),
        ]);
        const campaign = campaignRows?.[0];
        if (campaign) {
          const label = campaign.badge_text || campaign.name;
          const discount = campaign.discount_percent > 0 ? ` — ${campaign.discount_percent}% OFF` : '';
          setTopMessage(`${label}${discount}`);
          return;
        }
        const raw = settingsRows?.[0]?.value;
        const announcement = typeof raw === 'string' ? raw.replace(/^"|"$/g, '') : '';
        setTopMessage(announcement || '');
      } catch { setTopMessage(''); }
    };
    fetchTopBar();
    const channel = supabase.channel('navbar-topbar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, fetchTopBar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, fetchTopBar)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/products?q=${encodeURIComponent(searchQuery)}`); setSearchOpen(false); }
  };

  const isHome = location.pathname === '/';
  const transparentTop = isHome && !scrolled && !mobileOpen;
  const navBg = transparentTop ? 'bg-transparent' : 'bg-[var(--surface)]/95 backdrop-blur-md shadow-lg';
  const textColor = transparentTop ? 'text-white' : 'text-[var(--text)]';
  const iconColor = transparentTop ? 'text-white hover:text-[var(--accent)]' : 'text-[var(--text)] hover:text-[var(--accent)]';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        {/* Top bar */}
        <AnimatePresence>
          {topMessage && !topBarDismissed && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="bg-[#2D1A12] overflow-hidden">
              <div className="flex items-center justify-center gap-2 px-8 py-1.5 relative">
                <Sparkles size={11} className="text-[var(--accent)] shrink-0" />
                <p className="text-[#EDE3D3] text-xs text-center font-medium truncate">{topMessage}</p>
                <button onClick={() => setTopBarDismissed(true)} className="absolute right-3 text-[var(--accent)]/60 hover:text-[var(--accent)]">
                  <X size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main nav row */}
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">

            {/* Logo */}
            <Link to="/" className="flex flex-col leading-none shrink-0" onClick={() => setMobileOpen(false)}>
              <span className={`text-lg sm:text-2xl font-bold tracking-[0.1em] sm:tracking-[0.15em] ${textColor} transition-colors duration-300`}
                style={{ fontFamily: 'Georgia, serif' }}>CHOCOLUSH</span>
              <span className={`text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-colors duration-300 ${transparentTop ? 'text-white/70' : 'text-[var(--text-3)]'}`}>
                Premium Chocolate
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(link => (
                <Link key={link.href} to={link.href}
                  className={`text-sm tracking-[0.1em] uppercase transition-colors duration-200 ${location.pathname === link.href ? 'text-[var(--accent)]' : `${textColor} hover:text-[var(--accent)]`}`}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right icons — reduced for mobile */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Theme toggle — always visible, compact on mobile */}
              <button onClick={toggleTheme} aria-label="Toggle theme"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${iconColor}`}>
                <AnimatePresence mode="wait" initial={false}>
                  {theme === 'dark'
                    ? <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><Sun size={17} /></motion.span>
                    : <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Moon size={17} /></motion.span>
                  }
                </AnimatePresence>
              </button>

              {/* Search */}
              <button onClick={() => setSearchOpen(true)} className={`w-8 h-8 flex items-center justify-center ${iconColor} transition-colors`}>
                <Search size={19} />
              </button>

              {/* Cart — with badge */}
              <Link to="/cart" className={`relative w-8 h-8 flex items-center justify-center ${iconColor} transition-colors`}>
                <ShoppingBag size={19} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--accent)] text-[#1A0E08] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Link>

              {/* Wishlist — hidden on very small screens, visible sm+ */}
              <Link to="/wishlist" className={`hidden sm:flex w-8 h-8 items-center justify-center ${iconColor} transition-colors`}>
                <Heart size={19} />
              </Link>

              {/* Login / User — desktop only */}
              {user ? (
                <button onClick={handleSignOut}
                  className="hidden md:flex items-center gap-1 text-xs tracking-wider uppercase text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 px-3 py-1.5 rounded-full transition-colors">
                  <User size={14} /> Account
                </button>
              ) : (
                <Link to="/login"
                  className="hidden md:flex text-xs tracking-wider uppercase text-[#FFFFFF] bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] px-4 py-1.5 rounded-full transition-colors">
                  Login
                </Link>
              )}

              {/* Hamburger */}
              <button onClick={() => setMobileOpen(v => !v)} aria-label="Menu"
                className={`w-8 h-8 flex items-center justify-center lg:hidden ${iconColor} transition-colors`}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[var(--surface)] border-t border-[var(--border)] overflow-hidden">
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map(link => (
                  <Link key={link.href} to={link.href}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === link.href ? 'text-[var(--accent)] bg-[var(--surface-alt)]' : 'text-[var(--text)] hover:bg-[var(--surface-alt)]'
                    }`}>
                    {link.label} <ChevronRight size={15} className="text-[var(--text-3)]" />
                  </Link>
                ))}
                <div className="border-t border-[var(--border)] my-2"/>
                <Link to="/wishlist" className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors">
                  <Heart size={16}/> Wishlist
                </Link>
                {user ? (
                  <>
                    <Link to="/profile" className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors">
                      <User size={16}/> My Profile
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-[var(--text)] hover:bg-[var(--surface-alt)] transition-colors">
                      <ShoppingBag size={16}/> My Orders
                    </Link>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <LogOut size={16}/> Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="flex items-center justify-center gap-2 mx-2 my-2 py-3 rounded-xl bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-[#FFFFFF] text-sm font-bold transition-colors">
                    Login to Chocolush
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[60] flex items-start justify-center pt-20 px-4"
            onClick={e => { if (e.target === e.currentTarget) setSearchOpen(false); }}>
            <motion.form initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              onSubmit={handleSearch}
              className="w-full max-w-xl bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border-2)] shadow-2xl">
              <div className="flex items-center px-4 py-3 gap-3">
                <Search size={20} className="text-[var(--text-3)] shrink-0" />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search chocolates..." className="flex-1 bg-transparent text-[var(--text)] text-lg outline-none placeholder-[var(--text-3)]" />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-[var(--text-3)] hover:text-[var(--text)]"><X size={20} /></button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
