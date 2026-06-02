-- ============================================================
-- LavagePro – Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables.
-- All authenticated users share the same workspace data.
-- ============================================================

-- ── Clients ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- created_by (audit)
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_authenticated" ON clients
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── Revenues ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenues (
  id              TEXT PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- created_by (audit)
  client_type     TEXT,
  client_name     TEXT,
  client_id       TEXT,
  car_plate       TEXT,
  vehicle_model   TEXT,
  washing_type    TEXT,
  price           NUMERIC,
  payment_method  TEXT,
  date            DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revenues_authenticated" ON revenues
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── Expenses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- created_by (audit)
  category    TEXT,
  amount      NUMERIC,
  date        DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_authenticated" ON expenses
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── Invoices ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              TEXT PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- created_by (audit)
  invoice_number  TEXT,
  client_id       TEXT,
  client_name     TEXT,
  client_email    TEXT,
  client_phone    TEXT,
  client_address  TEXT,
  items           JSONB DEFAULT '[]',
  subtotal        NUMERIC DEFAULT 0,
  tax             NUMERIC DEFAULT 0,
  total           NUMERIC DEFAULT 0,
  status          TEXT DEFAULT 'unpaid',
  date            DATE,
  due_date        DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_authenticated" ON invoices
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── Settings (one shared row for the whole workspace) ──────
CREATE TABLE IF NOT EXISTS settings (
  id                TEXT PRIMARY KEY,             -- always 'app-settings'
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- last updated by
  company_name      TEXT DEFAULT 'LavagePro',
  company_phone     TEXT DEFAULT '',
  company_email     TEXT DEFAULT '',
  company_address   TEXT DEFAULT '',
  tax_number        TEXT DEFAULT '',
  invoice_footer    TEXT DEFAULT 'Merci de votre confiance · LavagePro',
  statement_footer  TEXT DEFAULT 'Paiement dû dans les 30 jours suivant la date de ce relevé. Merci pour votre confiance.',
  logo              TEXT,
  wash_types        JSONB DEFAULT '["Lavage simple","Lavage complet","Lavage premium","Nettoyage intérieur","Détailing complet","Lavage express","Lavage à la main"]',
  expense_categories JSONB DEFAULT '[{"name":"Eau","color":"#4F86C6"},{"name":"Électricité","color":"#F5A623"},{"name":"Salaires","color":"#D97757"},{"name":"Produits d''entretien","color":"#4BAE8A"},{"name":"Loyer","color":"#9B7FD4"},{"name":"Maintenance","color":"#E05C6B"},{"name":"Carburant","color":"#6DB5A7"},{"name":"Équipement","color":"#F7C59F"},{"name":"Autre","color":"#94a3b8"}]',
  updated_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_authenticated" ON settings
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
