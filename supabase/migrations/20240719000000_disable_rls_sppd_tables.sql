-- ─── MIGRATION: Disable RLS for all SPPD Tables ───────────
-- Disable Row Level Security on tables created for the offline to online migration
-- This allows the application to directly insert/update rows without needing an authenticated session,
-- making it 100% online across all devices.

ALTER TABLE sppd_statuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE sppd_pegawai_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE sppd_laporan_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE sppd_pelaksana_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE sppd_program_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE sppd_hidden_ids DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE kwitansi_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE bukti_pembayaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_kegiatan DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
