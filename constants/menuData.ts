import { Category, MenuItem } from '../types';

export const INITIAL_DATA = {
  categories: [
    { id: 'cat_appetizers', name: 'Appetizers', sort_order: 1 },
    { id: 'cat_salads', name: 'Salads', sort_order: 2 },
    { id: 'cat_franje', name: 'Bel Franje', sort_order: 3 },
    { id: 'cat_speciality', name: 'Speciality', sort_order: 4 },
    { id: 'cat_burgers', name: 'Burgers', sort_order: 5 },
    { id: 'cat_mashewe', name: 'Mashewe', sort_order: 6 },
    { id: 'cat_sweets', name: 'Sweet Tooth', sort_order: 7 },
    { id: 'cat_drinks', name: 'Soft Drinks', sort_order: 8 },
  ] as Category[],
  
  items: [
    // Appetizers
    { id: 'item_fries', category_id: 'cat_appetizers', name: 'Fries', price: 2.50, is_available: true, description: 'Golden crispy fries', image_url: null },
    { id: 'item_calamari', category_id: 'cat_appetizers', name: 'Calamari Rings', price: 5.50, is_available: true, description: 'Served with tartar sauce', image_url: null },
    { id: 'item_mozzarella', category_id: 'cat_appetizers', name: 'Mozzarella Sticks', price: 4.50, is_available: true, description: 'Served with marinara', image_url: null },
    { id: 'item_dynamite', category_id: 'cat_appetizers', name: 'Dynamite Shrimps', price: 7.50, is_available: true, description: 'Spicy creamy sauce', image_url: null },
    { id: 'item_tenders', category_id: 'cat_appetizers', name: 'Crispy Tenders', price: 5.00, is_available: true, description: 'Hand-breaded chicken', image_url: null },
    { id: 'item_app_combo', category_id: 'cat_appetizers', name: 'Appetizer Combo', price: 18.00, is_available: true, description: 'A mix of all our favorites', image_url: null },
    { id: 'item_hummus', category_id: 'cat_appetizers', name: 'Hummus', price: 3.50, is_available: true, description: 'Traditional recipe', image_url: null },
    { id: 'item_kebbe', category_id: 'cat_appetizers', name: 'Kebbe Ball', price: 1.20, is_available: true, description: 'Fried meat ball', image_url: null },
    { id: 'item_rakat', category_id: 'cat_appetizers', name: 'Rakat Cheese', price: 0.90, is_available: true, description: 'Crispy cheese roll', image_url: null },
    { id: 'item_sambousik', category_id: 'cat_appetizers', name: 'Sambousik Meat', price: 0.90, is_available: true, description: 'Fried meat pastry', image_url: null },

    // Salads
    { id: 'item_caesar', category_id: 'cat_salads', name: 'Caesar Salad', price: 7.50, is_available: true, description: 'Lettuce, parmesan, croutons', image_url: null },
    { id: 'item_season', category_id: 'cat_salads', name: 'Season Salad', price: 5.00, is_available: true, description: 'Fresh seasonal vegetables', image_url: null },
    { id: 'item_fattouch', category_id: 'cat_salads', name: 'Fattouch', price: 5.00, is_available: true, description: 'Traditional Lebanese salad', image_url: null },
    { id: 'item_tabbouleh', category_id: 'cat_salads', name: 'Tabbouleh', price: 5.00, is_available: true, description: 'Parsley, tomato, onion', image_url: null },

    // Bel Franje
    { id: 'item_char_chicken', category_id: 'cat_franje', name: 'Char-Grilled Chicken', price: 4.25, is_available: true, description: 'Juicy marinated breast', image_url: null },
    { id: 'item_francisco', category_id: 'cat_franje', name: 'Francisco Chicken', price: 6.50, is_available: true, description: 'Chicken, corn, cheese, mayo', image_url: null },
    { id: 'item_philly', category_id: 'cat_franje', name: 'Philly Steak', price: 7.00, is_available: true, description: 'Steak, onions, cheese, peppers', image_url: null },
    { id: 'item_rosto', category_id: 'cat_franje', name: 'Rosto', price: 5.50, is_available: true, description: 'Roast beef sandwich', image_url: null },
    { id: 'item_makanek', category_id: 'cat_franje', name: 'Makanek', price: 4.50, is_available: true, description: 'Lebanese sausages', image_url: null },
    { id: 'item_soujouk', category_id: 'cat_franje', name: 'Soujouk', price: 4.50, is_available: true, description: 'Spicy sausages', image_url: null },
    { id: 'item_halloumi', category_id: 'cat_franje', name: 'Halloumi Pesto', price: 5.50, is_available: true, description: 'Grilled halloumi with pesto', image_url: null },
    { id: 'item_turkey', category_id: 'cat_franje', name: 'Turkey Cheese', price: 4.00, is_available: true, description: 'Classic deli style', image_url: null },
    { id: 'item_crispy_chx', category_id: 'cat_franje', name: 'Crispy Chicken', price: 6.50, is_available: true, description: 'Fried chicken breast', image_url: null },
    { id: 'item_chinese', category_id: 'cat_franje', name: 'Chinese Chicken', price: 6.50, is_available: true, description: 'Asian style chicken mix', image_url: null },

    // Speciality
    { id: 'item_spec_shrimp', category_id: 'cat_speciality', name: 'Special Shrimp', price: 6.50, is_available: true, description: 'Chef special sauce', image_url: null },
    { id: 'item_merguez', category_id: 'cat_speciality', name: 'Merguez Provolone', price: 7.00, is_available: true, description: 'Spicy sausage with cheese', image_url: null },
    { id: 'item_aashtarout', category_id: 'cat_speciality', name: 'Aashtarout', price: 6.00, is_available: true, description: 'House speciality', image_url: null },
    { id: 'item_dl_steak', category_id: 'cat_speciality', name: 'Don Louis Special Steak', price: 8.50, is_available: true, description: 'Premium cut steak sandwich', image_url: null },

    // Burgers
    { id: 'item_beef_burg', category_id: 'cat_burgers', name: 'Beef Burger', price: 5.50, is_available: true, description: 'Homemade patty', image_url: null },
    { id: 'item_chx_burg', category_id: 'cat_burgers', name: 'Chicken Burger', price: 5.50, is_available: true, description: 'Grilled or fried', image_url: null },
    { id: 'item_dl_burg', category_id: 'cat_burgers', name: 'Don Louis Special Burger', price: 7.00, is_available: true, description: 'Loaded with extras', image_url: null },
    { id: 'item_add_combo', category_id: 'cat_burgers', name: 'Add Combo', price: 2.30, is_available: true, description: 'Fries + Coleslaw + Drink', image_url: null },

    // Mashewe
    { id: 'item_taouk', category_id: 'cat_mashewe', name: 'Taouk Sandwich', price: 4.50, is_available: true, description: 'Marinated chicken skewers', image_url: null },
    { id: 'item_castaletta', category_id: 'cat_mashewe', name: 'Castaletta Cube Sandwich', price: 6.50, is_available: true, description: 'Lamb cubes', image_url: null },
    { id: 'item_kafta', category_id: 'cat_mashewe', name: 'Kafta Sandwich', price: 4.50, is_available: true, description: 'Minced meat with parsley', image_url: null },
    { id: 'item_kabab_hal', category_id: 'cat_mashewe', name: 'Kabab Halabi Sandwich', price: 4.50, is_available: true, description: 'Spicy tomato sauce', image_url: null },
    { id: 'item_kabab_orf', category_id: 'cat_mashewe', name: 'Kabab Orfali Sandwich', price: 5.00, is_available: true, description: 'With grilled vegetables', image_url: null },
    { id: 'item_kabab_int', category_id: 'cat_mashewe', name: 'Kabab Intable Sandwich', price: 5.50, is_available: true, description: 'Yogurt garlic sauce', image_url: null },
    { id: 'item_mixed_grill', category_id: 'cat_mashewe', name: 'Mixed Grill Plat', price: 15.00, is_available: true, description: 'Selection of BBQ skewers', image_url: null },
    { id: 'item_soujouk_sikh', category_id: 'cat_mashewe', name: 'Soujouk 3al Sikh Sandwich', price: 5.50, is_available: true, description: 'Grilled soujouk', image_url: null },
    { id: 'item_half_boneless', category_id: 'cat_mashewe', name: 'Half Boneless Chicken', price: 9.50, is_available: true, description: 'Charcoal grilled', image_url: null },
    { id: 'item_char_grill_pl', category_id: 'cat_mashewe', name: 'Char-Grilled Chicken', price: 15.00, is_available: true, description: 'Whole chicken platter', image_url: null },
    { id: 'item_aarayes', category_id: 'cat_mashewe', name: 'Aarayes Don Louis', price: 8.50, is_available: true, description: 'Meat stuffed pita', image_url: null },

    // Sweet Tooth
    { id: 'item_choco_ban', category_id: 'cat_sweets', name: 'Choco Banana', price: 4.50, is_available: true, description: 'Chocolate spread & banana', image_url: null },
    { id: 'item_choco_cheese', category_id: 'cat_sweets', name: 'Choco Cheese', price: 5.00, is_available: true, description: 'Sweet cheese mix', image_url: null },
    { id: 'item_tine_cheese', category_id: 'cat_sweets', name: 'Tine Cheese', price: 5.50, is_available: true, description: 'Figs and cheese', image_url: null },

    // Soft Drinks
    { id: 'item_pepsi', category_id: 'cat_drinks', name: 'Pepsi / 7up / Mirinda', price: 1.00, is_available: true, description: 'Canned soda', image_url: null },
    { id: 'item_laban', category_id: 'cat_drinks', name: 'Laban Ayran', price: 0.85, is_available: true, description: 'Yogurt drink', image_url: null },
    { id: 'item_icetea', category_id: 'cat_drinks', name: 'Ice Tea', price: 1.25, is_available: true, description: 'Peach or Lemon', image_url: null },
    { id: 'item_sparkling', category_id: 'cat_drinks', name: 'Sparkling Water', price: 1.00, is_available: true, description: 'Perrier or similar', image_url: null },
    { id: 'item_water', category_id: 'cat_drinks', name: 'Water', price: 0.40, is_available: true, description: 'Small bottle', image_url: null },
    { id: 'item_juice', category_id: 'cat_drinks', name: 'Juice', price: 0.50, is_available: true, description: 'Fruit juice box', image_url: null },
    { id: 'item_beer', category_id: 'cat_drinks', name: 'Beer', price: 2.00, is_available: true, description: 'Local beer', image_url: null },
  ] as MenuItem[]
};
