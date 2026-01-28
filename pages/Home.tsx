
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Icon } from '../components/Icons';
import { Promo } from '../types';
import { DailySpin } from '../components/DailySpin';
import { useAuth } from '../contexts/AuthContext';

// Fallback Logo (Inline SVG Data URI)
const DEFAULT_LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRjU5RTBCO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNEOTc3MDY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzE3MTcxNyIvPgogIDxjaXJjbGUgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMjEwIiBzdHJva2U9InVybCgjZ3JhZDEpIiBzdHJva2Utd2lkdGg9IjE2IiBmaWxsPSJub25lIiAvPgogIDxjaXJjbGUgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMTgwIiBzdHJva2U9IiMyNjI2MjYiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIgLz4KICA8dGV4dCB4PSIyNTYiIHk9IjI5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0idXJsKCNncmFkMSkiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLCBzZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iMjQwIiBmb250LXN0eWxlPSJpdGFsaWMiPkRMPC90ZXh0PgogIDx0ZXh0IHg9IjI1NiIgeT0iNDIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMCIgbGV0dGVyLXNwYWNpbmc9IjYiIGZvbnQtd2VpZ2h0PSJib2xkIj5FU1QuIDIwMjU8L3RleHQ+Cjwvc3ZnPg==`;

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [activePromo, setActivePromo] = useState<Promo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_BASE64);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Promo
      const { data: promoData } = await supabase
        .from('promos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (promoData) setActivePromo(promoData);

      // Fetch Logo from DB
      const { data: logoData } = await supabase.from('app_settings').select('value').eq('key', 'logo_url').single();
      if (logoData && logoData.value) {
        setLogoUrl(logoData.value);
      }
    };
    fetchData();
  }, []);

  const handleSpinClick = () => {
    if (!user) {
        // Redirect logic or show auth modal could go here, for now relying on Layout nav
        window.location.hash = '#/auth';
        return;
    }
    setShowSpinner(true);
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center justify-center mt-8 text-center space-y-4">
        <div className="w-40 h-40 rounded-full border-4 border-white flex items-center justify-center bg-brand-surface shadow-2xl relative overflow-hidden group">
             <img 
               src={logoUrl} 
               alt="Don Louis" 
               className="w-full h-full object-cover" 
               onError={(e) => {
                 const target = e.target as HTMLImageElement;
                 if (target.src !== DEFAULT_LOGO_BASE64) {
                    setLogoUrl(DEFAULT_LOGO_BASE64);
                 } else {
                    target.style.display = 'none';
                 }
               }} 
             />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Don Louis</h1>
          <p className="text-brand-gold italic">Where Food is an Art</p>
        </div>
      </div>

      {/* Business Status */}
      <div className="flex justify-center items-center space-x-2 text-sm">
        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
        <span className="text-green-400 font-medium">Open Now • Closes 11 PM</span>
      </div>

      {/* Daily Spin Banner */}
      <div 
        onClick={handleSpinClick}
        className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-4 shadow-lg border border-purple-500/30 relative overflow-hidden group cursor-pointer active:scale-95 transition-transform"
      >
         <div className="relative z-10 flex items-center justify-between">
            <div>
                <h3 className="font-bold text-lg text-white">Daily Luck</h3>
                <p className="text-xs text-purple-200">Spin to win up to <span className="text-brand-gold font-bold">50% OFF!</span></p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center animate-spin-slow">
                <Icon name="star" className="text-yellow-400 w-6 h-6" />
            </div>
         </div>
         {/* Decorative Sparkles */}
         <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full"></div>
      </div>

      {/* Promo Banner */}
      {activePromo ? (
        <div className="bg-gradient-to-r from-brand-gold to-yellow-600 rounded-xl p-4 shadow-lg text-neutral-900 relative overflow-hidden animate-fade-in">
          <div className="relative z-10">
            <h3 className="font-bold text-xl">{activePromo.title}</h3>
            <p className="font-medium text-sm opacity-90">{activePromo.description}</p>
          </div>
          <Icon name="star" className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
        </div>
      ) : (
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700 text-center">
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest">Welcome to Don Louis</h3>
            <p className="text-brand-gold text-xs mt-1">Authentic Lebanese Snacks & Grill</p>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid gap-4">
        <Link to="/menu" className="bg-brand-gold hover:bg-yellow-500 text-neutral-900 font-bold py-4 px-6 rounded-xl flex items-center justify-between shadow-lg transform transition active:scale-95">
          <span className="text-lg">Order Now</span>
          <Icon name="chevronRight" className="w-6 h-6" />
        </Link>
        
        <div className="grid grid-cols-2 gap-4">
          <Link to="/rewards" className="bg-brand-surface hover:bg-neutral-800 text-white font-medium py-4 px-6 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg border border-neutral-800">
            <Icon name="gift" className="w-8 h-8 text-brand-gold" />
            <span>Rewards</span>
          </Link>
          <Link to="/track" className="bg-brand-surface hover:bg-neutral-800 text-white font-medium py-4 px-6 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg border border-neutral-800">
            <Icon name="clock" className="w-8 h-8 text-blue-400" />
            <span>Track Order</span>
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-gray-500 text-sm pt-8 pb-4">
        <p>Adonis, main road</p>
        <p>Facing Homsi for music</p>
        <p className="mt-1">+961 81 922 779</p>
        <p className="mt-4 text-[10px] opacity-50">App Version 2.2</p>
        
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <Link to="/admin" className="text-[10px] text-neutral-700 hover:text-neutral-500 uppercase tracking-widest font-bold">
            Staff Access
          </Link>
        </div>
      </div>

      {/* Spin Modal */}
      {showSpinner && <DailySpin onClose={() => setShowSpinner(false)} />}
    </div>
  );
};
