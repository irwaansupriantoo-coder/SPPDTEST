-- ─── MIGRATION: Tabel tambahan untuk menggantikan localStorage ───────────
-- Semua data yang sebelumnya disimpan di localStorage/browser kini persisten di Supabase

-- ─── TABEL STATUS PENGAJUAN SPPD ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sppd_statuses (
  no_sppd         TEXT        PRIMARY KEY,
  status          TEXT        NOT NULL DEFAULT 'Menunggu Persetujuan',
  approval_date   TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL APPROVAL PEGAWAI (per SPPD) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sppd_pegawai_approvals (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  no_sppd         TEXT        NOT NULL,
  nip             TEXT        NOT NULL,
  approved_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (no_sppd, nip)
);

-- ─── TABEL STATUS LAPORAN (SPJ status per SPPD) ─────────────────────────
CREATE TABLE IF NOT EXISTS sppd_laporan_status (
  no_sppd         TEXT        PRIMARY KEY,
  status          TEXT        NOT NULL DEFAULT 'belum_spj',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL DATA PELAKSANA (biaya per pelaksana per SPPD) ─────────────────
CREATE TABLE IF NOT EXISTS sppd_pelaksana_data (
  no_sppd         TEXT        PRIMARY KEY,
  pelaksana       JSONB       NOT NULL DEFAULT '[]',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL PROGRAM & TANGGAL (per SPPD) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sppd_program_data (
  no_sppd         TEXT        PRIMARY KEY,
  program_data    JSONB       NOT NULL DEFAULT '{}',
  dates_data      JSONB       NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL HIDDEN SPPD IDS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sppd_hidden_ids (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  no_sppd         TEXT        NOT NULL UNIQUE,
  hidden_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL ACTIVITY LOGS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  type            TEXT        NOT NULL,
  title           TEXT        NOT NULL,
  description     TEXT,
  sppd            TEXT,
  timestamp       TIMESTAMPTZ DEFAULT NOW(),
  user_nama       TEXT,
  user_nip        TEXT,
  user_role       TEXT
);

-- ─── TABEL USER PROFILES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  nip             TEXT        PRIMARY KEY,
  nama            TEXT,
  pangkat         TEXT,
  jabatan         TEXT,
  profile_picture TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL NOMOR KWITANSI ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kwitansi_numbers (
  key             TEXT        PRIMARY KEY,
  value           TEXT        NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL BUKTI PEMBAYARAN ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bukti_pembayaran (
  no_sppd         TEXT        PRIMARY KEY,
  file_name       TEXT        NOT NULL,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL SUB KEGIATAN (proper table, replacing KV/localStorage) ────────
CREATE TABLE IF NOT EXISTS sub_kegiatan (
  id              TEXT        PRIMARY KEY,
  program         TEXT        NOT NULL,
  kegiatan        TEXT        NOT NULL,
  nama            TEXT        NOT NULL,
  pagu_dalam_daerah   BIGINT  DEFAULT 0,
  realisasi_dalam_daerah BIGINT DEFAULT 0,
  pagu_luar_daerah    BIGINT  DEFAULT 0,
  realisasi_luar_daerah  BIGINT DEFAULT 0,
  pengelola_nips  JSONB       DEFAULT '[]',
  pptk_nip        TEXT        DEFAULT '',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL CLEAR PENGAJUAN TIMESTAMP ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key             TEXT        PRIMARY KEY,
  value           TEXT        NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_sppd_pegawai_approvals_nosppd ON sppd_pegawai_approvals(no_sppd);
CREATE INDEX IF NOT EXISTS idx_sppd_hidden_nosppd ON sppd_hidden_ids(no_sppd);
CREATE INDEX IF NOT EXISTS idx_sub_kegiatan_pptk ON sub_kegiatan(pptk_nip);

-- ─── ENABLE REALTIME ─────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE sppd_statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE sppd_laporan_status;
ALTER PUBLICATION supabase_realtime ADD TABLE sppd_pelaksana_data;
ALTER PUBLICATION supabase_realtime ADD TABLE sppd_hidden_ids;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE sub_kegiatan;
ALTER PUBLICATION supabase_realtime ADD TABLE pengajuan_sppd;
ALTER PUBLICATION supabase_realtime ADD TABLE bukti_pembayaran;

-- ─── SEED SUB KEGIATAN DEFAULT ───────────────────────────────────────────
INSERT INTO sub_kegiatan (id, program, kegiatan, nama, pagu_dalam_daerah, pagu_luar_daerah) VALUES
  ('2.17.07.2.01.04.5.1.02.04.01.0003 - Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan Usaha Mikro',
   'Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)',
   'Pemberdayaan usaha Mikro yang dilakukan melalui pendataan, kemitraan, kemudahan perizinan, Kelembagaan dan koordinasi dengan para pemangku kepentingan',
   '2.17.07.2.01.04.5.1.02.04.01.0003 - Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan Usaha Mikro',
   150000000, 0),
  ('2.17.07.2.01.04.5.1.02.04.01.0004 - Sub Kegiatan Pendataan Potensi Usaha Mikro',
   'Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)',
   'Pemberdayaan usaha Mikro yang dilakukan melalui pendataan, kemitraan, kemudahan perizinan, Kelembagaan dan koordinasi dengan para pemangku kepentingan',
   '2.17.07.2.01.04.5.1.02.04.01.0004 - Sub Kegiatan Pendataan Potensi Usaha Mikro',
   100000000, 0),
  ('2.17.07.2.01.04.5.1.02.04.01.0005 - Sub Kegiatan Fasilitasi Akses Permodalan',
   'Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)',
   'Pengembangan Usaha Mikro melalui Fasilitasi, Bimbingan Teknis, dan Pendampingan',
   '2.17.07.2.01.04.5.1.02.04.01.0005 - Sub Kegiatan Fasilitasi Akses Permodalan',
   200000000, 0),
  ('2.17.07.2.01.04.5.1.02.04.01.0006 - Sub Kegiatan Pelatihan dan Bimbingan Teknis',
   'Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)',
   'Pengembangan Usaha Mikro melalui Fasilitasi, Bimbingan Teknis, dan Pendampingan',
   '2.17.07.2.01.04.5.1.02.04.01.0006 - Sub Kegiatan Pelatihan dan Bimbingan Teknis',
   0, 500000000),
  ('2.17.07.2.01.04.5.1.02.04.01.0007 - Pelatihan Manajemen Koperasi',
   'Program Pengembangan Koperasi',
   'Peningkatan Kualitas SDM Koperasi',
   '2.17.07.2.01.04.5.1.02.04.01.0007 - Pelatihan Manajemen Koperasi',
   0, 400000000),
  ('2.17.07.2.01.04.5.1.02.04.01.0008 - Pemeriksaan Kelembagaan Koperasi',
   'Program Pengembangan Koperasi',
   'Pengawasan dan Pemeriksaan Koperasi',
   '2.17.07.2.01.04.5.1.02.04.01.0008 - Pemeriksaan Kelembagaan Koperasi',
   150000000, 0)
ON CONFLICT (id) DO NOTHING;
