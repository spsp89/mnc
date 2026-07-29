CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'category',
  accent_color TEXT NOT NULL DEFAULT '#0B2F74',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  logo_url TEXT,
  thumbnail_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  area TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Kozhikode',
  region TEXT NOT NULL DEFAULT 'Kerala',
  country TEXT NOT NULL DEFAULT 'India',
  address_label TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rating_average NUMERIC(3,2) NOT NULL DEFAULT 4.5,
  rating_count INTEGER NOT NULL DEFAULT 0,
  distance_km NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  badge_text TEXT,
  badge_color TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  search_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'plate',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clinics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  address_label TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Kozhikode',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  speciality TEXT NOT NULL,
  experience TEXT NOT NULL,
  rating_average NUMERIC(3,2) NOT NULL DEFAULT 4.5,
  rating_count INTEGER NOT NULL DEFAULT 0,
  next_slot TEXT NOT NULL,
  fee TEXT NOT NULL,
  image_url TEXT NOT NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_slot TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  business_id TEXT REFERENCES businesses(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  image_url TEXT NOT NULL,
  accent_color TEXT NOT NULL DEFAULT '#0B2F74',
  section TEXT NOT NULL DEFAULT 'main',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  subcategory_slug TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  unit TEXT NOT NULL DEFAULT '1 kg',
  price NUMERIC(8,2) NOT NULL DEFAULT 0,
  old_price NUMERIC(8,2) NOT NULL DEFAULT 0,
  discount_text TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT 'Local shop',
  product_type TEXT NOT NULL DEFAULT '',
  organic TEXT NOT NULL DEFAULT 'No',
  form_factor TEXT NOT NULL DEFAULT 'Whole',
  shelf_life TEXT NOT NULL DEFAULT '7 Days',
  is_perishable BOOLEAN NOT NULL DEFAULT TRUE,
  food_type TEXT NOT NULL DEFAULT 'Fresh',
  origin TEXT NOT NULL DEFAULT 'India',
  packaging TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  unit_options TEXT[] NOT NULL DEFAULT '{}',
  size_options TEXT[] NOT NULL DEFAULT '{}',
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_areas TEXT[] NOT NULL DEFAULT '{}',
  delivery_fee TEXT NOT NULL DEFAULT '',
  delivery_eta TEXT NOT NULL DEFAULT '',
  delivery_contact TEXT NOT NULL DEFAULT '',
  order_instructions TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name TEXT NOT NULL DEFAULT 'BNC Nearu',
  tagline TEXT NOT NULL DEFAULT 'Local shops, services, offers, and bookings in one place.',
  primary_color TEXT NOT NULL DEFAULT '#0B2F74',
  secondary_color TEXT NOT NULL DEFAULT '#1C4EA1',
  accent_color TEXT NOT NULL DEFAULT '#F4B227',
  background_color TEXT NOT NULL DEFAULT '#F8F6EF',
  surface_color TEXT NOT NULL DEFAULT '#FFFCF7',
  muted_text_color TEXT NOT NULL DEFAULT '#6B7E9D',
  logo_url TEXT NOT NULL DEFAULT '/assets/branding/bnc-logo.png',
  default_city TEXT NOT NULL DEFAULT 'Kozhikode',
  default_region TEXT NOT NULL DEFAULT 'Kerala',
  support_phone TEXT NOT NULL DEFAULT '+91 98765 00000',
  support_whatsapp TEXT NOT NULL DEFAULT '+91 98765 00000',
  support_email TEXT NOT NULL DEFAULT 'support@bncnearu.com',
  currency_code TEXT NOT NULL DEFAULT 'INR',
  enable_deals BOOLEAN NOT NULL DEFAULT TRUE,
  enable_doctor_bookings BOOLEAN NOT NULL DEFAULT TRUE,
  update_interval_seconds INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  purpose TEXT NOT NULL DEFAULT 'Local shop',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_delivery_boys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  merchant_id TEXT NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  vehicle TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  merchant_id TEXT NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL,
  delivery_boy_id TEXT REFERENCES merchant_delivery_boys(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  quantity TEXT NOT NULL DEFAULT '',
  payment_note TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  landmark TEXT NOT NULL DEFAULT '',
  delivery_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  total TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_options TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_options TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status TEXT NOT NULL DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_areas TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_fee TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_eta TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_contact TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_instructions TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_flags ON businesses(is_featured, is_popular);
CREATE INDEX IF NOT EXISTS idx_businesses_search ON businesses USING gin(to_tsvector('simple', search_text));
CREATE INDEX IF NOT EXISTS idx_clinics_search ON clinics USING gin(to_tsvector('simple', name || ' ' || address_label || ' ' || area));
CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_deals_active ON deals(is_active, is_featured, section);
CREATE INDEX IF NOT EXISTS idx_products_lookup ON products(is_active, category_slug, subcategory_slug, business_id);
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_business ON merchant_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_merchant_delivery_boys_merchant ON merchant_delivery_boys(merchant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_orders_merchant ON merchant_orders(merchant_id, created_at DESC);

INSERT INTO categories (name, slug, icon, accent_color, sort_order, is_active)
VALUES
  ('Grocery', 'grocery', 'shopping-cart', '#FF5A4C', 1, TRUE),
  ('Restaurants', 'restaurants', 'utensils-crossed', '#FFB01E', 2, TRUE),
  ('Bakery & Sweets', 'bakery-sweets', 'utensils-crossed', '#D94842', 3, FALSE),
  ('Tailors', 'tailors', 'scissors', '#0B285E', 4, TRUE),
  ('Beauty', 'beauty', 'sparkles', '#FF7186', 5, TRUE),
  ('Electronics', 'electronics', 'monitor-smartphone', '#6A66FF', 6, TRUE),
  ('Home Services', 'home-services', 'house-plus', '#4AB64B', 7, TRUE),
  ('Pharmacy', 'pharmacy', 'layout-grid', '#1F9D7A', 8, FALSE),
  ('Gifts & Stationery', 'gifts-stationery', 'layout-grid', '#8A5BFF', 9, FALSE),
  ('More', 'more', 'layout-grid', '#7183A6', 10, FALSE)
ON CONFLICT (slug) DO UPDATE
SET name = excluded.name,
  icon = excluded.icon,
  accent_color = excluded.accent_color,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

UPDATE categories
SET is_active = FALSE, updated_at = now()
WHERE slug IN ('restaurant', 'clinic', 'bakery', 'mobile', 'doctor-booking');

INSERT INTO app_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (
  category_id, slug, name, short_description, thumbnail_url, phone, whatsapp,
  area, city, address_label, rating_average, rating_count, distance_km,
  is_featured, is_popular, badge_text, badge_color, tags, search_text
)
SELECT c.id, data.slug, data.name, data.short_description, data.thumbnail_url,
  data.phone, data.whatsapp, data.area, 'Kozhikode', data.address_label,
  data.rating_average, data.rating_count, data.distance_km, data.is_featured,
  data.is_popular, data.badge_text, data.badge_color, data.tags, data.search_text
FROM categories c
JOIN (
  VALUES
    ('restaurants','spice-garden','Spice Garden','Family restaurant and dinner spot','/mockup/im-restaurant.jpg','+91 98765 11111','+91 98765 11111','Mavoor Road','Spice Garden, Mavoor Road, Kozhikode',4.6,126,1.2,true,true,'20% OFF','#2469D6',ARRAY['restaurants','dinner','family'],'spice garden restaurant dinner family mavoor road'),
    ('grocery','fresh-basket','Fresh Basket','Fresh grocery and daily essentials','/mockup/im-vegetables.jpg','+91 98765 22222','+91 98765 22222','Nadakkavu','Fresh Basket, Nadakkavu, Kozhikode',4.5,162,2.1,true,false,'Fresh Today','#25A451',ARRAY['grocery','vegetables','daily'],'fresh basket grocery vegetables nadakkavu'),
    ('beauty','maya-beauty-salon','Maya Beauty Salon','Salon, spa and grooming services','/mockup/im-beauty.jpg','+91 98765 33333','+91 98765 33333','PT Usha Road','Maya Beauty Salon, PT Usha Road, Kozhikode',4.7,214,1.9,true,true,'Top Rated','#D94842',ARRAY['salon','spa','beauty'],'maya beauty salon spa grooming'),
    ('pharmacy','city-care-pharmacy','City Care Pharmacy','Medicines and health essentials','/mockup/im-pharmacy.jpg','+91 98765 44444','+91 98765 44444','Bank Road','City Care Pharmacy, Bank Road, Kozhikode',4.5,94,1.6,false,true,'Trusted','#0B2F74',ARRAY['pharmacy','medicine','health'],'city care pharmacy medicine health')
) AS data(category_slug, slug, name, short_description, thumbnail_url, phone, whatsapp, area, address_label, rating_average, rating_count, distance_km, is_featured, is_popular, badge_text, badge_color, tags, search_text)
ON c.slug = data.category_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO business_images (business_id, url, alt, variant, is_primary)
SELECT b.id, b.thumbnail_url, b.name || ' image', 'plate', TRUE
FROM businesses b
WHERE b.thumbnail_url IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO clinics (slug, name, image_url, phone, whatsapp, address_label, area, distance_km)
VALUES
  ('careplus-family-clinic','CarePlus Family Clinic','/mockup/im-pharmacy.jpg','+91 98765 21010','+91 98765 21010','CarePlus Family Clinic, Mavoor Road, Kozhikode','Mavoor Road',1.1),
  ('smile-care-dental-studio','Smile Care Dental Studio','/mockup/im-optical.jpg','+91 98470 44122','+91 98470 44122','Smile Care Dental Studio, Stadium Junction, Kozhikode','Stadium Junction',1.8),
  ('glow-skin-clinic','Glow Skin Clinic','/mockup/im-beauty.jpg','+91 97455 88221','+91 97455 88221','Glow Skin Clinic, PT Usha Road, Kozhikode','PT Usha Road',2.4),
  ('city-care-hospital','City Care Hospital','/mockup/im-pharmacy.jpg','+91 98460 11880','+91 98460 11880','City Care Hospital, Bank Road, Kozhikode','Bank Road',2.0)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO doctors (clinic_id, slug, name, speciality, experience, rating_average, rating_count, next_slot, fee, image_url, services)
SELECT c.id, data.slug, data.name, data.speciality, data.experience, data.rating_average, data.rating_count, data.next_slot, data.fee, data.image_url, data.services
FROM clinics c
JOIN (
  VALUES
    ('careplus-family-clinic','dr-anjali-menon','Dr. Anjali Menon','General Physician','12 yrs exp',4.8,126,'Today 6:30 PM','Rs300','/mockup/im-occ_reception.jpg',ARRAY['Fever','Diabetes','BP check']),
    ('careplus-family-clinic','dr-kiran-joseph','Dr. Kiran Joseph','Pediatrician','10 yrs exp',4.6,88,'Today 8:00 PM','Rs400','/mockup/im-occ_helper.jpg',ARRAY['Child fever','Vaccination','Cold']),
    ('smile-care-dental-studio','dr-sameer-rahman','Dr. Sameer Rahman','Dentist','9 yrs exp',4.7,96,'Tomorrow 10:00 AM','Rs500','/mockup/im-optical.jpg',ARRAY['Tooth pain','Cleaning','Root canal']),
    ('glow-skin-clinic','dr-meera-nair','Dr. Meera Nair','Dermatologist','8 yrs exp',4.9,142,'Today 7:15 PM','Rs650','/mockup/im-beauty.jpg',ARRAY['Skin allergy','Acne','Hair care']),
    ('city-care-hospital','dr-faisal-ahmed','Dr. Faisal Ahmed','Cardiologist','15 yrs exp',4.8,178,'Today 5:45 PM','Rs800','/mockup/im-occ_computer.jpg',ARRAY['Chest pain','ECG','Heart check'])
) AS data(clinic_slug, slug, name, speciality, experience, rating_average, rating_count, next_slot, fee, image_url, services)
ON c.slug = data.clinic_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO deals (
  business_id, slug, title, description, code, image_url, accent_color,
  section, is_featured, sort_order
)
SELECT b.id, data.slug, data.title, data.description, data.code, data.image_url,
  data.accent_color, data.section, data.is_featured, data.sort_order
FROM businesses b
JOIN (
  VALUES
    ('city-care-pharmacy','health-checkup-rs599','Rs599 health checkup','Full body health checkup package today.','CARE599','/mockup/im-pharmacy.jpg','#12459B','main',true,10),
    ('maya-beauty-salon','salon-combo-rs599','Rs599 salon combo','Hair spa and haircut package.','SPA599','/mockup/im-beauty.jpg','#0B2F74','combo',true,20),
    ('fresh-basket','fresh-vegetables-15-off','15% off fresh vegetables','Save on selected fresh vegetables.','VEG15','/mockup/im-vegetables.jpg','#0E7A43','main',false,30),
    ('spice-garden','family-dinner-combo','Family dinner combo','Save on dinner combos for four.','FAMILY15','/mockup/im-restaurant.jpg','#8D3F20','combo',false,40)
) AS data(business_slug, slug, title, description, code, image_url, accent_color, section, is_featured, sort_order)
ON b.slug = data.business_slug
ON CONFLICT (slug) DO NOTHING;
