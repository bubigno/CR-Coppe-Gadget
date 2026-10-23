-- SCHEMA SUPABASE — CR Coppe & Gadget (SQL Editor → incolla ed esegui tutto, anche più volte)
-- Sicuro sul progetto esistente: le nuove tabelle NON collidono con quelle del vecchio sito
-- (servizi, site_content), che restano intatte. Schema idempotente: rieseguibile senza errori.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  image text DEFAULT '',
  parent_slug text REFERENCES categories(slug),
  sort_order int NOT NULL DEFAULT 0,
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  seo_noindex boolean DEFAULT false,
  seo_og_image text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  code text DEFAULT '',
  short_description text DEFAULT '',
  full_description text DEFAULT '',
  category_slug text REFERENCES categories(slug),
  main_image text DEFAULT '',
  image_alt text DEFAULT '',
  materials text DEFAULT '',
  dimensions text DEFAULT '',
  colors text DEFAULT '',
  variants text DEFAULT '',
  price text DEFAULT '',
  availability text DEFAULT '',
  customization_info text DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false,
  views int NOT NULL DEFAULT 0,
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  seo_noindex boolean DEFAULT false,
  seo_og_image text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_slug);
CREATE INDEX IF NOT EXISTS idx_products_published ON products (published);

CREATE TABLE IF NOT EXISTS product_images (
  id bigserial PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  position int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_images ON product_images (product_id, position);

CREATE TABLE IF NOT EXISTS product_specs (
  id bigserial PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  position int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_specs ON product_specs (product_id, position);

CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  hero_image text DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  seo_noindex boolean DEFAULT false,
  seo_og_image text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_blocks (
  id bigserial PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  heading text DEFAULT '',
  text text DEFAULT '',
  position int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_page_blocks ON page_blocks (page_id, position);

CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'preventivo' CHECK (type IN ('preventivo','contatto','informazioni')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text DEFAULT '',
  email text NOT NULL,
  phone text DEFAULT '',
  product_slug text DEFAULT '',
  product_name text DEFAULT '',
  quantity text DEFAULT '',
  message text NOT NULL,
  privacy_accepted boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'nuova' CHECK (status IN ('nuova','in_lavorazione','completata')),
  admin_notes text DEFAULT '',
  ip text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qr_created ON quote_requests (created_at);
CREATE INDEX IF NOT EXISTS idx_qr_status_created ON quote_requests (status, created_at);
CREATE INDEX IF NOT EXISTS idx_qr_ip_created ON quote_requests (ip, created_at);

CREATE TABLE IF NOT EXISTS settings (
  id text PRIMARY KEY DEFAULT 'site_settings' CHECK (id = 'site_settings'),
  company_name text DEFAULT 'CR Coppe & Gadget',
  tagline text DEFAULT '',
  hero_title text DEFAULT '',
  hero_subtitle text DEFAULT '',
  about_short text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  opening_hours text DEFAULT '',
  map_embed_url text DEFAULT '',
  facebook text DEFAULT '',
  instagram text DEFAULT '',
  linkedin text DEFAULT '',
  site_url text DEFAULT '',
  google_analytics_id text DEFAULT '',
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  seo_noindex boolean DEFAULT false,
  seo_og_image text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_slug text UNIQUE NOT NULL,
  to_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id bigserial PRIMARY KEY,
  event text NOT NULL CHECK (event IN ('pageview','click')),
  path text DEFAULT '',
  label text DEFAULT '',
  referrer text DEFAULT '',
  session_id text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ae_created ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_ae_event_created ON analytics_events (event, created_at);
CREATE INDEX IF NOT EXISTS idx_ae_path_created ON analytics_events (path, created_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  identifier text PRIMARY KEY,
  count int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: attivata su tutte le tabelle, NESSUNA policy pubblica.
-- Solo il backend con SUPABASE_SERVICE_ROLE_KEY (che bypassa RLS) legge e scrive.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Bucket pubblico per le immagini (lettura pubblica, scrittura solo via service role / URL firmati)
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;