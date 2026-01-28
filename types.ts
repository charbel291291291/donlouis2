
export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  image_url: string | null;
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  image_url?: string | null;
  created_at?: string;
}

export interface Reward {
  id: string;
  title: string;
  points_cost: number;
}

export interface AppSetting {
  key: string;
  value: string;
}

export type OrderType = 'pickup' | 'delivery';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string; // New: For "No onions", etc.
}

export interface SpinReward {
  type: 'discount_percent' | 'free_delivery' | 'free_item' | 'no_luck';
  value: number; 
  label: string;
  target_item_name?: string; 
}

export interface SavedAddress {
  label: string; // "Home", "Work"
  address: string;
  zoneId: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string;
  points: number;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  last_spin_date?: string | null; 
  active_reward?: SpinReward | null; 
  referral_count?: number;
  saved_addresses?: SavedAddress[]; // New field
}

export interface Order {
  id: string;
  profile_phone: string;
  customer_name: string;
  customer_address: string | null;
  order_type: OrderType;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  tip_amount?: number; // New
  rating?: number; // New
  feedback?: string; // New
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_name: string;
  quantity: number;
  price_at_time: number;
  notes?: string; // New
}
