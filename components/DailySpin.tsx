
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { SpinReward } from '../types';
import { Icon } from './Icons';

interface DailySpinProps {
  onClose: () => void;
}

// Configuration for the 5 segments
const PRIZES = [
  { 
    id: '5off',
    label: '5% OFF', 
    reward: { type: 'discount_percent', value: 5, label: '5% Discount' } as SpinReward, 
    color: '#171717', // Dark
    textColor: '#F59E0B', // Gold text
    probability: 0.35 
  },
  { 
    id: '15off',
    label: '15% OFF', 
    reward: { type: 'discount_percent', value: 15, label: '15% Discount' } as SpinReward, 
    color: '#F59E0B', // Gold
    textColor: '#171717', // Dark text
    probability: 0.20 
  },
  { 
    id: 'tryagain',
    label: 'Try Again', 
    reward: { type: 'no_luck', value: 0, label: 'No Luck' } as SpinReward, 
    color: '#404040', // Grey
    textColor: '#A3A3A3', 
    probability: 0.35 
  },
  { 
    id: '25off',
    label: '25% OFF', 
    reward: { type: 'discount_percent', value: 25, label: '25% Discount' } as SpinReward, 
    color: '#171717', // Darker
    textColor: '#F59E0B',
    probability: 0.08 
  },
  { 
    id: '50off',
    label: '50% OFF', 
    reward: { type: 'discount_percent', value: 50, label: '50% Discount' } as SpinReward, 
    color: '#D97706', // Rich Bronze
    textColor: '#FFFFFF',
    probability: 0.02 
  },
];

