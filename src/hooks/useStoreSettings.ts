import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const SETTING_DEFAULTS: Record<string, string> = {
  store_name: 'Chocolush',
  tagline: 'Premium Chocolate Boutique',
  whatsapp_number: '919400667313',
  instagram_handle: '@_chocolush._',
  instagram_url: 'https://www.instagram.com/_chocolush._?igsh=NWM0NnJ3amhpYWFn',
  contact_email: 'chocolush10@gmail.com',
  contact_address: 'Kerala, India',
  footer_tagline: 'Where every bite is pure luxury.',
  announcement_bar: '',
  primary_color: '#C5A880',
  hero_title: 'Pure Indulgence',
  hero_subtitle: 'Handcrafted luxury chocolates from Kerala. Every bite tells a story.',
  hero_image_1: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600',
  hero_image_2: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1600',
  hero_image_3: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=1600',
  about_title: 'About Chocolush',
  about_text: 'Chocolush was born from a love of premium chocolate in Kerala.',
  about_image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=1200',
  brownie_title: 'Customized Brownies',
  brownie_subtitle: 'For Every Occasion',
  brownie_text: 'Weddings, birthdays, corporate events — bespoke chocolate experiences tailored just for you.',
  brownie_image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=1600',
  banner_title: '',
  banner_text: '',
  banner_image: '',
  banner_link: '',
  free_delivery_above: '500',
  store_policy: 'All sales are final.',
  meta_title: 'Chocolush — Premium Artisan Chocolates Kerala',
  meta_description: 'Handcrafted luxury chocolates, Kunafa chocolate, customized brownies from Kerala.',
};

const parse = (raw: any): string => {
  if (!raw && raw !== 0) return '';
  if (typeof raw === 'string') return raw.replace(/^"|"$/g, '');
  return String(raw);
};

let _cache: Record<string, string> | null = null;
let _listeners: Array<() => void> = [];
let _fetching = false;

const notify = () => _listeners.forEach(fn => fn());

const fetchSettings = async () => {
  if (_fetching) return;
  _fetching = true;
  try {
    const { data } = await supabase.from('store_settings').select('key, value');
    if (data?.length) {
      const m: Record<string, string> = { ...SETTING_DEFAULTS };
      data.forEach((r: any) => { m[r.key] = parse(r.value); });
      _cache = m;
      notify();
    }
  } catch {}
  _fetching = false;
};

fetchSettings();
supabase.channel('settings-hook').on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, fetchSettings).subscribe();

export const useStoreSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>(_cache || SETTING_DEFAULTS);

  useEffect(() => {
    const update = () => setSettings({ ...(_cache || SETTING_DEFAULTS) });
    _listeners.push(update);
    if (_cache) update();
    return () => { _listeners = _listeners.filter(f => f !== update); };
  }, []);

  const get = (key: string) => settings[key] ?? SETTING_DEFAULTS[key] ?? '';
  const wa = get('whatsapp_number').replace(/\D/g, '');
  const waLink = (msg: string) => `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;

  return { settings, get, wa, waLink };
};
