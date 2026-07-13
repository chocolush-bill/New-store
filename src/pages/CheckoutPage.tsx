import { useStoreSettings } from '../hooks/useStoreSettings';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, CheckCircle, Tag, X, ShoppingBag, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const { wa } = useStoreSettings();
  const PHONE = wa;
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name,phone,address').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setForm(p => ({
          ...p,
          name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
        }));
      }).catch(() => {});
  }, [user]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await supabase
        .from('coupons').select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single();
      if (!data) { toast.error('Invalid or expired coupon'); setCouponLoading(false); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error('Coupon expired'); setCouponLoading(false); return; }
      if (data.max_uses && data.used_count >= data.max_uses) { toast.error('Coupon limit reached'); setCouponLoading(false); return; }
      if (data.min_order && total < data.min_order) { toast.error(`Minimum order ₹${data.min_order} required`); setCouponLoading(false); return; }
      setAppliedCoupon(data);
      toast.success(`Coupon applied! ${data.discount_type === 'percent' ? data.discount_value + '%' : '₹' + data.discount_value} off 🎉`);
    } catch { toast.error('Could not apply coupon'); }
    setCouponLoading(false);
  };

  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === 'percent'
      ? (total * appliedCoupon.discount_value) / 100
      : appliedCoupon.discount_value
    : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const handlePlaceOrder = async () => {
    if (!form.name.trim()) { toast.error('Please enter your name'); return; }
    if (!form.phone.trim()) { toast.error('Please enter your phone number'); return; }
    if (!form.address.trim()) { toast.error('Please enter your address'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    setLoading(true);
    try {
      // Save profile
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: form.name,
          phone: form.phone,
          address: `${form.address}${form.city ? ', ' + form.city : ''}`,
          email: user.email,
        }, { onConflict: 'id' });
      }

      const orderData: any = {
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: `${form.address}${form.city ? ', ' + form.city : ''}`,
        notes: form.notes || null,
        total_amount: finalTotal,
        status: 'pending',
        payment_method: 'whatsapp',
      };
      if (user) orderData.user_id = user.id;
      if (appliedCoupon) {
        orderData.coupon_code = appliedCoupon.code;
        orderData.discount_amount = discountAmount;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders').insert(orderData).select().single();

      if (orderError) {
        console.error('Order error:', orderError);
        toast.error('Failed to place order: ' + orderError.message);
        setLoading(false);
        return;
      }

      // Insert order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) console.warn('Order items error:', itemsError.message);

      // Update coupon usage
      if (appliedCoupon) {
        await supabase.from('coupons')
          .update({ used_count: (appliedCoupon.used_count || 0) + 1 })
          .eq('id', appliedCoupon.id);
      }

      // Mark referral as completed on first order
      if (user) {
        try {
          await supabase.from('referrals')
            .update({ status: 'completed' })
            .eq('referred_id', user.id)
            .eq('status', 'pending');
        } catch (refErr) {
          console.warn('Referral status update skipped:', refErr);
        }
      }

      setOrderId(order.id.slice(0, 8).toUpperCase());
      clearCart();
      setOrderPlaced(true);
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const buildWhatsAppMsg = () => {
    const itemList = items.map(i => `• ${i.name} ×${i.quantity} — ₹${(i.price * i.quantity).toLocaleString()}`).join('\n');
    return `🍫 *New Order — Chocolush*\n\nOrder ID: #${orderId}\n\n*Customer:*\nName: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}${form.city ? ', ' + form.city : ''}\n\n*Items:*\n${itemList}\n\n*Subtotal:* ₹${total.toLocaleString()}${discountAmount > 0 ? `\n*Discount:* -₹${discountAmount.toFixed(2)}` : ''}\n*Total: ₹${finalTotal.toLocaleString()}*\n${form.notes ? '\nNotes: ' + form.notes : ''}\n\nPlease confirm availability and share payment details. Thank you! 🙏`;
  };

  if (orderPlaced) return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-10 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
            className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </motion.div>
          <h2 className="text-3xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Order Received!</h2>
          <p className="text-[var(--text-2)] text-sm mb-6">Order #{orderId}</p>
          <div className="bg-[var(--border)] rounded-2xl p-5 mb-8 text-left border border-[var(--border-2)]">
            <p className="text-[var(--text)] text-sm leading-relaxed">Your order request has been submitted successfully 🍫</p>
            <p className="text-[var(--text-2)] text-sm leading-relaxed mt-3">Our team will confirm product availability. After confirmation, <strong className="text-[var(--accent)]">Chocolush will contact you</strong> for payment and delivery.</p>
          </div>
          <div className="space-y-3">
            <a href={`https://wa.me/${PHONE}?text=${encodeURIComponent(buildWhatsAppMsg())}`} target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20B85A] text-[var(--text)] font-bold py-4 rounded-xl transition-colors">
              <MessageCircle size={20} /> Chat for Payment Confirmation
            </a>
            <Link to="/orders" className="w-full flex items-center justify-center gap-2 border border-[var(--accent)]/30 text-[var(--accent)] py-3 rounded-xl text-sm hover:bg-[var(--accent)]/5 transition-colors">
              <ShoppingBag size={16} /> View My Orders
            </Link>
            <Link to="/products" className="w-full flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text-2)] text-sm py-2 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-2">Almost There</p>
          <h1 className="text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>Checkout</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Details */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="text-[var(--accent)] font-semibold mb-5">Delivery Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'name', label: 'Full Name *', placeholder: 'Your name', full: false },
                  { name: 'phone', label: 'Phone Number *', placeholder: '+91 XXXXX XXXXX', full: false },
                  { name: 'address', label: 'Address *', placeholder: 'Street, Landmark', full: true },
                  { name: 'city', label: 'City / Town', placeholder: 'Kasaragod', full: false },
                  { name: 'notes', label: 'Special Notes', placeholder: 'Any special requests?', full: false },
                ].map(f => (
                  <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
                    <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-1.5">{f.label}</label>
                    <input name={f.name} value={form[f.name as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] px-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="text-[var(--accent)] font-semibold mb-4 flex items-center gap-2"><Tag size={16}/> Coupon Code</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-900/20 border border-green-800/50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-green-400 font-bold text-sm">{appliedCoupon.code}</p>
                    <p className="text-green-300 text-xs">{appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.discount_value}% off` : `₹${appliedCoupon.discount_value} off`} applied!</p>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-[var(--text-2)] hover:text-red-400"><X size={18}/></button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] px-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm tracking-widest" />
                  <button onClick={applyCoupon} disabled={couponLoading}
                    className="bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:opacity-50 text-[#FFFFFF] font-bold px-5 py-3 rounded-xl text-sm transition-colors">
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="text-[var(--accent)] font-semibold mb-4">Payment</h3>
              <div className="space-y-3 mb-4">
                {[
                  { icon: '💳', label: 'GPay / UPI', sub: 'After WhatsApp confirmation' },
                  { icon: '💵', label: 'Cash on Delivery', sub: 'Pay at your doorstep' },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-4 bg-[var(--border)] border border-[var(--border-2)] rounded-xl px-4 py-3">
                    <span className="text-xl">{m.icon}</span>
                    <div><p className="text-[var(--text)] text-sm font-medium">{m.label}</p><p className="text-[var(--text-2)] text-xs">{m.sub}</p></div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-[#25D366]/5 border border-[#25D366]/20 rounded-xl">
                <p className="text-[var(--text-2)] text-xs leading-relaxed"><MessageCircle size={12} className="inline mr-1 text-[#25D366]"/>After placing your order, chat with us on WhatsApp to confirm payment and delivery.</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sticky top-24">
              <h3 className="text-[var(--accent)] font-bold text-lg mb-5" style={{ fontFamily: 'Georgia, serif' }}>Order Summary</h3>
              <div className="space-y-3 mb-5 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=80'} alt={item.name} className="w-12 h-12 object-cover rounded-lg shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text)] text-xs truncate">{item.name}</p>
                      <p className="text-[var(--text-2)] text-xs">×{item.quantity}</p>
                    </div>
                    <span className="text-[var(--text-2)] text-xs font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border)] pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-2)]">Subtotal</span><span className="text-[var(--text)]">₹{total.toLocaleString()}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-green-400">Discount</span><span className="text-green-400">-₹{discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--text)] font-bold">Total</span>
                  <span className="text-[var(--accent)] font-bold text-xl">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>
              <button onClick={handlePlaceOrder} disabled={loading || items.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFFFFF] font-bold py-4 rounded-xl transition-colors text-sm tracking-wider">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin"/>Placing Order...</>
                ) : '🍫 Place Order'}
              </button>
              {!user && (
                <p className="text-center text-[var(--text-2)] text-xs mt-3">
                  <Link to="/login" className="text-[var(--accent)] underline">Login</Link> to auto-fill your details
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