export const DailySpin: React.FC<DailySpinProps> = ({ onClose }) => {
  const { user, refreshProfile } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<SpinReward | null>(null);
  const [canSpin, setCanSpin] = useState(false);
  const [message, setMessage] = useState<string>('Spin for luxury rewards!');

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const lastSpin = user.last_spin_date;
      
      // Reset logic: If last spin was not today, they can spin.
      if (lastSpin !== today) {
        setCanSpin(true);
      } else {
        setCanSpin(false);
        setMessage("You've already spun today. Return tomorrow.");
        if (user.active_reward && user.active_reward.type !== 'no_luck') {
            setWonPrize(user.active_reward);
        }
      }
    }
  }, [user]);

  const handleSpin = async () => {
    if (!canSpin || isSpinning || !user) return;

    setIsSpinning(true);
    setMessage("Good luck...");

    // 1. Determine Result based on probabilities
    const rand = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;

    for (let i = 0; i < PRIZES.length; i++) {
        cumulative += PRIZES[i].probability;
        if (rand < cumulative) {
            selectedIndex = i;
            break;
        }
    }

    // 2. Calculate Rotation
    const segmentCount = PRIZES.length;
    const segmentAngle = 360 / segmentCount; 
    
    const spins = 8; 
    const segmentCenter = (selectedIndex * segmentAngle) + (segmentAngle / 2);
    const baseTarget = 360 * spins - segmentCenter;
    
    // Jitter: +/- 20% of segment width
    const jitter = (Math.random() - 0.5) * (segmentAngle * 0.4); 
    
    const targetRotation = baseTarget + jitter;

    setRotation(targetRotation);

    // 3. Wait for animation
    setTimeout(async () => {
        const prize = PRIZES[selectedIndex];
        setWonPrize(prize.reward);
        setIsSpinning(false);
        setCanSpin(false);
        
        if (prize.reward.type === 'no_luck') {
            setMessage("Not this time. Try again tomorrow!");
        } else {
            setMessage(`Congratulations! You won ${prize.label}`);
        }

        // 4. Save to DB
        const today = new Date().toISOString().split('T')[0];
        try {
            await supabase.from('profiles').update({
                last_spin_date: today,
                active_reward: prize.reward
            }).eq('id', user.id);
            await refreshProfile();
        } catch (e) {
            console.error("Failed to save spin", e);
        }

    }, 4000); 
  };

  if (!user) return null;

  const gradientString = PRIZES.map((p, i) => {
      const start = i * (360 / PRIZES.length);
      const end = (i + 1) * (360 / PRIZES.length);
      return `${p.color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-md bg-neutral-900 border border-brand-gold/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden flex flex-col items-center">
            
            {/* Close Button */}
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20 bg-white/5 rounded-full p-2"
            >
                <Icon name="close" className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-200">Daily Luck</h2>
                <p className={`text-sm font-medium transition-colors duration-500 ${isSpinning ? 'text-brand-gold animate-pulse' : 'text-gray-400'}`}>
                    {message}
                </p>
            </div>

            {/* Wheel Container */}
            <div className="relative w-72 h-72 mb-8">
                {/* Decorative Outer Ring */}
                <div className="absolute inset-[-12px] rounded-full border border-brand-gold/20 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-brand-gold/10 animate-pulse"></div>
                </div>

                {/* Pointer */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-lg">
                     <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-brand-gold"></div>
                </div>

                {/* The Rotating Wheel */}
                <div 
                    className="w-full h-full rounded-full border-[6px] border-neutral-800 shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
                    style={{ 
                        transform: `rotate(${rotation}deg)`,
                        background: `conic-gradient(${gradientString})`
                    }}
                >
                    {PRIZES.map((prize, index) => {
                        const rotationAngle = (360 / PRIZES.length) * index + (360 / PRIZES.length) / 2;
                        return (
                            <div 
                                key={prize.id}
                                className="absolute top-0 left-0 w-full h-full flex justify-center text-center"
                                style={{
                                    transform: `rotate(${rotationAngle}deg)`,
                                }}
                            >
                                <div className="pt-8 transform origin-top hover:scale-110 transition-transform" style={{ color: prize.textColor }}>
                                    <span className="block text-xl font-black font-serif leading-none tracking-tighter drop-shadow-md">
                                        {prize.label.split(' ')[0]}
                                    </span>
                                    <span className="block text-[9px] uppercase font-bold tracking-[0.2em] opacity-90 mt-1">
                                        {prize.label.split(' ').slice(1).join(' ')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Static Center Hub / Spin Button */}
                <button
                    onClick={handleSpin}
                    disabled={!canSpin || isSpinning}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-[3px] z-40 shadow-[0_0_25px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-300 group
                        ${canSpin 
                            ? 'bg-neutral-900 border-brand-gold cursor-pointer hover:scale-105 hover:shadow-[0_0_35px_rgba(245,158,11,0.4)]' 
                            : 'bg-neutral-800 border-neutral-600 cursor-default'}
                    `}
                >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300
                        ${canSpin ? 'bg-gradient-to-br from-brand-gold to-yellow-700' : 'bg-neutral-700'}
                    `}>
                        <span className={`font-black text-sm tracking-widest ${canSpin ? 'text-white' : 'text-neutral-500'}`}>
                            {isSpinning ? '...' : canSpin ? 'SPIN' : 'DL'}
                        </span>
                    </div>
                </button>
            </div>

            {/* Bottom Actions */}
            <button
                onClick={handleSpin}
                disabled={!canSpin || isSpinning}
                className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-[0.2em] transition-all shadow-xl
                    ${!canSpin 
                        ? 'bg-neutral-800 text-gray-600 cursor-not-allowed border border-neutral-800' 
                        : 'bg-gradient-to-r from-brand-gold to-yellow-600 text-neutral-900 hover:scale-105 hover:shadow-brand-gold/20'}
                `}
            >
                {isSpinning ? 'Good Luck...' : canSpin ? 'Spin The Wheel' : (wonPrize && wonPrize.type !== 'no_luck') ? 'Reward Unlocked' : 'Come Back Tomorrow'}
            </button>
            
            {wonPrize && wonPrize.type !== 'no_luck' && !canSpin && (
                <div className="mt-6 flex items-center gap-2 text-green-400 bg-green-900/10 px-4 py-2 rounded-lg border border-green-500/20 animate-bounce">
                    <Icon name="check" className="w-4 h-4" />
                    <p className="text-xs font-bold">
                        Applied to next order!
                    </p>
                </div>
            )}
        </div>
    </div>
  );
};
