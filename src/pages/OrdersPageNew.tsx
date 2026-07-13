import { useStoreSettings } from '../hooks/useStoreSettings';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ArrowRight, MessageCircle, Edit, X, Minus, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_STYLES: any = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  confirmed: 'bg-blue-900/30 text-blue-400 border-blue-800',
  ready: 'bg-purple-900/30 text-purple-400 border-purple-800',
  delivered: 'bg-green-900/30 text-green-400 border-green-800',
  cancelled: 'bg-red-900/30 text-red-400 border-red-800',
};

const OrdersPage = () => {
  const { wa: PHONE } = useStoreSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<any>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ customer_name: '', customer_phone: '', customer_address: '', notes: '' });
  const [editItems, setEditItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders();

    // Realtime order updates
    const channel = supabase.channel(`orders-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)')
      .eq('user_id', user!.id).order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const openEdit = (order: any) => {
    if (order.status !== 'pending') { toast.error('Only pending orders can be edited'); return; }
    setEditForm({ customer_name: order.customer_name, customer_phone: order.customer_phone || '', customer_address: order.customer_address || '', notes: order.notes || '' });
    setEditItems(order.order_items?.map((i: any) => ({ ...i })) || []);
    setEditModal(order);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    const newTotal = editItems.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);

    await supabase.from('orders').update({
      customer_name: editForm.customer_name,
      customer_phone: editForm.customer_phone,
      customer_address: editForm.customer_address,
      notes: editForm.notes,
      total_amount: newTotal,
    }).eq('id', editModal.id);

    // Update order items
    for (const item of editItems) {
      if (item.quantity <= 0) {
        await supabase.from('order_items').delete().eq('id', item.id);
      } else {
        await supabase.from('order_items').update({ quantity: item.quantity }).eq('id', item.id);
      }
    }

    toast.success('Order updated successfully! ✅');
    setSaving(false);
    setEditModal(null);
    fetchOrders();
  };

  const handleCancel = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    toast.success('Order cancelled');
    setCancelConfirm(null);
    fetchOrders();
  };

  const updateItemQty = (id: string, qty: number) => {
    setEditItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-2">Account</p>
          <h1 className="text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>My Orders</h1>
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-[var(--surface)] rounded-2xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <Package size={64} className="text-[var(--border-2)] mx-auto mb-4" />
            <p className="text-[var(--text)] text-xl mb-2">No orders yet</p>
            <Link to="/products" className="inline-flex items-center gap-2 text-[var(--accent)] text-sm mt-4 hover:text-[var(--text-2)]">
              Start Shopping <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)]/20 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[var(--text)] font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[var(--text-2)] text-xs">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full border capitalize ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>{order.status}</span>
                    <span className="text-[var(--accent)] font-bold">₹{order.total_amount?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  {order.order_items?.slice(0, 3).map((item: any) => (
                    <p key={item.id} className="text-[var(--text-2)] text-xs">{item.product_name} ×{item.quantity} — ₹{(item.price * item.quantity).toLocaleString()}</p>
                  ))}
                  {order.order_items?.length > 3 && <p className="text-[var(--text-2)] text-xs">+{order.order_items.length - 3} more</p>}
                  {order.coupon_code && <p className="text-green-400 text-xs">Coupon: {order.coupon_code} (-₹{order.discount_amount?.toFixed(2)})</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => openEdit(order)}
                        className="flex items-center gap-1.5 bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] px-3 py-1.5 rounded-xl text-xs hover:bg-[var(--accent)]/20 transition-colors">
                        <Edit size={12} /> Edit Order
                      </button>
                      <button onClick={() => setCancelConfirm(order.id)}
                        className="flex items-center gap-1.5 bg-red-900/10 border border-red-800/30 text-red-400 px-3 py-1.5 rounded-xl text-xs hover:bg-red-900/20 transition-colors">
                        <X size={12} /> Cancel Order
                      </button>
                    </>
                  )}
                  <a href={`https://wa.me/919400667313?text=Hi!%20My%20order%20%23${order.id.slice(0,8).toUpperCase()}%20—%20can%20you%20help?`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] px-3 py-1.5 rounded-xl text-xs hover:bg-[#25D366]/20 transition-colors">
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                </div>

                {order.status === 'pending' && (
                  <p className="text-[var(--text-2)] text-xs mt-2 italic">✏️ You can edit or cancel this order until admin confirms it.</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                <h3 className="text-[var(--accent)] font-bold">Edit Order #{editModal.id.slice(0, 8).toUpperCase()}</h3>
                <button onClick={() => setEditModal(null)}><X size={20} className="text-[var(--text-2)]" /></button>
              </div>
              <div className="p-5 space-y-4">
                {/* Edit Details */}
                <div>
                  <p className="text-[var(--accent)] text-xs uppercase tracking-wider mb-3">Delivery Details</p>
                  {[
                    { key: 'customer_name', label: 'Name', placeholder: 'Your name' },
                    { key: 'customer_phone', label: 'Phone', placeholder: '+91 XXXXX XXXXX' },
                    { key: 'customer_address', label: 'Address', placeholder: 'Street, City, Kerala' },
                    { key: 'notes', label: 'Notes', placeholder: 'Special instructions' },
                  ].map(f => (
                    <div key={f.key} className="mb-3">
                      <label className="text-[var(--text-2)] text-xs block mb-1">{f.label}</label>
                      <input value={editForm[f.key as keyof typeof editForm]}
                        onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] px-3 py-2.5 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
                    </div>
                  ))}
                </div>

                {/* Edit Items */}
                <div>
                  <p className="text-[var(--accent)] text-xs uppercase tracking-wider mb-3">Order Items</p>
                  <div className="space-y-2">
                    {editItems.filter(i => i.quantity > 0).map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-[var(--border)] rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--text)] text-sm truncate">{item.product_name}</p>
                          <p className="text-[var(--accent)] text-xs">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button onClick={() => updateItemQty(item.id, item.quantity - 1)} className="w-7 h-7 bg-[var(--border-2)] rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-[var(--accent)]"><Minus size={12} /></button>
                          <span className="text-[var(--text)] text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateItemQty(item.id, item.quantity + 1)} className="w-7 h-7 bg-[var(--border-2)] rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-[var(--accent)]"><Plus size={12} /></button>
                          <button onClick={() => updateItemQty(item.id, 0)} className="text-red-400 hover:text-red-300 ml-1"><X size={14} /></button>
                        </div>
                        <p className="text-[var(--accent)] font-bold text-sm ml-3 w-20 text-right">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-[var(--border)]">
                    <span className="text-[var(--text)] font-bold text-sm">New Total</span>
                    <span className="text-[var(--accent)] font-bold">₹{editItems.reduce((s, i) => s + (i.price * Math.max(0, i.quantity)), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-[var(--border)]">
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex-1 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:opacity-50 text-[#FFFFFF] font-bold py-3 rounded-xl text-sm">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditModal(null)} className="px-5 border border-[var(--border)] text-[var(--text-2)] py-3 rounded-xl text-sm">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirm */}
      <AnimatePresence>
        {cancelConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--surface)] border border-red-900/50 rounded-2xl p-6 max-w-sm w-full text-center">
              <AlertTriangle size={36} className="text-red-400 mx-auto mb-3" />
              <h3 className="text-[var(--text)] font-bold text-lg mb-2">Cancel Order?</h3>
              <p className="text-[var(--text-2)] text-sm mb-5">This action cannot be undone. The order will be marked as cancelled.</p>
              <div className="flex gap-3">
                <button onClick={() => handleCancel(cancelConfirm)} className="flex-1 bg-red-500 hover:bg-red-600 text-[var(--text)] font-bold py-3 rounded-xl text-sm">Yes, Cancel</button>
                <button onClick={() => setCancelConfirm(null)} className="flex-1 border border-[var(--border)] text-[var(--text-2)] py-3 rounded-xl text-sm">Keep Order</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersPage;
