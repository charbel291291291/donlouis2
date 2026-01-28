
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Icon } from '../components/Icons';
import { Reward, SpinReward } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Rewards: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [rewardsList, setRewardsList] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      const { data } = await supabase.from('rewards').select('*').order('points_cost', { ascending: true });
      if (data) setRewardsList(data);
    };
    fetchRewards();
  }, []);

  const handleClaim = async (reward: Reward) => {
    if (!user) return;
    if (user.points < reward.points_cost) {
        alert("Not enough points!");
        return;
    }

    if (!window.confirm(`Spend ${reward.points_cost} points for "${reward.title}"? \n\nThis will replace any active Daily Spin reward.`)) {
        return;
    }

    setLoading(true);
    try {
        // 1. Construct the Reward Object
        // Simple heuristic mapping based on title
        let rewardData: SpinReward;
        
        if (reward.title.includes('%')) {
            const val = parseInt(reward.title.replace(/\D/g, '')) || 10;
            rewardData = { type: 'discount_percent', value: val, label: reward.title };
        } else if (reward.title.toLowerCase().includes('delivery')) {
            rewardData = { type: 'free_delivery', value: 0, label: reward.title };
        } else {
            // Assume "Free [Item Name]" or just "[Item Name]"
            // We strip "Free " from the start if present to get target item name
            const cleanName = reward.title.replace(/^Free\s+/i, '');
            rewardData = { 
                type: 'free_item', 
                value: 0, 
                label: reward.title,
                target_item_name: cleanName
            };
        }

        // 2. Deduct Points & Set Active Reward
        const { error } = await supabase.from('profiles').update({
            points: user.points - reward.points_cost,
            active_reward: rewardData
        }).eq('id', user.id);

        if (error) throw error;

        await refreshProfile();
        setSuccessMsg(`Redeemed: ${reward.title}`);
        
        // Scroll top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear success msg after 3s
        setTimeout(() => setSuccessMsg(null), 3000);

    } catch (err: any) {
        alert("Redemption failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen pb-24 relative">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="bg-neutral-800 p-2 rounded-full">
            <Icon name="chevronRight" className="w-5 h-5 rotate-180 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-brand-gold">Rewards Catalog</h1>
      </div>
      
      {/* Success Banner */}
      {successMsg && (
          <div className="bg-green-600 text-white p-4 rounded-xl mb-6 shadow-lg animate-fade-in flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full"><Icon name="check" className="w-5 h-5" /></div>
              <div>
                  <p className="font-bold">Success!</p>
                  <p className="text-xs opacity-90">{successMsg}</p>
              </div>
          </div>
      )}

      {!user && (
          <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700 mb-8 text-center">
              <p className="text-gray-300 text-sm mb-3">Login to see your points and redeem rewards.</p>
              <button onClick={() => navigate('/auth')} className="bg-brand-gold text-black px-6 py-2 rounded-lg font-bold text-sm">
                  Login / Join
              </button>
          </div>
      )}

      {user && (
          <div className="bg-gradient-to-r from-brand-gold to-yellow-600 p-6 rounded-2xl text-neutral-900 shadow-xl mb-8 flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-1">{user.points}</h2>
                <p className="font-medium opacity-80 uppercase tracking-wider text-xs">Your Balance</p>
                {user.active_reward && (
                    <div className="mt-3 inline-flex items-center gap-1 bg-black/20 px-2 py-1 rounded text-[10px] font-bold text-white">
                        <Icon name="star" className="w-3 h-3" />
                        Active: {user.active_reward.label}
                    </div>
                )}
            </div>
            <Icon name="gift" className="w-24 h-24 opacity-10 absolute right-[-10px] bottom-[-10px]" />
          </div>
      )}
      
      <div className="space-y-3">
        {rewardsList.map(r => {
            const canRedeem = user ? user.points >= r.points_cost : false;
            return (
            <div key={r.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${canRedeem ? 'bg-neutral-800 border-brand-gold shadow-lg shadow-brand-gold/10' : 'bg-neutral-800/50 border-neutral-800 opacity-60'}`}>
                <div className="text-left">
                <div className="font-bold text-gray-200">{r.title}</div>
                <div className="text-xs text-brand-gold font-mono mt-1">{r.points_cost} pts</div>
                </div>
                {canRedeem ? (
                <button 
                    onClick={() => handleClaim(r)}
                    disabled={loading}
                    className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-200 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {loading ? '...' : 'Claim'}
                </button>
                ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
                    <Icon name="star" className="w-4 h-4 text-gray-600" />
                </div>
                )}
            </div>
            )
        })}
        {rewardsList.length === 0 && <p className="text-sm text-gray-500 text-center">No active rewards available.</p>}
      </div>
    </div>
  );
};
