
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Icon } from '../components/Icons';
import { Order, OrderItem } from '../types';
import { InstallPrompt } from '../components/InstallPrompt';

export const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<(Order & { items: OrderItem[] })[]>([]);
  const [activeTab, setActiveTab] = useState<'card' | 'history'>('card');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', pin: '' });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (!user) {
        navigate('/auth');
        return;
    }
    setEditForm({ name: user.full_name || '', pin: '' }); // Don't prefill PIN for security

    // Fetch History with Items
    const fetchHistory = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('profile_phone', user.phone)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (data) setHistory(data as any);
    };
    fetchHistory();
  }, [user, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaveLoading(true);
      
      const updates: any = { full_name: editForm.name };
      if (editForm.pin && editForm.pin.length === 4) {
          updates.pin_code = editForm.pin;
      }
      
      const res = await updateProfile(updates);
      setSaveLoading(false);
      
      if (res.success) {
          setIsEditing(false);
          setEditForm(prev => ({ ...prev, pin: '' })); // Clear PIN field
      } else {
          alert("Failed to update profile: " + res.message);
      }
  };

  const shareReferral = () => {
      if (navigator.share) {
          navigator.share({
              title: 'Join Don Louis',
              text: `Use my code ${user?.phone} to join Don Louis Snack Bar!`,
              url: window.location.href
          }).catch(console.error);
      } else {
          navigator.clipboard.writeText(user?.phone || '');
          alert("Referral code copied to clipboard!");
      }
  };

  if (!user) return null;

  // Gamification Logic
  const getTier = (points: number) => {
      if (points >= 500) return { name: 'Platinum Elite', color: 'from-slate-300 via-white to-slate-300', text: 'text-slate-900', icon: '👑' };
      if (points >= 200) return { name: 'Gold Member', color: 'from-yellow-400 via-yellow-200 to-yellow-500', text: 'text-yellow-900', icon: '⭐' };
      return { name: 'Bronze Member', color: 'from-orange-700 via-orange-400 to-orange-800', text: 'text-white', icon: '🛡️' };
  };

  const tier = getTier(user.points);
  const nextTierGoal = user.points >= 500 ? 1000 : (user.points >= 200 ? 500 : 200);
  const progressPercent = Math.min(100, (user.points / nextTierGoal) * 100);

  const quotes = [
      "Taste is the only truth.",
      "You aren't just eating, you're dining.",
      "Reward your senses.",
      "Excellence in every bite."
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="min-h-screen bg-neutral-900 pb-24 text-gray-100">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur sticky top-0 z-20 pt-safe-top">
        <h1 className="text-xl font-bold text-white">My Profile</h1>
        <div className="flex gap-3">
            <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-brand-gold border border-brand-gold/30 px-3 py-1.5 rounded-full hover:bg-brand-gold/10">
                Edit
            </button>
            <button onClick={logout} className="text-xs font-bold text-red-500 border border-red-500/30 px-3 py-1.5 rounded-full hover:bg-red-900/20">
                Sign Out
            </button>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto space-y-8 animate-fade-in">
        
        {/* Toggle Tabs */}
        <div className="flex bg-neutral-800 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('card')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'card' ? 'bg-neutral-700 text-white shadow' : 'text-gray-500'}`}
            >
                Membership Card
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-neutral-700 text-white shadow' : 'text-gray-500'}`}
            >
                Order History
            </button>
        </div>

        {activeTab === 'card' ? (
            <div className="space-y-8">
                {/* Digital Card */}
                <div className="relative group perspective-1000">
                    <div className={`relative h-56 w-full rounded-2xl overflow-hidden transition-transform duration-500 transform shadow-2xl bg-gradient-to-br ${tier.color} p-6 flex flex-col justify-between border border-white/20`}>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>

                        {/* Card Header */}
                        <div className="flex justify-between items-start z-10">
                            <div>
                                <h3 className={`font-serif italic font-bold text-2xl ${tier.text} opacity-90`}>Don Louis</h3>
                                <p className={`text-[10px] uppercase tracking-widest ${tier.text} font-bold opacity-70`}>Club Membership</p>
                            </div>
                            <div className="text-2xl">{tier.icon}</div>
                        </div>

                        {/* Chip */}
                        <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-600 border border-yellow-400/50 shadow-inner opacity-80 z-10 flex items-center justify-center">
                            <div className="w-8 h-5 border border-black/10 rounded-sm flex justify-between px-1 items-center">
                                <div className="w-[1px] h-full bg-black/20"></div>
                                <div className="w-[1px] h-full bg-black/20"></div>
                                <div className="w-[1px] h-full bg-black/20"></div>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="z-10">
                            <div className={`font-mono text-lg font-bold tracking-widest ${tier.text} mb-2 shadow-black drop-shadow-sm`}>
                                •••• •••• {user.phone.slice(-4)}
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className={`text-[8px] uppercase ${tier.text} opacity-70`}>Member Name</p>
                                    <p className={`font-bold uppercase tracking-wide ${tier.text} text-sm`}>{user.full_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[8px] uppercase ${tier.text} opacity-70`}>Points Balance</p>
                                    <p className={`font-bold text-xl ${tier.text}`}>{user.points}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Stats */}
                <div className="bg-brand-surface rounded-2xl p-6 border border-neutral-800 shadow-lg">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-gray-300">{tier.name} Status</span>
                        <span className="text-xs text-brand-gold">{user.points} / {nextTierGoal} pts</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden border border-neutral-800">
                        <div 
                            className="h-full bg-gradient-to-r from-brand-gold to-yellow-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 italic text-center">"{randomQuote}"</p>
                </div>

                {/* Referral Card */}
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-6 border border-indigo-500/30 relative overflow-hidden shadow-lg">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-white text-lg">Refer & Earn 30%</h3>
                                <p className="text-xs text-indigo-200 mt-1 max-w-[200px]">Get a 30% discount for every friend who joins using your code!</p>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg">
                                <Icon name="gift" className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                        
                        <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center border border-white/5 mb-3">
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Your Code</p>
                                <p className="font-mono text-white font-bold tracking-wide">{user.phone}</p>
                            </div>
                            <button onClick={shareReferral} className="text-xs bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                                Share
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-indigo-300">
                             <span className="w-2 h-2 rounded-full bg-green-400"></span>
                             <span>{user.referral_count || 0} Friends Referred</span>
                        </div>
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
                </div>
                
                {/* PWA Install Prompt */}
                <InstallPrompt />

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => navigate('/rewards')} className="bg-neutral-800 hover:bg-neutral-700 p-4 rounded-xl flex flex-col items-center gap-2 border border-neutral-700 transition-colors">
                        <Icon name="gift" className="w-6 h-6 text-brand-gold" />
                        <span className="text-xs font-bold text-gray-300">Redeem Rewards</span>
                    </button>
                    <button onClick={() => navigate('/menu')} className="bg-neutral-800 hover:bg-neutral-700 p-4 rounded-xl flex flex-col items-center gap-2 border border-neutral-700 transition-colors">
                        <Icon name="menu" className="w-6 h-6 text-blue-400" />
                        <span className="text-xs font-bold text-gray-300">Order Now</span>
                    </button>
                </div>
            </div>
        ) : (
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-brand-gold mb-4">Order History</h2>
                {history.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-brand-surface rounded-xl border border-neutral-800">
                        <p>No orders yet.</p>
                        <button onClick={() => navigate('/menu')} className="text-brand-gold text-sm font-bold mt-2">Start your first order</button>
                    </div>
                ) : (
                    history.map(order => (
                        <div key={order.id} className="bg-brand-surface p-5 rounded-xl border border-neutral-800 flex flex-col gap-3 shadow-lg hover:border-neutral-700 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs text-gray-400 font-mono mb-1">
                                        {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="font-bold text-white text-lg">${order.total_amount.toFixed(2)}</div>
                                </div>
                                <div className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider ${order.status === 'completed' ? 'bg-green-900/20 text-green-400 border border-green-900/30' : 'bg-yellow-900/20 text-yellow-500 border border-yellow-900/30'}`}>
                                    {order.status.replace('_', ' ')}
                                </div>
                            </div>
                            
                            {/* Item Details Summary */}
                            <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/50">
                                <p className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wide">Items Ordered:</p>
                                <p className="text-sm text-gray-200 leading-relaxed">
                                    {order.items?.map(i => `${i.quantity}x ${i.menu_item_name}`).join(', ')}
                                </p>
                            </div>

                            <button 
                                onClick={() => navigate(`/track?orderId=${order.id}`)}
                                className="w-full mt-1 py-2 text-center text-xs font-bold text-brand-gold hover:text-white border border-brand-gold/20 rounded-lg hover:bg-brand-gold/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon name="chevronRight" className="w-3 h-3" /> View Full Details & Track
                            </button>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-neutral-900 border border-brand-gold w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Edit Profile</h3>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs text-gray-500 uppercase font-bold">Full Name</label>
                          <input 
                              type="text" 
                              value={editForm.name} 
                              onChange={e => setEditForm(prev => ({...prev, name: e.target.value}))}
                              className="w-full bg-neutral-800 text-white p-3 rounded-xl outline-none focus:ring-1 focus:ring-brand-gold"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs text-gray-500 uppercase font-bold">New Security PIN (Optional)</label>
                          <input 
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              placeholder="Leave empty to keep current"
                              value={editForm.pin}
                              onChange={e => setEditForm(prev => ({...prev, pin: e.target.value.replace(/[^0-9]/g, '')}))}
                              className="w-full bg-neutral-800 text-white p-3 rounded-xl outline-none focus:ring-1 focus:ring-brand-gold font-mono tracking-widest"
                          />
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-neutral-800 text-gray-400 rounded-xl font-bold">Cancel</button>
                          <button type="submit" disabled={saveLoading} className="flex-1 py-3 bg-brand-gold text-black rounded-xl font-bold">
                              {saveLoading ? 'Saving...' : 'Save'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};
