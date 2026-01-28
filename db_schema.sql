
-- ==========================================
-- DON LOUIS SNACK BAR - COMPLETE DB SCHEMA
-- ==========================================

-- 1. RESET (Optional - prevents "Relation already exists" errors)
-- Remove drops if you want to preserve data, but kept here for clean slate as requested.
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists menu_items cascade;
drop table if exists categories cascade;
drop table if exists profiles cascade;
drop table if exists promos cascade;
drop table if exists rewards cascade;
drop table if exists app_settings cascade;

-- 2. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 3. TABLES

-- App Global Settings (Logo, etc.)
create table app_settings (
  key text primary key,
  value text not null
);

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sort_order int default 0,
  created_at timestamp with time zone default now()
);

-- Users/Profiles (Linked by Phone for Loyalty)
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  phone text unique not null,
  pin_code text, -- SECURE PIN FOR LOGIN
  full_name text,
  points int default 0,
  created_at timestamp with time zone default now(),
  -- NEW FIELDS FOR DAILY SPIN & REFERRALS
  last_spin_date date,
  active_reward jsonb,
  referral_count int default 0
);

-- Menu Items
create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  description text,
  price decimal(10,2) not null,
  is_available boolean default true,
  image_url text,
  created_at timestamp with time zone default now()
);

-- Promos
create table promos (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  is_active boolean default false,
  image_url text, -- Added for banners
  created_at timestamp with time zone default now()
);

-- Rewards Rules
create table rewards (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  points_cost int not null,
  created_at timestamp with time zone default now()
);

-- Orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  profile_phone text not null, -- Links to profile via phone
  customer_name text not null,
  customer_address text,
  order_type text check (order_type in ('pickup', 'delivery')),
  status text check (status in ('new', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled')) default 'new',
  total_amount decimal(10,2) not null,
  delivery_fee decimal(10,2) default 0,
  created_at timestamp with time zone default now()
);

-- Order Items
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_name text not null,
  quantity int not null,
  price_at_time decimal(10,2) not null
);

-- 4. STORAGE SETUP (Menu Images)
-- We use ON CONFLICT DO NOTHING to prevent errors if you already created it manually.
insert into storage.buckets (id, name, public) 
values ('menu-items', 'menu-items', true)
on conflict (id) do nothing;

-- Storage Policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;
drop policy if exists "Public Update" on storage.objects;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'menu-items' );
create policy "Public Upload" on storage.objects for insert with check ( bucket_id = 'menu-items' );
create policy "Public Update" on storage.objects for update with check ( bucket_id = 'menu-items' );

-- 5. SEED DATA (Populate the Menu)
insert into app_settings (key, value) values ('logo_url', '') on conflict do nothing;

do $$
declare
  cat_appetizers uuid;
  cat_salads uuid;
  cat_franje uuid;
  cat_speciality uuid;
  cat_burgers uuid;
  cat_mashewe uuid;
  cat_sweets uuid;
  cat_drinks uuid;
