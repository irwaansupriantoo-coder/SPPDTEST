-- ─── MIGRATION: Fix User Management Tables ──────────────────────────────
-- 1. Create kv_store_e15eeec0 table (was never created in this project)
-- 2. Fix pegawai role constraint (too restrictive)
-- 3. Add missing 'bidang' column to pegawai table

-- ─── 1. CREATE KV STORE TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kv_store_e15eeec0 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Disable RLS for KV store
ALTER TABLE kv_store_e15eeec0 DISABLE ROW LEVEL SECURITY;

-- ─── 2. FIX PEGAWAI ROLE CONSTRAINT ─────────────────────────────────────
-- Drop the old restrictive constraint and add one that includes all valid roles
ALTER TABLE pegawai DROP CONSTRAINT IF EXISTS pegawai_role_check;
ALTER TABLE pegawai ADD CONSTRAINT pegawai_role_check 
  CHECK (role IN ('pegawai', 'admin', 'verifikator', 'kpa', 'pptk', 'bendahara', 'pengelola'));

-- ─── 3. ADD MISSING BIDANG COLUMN ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pegawai' AND column_name = 'bidang'
  ) THEN
    ALTER TABLE pegawai ADD COLUMN bidang TEXT DEFAULT '';
  END IF;
END $$;

-- ─── 4. MAKE auth_id NULLABLE (for users created without Supabase Auth) ─
ALTER TABLE pegawai ALTER COLUMN auth_id DROP NOT NULL;
