import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStoreSettings } from '../hooks/useStoreSettings';
import toast from 'react-hot-toast';

const Footer = () => {
  const { get } = useStoreSettings();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const wa = get('whatsapp_number').replace(/\D/g, '');
  const igUrl = get('instagram_url');
  const igHandle = get('instagram_handle');
  const contactEmail = get('contact_email');
  const address = get('contact_address');
  const storeName = get('store_name');
  const footerTag = get('footer_tagline');
  const freeDelivery = get('free_delivery_above');

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({ email });
    if (error) toast.error('You may already be subscribed!');
    else { toast.success('Subscribed! 🍫'); setEmail(''); }
    setSubscribing(false);
  };

  return (
    <footer className="bg-[var(--bg)] border-t border-[var(--border)]">
      {/* Newsletter */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>Join Our Chocolate Circle</h3>
              <p className="text-[var(--text-2)] mt-1 text-sm">Exclusive offers, new arrivals & sweet stories delivered to you.</p>
            </div>
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row w-full md:w-auto gap-2 sm:gap-3">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full sm:w-72 bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] px-4 py-3 rounded-xl outline-none focus:border-[var(--accent)] placeholder-[var(--text-3)] text-sm" />
              <button type="submit" disabled={subscribing}
                className="w-full sm:w-auto bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm tracking-wider disabled:opacity-50">
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="block mb-4">
              <p className="text-xl font-bold tracking-widest text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>{storeName.toUpperCase()}</p>
              <p className="text-[9px] tracking-[0.3em] text-[var(--text-3)] uppercase">Premium Chocolate Boutique</p>
            </Link>
            <p className="text-[var(--text-2)] text-sm leading-relaxed mb-5">Crafting moments of pure indulgence through the finest artisan chocolates. Every piece is a story of passion, precision, and luxury.</p>
            <div className="flex gap-4">
              <a href={igUrl} target="_blank" rel="noreferrer" className="text-[var(--text-2)] hover:text-[var(--accent)] transition-colors"><ExternalLink size={19}/></a>
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="text-[var(--text-2)] hover:text-[#25D366] transition-colors"><MessageCircle size={19}/></a>
              <a href={`mailto:${contactEmail}`} className="text-[var(--text-2)] hover:text-[var(--accent)] transition-colors"><Mail size={19}/></a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[var(--text)] font-semibold text-xs tracking-[0.2em] uppercase mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'All Chocolates', href: '/products' },
                { label: 'Categories', href: '/categories' },
                { label: 'Wishlist', href: '/wishlist' },
                { label: 'Bulk Orders', href: `https://wa.me/${wa}?text=Hello%20Chocolush!%20Bulk%20order%20inquiry.` },
                { label: 'Customized Brownies', href: `https://wa.me/${wa}?text=Hello%20Chocolush!%20Customized%20brownies.` },
              ].map(item => (
                <li key={item.label}>
                  {item.href.startsWith('http') ? (
                    <a href={item.href} target="_blank" rel="noreferrer" className="text-[var(--text-2)] text-sm hover:text-[var(--accent)] transition-colors">{item.label}</a>
                  ) : (
                    <Link to={item.href} className="text-[var(--text-2)] text-sm hover:text-[var(--accent)] transition-colors">{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[var(--text)] font-semibold text-xs tracking-[0.2em] uppercase mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Our Journal', href: '/blog' },
                { label: 'Contact', href: '/contact' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.href} className="text-[var(--text-2)] text-sm hover:text-[var(--accent)] transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[var(--text)] font-semibold text-xs tracking-[0.2em] uppercase mb-4">Get In Touch</h4>
            <ul className="space-y-3 text-sm text-[var(--text-2)]">
              <li>{address}</li>
              <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="hover:text-[#25D366] transition-colors">+{wa}</a></li>
              <li><a href={`mailto:${contactEmail}`} className="hover:text-[var(--accent)] transition-colors">{contactEmail}</a></li>
              <li><a href={igUrl} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)] transition-colors">{igHandle}</a></li>
              {freeDelivery && <li className="text-[var(--accent)] text-xs font-medium pt-1">🚚 Free delivery above ₹{freeDelivery}</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-[var(--border)] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[var(--text-3)] text-xs text-center">© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p className="text-[var(--text-3)] text-xs text-center">{footerTag}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
