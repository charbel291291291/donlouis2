
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (phone: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  signup: (phone: string, fullName: string, pin: string, referralCode?: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (data: { full_name?: string; pin_code?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from local storage on mount
  useEffect(() => {
    const storedPhone = localStorage.getItem('don_louis_user_phone');
    if (storedPhone) {
      fetchProfile(storedPhone);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .single();

      if (data && !error) {
        setUser(data);
        localStorage.setItem('don_louis_user_phone', phone);
      } else {
        logout(); // Invalid stored phone
      }
    } catch (e) {
      console.error("Auth Load Error", e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, pin: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error || !data) {
        setLoading(false);
        return { success: false, message: 'Account not found. Please sign up.' };
      }

      // Verify PIN
      if (data.pin_code !== pin) {
          setLoading(false);
          return { success: false, message: 'Invalid PIN. Please try again.' };
      }

      setUser(data);
      localStorage.setItem('don_louis_user_phone', phone);
      setLoading(false);
      return { success: true };
    } catch (e) {
      setLoading(false);
      return { success: false, message: 'Network error.' };
    }
  };

  const signup = async (phone: string, fullName: string, pin: string, referralCode?: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      // Check if exists
      const { data: existing } = await supabase.from('profiles').select('id').eq('phone', phone).single();
      if (existing) {
        setLoading(false);
        return { success: false, message: 'Phone number already registered. Please login.' };
      }

      // Create new user
      const { data, error } = await supabase.from('profiles').insert([{
        phone,
        full_name: fullName,
        pin_code: pin,
        points: 0,
        referral_count: 0
      }]).select().single();

      if (error) throw error;

      // Handle Referral Reward Logic
      if (referralCode && referralCode !== phone) {
          // Find the referrer by phone number (code)
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id, referral_count')
            .eq('phone', referralCode)
            .single();
          
          if (referrer) {
              // Grant 30% OFF to the referrer
              await supabase.from('profiles').update({
                  active_reward: { 
                      type: 'discount_percent', 
                      value: 30, 
                      label: `Referral Bonus (30% OFF)` 
                  },
                  referral_count: (referrer.referral_count || 0) + 1
              }).eq('id', referrer.id);
          }
      }

      setUser(data);
      localStorage.setItem('don_louis_user_phone', phone);
      setLoading(false);
      return { success: true };
    } catch (e: any) {
      setLoading(false);
      return { success: false, message: e.message || 'Signup failed.' };
    }
  };

  const updateProfile = async (updates: { full_name?: string; pin_code?: string }): Promise<{ success: boolean; message?: string }> => {
      if (!user) return { success: false, message: "Not logged in" };
      
      try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

          if (error) throw error;
          
          // Update local state
          setUser(prev => prev ? { ...prev, ...updates } : null);
          return { success: true };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('don_louis_user_phone');
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.phone);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, updateProfile, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
