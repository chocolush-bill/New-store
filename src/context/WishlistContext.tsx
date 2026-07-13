import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';


interface WishlistContextType {
  wishlist: string[];
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({} as WishlistContextType);
export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    if (!user) { setWishlist([]); return; }
    supabase.from('wishlist').select('product_id').eq('user_id', user.id)
      .then(({ data }) => setWishlist(data?.map(w => w.product_id) || []));
  }, [user]);

  const toggle = async (productId: string) => {
    if (!user) return;
    if (wishlist.includes(productId)) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
      setWishlist(prev => prev.filter(id => id !== productId));
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
      setWishlist(prev => [...prev, productId]);
    }
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};
