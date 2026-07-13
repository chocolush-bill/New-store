import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ShoppingBag, Package, Cake } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../lib/supabase';

const PHONE = WHATSAPP_NUMBER.replace(/\D/g, '');

const WhatsAppButton = () => {
  const [open, setOpen] = useState(false);

  const options = [
    {
      icon: <MessageCircle size={18} />,
      label: 'Customer Support',
      msg: 'Hello Chocolush! 🍫 I need some assistance.',
    },
    {
      icon: <ShoppingBag size={18} />,
      label: 'Bulk Order Inquiry',
      msg: 'Hello Chocolush! 🍫 I\'m interested in placing a BULK ORDER. Could you please share the details and pricing?',
    },
    {
      icon: <Cake size={18} />,
      label: 'Customized Brownies',
      msg: 'Hello Chocolush! 🍫 I\'d like to order CUSTOMIZED BROWNIES. Can you help me with the options and pricing?',
    },
    {
      icon: <Package size={18} />,
      label: 'Order Payment',
      msg: 'Hello Chocolush! 🍫 I have placed an order on your website and would like to proceed with the payment and confirm delivery details.',
    },
  ];

  const openChat = (msg: string) => {
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    setOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-[var(--surface)] border border-[var(--border-2)] rounded-2xl shadow-2xl overflow-hidden w-72"
          >
            <div className="bg-[#25D366] px-5 py-4">
              <p className="text-[var(--text)] font-bold text-sm">💬 Chat with Chocolush</p>
              <p className="text-green-100 text-xs mt-0.5">Usually replies instantly</p>
            </div>
            <div className="p-3 space-y-2">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => openChat(opt.msg)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--border)] hover:bg-[var(--border-2)] text-[var(--text)] hover:text-[var(--accent)] text-sm transition-all text-left"
                >
                  <span className="text-[#25D366]">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-[#25D366] hover:bg-[#20B85A] text-[var(--text)] rounded-full shadow-2xl flex items-center justify-center transition-colors"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="wa" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default WhatsAppButton;
