-- ============================================================
-- Migration: switch from per-user isolation to shared workspace
-- Run this once in the Supabase SQL Editor.
-- ============================================================

-- 1. Drop the old per-user RLS policies
DROP POLICY IF EXISTS "clients_owner"   ON clients;
DROP POLICY IF EXISTS "revenues_owner"  ON revenues;
DROP POLICY IF EXISTS "expenses_owner"  ON expenses;
DROP POLICY IF EXISTS "invoices_owner"  ON invoices;
DROP POLICY IF EXISTS "settings_owner"  ON settings;

-- 2. Create new policies: any authenticated user can read and write all rows
CREATE POLICY "clients_authenticated" ON clients
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "revenues_authenticated" ON revenues
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_authenticated" ON expenses
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "invoices_authenticated" ON invoices
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "settings_authenticated" ON settings
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Rename any existing per-user settings rows to the shared 'app-settings' id.
--    If multiple users had their own settings, keep only the most recently updated one.
DO $$
DECLARE
  best_id TEXT;
BEGIN
  -- Find the most recently updated settings row
  SELECT id INTO best_id FROM settings ORDER BY updated_at DESC NULLS LAST LIMIT 1;

  IF best_id IS NOT NULL AND best_id <> 'app-settings' THEN
    -- Delete any extra rows first (PK constraint requires uniqueness)
    DELETE FROM settings WHERE id <> best_id;
    -- Rename the surviving row to the shared id
    UPDATE settings SET id = 'app-settings' WHERE id = best_id;
  END IF;
END $$;
