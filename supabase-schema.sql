-- Run this in Supabase SQL Editor to create the orders table

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  retailcrm_id VARCHAR UNIQUE NOT NULL,
  external_id VARCHAR,
  first_name VARCHAR NOT NULL DEFAULT '',
  last_name VARCHAR NOT NULL DEFAULT '',
  phone VARCHAR,
  email VARCHAR,
  status VARCHAR DEFAULT 'new',
  city VARCHAR DEFAULT '',
  address_text TEXT DEFAULT '',
  utm_source VARCHAR DEFAULT '',
  total_amount INTEGER NOT NULL DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (allow read for anon key)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON orders
  FOR SELECT USING (true);

-- Index for common queries
CREATE INDEX idx_orders_city ON orders(city);
CREATE INDEX idx_orders_utm ON orders(utm_source);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_total ON orders(total_amount);
