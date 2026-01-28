
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icons';
import { supabase } from '../supabaseClient';

// Fallback Logo (Inline SVG Data URI) - Consistent with Home/Admin
const DEFAULT_LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRjU5RTBCO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNEOTc3MDY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzE3MTcxNyIvPgogIDxjaXJjbGUgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMjEwIiBzdHJva2U9InVybCgjZ3JhZDEpIiBzdHJva2Utd2lkdGg9IjE2IiBmaWxsPSJub25lIiAvPgogIDxjaXJjbGUgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMTgwIiBzdHJva2U9IiMyNjI2MjYiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIgLz4KICA8dGV4dCB4PSIyNTYiIHk9IjI5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0idXJsKCNncmFkMSkiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLCBzZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iMjQwIiBmb250LXN0eWxlPSJpdGFsaWMiPkRMPC90ZXh0PgogIDx0ZXh0IHg9IjI1NiIgeT0iNDIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMCIgbGV0dGVyLXNwYWNpbmc9IjYiIGZvbnQtd2VpZ2h0PSJib2xkIj5FU1QuIDIwMjU8L3RleHQ+Cjwvc3ZnPg==`;

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ phone: '', name: '', pin: '', referralCode: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_BASE64);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/profile';

  // Fetch Dynamic Logo
  useEffect(() => {
    const fetchLogo = async () => {
      // 1. Try to get specific Auth Page Logo
      const { data: authData } = await supabase.from('app_settings').select('value').eq('key', 'auth_logo_url').maybeSingle();
      if (authData && authData.value) {
        setLogoUrl(authData.value);
        return;
      }

      // 2. Fallback to Main Logo
      const { data: logoData } = await supabase.from('app_settings').select('value').eq('key', 'logo_url').maybeSingle();
      if (logoData && logoData.value) {
        setLogoUrl(logoData.value);
      }
    };
    fetchLogo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic Validation
    if (!formData.phone || (formData.phone.length < 8)) {
        setError("Please enter a valid phone number.");
        setIsLoading(false);
        return;
    }

    if (!formData.pin || formData.pin.length !== 4) {
        setError("Please enter a 4-digit Security PIN.");
        setIsLoading(false);
        return;
    }

    try {
      let result;
      if (isLogin) {
        result = await login(formData.phone, formData.pin);
      } else {
        if (!formData.name) {
            setError("Full Name is required for membership.");
            setIsLoading(false);
            return;
        }
        result = await signup(formData.phone, formData.name, formData.pin, formData.referralCode);
      }

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message || "Authentication failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-yellow-600/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="w-full max-w-sm z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm p-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex items-center justify-center overflow-hidden">
                 <img 
                    src={logoUrl} 
                    className="w-full h-full object-cover rounded-full" 
                    alt="DL" 
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== DEFAULT_LOGO_BASE64) {
                           setLogoUrl(DEFAULT_LOGO_BASE64);
                        }
                    }}
                 />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white tracking-wide">
                {isLogin ? "Welcome Back" : "Join the Elite"}
            </h1>
            <p className="text-brand-gold/80 text-sm mt-2 font-medium tracking-widest uppercase">
                {isLogin ? "Access your premium profile" : "Start your culinary journey"}
            </p>
        </div>

        {/* Card */}
        <div className="bg-brand-surface/50 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {!isLogin && (
                    <div className="space-y-1 animate-fade-in">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                        <div className="relative">
                            <Icon name="user" className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                            <input 
                                type="text" 
                                placeholder="Don Louis"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-neutral-900/80 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:border-brand-gold outline-none transition-all focus:shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative">
                        <Icon name="check" className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                        <input 
                            type="tel" 
                            placeholder="03 123 456"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-neutral-900/80 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:border-brand-gold outline-none transition-all focus:shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {isLogin ? "Enter Security PIN" : "Create Security PIN"}
                        </label>
                        {isLogin && (
                            <button type="button" onClick={() => setShowRecovery(true)} className="text-[10px] text-brand-gold hover:underline opacity-80">
                                Forgot PIN?
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Icon name="star" className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                        <input 
                            type="password" 
                            placeholder="••••"
                            maxLength={4}
                            inputMode="numeric"
                            value={formData.pin}
                            onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setFormData({...formData, pin: val});
                            }}
                            className="w-full bg-neutral-900/80 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:border-brand-gold outline-none transition-all focus:shadow-[0_0_15px_rgba(245,158,11,0.1)] tracking-[0.5em] font-mono"
                        />
                    </div>
                    {!isLogin && <p className="text-[10px] text-gray-500 ml-1">Remember this 4-digit code to log in next time.</p>}
                </div>

                {!isLogin && (
                    <div className="space-y-1 animate-fade-in border-t border-white/5 pt-4">
                        <label className="text-xs font-bold text-brand-gold uppercase tracking-wider ml-1">Referral Code (Optional)</label>
                        <div className="relative">
                            <Icon name="gift" className="absolute left-4 top-3.5 w-5 h-5 text-brand-gold/70" />
                            <input 
                                type="text" 
                                placeholder="Friend's Phone #"
                                value={formData.referralCode}
                                onChange={e => setFormData({...formData, referralCode: e.target.value})}
                                className="w-full bg-neutral-900/80 border border-brand-gold/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:border-brand-gold outline-none transition-all"
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/20 border border-red-500/30 text-red-200 text-xs p-3 rounded-lg text-center animate-pulse">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-yellow-600 to-brand-gold hover:from-yellow-500 hover:to-yellow-400 text-neutral-900 font-bold py-4 rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 mt-4"
                >
                    {isLoading ? "Processing..." : (isLogin ? "Secure Login" : "Create Membership")}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                    {isLogin ? "Not a member yet?" : "Already have a profile?"}
                </p>
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(null); setFormData(prev => ({...prev, pin: '', referralCode: ''})); }}
                    className="text-white font-bold text-sm mt-2 hover:text-brand-gold transition-colors underline decoration-brand-gold/30 underline-offset-4"
                >
                    {isLogin ? "Apply for Membership" : "Sign In Here"}
                </button>
            </div>
        </div>

        {/* Footer Motivation */}
        <div className="mt-12 text-center opacity-40">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white">Where Food Is An Art</p>
        </div>

        {/* Staff Access */}
        <div className="mt-6 text-center">
            <button 
                onClick={() => navigate('/admin')}
                className="text-[9px] text-neutral-600 hover:text-neutral-400 uppercase tracking-widest font-bold transition-colors"
            >
                Staff Access
            </button>
        </div>
      </div>

      {/* RECOVERY MODAL */}
      {showRecovery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
              <div className="bg-neutral-900 border border-brand-gold/30 p-6 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.1)] relative">
                   <button onClick={() => setShowRecovery(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                      <Icon name="close" className="w-5 h-5" />
                   </button>
                   
                   <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
                      <Icon name="user" className="w-8 h-8 text-brand-gold" />
                   </div>
                   
                   <h3 className="text-xl font-bold text-white mb-2">Recover Account</h3>
                   <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                      To keep your account secure without SMS fees, PIN resets are handled manually. Please contact our support team.
                   </p>
                   
                   <div className="space-y-3">
                       <a href="tel:+96181922779" className="block w-full bg-brand-gold text-neutral-900 font-bold py-3 rounded-xl shadow-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
                          <Icon name="check" className="w-4 h-4" /> Call Support
                       </a>
                       <a href="https://wa.me/96181922779?text=Hello%20Don%20Louis%2C%20I%20forgot%20my%20PIN%20code%20for%20the%20app." target="_blank" rel="noreferrer" className="block w-full bg-neutral-800 text-white font-bold py-3 rounded-xl border border-neutral-700 hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2">
                          <Icon name="chart" className="w-4 h-4 text-green-500" /> WhatsApp Us
                       </a>
                   </div>
              </div>
          </div>
      )}

    </div>
  );
};
