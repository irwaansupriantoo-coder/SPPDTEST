-- Matikan RLS untuk tabel status agar siapa saja (KPA/Admin) yang memiliki akses
-- aplikasi dapat langsung melakukan upsert ke tabel pelacakan status.
-- (Ini adalah cara paling mudah untuk mengatasi error "new row violates row-level security policy")

ALTER TABLE sppd_statuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE sppd_pegawai_approvals DISABLE ROW LEVEL SECURITY;

-- Jika Anda tetap ingin menggunakan RLS, berikan akses penuh kepada role authenticated:
-- ALTER TABLE sppd_statuses ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow authenticated to update sppd_statuses" ON sppd_statuses;
-- CREATE POLICY "Allow authenticated to update sppd_statuses" ON sppd_statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);
