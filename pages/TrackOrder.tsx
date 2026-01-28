
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Order, OrderItem } from '../types';
import { Icon } from '../components/Icons';
import { requestNotificationPermission, sendLocalNotification } from '../utils/notifications';
import { useAuth } from '../contexts/AuthContext';

export const TrackOrder: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order & { items: OrderItem[] } | null>(null);
  const [inputOrderId, setInputOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Auto-tracking state
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [ignoreAuto, setIgnoreAuto] = useState(false);
  
  // Steps for the progress bar
  const steps = ['new', 'preparing', 'ready', 'out_for_delivery', 'completed'];
  const labels: Record<string, string> = {
    new: 'Order Placed',
    preparing: 'Kitchen Preparing',
    ready: 'Ready for Pickup',
    out_for_delivery: 'Out for Delivery',
    completed: 'Enjoy your meal!'
  };

  useEffect(() => {
    // Request permission when entering the tracking page
    requestNotificationPermission().then(granted => {
        if (granted) console.log("Notifications enabled for order updates");
    });
  }, []);

  // Automatic Tracking Logic
  useEffect(() => {
      if (!orderId && user && !ignoreAuto) {
          const checkActiveOrder = async () => {
              setIsAutoChecking(true);
              try {
                  const { data } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('profile_phone', user.phone)
                    .in('status', ['new', 'preparing', 'ready', 'out_for_delivery'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                  
                  if (data) {
                      setSearchParams({ orderId: data.id });
                  }
              } catch (e) {
                  console.error("Auto-track failed", e);
              } finally {
                  setIsAutoChecking(false);
              }
          };
          checkActiveOrder();
      }
  }, [orderId, user, ignoreAuto, setSearchParams]);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch order AND items
    supabase.from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError('Order not found. Please check your Order ID.');
          setOrder(null);
        } else {
          setOrder(data as any);
        }
        setLoading(false);
      });

    // Realtime Subscription
    const channel = supabase.channel(`order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
        const updatedOrder = payload.new as Order;
        // Keep existing items, only update status/totals
        setOrder(prev => prev ? { ...prev, ...updatedOrder } : null);
        
        // Trigger Local Notification
        if (updatedOrder.status) {
            const statusLabel = labels[updatedOrder.status] || updatedOrder.status;
            sendLocalNotification('Order Update', `Status changed to: ${statusLabel}`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [orderId]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputOrderId.trim()) {
      setSearchParams({ orderId: inputOrderId.trim() });
    }
  };
  
  // Consolidated Loading State
  if (loading || isAutoChecking) return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            <div className="text-brand-gold font-bold text-sm tracking-widest uppercase animate-pulse">
                {isAutoChecking ? 'Finding active order...' : 'Loading Status...'}
            </div>
          </div>
      </div>
  );

  // Manual Input Screen
  if (!orderId) {
    return (
      <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
             <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-brand-gold rounded-full blur-[120px]"></div>
        </div>

        <h1 className="text-3xl font-serif font-bold mb-2 text-center text-white relative z-10">Track Your Experience</h1>
        <p className="text-brand-gold/80 text-sm mb-10 text-center relative z-10 uppercase tracking-widest">Enter Order ID</p>
        
        <div className="bg-brand-surface/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl w-full relative z-10">
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-6">
            <div className="relative group">
                <input 
                  type="text" 
                  placeholder="e.g. 123e4567..." 
                  value={inputOrderId}
                  onChange={(e) => setInputOrderId(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl p-4 text-white focus:border-brand-gold outline-none font-mono text-sm transition-all group-hover:bg-neutral-900/80"
                />
            </div>
            <button 
              type="submit"
              className="bg-gradient-to-r from-brand-gold to-yellow-600 text-neutral-900 font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform active:scale-95"
            >
              Track Order
            </button>
          </form>
          {userHasHistory() && (
             <button onClick={() => navigate('/profile')} className="mt-6 w-full text-xs text-gray-500 hover:text-white transition-colors">
                View Recent Orders in Profile
             </button>
          )}
        </div>
      </div>
    );
  }

  function userHasHistory() {
      return localStorage.getItem('don_louis_user_phone') !== null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-neutral-900">
        <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <Icon name="close" className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-gray-300 mb-6 text-lg">{error}</p>
        <button 
          onClick={() => { setIgnoreAuto(true); setSearchParams({}); }}
          className="text-brand-gold underline font-bold hover:text-white transition-colors"
        >
          Try Another ID
        </button>
      </div>
    );
  }

  if (!order) return null;

  const currentStepIndex = steps.indexOf(order.status);
  const relevantSteps = steps.filter(s => order.order_type !== 'pickup' || s !== 'out_for_delivery');
  
  return (
    <div className="p-6 max-w-md mx-auto pb-24 min-h-screen relative">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[10%] left-[-20%] w-[300px] h-[300px] bg-brand-gold/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[10%] right-[-20%] w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
            <button 
                onClick={() => { setIgnoreAuto(true); setSearchParams({}); }} 
                className="bg-neutral-800/50 hover:bg-neutral-800 p-2 rounded-full transition-colors backdrop-blur-md border border-white/5"
            >
                <Icon name="chevronRight" className="w-5 h-5 rotate-180 text-gray-300" />
            </button>
            <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Order ID</p>
                <p className="text-xs text-brand-gold font-mono">#{order.id.slice(0,8)}</p>
            </div>
        </div>
        
        <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Order Status</h1>
            <p className="text-gray-400 text-sm">Estimated arrival: <span className="text-white font-bold">Soon</span></p>
        </div>
        
        {/* Progress Card */}
        <div className="bg-brand-surface/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden mb-8">
            
            {/* Connecting Line (Background) */}
            <div className="absolute left-[2.9rem] top-12 bottom-12 w-0.5 bg-neutral-800 rounded-full"></div>
            
            {/* Connecting Line (Active) */}
            <div 
                className="absolute left-[2.9rem] top-12 w-0.5 bg-gradient-to-b from-brand-gold to-yellow-200 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_#F59E0B]"
                style={{ height: `${Math.min(100, (currentStepIndex / (steps.length - 1)) * 80)}%` }} 
            ></div>

            <div className="space-y-10 relative">
            {steps.map((step, index) => {
                // Skip "out_for_delivery" if it's a pickup order
                if (order.order_type === 'pickup' && step === 'out_for_delivery') return null;
                
                const isPast = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                <div key={step} className={`flex items-start gap-6 relative z-10 transition-all duration-700 ${isCurrent ? 'scale-105 origin-left' : 'scale-100'}`}>
                    
                    {/* Step Circle */}
                    <div 
                        className={`
                            w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ease-out z-20
                            ${isPast ? 'bg-brand-gold border-brand-gold text-neutral-900 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : ''}
                            ${isCurrent ? 'bg-neutral-900 border-brand-gold text-brand-gold shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-110' : ''}
                            ${!isPast && !isCurrent ? 'bg-neutral-900/80 border-neutral-700 text-neutral-600' : ''}
                        `}
                    >
                        {isPast && <Icon name="check" className="w-6 h-6" />}
                        {isCurrent && <Icon name="clock" className="w-6 h-6 animate-pulse" />}
                        {!isPast && !isCurrent && <div className="w-2 h-2 rounded-full bg-neutral-700" />}
                    </div>
                    
                    {/* Text Details */}
                    <div className={`pt-1 transition-all duration-500 ${isCurrent ? 'opacity-100 translate-x-2' : isPast ? 'opacity-60' : 'opacity-30'}`}>
                        <h4 className={`font-bold text-lg leading-none transition-colors duration-300 ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                            {labels[step] || step}
                        </h4>
                        
                        {/* Animated Subtext for Current Step */}
                        <div className={`grid transition-all duration-500 ease-out ${isCurrent ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <span className="inline-block px-3 py-1 bg-brand-gold/10 border border-brand-gold/20 rounded-full text-[10px] font-bold text-brand-gold uppercase tracking-wider animate-pulse">
                                    In Progress
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })}
            </div>
        </div>

        {/* Order Details (Receipt) */}
        <div className="bg-neutral-800/30 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Order Details</h3>
            
            <div className="space-y-3 mb-4">
                {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex gap-3">
                            <span className="text-brand-gold font-bold">{item.quantity}x</span>
                            <span className="text-gray-300">{item.menu_item_name}</span>
                        </div>
                        <div className="text-gray-500">${(item.price_at_time * item.quantity).toFixed(2)}</div>
                    </div>
                ))}
            </div>

            <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                <div>
                     <p className="text-gray-500 text-xs">Total Amount</p>
                </div>
                <div className="text-xl font-bold text-white">${order.total_amount.toFixed(2)}</div>
            </div>
            
            <div className="mt-4 text-center">
                 <div className={`inline-block px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${order.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'}`}>
                     {order.status.replace(/_/g, " ")}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};
