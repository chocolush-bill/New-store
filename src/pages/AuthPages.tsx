import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    else { toast.success('Welcome back! 🍫'); navigate('/'); }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) toast.error(error.message);
    else toast.success('Reset link sent to your email!');
    setLoading(false);
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message);
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md w-full px-2 sm:px-0"
      >
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>CHOCOLUSH</Link>
          <p className="text-[var(--text-2)] text-sm mt-2">{forgotMode ? 'Reset your password' : 'Welcome back'}</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8">
          {forgotMode ? (
            <form onSubmit={handleForgot} className="space-y-5">
              <div>
                <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-2">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] pl-11 pr-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:opacity-50 text-[#FFFFFF] font-bold py-3.5 rounded-xl transition-colors text-sm tracking-wider">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setForgotMode(false)} className="w-full text-[var(--text-2)] text-sm hover:text-[var(--text-2)] transition-colors">
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-2">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] pl-11 pr-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-2">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] pl-11 pr-12 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-2)] hover:text-[var(--text-2)]">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setForgotMode(true)} className="text-[var(--accent)] text-xs hover:text-[var(--text-2)] transition-colors">Forgot password?</button>
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:opacity-50 text-[#FFFFFF] font-bold py-3.5 rounded-xl transition-colors text-sm tracking-wider">
                {loading ? 'Signing in...' : 'Sign In'} {!loading && <ArrowRight size={16} />}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
                <div className="relative text-center"><span className="bg-[var(--surface)] px-4 text-[var(--text-2)] text-xs">or</span></div>
              </div>

              <button type="button" onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 border border-[var(--border-2)] hover:border-[var(--accent)]/30 text-[var(--text-2)] py-3 rounded-xl transition-colors text-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>

              <p className="text-center text-[var(--text-2)] text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-[var(--accent)] hover:text-[var(--text-2)]">Create one</Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const RegisterPage = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { data, error } = await signUp(form.email, form.password, form.name);
    if (error) { toast.error(error.message); setLoading(false); return; }

    // Capture referral if present in URL (#/register?ref=CODE)
    try {
      const hash = window.location.hash; // e.g. #/register?ref=ABCD1234
      const queryStart = hash.indexOf('?');
      if (queryStart !== -1 && data?.user) {
        const params = new URLSearchParams(hash.slice(queryStart + 1));
        const refCode = params.get('ref');
        if (refCode) {
          const { data: referrer } = await supabase.from('profiles')
            .select('id, full_name').eq('referral_code', refCode).single();
          if (referrer && referrer.id !== data.user.id) {
            await supabase.from('referrals').insert({
              referrer_id: referrer.id,
              referred_id: data.user.id,
              referral_code: refCode,
              referrer_name: referrer.full_name,
              referred_name: form.name,
              status: 'pending',
            });
          }
        }
      }
    } catch (refErr) {
      console.warn('Referral capture skipped:', refErr);
    }

    toast.success('Account created! Welcome to Chocolush 🍫');
    navigate('/');
    setLoading(false);
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message);
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md w-full px-2 sm:px-0">
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>CHOCOLUSH</Link>
          <p className="text-[var(--text-2)] text-sm mt-2">Create your account</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            {[
              { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Your Name', icon: <User size={16} /> },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com', icon: <Mail size={16} /> },
            ].map(field => (
              <div key={field.name}>
                <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-2">{field.label}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-2)]">{field.icon}</span>
                  <input type={field.type} name={field.name} value={form[field.name as keyof typeof form]} onChange={handleChange} placeholder={field.placeholder} className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] pl-11 pr-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
                </div>
              </div>
            ))}
            <div>
              <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] pl-11 pr-12 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-2)]">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div>
              <label className="text-[var(--text-2)] text-xs tracking-widest uppercase block mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
                <input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Repeat password" className="w-full bg-[var(--surface)] border-2 border-[var(--border-2)] text-[var(--text)] pl-11 pr-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[var(--accent-2)] hover:bg-[var(--accent-2-hover)] disabled:opacity-50 text-[#FFFFFF] font-bold py-3.5 rounded-xl transition-colors text-sm tracking-wider">
              {loading ? 'Creating...' : 'Create Account'} {!loading && <ArrowRight size={16} />}
            </button>
            <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div><div className="relative text-center"><span className="bg-[var(--surface)] px-4 text-[var(--text-2)] text-xs">or</span></div></div>
            <button type="button" onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 border border-[var(--border-2)] hover:border-[var(--accent)]/30 text-[var(--text-2)] py-3 rounded-xl transition-colors text-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <p className="text-center text-[var(--text-2)] text-sm">Already have an account? <Link to="/login" className="text-[var(--accent)] hover:text-[var(--text-2)]">Sign in</Link></p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
