-- =============================================
-- TIMBER STOCK & DISPATCH TRACKER
-- Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. WOOD TYPES
CREATE TABLE IF NOT EXISTS wood_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PARTIES (Suppliers + Receivers)
CREATE TABLE IF NOT EXISTS parties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('supplier', 'receiver', 'both')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. USER PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'yard_operator' CHECK (role IN ('admin', 'yard_operator')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INWARD ENTRIES (Header)
CREATE TABLE IF NOT EXISTS inward_entries (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  supplier_id INTEGER REFERENCES parties(id),
  vehicle_number VARCHAR(20) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  wood_type_id INTEGER REFERENCES wood_types(id),
  thickness DECIMAL(5,2) NOT NULL,
  total_cft DECIMAL(10,3) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INWARD ENTRY ITEMS (Table Grid Data)
CREATE TABLE IF NOT EXISTS inward_entry_items (
  id SERIAL PRIMARY KEY,
  inward_entry_id INTEGER REFERENCES inward_entries(id) ON DELETE CASCADE,
  width_inch DECIMAL(4,2) NOT NULL,
  length_feet INTEGER NOT NULL CHECK (length_feet BETWEEN 4 AND 13),
  pieces INTEGER NOT NULL DEFAULT 0,
  cft DECIMAL(10,4) NOT NULL DEFAULT 0
);

-- 7. OUTWARD ENTRIES (Header)
CREATE TABLE IF NOT EXISTS outward_entries (
  id SERIAL PRIMARY KEY,
  challan_number VARCHAR(10) UNIQUE NOT NULL,
  date DATE NOT NULL,
  receiver_id INTEGER REFERENCES parties(id),
  vehicle_number VARCHAR(20) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  wood_type_id INTEGER REFERENCES wood_types(id),
  thickness DECIMAL(5,2) NOT NULL,
  total_cft DECIMAL(10,3) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. OUTWARD ENTRY ITEMS (Table Grid Data)
CREATE TABLE IF NOT EXISTS outward_entry_items (
  id SERIAL PRIMARY KEY,
  outward_entry_id INTEGER REFERENCES outward_entries(id) ON DELETE CASCADE,
  width_inch DECIMAL(4,2) NOT NULL,
  length_feet INTEGER NOT NULL CHECK (length_feet BETWEEN 4 AND 13),
  pieces INTEGER NOT NULL DEFAULT 0,
  cft DECIMAL(10,4) NOT NULL DEFAULT 0
);

-- 9. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  record_id INTEGER,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AUTO CHALLAN NUMBER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION generate_challan_number()
RETURNS VARCHAR AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(challan_number AS INTEGER)), 0) + 1
  INTO next_num
  FROM outward_entries;
  RETURN LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AUTO UPDATE updated_at TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inward_updated_at
  BEFORE UPDATE ON inward_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER outward_updated_at
  BEFORE UPDATE ON outward_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wood_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inward_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inward_entry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outward_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE outward_entry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read master data
CREATE POLICY "Authenticated read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read wood_types" ON wood_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read parties" ON parties FOR SELECT TO authenticated USING (true);

-- Only admins can modify master data
CREATE POLICY "Admin write categories" ON categories FOR ALL TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin write wood_types" ON wood_types FOR ALL TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin write parties" ON parties FOR ALL TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- All authenticated users can read/write entries
CREATE POLICY "Authenticated read inward" ON inward_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write inward" ON inward_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update inward" ON inward_entries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated read inward_items" ON inward_entry_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write inward_items" ON inward_entry_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update inward_items" ON inward_entry_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete inward_items" ON inward_entry_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated read outward" ON outward_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write outward" ON outward_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update outward" ON outward_entries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated read outward_items" ON outward_entry_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write outward_items" ON outward_entry_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update outward_items" ON outward_entry_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete outward_items" ON outward_entry_items FOR DELETE TO authenticated USING (true);

-- Only admin can delete entries
CREATE POLICY "Admin delete inward" ON inward_entries FOR DELETE TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin delete outward" ON outward_entries FOR DELETE TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- User can see own profile, admin can see all
CREATE POLICY "User read own profile" ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin manage profiles" ON user_profiles FOR ALL TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- =============================================
-- SEED DEFAULT DATA
-- =============================================
INSERT INTO categories (name) VALUES ('Mango'), ('Teak'), ('Pine'), ('Sagwan') ON CONFLICT DO NOTHING;
INSERT INTO wood_types (name) VALUES ('Normal'), ('Premium'), ('Grade A'), ('Grade B') ON CONFLICT DO NOTHING;
