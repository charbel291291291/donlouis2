
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
}

export interface SpinReward {
  type: 'discount_percent' | 'free_delivery' | 'free_item' | 'no_luck';
  value: number; // e.g., 10 for 10%, 0 for free delivery
  label: string;
  target_item_name?: string; // For specific items e.g. "Fries"
}

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string;
  points: number;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  last_spin_date?: string | null; // ISO Date string YYYY-MM-DD
  active_reward?: SpinReward | null; // JSONB in DB
  referral_count?: number;
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
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_name: string;
  quantity: number;
  price_at_time: number;
}
