
import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icons';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { DELIVERY_ZONES } from '../constants/deliveryZones';

export const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, subtotal, clearCart } = useCart();
  const { user, refreshProfile } = useAuth();
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('delivery');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [details, setDetails] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  // Auto-fill details if logged in
  useEffect(() => {
    if (user) {
        setDetails(prev => ({
            ...prev,
            name: user.full_name || '',
            phone: user.phone || ''
        }));
    }
  }, [user]);

  // --- REWARD LOGIC ---
  // If user has an active_reward in DB, we use it regardless of date (unless it was a daily spin strictly). 
  // For now, we trust active_reward. DailySpin logic in Reward page overwrites it, so it's consistent.
  const reward = user?.active_reward;
  const isRewardValid = !!reward && reward.type !== 'no_luck';

  let discountAmount = 0;
  let finalDeliveryFee = 0;
  let missingRewardItem = null; // Name of item user needs to add to get free
  
  // Base Delivery Fee
  const zoneFee = (orderType === 'delivery' ? (DELIVERY_ZONES.find(z => z.id === selectedZoneId)?.fee || 0) : 0);
  
  // Calculate Discounts
  if (isRewardValid) {
    if (reward.type === 'discount_percent') {
        discountAmount = subtotal * (reward.value / 100);
        finalDeliveryFee = zoneFee;
    } else if (reward.type === 'free_delivery') {
        discountAmount = 0;
        finalDeliveryFee = 0;
    } else if (reward.type === 'free_item' && reward.target_item_name) {
        // Find if target item is in cart
        // Loose match: If target is "Fries", match "Fries" or "French Fries" etc.
        const targetItem = items.find(i => i.name.toLowerCase().includes(reward.target_item_name!.toLowerCase()));
        
        if (targetItem) {
            // Deduct cost of 1 unit of that item
            discountAmount = targetItem.price; 
        } else {
            missingRewardItem = reward.target_item_name;
        }
        finalDeliveryFee = zoneFee;
    }
  } else {
    finalDeliveryFee = zoneFee;
  }
    
  const total = Math.max(0, subtotal - discountAmount + finalDeliveryFee);

  // Primary Submission Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (orderType === 'delivery') {
      if (!selectedZoneId) {
        alert("Please select a delivery area to calculate the fee.");
        return;
      }
      setShowConfirmation(true);
    } else {
      placeOrder();
    }
  };

  const placeOrder = async () => {
    setLoading(true);
    setShowConfirmation(false);

    try {
      // 1. Calculate Loyalty Points (1 point per $1 subtotal)
      const pointsEarned = Math.floor(subtotal);

      // 2. Fetch existing points safely
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('phone', details.phone)
        .maybeSingle();

      if (fetchError) {
          console.error("Error fetching profile:", fetchError);
          throw new Error("Failed to retrieve user profile.");
      }

      const currentPoints = existingProfile?.points || 0;
      const newPoints = currentPoints + pointsEarned;

      // 3. Update or Create Profile & Consume Reward
      // onConflict: 'phone' ensures we update the existing record if found, or insert if new.
      const updates: any = { 
        phone: details.phone, 
        full_name: details.name,
        points: newPoints
      };
      
      // If reward was used, consume it (set active_reward to null)
      // Only consume if we actually applied a discount or it was a free delivery that was used
      if (isRewardValid && (discountAmount > 0 || (reward.type === 'free_delivery' && orderType === 'delivery'))) {
          updates.active_reward = null; 
      }

      const { error: profileError } = await supabase.from('profiles').upsert(updates, { onConflict: 'phone' });

      if (profileError) {
          console.error("Error updating points:", profileError);
          throw new Error("Failed to update loyalty points.");
      }

      // Prepare Address
      let finalAddress = null;
      if (orderType === 'delivery') {
        const zoneName = DELIVERY_ZONES.find(z => z.id === selectedZoneId)?.name;
        finalAddress = `[${zoneName}] ${details.address}`;
      }

      // 4. Create Order
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        profile_phone: details.phone,
        customer_name: details.name,
        customer_address: finalAddress,
        order_type: orderType,
        total_amount: total,
        delivery_fee: finalDeliveryFee,
        status: 'new'
      }).select().single();

      if (orderError) throw orderError;

      // 5. Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_name: item.name,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;
      
      // Cleanup
      clearCart();
      
      // Refresh profile context to ensure UI reflects new points/cleared reward immediately
      if (user) {
          await refreshProfile();
      }

      navigate(`/track?orderId=${order.id}`);

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error placing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
        <Icon name="cart" className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-xl">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 relative">
      <h1 className="text-2xl font-bold mb-6 text-white">Checkout</h1>

      {/* Missing Reward Banner */}
      {missingRewardItem && (
          <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl mb-6 flex gap-3 items-center animate-pulse">
              <Icon name="gift" className="w-6 h-6 text-blue-400" />
              <div className="text-sm">
                  <p className="text-blue-200 font-bold">Free {missingRewardItem} Unlocked!</p>
                  <button onClick={() => navigate('/menu')} className="text-brand-gold underline font-bold mt-1">Add to cart to claim</button>
              </div>
          </div>
      )}

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center bg-brand-surface p-3 rounded-lg border border-neutral-800">
            <div className="flex-1">
              <h4 className="font-bold text-gray-200">{item.name}</h4>
              <p className="text-brand-gold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-neutral-900 rounded-lg p-1">
                 <button onClick={() => updateQuantity(item.id, -1)} className="px-2 text-gray-400">-</button>
                 <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                 <button onClick={() => updateQuantity(item.id, 1)} className="px-2 text-brand-gold">+</button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500">
                <Icon name="trash" className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Type */}
      <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-neutral-800 rounded-xl">
        <button 
          onClick={() => setOrderType('delivery')}
          className={`py-2 rounded-lg text-sm font-bold transition-all ${orderType === 'delivery' ? 'bg-brand-gold text-neutral-900 shadow' : 'text-gray-400'}`}
        >
          Delivery
        </button>
        <button 
          onClick={() => setOrderType('pickup')}
          className={`py-2 rounded-lg text-sm font-bold transition-all ${orderType === 'pickup' ? 'bg-brand-gold text-neutral-900 shadow' : 'text-gray-400'}`}
        >
          Pickup
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          required 
          type="text" 
          placeholder="Full Name" 
          className="w-full bg-brand-surface border border-neutral-700 rounded-lg p-3 text-white focus:border-brand-gold outline-none"
          value={details.name}
          onChange={e => setDetails({...details, name: e.target.value})}
        />
        <input 
          required 
          type="tel" 
          placeholder="Phone Number (Required)" 
          className="w-full bg-brand-surface border border-neutral-700 rounded-lg p-3 text-white focus:border-brand-gold outline-none"
          value={details.phone}
          onChange={e => setDetails({...details, phone: e.target.value})}
        />
        
        {orderType === 'delivery' && (
          <div className="space-y-4 animate-fade-in">
            {/* Zone Selector */}
            <div className="relative">
              <select
                required
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full bg-brand-surface border border-neutral-700 rounded-lg p-3 text-white focus:border-brand-gold outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Delivery Area</option>
                {DELIVERY_ZONES.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} (+${zone.fee.toFixed(2)})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                <Icon name="chevronRight" className="w-4 h-4 rotate-90" />
              </div>
            </div>

            <textarea 
              required 
              placeholder="Building, Floor, Apartment, Famous Landmark..." 
              className="w-full bg-brand-surface border border-neutral-700 rounded-lg p-3 text-white focus:border-brand-gold outline-none h-24"
              value={details.address}
              onChange={e => setDetails({...details, address: e.target.value})}
            />
          </div>
        )}

        {/* Summary */}
        <div className="border-t border-neutral-800 pt-4 mt-6 space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {/* Applied Reward Display */}
          {isRewardValid && discountAmount > 0 && (
            <div className="flex justify-between text-green-400">
                <span className="flex items-center gap-1"><Icon name="star" className="w-3 h-3" /> Reward ({reward.label})</span>
                <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-400">
            <span>Delivery Fee</span>
            <span className={orderType === 'delivery' && !selectedZoneId ? 'text-red-400' : ''}>
               {orderType === 'delivery' ? (
                   isRewardValid && reward.type === 'free_delivery' && selectedZoneId ? (
                       <span className="line-through text-gray-600 mr-2">${zoneFee.toFixed(2)}</span>
                   ) : null
               ) : null}
               {orderType === 'delivery' 
                ? (selectedZoneId ? (finalDeliveryFee === 0 && zoneFee > 0 ? <span className="text-green-400">FREE</span> : `$${finalDeliveryFee.toFixed(2)}`) : 'Select Area') 
                : '$0.00'
               }
            </span>
          </div>

          <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-neutral-800/50 mt-2">
            <span>Total</span>
            <span className="text-brand-gold">${total.toFixed(2)}</span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-brand-gold text-neutral-900 font-bold py-4 rounded-xl shadow-lg mt-6 hover:bg-yellow-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-brand-gold rounded-xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Delivery Details</h3>
            
            <div className="space-y-3 mb-6 text-sm text-gray-300">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span>Delivery Area</span>
                    <span className="font-bold text-white text-right">{DELIVERY_ZONES.find(z => z.id === selectedZoneId)?.name}</span>
                </div>
                
                {isRewardValid && discountAmount > 0 && (
                     <div className="flex justify-between items-center text-green-400">
                        <span>Discount Applied</span>
                        <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                    </div>
                )}
                
                <div className="flex justify-between items-center">
                    <span>Delivery Fee</span>
                    <span>
                        {finalDeliveryFee === 0 && zoneFee > 0 
                            ? <span className="text-green-400 font-bold">FREE</span> 
                            : <span className="font-bold text-brand-gold">+${finalDeliveryFee.toFixed(2)}</span>
                        }
                    </span>
                </div>

                <div className="pt-2 flex justify-between text-lg font-bold text-white">
                    <span>Total Amount</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                
                <div className="mt-4 bg-neutral-800/50 p-3 rounded-lg border border-neutral-700">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Delivering To</div>
                  <div className="text-white line-clamp-2 leading-relaxed">{details.address}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => setShowConfirmation(false)}
                    className="py-3 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-gray-300 font-bold transition-colors"
                >
                    Edit
                </button>
                <button 
                    onClick={placeOrder}
                    disabled={loading}
                    className="py-3 rounded-lg bg-brand-gold hover:bg-yellow-500 text-neutral-900 font-bold transition-colors shadow-lg flex justify-center items-center"
                >
                    {loading ? 'Processing...' : 'Confirm Order'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
