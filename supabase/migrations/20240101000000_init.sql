-- ─── TABEL PEGAWAI ────────────────────────────────────────────────────────
-- Menyimpan profil pegawai yang terhubung ke Supabase Auth
CREATE TABLE IF NOT EXISTS pegawai (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  nip         TEXT        UNIQUE NOT NULL,
  nama        TEXT        NOT NULL,
  pangkat     TEXT,
  jabatan     TEXT,
  role        TEXT        NOT NULL DEFAULT 'pegawai' CHECK (role IN ('pegawai', 'admin', 'verifikator')),
  email       TEXT        UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL ANGGARAN PERJALANAN DINAS ─────────────────────────────────────
-- Menyimpan alokasi dan realisasi anggaran per tahun per tipe perjalanan
CREATE TABLE IF NOT EXISTS anggaran_perjalanan (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tahun       TEXT        NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::TEXT,
  tipe        TEXT        NOT NULL CHECK (tipe IN ('Dalam Daerah', 'Luar Daerah')),
  total       BIGINT      NOT NULL DEFAULT 0,
  used        BIGINT      NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (tahun, tipe)
);

-- ─── TABEL PENGAJUAN SPPD ─────────────────────────────────────────────────
-- Menyimpan data pengajuan Surat Perintah Perjalanan Dinas
CREATE TABLE IF NOT EXISTS pengajuan_sppd (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  no_spt          TEXT        NOT NULL,
  no_sppd         TEXT        NOT NULL,
  pembuat         JSONB       NOT NULL,
  pelaksana       JSONB       NOT NULL DEFAULT '[]',
  kota            TEXT        NOT NULL,
  total_anggaran  BIGINT      DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'belum_spj'
                              CHECK (status IN ('belum_spj', 'menunggu_verifikasi', 'selesai', 'perbaikan')),
  tipe_perjalanan TEXT        NOT NULL CHECK (tipe_perjalanan IN ('Dalam Daerah', 'Luar Daerah')),
  tempat_berangkat TEXT,
  tanggal_pergi   DATE,
  tanggal_kembali DATE,
  keperluan       TEXT,
  alat_angkut     TEXT,
  catatan_perbaikan TEXT,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL LAPORAN SPPD (SPJ) ─────────────────────────────────────────────
-- Menyimpan data laporan pertanggungjawaban (SPJ) untuk setiap pengajuan
CREATE TABLE IF NOT EXISTS laporan_sppd (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  pengajuan_id    UUID        NOT NULL REFERENCES pengajuan_sppd(id) ON DELETE CASCADE,
  spj_data        JSONB       NOT NULL DEFAULT '{}',
  submitted_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  verified_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at     TIMESTAMPTZ,
  catatan_verifikasi TEXT,
  UNIQUE (pengajuan_id)
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pengajuan_status           ON pengajuan_sppd(status);
CREATE INDEX IF NOT EXISTS idx_pengajuan_tipe             ON pengajuan_sppd(tipe_perjalanan);
CREATE INDEX IF NOT EXISTS idx_pengajuan_created_at       ON pengajuan_sppd(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_laporan_pengajuan_id       ON laporan_sppd(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_anggaran_tahun_tipe        ON anggaran_perjalanan(tahun, tipe);

-- ─── SEED DATA ANGGARAN 2024 ──────────────────────────────────────────────
INSERT INTO anggaran_perjalanan (tahun, tipe, total, used)
VALUES
  ('2024', 'Dalam Daerah', 600000000,  450000000),
  ('2024', 'Luar Daerah',  2000000000, 840000000)
ON CONFLICT (tahun, tipe) DO NOTHING;