begin
  -- Insert Categories
  insert into categories (name, sort_order) values ('Appetizers', 1) returning id into cat_appetizers;
  insert into categories (name, sort_order) values ('Salads', 2) returning id into cat_salads;
  insert into categories (name, sort_order) values ('Bel Franje', 3) returning id into cat_franje;
  insert into categories (name, sort_order) values ('Speciality', 4) returning id into cat_speciality;
  insert into categories (name, sort_order) values ('Burgers', 5) returning id into cat_burgers;
  insert into categories (name, sort_order) values ('Mashewe', 6) returning id into cat_mashewe;
  insert into categories (name, sort_order) values ('Sweet Tooth', 7) returning id into cat_sweets;
  insert into categories (name, sort_order) values ('Soft Drinks', 8) returning id into cat_drinks;

  -- Insert Promos
  insert into promos (title, description, is_active) values 
  ('Appetizer Combo Deal', 'Get all your favorites for just $18.00!', true);

  -- Insert Rewards Rules
  insert into rewards (title, points_cost) values
  ('Free Fries', 30),
  ('Free Sandwich', 50),
  ('Free Burger', 80),
  ('Appetizer Combo', 120);

  -- Appetizers
  insert into menu_items (category_id, name, price) values
  (cat_appetizers, 'Fries', 2.50),
  (cat_appetizers, 'Calamari Rings', 5.50),
  (cat_appetizers, 'Mozzarella Sticks', 4.50),
  (cat_appetizers, 'Dynamite Shrimps', 7.50),
  (cat_appetizers, 'Crispy Tenders', 5.00),
  (cat_appetizers, 'Appetizer Combo', 18.00),
  (cat_appetizers, 'Hummus', 3.50),
  (cat_appetizers, 'Kebbe Ball', 1.20),
  (cat_appetizers, 'Rakat Cheese', 0.90),
  (cat_appetizers, 'Sambousik Meat', 0.90);

  -- Salads
  insert into menu_items (category_id, name, price) values
  (cat_salads, 'Caesar Salad', 7.50),
  (cat_salads, 'Season Salad', 5.00),
  (cat_salads, 'Fattouch', 5.00),
  (cat_salads, 'Tabbouleh', 5.00);

  -- Bel Franje
  insert into menu_items (category_id, name, price) values
  (cat_franje, 'Char-Grilled Chicken', 4.25),
  (cat_franje, 'Francisco Chicken', 6.50),
  (cat_franje, 'Philly Steak', 7.00),
  (cat_franje, 'Rosto', 5.50),
  (cat_franje, 'Makanek', 4.50),
  (cat_franje, 'Soujouk', 4.50),
  (cat_franje, 'Halloumi Pesto', 5.50),
  (cat_franje, 'Turkey Cheese', 4.00),
  (cat_franje, 'Crispy Chicken', 6.50),
  (cat_franje, 'Chinese Chicken', 6.50);

  -- Speciality
  insert into menu_items (category_id, name, price) values
  (cat_speciality, 'Special Shrimp', 6.50),
  (cat_speciality, 'Merguez Provolone', 7.00),
  (cat_speciality, 'Aashtarout', 6.00),
  (cat_speciality, 'Don Louis Special Steak', 8.50);

  -- Burgers
  insert into menu_items (category_id, name, price) values
  (cat_burgers, 'Beef Burger', 5.50),
  (cat_burgers, 'Chicken Burger', 5.50),
  (cat_burgers, 'Don Louis Special Burger', 7.00),
  (cat_burgers, 'Add Combo', 2.30);

  -- Mashewe
  insert into menu_items (category_id, name, price) values
  (cat_mashewe, 'Taouk Sandwich', 4.50),
  (cat_mashewe, 'Castaletta Cube Sandwich', 6.50),
  (cat_mashewe, 'Kafta Sandwich', 4.50),
  (cat_mashewe, 'Kabab Halabi Sandwich', 4.50),
  (cat_mashewe, 'Kabab Orfali Sandwich', 5.00),
  (cat_mashewe, 'Kabab Intable Sandwich', 5.50),
  (cat_mashewe, 'Mixed Grill Plat', 15.00),
  (cat_mashewe, 'Soujouk 3al Sikh Sandwich', 5.50),
  (cat_mashewe, 'Half Boneless Chicken', 9.50),
  (cat_mashewe, 'Char-Grilled Chicken', 15.00),
  (cat_mashewe, 'Aarayes Don Louis', 8.50);

  -- Sweet Tooth
  insert into menu_items (category_id, name, price) values
  (cat_sweets, 'Choco Banana', 4.50),
  (cat_sweets, 'Choco Cheese', 5.00),
  (cat_sweets, 'Tine Cheese', 5.50);

  -- Drinks
  insert into menu_items (category_id, name, price) values
  (cat_drinks, 'Pepsi / 7up / Mirinda', 1.00),
  (cat_drinks, 'Laban Ayran', 0.85),
  (cat_drinks, 'Ice Tea', 1.25),
  (cat_drinks, 'Sparkling Water', 1.00),
  (cat_drinks, 'Water', 0.40),
  (cat_drinks, 'Juice', 0.50),
  (cat_drinks, 'Beer', 2.00);

end $$;

-- ========================================================
-- IMPORTANT: RUN THIS IF YOU ALREADY HAVE A DATABASE SET UP
-- ========================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count int default 0;
