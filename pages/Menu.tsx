import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Category, MenuItem } from '../types';
import { useCart } from '../contexts/CartContext';
import { Icon } from '../components/Icons';
import { INITIAL_DATA } from '../constants/menuData';

export const Menu: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { addToCart, items: cartItems, updateQuantity } = useCart();
  
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catResponse, itemResponse] = await Promise.all([
          supabase.from('categories').select('*').order('sort_order'),
          supabase.from('menu_items').select('*').eq('is_available', true)
        ]);

        // Check if database returned data, otherwise use fallback
        if (catResponse.data && catResponse.data.length > 0) {
          setCategories(catResponse.data);
          if (itemResponse.data) setItems(itemResponse.data);
          setSelectedCategory(catResponse.data[0].id);
        } else {
          console.log("Using local fallback data (Database empty or disconnected)");
          setCategories(INITIAL_DATA.categories);
          setItems(INITIAL_DATA.items);
          setSelectedCategory(INITIAL_DATA.categories[0].id);
        }
      } catch (error) {
        console.error('Error fetching menu, using fallback:', error);
        // Fallback on error
        setCategories(INITIAL_DATA.categories);
        setItems(INITIAL_DATA.items);
        setSelectedCategory(INITIAL_DATA.categories[0].id);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter items based on category and search term
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCartQuantity = (itemId: string) => {
    return cartItems.find(i => i.id === itemId)?.quantity || 0;
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setSearchTerm(''); // Clear search when switching categories
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 p-4 space-y-4">
        <div className="h-12 bg-neutral-800 rounded-lg animate-pulse mb-6"></div>
        <div className="flex space-x-4 overflow-hidden mb-6">
           {[1,2,3,4].map(i => <div key={i} className="h-8 w-24 bg-neutral-800 rounded-full animate-pulse flex-shrink-0"></div>)}
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-24 bg-neutral-800 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 pb-24">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 pt-4 pb-2 px-4 transition-all">
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search for cravings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-neutral-800 rounded-xl leading-5 bg-neutral-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold sm:text-sm transition-colors"
          />
        </div>

        {/* Categories */}
        <div 
          ref={categoryScrollRef}
          className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
        >
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`
                whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                ${selectedCategory === cat.id 
                  ? 'bg-brand-gold text-neutral-900 shadow-[0_0_15px_rgba(245,158,11,0.3)] transform scale-105' 
                  : 'bg-brand-surface text-gray-400 border border-neutral-800 hover:border-neutral-600 hover:text-gray-200'}
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="p-4 grid gap-4 max-w-lg mx-auto mt-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <Icon name="search" className="w-12 h-12 mb-4 opacity-20" />
            <p>No items found.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory(categories[0]?.id || 'all'); }} 
              className="mt-4 text-brand-gold font-bold text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            const qty = getCartQuantity(item.id);
            return (
              <div 
                key={item.id} 
                className={`
                  relative group bg-brand-surface rounded-2xl p-4 border transition-all duration-300 overflow-hidden
                  ${qty > 0 ? 'border-brand-gold/50 shadow-[0_4px_20px_-5px_rgba(245,158,11,0.15)]' : 'border-neutral-800 hover:border-neutral-700'}
                `}
              >
                <div className="flex gap-4">
                  {/* Image Section */}
                  {item.image_url && (
                    <div 
                        className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 cursor-zoom-in active:scale-95 transition-transform"
                        onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(item.image_url);
                        }}
                    >
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-100 leading-tight mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-end justify-between mt-3">
                      <span className="text-brand-gold font-bold font-mono text-lg">
                        ${item.price.toFixed(2)}
                      </span>

                      {/* Add / Quantity Control */}
                      <div onClick={(e) => e.stopPropagation()}>
                        {qty === 0 ? (
                          <button 
                            onClick={() => addToCart(item)}
                            className="w-10 h-10 rounded-lg bg-neutral-900 hover:bg-brand-gold hover:text-neutral-900 text-brand-gold border border-neutral-800 hover:border-brand-gold flex items-center justify-center transition-all duration-300 shadow-lg active:scale-90"
                            aria-label="Add to cart"
                          >
                            <Icon name="plus" className="w-5 h-5" />
                          </button>
                        ) : (
                          <div className="flex items-center bg-neutral-900 rounded-lg border border-brand-gold/30 overflow-hidden shadow-lg h-9">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            >
                              <Icon name="minus" className="w-3 h-3" />
                            </button>
                            
                            <div className="w-8 h-full flex items-center justify-center bg-neutral-800 text-white font-bold text-sm border-x border-neutral-800">
                              {qty}
                            </div>

                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-full flex items-center justify-center text-brand-gold hover:bg-neutral-800 transition-colors"
                            >
                              <Icon name="plus" className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
            onClick={() => setPreviewImage(null)}
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
          
          <img 
            src={previewImage} 
            alt="Full Size" 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl scale-100 animate-scale-in"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};