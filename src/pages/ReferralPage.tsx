import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, Users, Award, MessageCircle, Sparkles } from 'lucide-react';
import { supabase, WHATSAPP_NUMBER } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MILESTONES = [
  { count: 3, reward: '₹100 Coupon', code: 'REF3CHOCO', icon: '🎁' },
  { count: 5, reward: '₹200 Coupon', code: 'REF5CHOCO', icon: '💎' },
  { count: 10, reward: '15% Lifetime Discount', code: 'REF10CHOCO', icon: '👑' },
];

const generateCode = (name?: string, email?: string) => {
  const base = (name || email || 'CHOCO').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 5) || 'CHOCO';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${base}${rand}`;
};

const ReferralPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    init();
  }, [user]);

  const init = async () => {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      let code = prof?.referral_code;
      if (!code) {
        code = generateCode(prof?.full_name, user?.email);
        await supabase.from('profiles').update({ referral_code: code }).eq('id', user!.id);
      }
      setProfile({ ...prof, referral_code: code });

      const { data: refs } = await supabase.from('referrals')
        .select('*').eq('referrer_id', user!.id).order('created_at', { ascending: false });
      setReferrals(refs || []);
    } catch (e) {
      console.warn('Referral init error:', e);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = profile?.referral_code
    ? `${window.location.origin}${window.location.pathname}#/register?ref=${profile.referral_code}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = `🍫 Hey! I love Chocolush — premium handcrafted chocolates from Kerala. Use my referral link to sign up and we both get rewarded!\n\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const completedCount = referrals.filter(r => r.status === 'completed').length;
  const nextMilestone = MILESTONES.find(m => completedCount < m.count);

  if (!user) {
    return (
      <div className="bg-[var(--bg)] min-h-screen pt-20 pb-12 sm:pt-24 sm:pb-20 px-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Gift size={48} className="text-[var(--accent)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Refer & Earn Rewards</h2>
          <p className="text-[var(--text-2)] text-sm mb-6">Login to get your personal referral link and start earning chocolate rewards.</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-white font-bold px-6 py-3 rounded-full text-sm transition-colors">
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-20 pb-12 sm:pt-24 sm:pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-2">Refer & Earn</p>
          <h1 className="text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>Share the Sweetness</h1>
          <p className="text-[var(--text-2)] text-sm mt-3 max-w-lg mx-auto">Invite friends to Chocolush. When they shop, you both get rewarded with delicious discounts.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-40 bg-white rounded-2xl animate-pulse border border-[var(--border)]" />
            <div className="h-32 bg-white rounded-2xl animate-pulse border border-[var(--border)]" />
          </div>
        ) : (
          <>
            {/* Referral Code Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative bg-gradient-to-br from-[#2D1A12] to-[#4a3324] rounded-3xl p-8 mb-6 overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[var(--accent)]/10"/>
              <div className="absolute -right-2 top-12 w-20 h-20 rounded-full bg-[var(--accent)]/10"/>
              <Sparkles className="absolute top-6 right-6 text-[var(--accent)]/40" size={28}/>
              <p className="text-[var(--accent)] text-xs tracking-[0.3em] uppercase mb-2 relative z-10">Your Referral Code</p>
              <p className="text-4xl font-bold text-white tracking-widest mb-6 relative z-10" style={{ fontFamily: 'Georgia, serif' }}>
                {profile?.referral_code}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                <div className="flex-1 bg-white/10 backdrop-blur border border-white/10 rounded-xl px-4 py-3 text-white/80 text-xs truncate">
                  {referralLink}
                </div>
                <div className="flex gap-2">
                  <button onClick={copyLink} className="flex items-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] text-[var(--text)] font-bold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
                    {copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Copied' : 'Copy Link'}
                  </button>
                  <button onClick={shareWhatsApp} className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20B85A] text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
                    <MessageCircle size={16}/> Share
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white border border-[var(--border)] rounded-2xl p-6 text-center">
                <Users size={24} className="text-[var(--accent)] mx-auto mb-2"/>
                <p className="text-3xl font-bold text-[var(--text)]">{referrals.length}</p>
                <p className="text-[var(--text-2)] text-xs uppercase tracking-wider mt-1">Total Referrals</p>
              </div>
              <div className="bg-white border border-[var(--border)] rounded-2xl p-6 text-center">
                <Award size={24} className="text-[var(--accent)] mx-auto mb-2"/>
                <p className="text-3xl font-bold text-[var(--text)]">{completedCount}</p>
                <p className="text-[var(--text-2)] text-xs uppercase tracking-wider mt-1">Completed Purchases</p>
              </div>
            </div>

            {/* Progress to Next Milestone */}
            {nextMilestone && (
              <div className="bg-white border border-[var(--border)] rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[var(--text)] font-semibold text-sm">Next Reward: {nextMilestone.icon} {nextMilestone.reward}</p>
                  <p className="text-[var(--accent)] text-sm font-bold">{completedCount} / {nextMilestone.count}</p>
                </div>
                <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (completedCount / nextMilestone.count) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--text-2)] rounded-full"/>
                </div>
                <p className="text-[var(--text-2)] text-xs mt-2">Refer {nextMilestone.count - completedCount} more friend{nextMilestone.count - completedCount !== 1 ? 's' : ''} to unlock this reward.</p>
              </div>
            )}

            {/* Milestones */}
            <div className="mb-6">
              <p className="text-[var(--text-2)] text-xs uppercase tracking-wider mb-3 text-center">Reward Milestones</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {MILESTONES.map(m => (
                  <div key={m.count} className={`bg-white border rounded-2xl p-5 text-center transition-all ${completedCount >= m.count ? 'border-[var(--accent)] shadow-[0_0_0_1px_#C5A880]' : 'border-[var(--border)]'}`}>
                    <p className="text-3xl mb-2">{m.icon}</p>
                    <p className="text-[var(--text)] font-bold text-sm mb-1">Refer {m.count} friends</p>
                    <p className="text-[var(--accent)] text-xs font-semibold">{m.reward}</p>
                    {completedCount >= m.count && <p className="text-green-600 text-xs mt-2 font-semibold">✓ Unlocked</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Referral History */}
            <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[var(--border)]">
                <h3 className="text-[var(--text)] font-bold">Referral History</h3>
              </div>
              {referrals.length === 0 ? (
                <div className="text-center py-10 text-[#8A6F56] text-sm">
                  No referrals yet. Share your link to start earning rewards! 🍫
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {referrals.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-[var(--text)] text-sm font-medium">{r.referred_name || 'New Friend'}</p>
                        <p className="text-[#8A6F56] text-xs">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full capitalize ${r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-[var(--border)] text-[var(--text-2)]'}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReferralPage;
