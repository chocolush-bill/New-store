import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Search, Grid3X3, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('cat') || '');
  const [sort, setSort] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    fetchProducts();
    const channel = supabase.channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [search, selectedCat, sort, priceRange, inStockOnly]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, categories(name)');
    if (search) query = query.ilike('name', `%${search}%`);
    if (selectedCat) query = query.eq('category_id', selectedCat);
    if (inStockOnly) query = query.gt('stock', 0);
    query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('rating', { ascending: false });
    else query = query.order('created_at', { ascending: false });
    const { data } = await query;
    setProducts(data?.length ? data : DEMO_PRODUCTS);
    setLoading(false);
  };

  const clearFilters = () => {
    setSearch(''); setSelectedCat(''); setPriceRange([0, 2000]); setInStockOnly(false); setSort('newest');
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[var(--accent)] text-xs tracking-[0.4em] uppercase mb-2">Explore</p>
          <h1 className="text-4xl font-bold text-[var(--text)]" style={{ fontFamily: 'Georgia, serif' }}>All Chocolates</h1>
          <p className="text-[var(--text-2)] mt-2">{products.length} products found</p>
        </div>

        {/* Search + Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chocolates..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] pl-11 pr-4 py-3 rounded-xl outline-none focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[var(--accent-2)]/15 placeholder-[var(--text-3)] text-sm"
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] px-4 py-3 rounded-xl outline-none text-sm"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] px-4 py-3 rounded-xl text-sm hover:border-[var(--accent)]/50 transition-colors"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {/* Filters Panel */}
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8"
          >
            <div className="flex flex-wrap gap-8">
              {/* Categories */}
              <div>
                <p className="text-[var(--accent)] text-xs tracking-widest uppercase mb-3">Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCat('')}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${!selectedCat ? 'bg-[var(--accent)] text-[#FFFFFF]' : 'bg-[var(--border)] text-[var(--text-2)] hover:bg-[var(--border-2)]'}`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCat(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${selectedCat === cat.id ? 'bg-[var(--accent)] text-[#FFFFFF]' : 'bg-[var(--border)] text-[var(--text-2)] hover:bg-[var(--border-2)]'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock */}
              <div>
                <p className="text-[var(--accent)] text-xs tracking-widest uppercase mb-3">Availability</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="accent-[var(--accent)]"
                  />
                  <span className="text-[var(--text-2)] text-sm">In Stock Only</span>
                </label>
              </div>

              <button onClick={clearFilters} className="flex items-center gap-1 text-[var(--text-2)] hover:text-red-400 text-xs transition-colors">
                <X size={14} /> Clear All
              </button>
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-[var(--surface)] rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🍫</p>
            <p className="text-[var(--text)] text-xl mb-2">No chocolates found</p>
            <p className="text-[var(--text-2)] text-sm">Try adjusting your filters</p>
            <button onClick={clearFilters} className="mt-6 text-[var(--accent)] text-sm underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DEMO_PRODUCTS = Array.from({ length: 12 }, (_, i) => ({
  id: `demo-${i}`,
  name: ['Kunafa Chocolate Box', 'Dark Truffle Collection', 'Rose Gold Pralines', 'Hazelnut Dream Bar', 'Sea Salt Caramel', 'Pistachio Bark', 'Belgian Milk Box', 'Saffron Ganache', 'Strawberry Burst', 'Mango Tango', 'Classic Dark', 'White Fantasy'][i],
  price: [450, 680, 520, 380, 290, 420, 550, 620, 350, 410, 330, 480][i],
  offer_price: i % 3 === 0 ? [380, null, null, 300, null, null, 450, null, null, 340, null, null][i] : undefined,
  image_url: `https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400`,
  stock: i === 3 ? 0 : 10,
  category: 'Chocolate',
  rating: 4.2 + Math.random() * 0.8,
  review_count: Math.floor(Math.random() * 80) + 5,
  is_featured: i < 8,
}));

export default ProductsPage;
