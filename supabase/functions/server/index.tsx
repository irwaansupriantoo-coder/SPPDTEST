import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();
app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ─── Admin Supabase client ─────────────────────────────────────────────────
function db() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function getUser(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await db().auth.getUser(token);
  
  // Fallback for offline/demo mode when anon key is used
  if (error || !user) {
    return { id: "offline-demo-user", email: "demo@berau.go.id" };
  }
  
  return user;
}

// Cek apakah tabel sudah ada di Supabase
async function tableExists(table: string): Promise<boolean> {
  const { error } = await db().from(table).select("id").limit(1);
  return !error || error.code !== "42P01";
}

// Data pegawai default (hardcoded sebagai fallback terakhir)
const PEGAWAI_DEFAULT = [
  { nip: "19870408 200901 1 002", nama: "Hidayat Sorang, S.T., M.E.", pangkat: "Penata Tk I, III/d", jabatan: "Kepala Bidang Kop & UMKM",            email: "hidayat@berau.go.id", password: "hidayat123", role: "pegawai" },
  { nip: "19950901 202203 1 013", nama: "Irwan Suprianto, S.Kom",     pangkat: "Penata Muda, III/a", jabatan: "Pengembang Kewirausahaan Ahli Pertama", email: "irwan@berau.go.id",   password: "irwan123",   role: "pegawai" },
  { nip: "19910627 202321 1 019", nama: "Wenry Adeputra, S.E.",       pangkat: "IX",                 jabatan: "Pengawas Koperasi",                    email: "wenry@berau.go.id",   password: "wenry123",   role: "pegawai" },
];

// ─── HEALTH ───────────────────────────────────────────────────────────────
app.get("/make-server-e15eeec0/health", (c) => c.json({ status: "ok" }));

// ─── AUTH: init-users ─────────────────────────────────────────────────────
app.post("/make-server-e15eeec0/auth/init-users", async (c) => {
  const supabase = db();
  const results = [];
  const useTable = await tableExists("pegawai");

  for (const p of PEGAWAI_DEFAULT) {
    // Cek apakah sudah ada di KV (flag idempotency)
    const kvKey = `user_nip:${p.nip}`;
    const existing = await kv.get(kvKey);
    if (existing) { results.push({ nip: p.nip, status: "already_exists" }); continue; }

    // Buat user di Supabase Auth
    let authId: string | null = null;
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: p.email, password: p.password,
      user_metadata: { nama: p.nama, nip: p.nip, pangkat: p.pangkat, jabatan: p.jabatan, role: p.role },
      email_confirm: true,
    });

    if (authErr) {
      // Mungkin sudah ada di Auth — cari berdasarkan email
      const { data: list } = await supabase.auth.admin.listUsers();
      const found = list?.users?.find((u: any) => u.email === p.email);
      authId = found?.id ?? null;
      if (!authId) { results.push({ nip: p.nip, status: "auth_error", message: authErr.message }); continue; }
    } else {
      authId = authData.user.id;
    }

    // Simpan ke tabel pegawai (jika ada)
    if (useTable && authId) {
      const { error: insertErr } = await supabase.from("pegawai").insert({
        auth_id: authId, nip: p.nip, nama: p.nama,
        pangkat: p.pangkat, jabatan: p.jabatan, role: p.role, email: p.email,
      });
      if (insertErr && insertErr.code !== "23505") {
        console.log(`pegawai insert error for ${p.nip}: ${insertErr.message}`);
      }
    }

    // Selalu simpan ke KV sebagai fallback
    await kv.set(kvKey, JSON.stringify({ email: p.email, authId, nama: p.nama, nip: p.nip, pangkat: p.pangkat, jabatan: p.jabatan, role: p.role }));
    results.push({ nip: p.nip, status: "created" });
  }

  // Seed anggaran default ke KV jika belum ada
  const angDalam = await kv.get("anggaran:dalam_daerah");
  if (!angDalam) await kv.set("anggaran:dalam_daerah", JSON.stringify({ total: 600000000, used: 450000000 }));
  const angLuar = await kv.get("anggaran:luar_daerah");
  if (!angLuar) await kv.set("anggaran:luar_daerah", JSON.stringify({ total: 2000000000, used: 840000000 }));

  return c.json({ success: true, results });
});

// ─── AUTH: resolve NIP → email ────────────────────────────────────────────
app.post("/make-server-e15eeec0/auth/resolve-nip", async (c) => {
  try {
    const { nip } = await c.req.json();
    if (!nip) return c.json({ error: "NIP wajib diisi" }, 400);

    // 1. Coba tabel pegawai (jika sudah ada)
    const useTable = await tableExists("pegawai");
    if (useTable) {
      const { data, error } = await db().from("pegawai").select("email, nama, role, nip, pangkat, jabatan").eq("nip", nip).maybeSingle();
      if (!error && data) return c.json(data);
    }

    // 2. Fallback: KV store
    const raw = await kv.get(`user_nip:${nip}`);
    if (raw) {
      const p = typeof raw === "string" ? JSON.parse(raw) : raw;
      return c.json({ email: p.email, nama: p.nama, role: p.role, nip: p.nip });
    }

    // 3. Fallback terakhir: hardcoded list (auto-trigger init jika NIP valid)
    const found = PEGAWAI_DEFAULT.find((p) => p.nip === nip);
    if (found) {
      // Trigger init otomatis
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/make-server-e15eeec0/auth/init-users`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
      }).catch(() => {});
      return c.json({ email: found.email, nama: found.nama, role: found.role, nip: found.nip });
    }

    return c.json({ error: "NIP tidak ditemukan dalam sistem" }, 404);
  } catch (err) {
    console.log("resolve-nip error:", err);
    // Last resort: langsung cek hardcoded
    const { nip } = await c.req.json().catch(() => ({ nip: "" }));
    const found = PEGAWAI_DEFAULT.find((p) => p.nip === nip);
    if (found) return c.json({ email: found.email, nama: found.nama, role: found.role, nip: found.nip });
    return c.json({ error: String(err) }, 500);
  }
});

// Profil pegawai yang sedang login
app.get("/make-server-e15eeec0/auth/me", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const useTable = await tableExists("pegawai");
  if (useTable) {
    const { data } = await db().from("pegawai").select("*").eq("auth_id", user.id).maybeSingle();
    if (data) return c.json(data);
  }

  // Fallback: metadata dari Auth
  return c.json({
    email: user.email,
    nama: user.user_metadata?.nama ?? user.email,
    nip: user.user_metadata?.nip ?? "",
    role: user.user_metadata?.role ?? "pegawai",
  });
});

// ─── SETUP DB ─────────────────────────────────────────────────────────────
app.post("/make-server-e15eeec0/setup-db", async (c) => {
  const checks: Record<string, boolean> = {
    pegawai: await tableExists("pegawai"),
    anggaran_perjalanan: await tableExists("anggaran_perjalanan"),
    pengajuan_sppd: await tableExists("pengajuan_sppd"),
    laporan_sppd: await tableExists("laporan_sppd"),
  };
  const allExist = Object.values(checks).every(Boolean);
  return c.json({
    success: true,
    tables: checks,
    allExist,
    message: allExist
      ? "Semua tabel sudah ada."
      : "Beberapa tabel belum ada. Jalankan file supabase/migrations/20240101000000_init.sql di Supabase SQL Editor.",
    sql_file: "supabase/migrations/20240101000000_init.sql",
  });
});

// ─── ANGGARAN ─────────────────────────────────────────────────────────────
app.get("/make-server-e15eeec0/anggaran", async (c) => {
  const tahun = c.req.query("tahun") ?? new Date().getFullYear().toString();

  // Coba tabel dulu
  if (await tableExists("anggaran_perjalanan")) {
    const { data } = await db().from("anggaran_perjalanan").select("*").eq("tahun", tahun);
    if (data && data.length > 0) {
      return c.json({
        dalamDaerah: data.find((d: any) => d.tipe === "Dalam Daerah") ?? { total: 600000000, used: 450000000 },
        luarDaerah:  data.find((d: any) => d.tipe === "Luar Daerah")  ?? { total: 2000000000, used: 840000000 },
        tahun,
      });
    }
  }

  // Fallback KV
  const rawDalam = await kv.get("anggaran:dalam_daerah");
  const rawLuar  = await kv.get("anggaran:luar_daerah");
  return c.json({
    dalamDaerah: rawDalam ? (typeof rawDalam === "string" ? JSON.parse(rawDalam) : rawDalam) : { total: 600000000, used: 450000000 },
    luarDaerah:  rawLuar  ? (typeof rawLuar  === "string" ? JSON.parse(rawLuar)  : rawLuar)  : { total: 2000000000, used: 840000000 },
    tahun,
  });
});

app.put("/make-server-e15eeec0/anggaran", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { type, total, used, tahun } = await c.req.json();
  const yr = tahun ?? new Date().getFullYear().toString();

  if (await tableExists("anggaran_perjalanan")) {
    await db().from("anggaran_perjalanan")
      .upsert({ tahun: yr, tipe: type, total, used, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "tahun,tipe" });
  }

  // Selalu update KV juga
  const kvKey = type === "Dalam Daerah" ? "anggaran:dalam_daerah" : "anggaran:luar_daerah";
  await kv.set(kvKey, JSON.stringify({ total, used }));

  return c.json({ success: true });
});

// ─── PENGAJUAN SPPD ───────────────────────────────────────────────────────
app.get("/make-server-e15eeec0/pengajuan", async (c) => {
  const tipe   = c.req.query("tipe");
  const status = c.req.query("status");
  const limit  = parseInt(c.req.query("limit") ?? "50");

  // Coba tabel
  if (await tableExists("pengajuan_sppd")) {
    let q = db().from("pengajuan_sppd").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(limit);
    if (tipe)   q = q.eq("tipe_perjalanan", tipe);
    if (status) q = q.eq("status", status);
    const { data, count } = await q;
    if (data) return c.json({ data: (data ?? []).map(norm), total: count ?? 0 });
  }

  // Fallback KV
  const items = await kv.getByPrefix("pengajuan:");
  let data = items
    .map((v: any) => { try { return typeof v === "string" ? JSON.parse(v) : v; } catch { return null; } })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  if (tipe)   data = data.filter((d: any) => d.tipePerjalanan === tipe);
  if (status) data = data.filter((d: any) => d.status === status);

  return c.json({ data: data.slice(0, limit), total: data.length });
});

app.post("/make-server-e15eeec0/pengajuan", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const { noSpt, noSppd, pembuat, pelaksana, kota, totalAnggaran, tipePerjalanan,
          tempatBerangkat, tanggalPergi, tanggalKembali, keperluan, alatAngkut } = body;

  if (!noSpt || !noSppd || !kota || !tipePerjalanan) return c.json({ error: "Field wajib tidak lengkap" }, 400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Coba tabel
  if (await tableExists("pengajuan_sppd")) {
    const { data, error } = await db().from("pengajuan_sppd").insert({
      id, no_spt: noSpt, no_sppd: noSppd, pembuat, pelaksana: pelaksana ?? [],
      kota, total_anggaran: totalAnggaran ?? 0, tipe_perjalanan: tipePerjalanan,
      tempat_berangkat: tempatBerangkat, tanggal_pergi: tanggalPergi,
      tanggal_kembali: tanggalKembali, keperluan, alat_angkut: alatAngkut, created_by: user.id,
    }).select().single();
    if (!error && data) {
      await updateAnggaranUsed(tipePerjalanan, totalAnggaran ?? 0);
      return c.json({ success: true, data: norm(data) });
    }
    console.log("pengajuan_sppd insert error:", error?.message);
  }

  // Fallback KV
  const record = { id, noSpt, noSppd, pembuat, pelaksana: pelaksana ?? [], kota,
    totalAnggaran: totalAnggaran ?? 0, status: "belum_spj", tipePerjalanan,
    tempatBerangkat, tanggalPergi, tanggalKembali, keperluan, alatAngkut,
    createdAt: now, updatedAt: now };
  await kv.set(`pengajuan:${id}`, JSON.stringify(record));
  await updateAnggaranUsed(tipePerjalanan, totalAnggaran ?? 0);
  return c.json({ success: true, data: record });
});

app.put("/make-server-e15eeec0/pengajuan/:id", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const updates = await c.req.json();
  const now = new Date().toISOString();

  if (await tableExists("pengajuan_sppd")) {
    const map: Record<string, string> = { status: "status", catatanPerbaikan: "catatan_perbaikan" };
    const patch: Record<string, any> = { updated_at: now };
    for (const [k, col] of Object.entries(map)) if (updates[k] !== undefined) patch[col] = updates[k];
    const { data, error } = await db().from("pengajuan_sppd").update(patch).eq("id", id).select().single();
    if (!error && data) return c.json({ success: true, data: norm(data) });
  }

  // Fallback KV
  const raw = await kv.get(`pengajuan:${id}`);
  if (raw) {
    const existing = typeof raw === "string" ? JSON.parse(raw) : raw;
    const updated = { ...existing, ...updates, updatedAt: now };
    await kv.set(`pengajuan:${id}`, JSON.stringify(updated));
    return c.json({ success: true, data: updated });
  }
  return c.json({ error: "Pengajuan tidak ditemukan" }, 404);
});

app.delete("/make-server-e15eeec0/pengajuan/:id", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  if (await tableExists("pengajuan_sppd")) await db().from("pengajuan_sppd").delete().eq("id", id);
  await kv.del(`pengajuan:${id}`);
  return c.json({ success: true });
});

// ─── LAPORAN SPPD (SPJ) ───────────────────────────────────────────────────
app.post("/make-server-e15eeec0/laporan/:pengajuanId", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const pengajuanId = c.req.param("pengajuanId");
  const spjData = await c.req.json();
  const now = new Date().toISOString();

  if (await tableExists("laporan_sppd")) {
    await db().from("laporan_sppd")
      .upsert({ pengajuan_id: pengajuanId, spj_data: spjData, submitted_by: user.id, submitted_at: now }, { onConflict: "pengajuan_id" });
    await db().from("pengajuan_sppd").update({ status: "menunggu_verifikasi", updated_at: now }).eq("id", pengajuanId);
  }

  // Update KV juga
  const raw = await kv.get(`pengajuan:${pengajuanId}`);
  if (raw) {
    const existing = typeof raw === "string" ? JSON.parse(raw) : raw;
    await kv.set(`pengajuan:${pengajuanId}`, JSON.stringify({ ...existing, status: "menunggu_verifikasi", spjData, updatedAt: now }));
  }

  return c.json({ success: true });
});

app.put("/make-server-e15eeec0/laporan/:pengajuanId/verifikasi", async (c) => {
  const user = await getUser(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const pengajuanId = c.req.param("pengajuanId");
  const { action, catatan } = await c.req.json();
  const statusBaru = action === "setujui" ? "selesai" : "perbaikan";
  const now = new Date().toISOString();

  if (await tableExists("pengajuan_sppd")) {
    await db().from("laporan_sppd")
      .update({ verified_by: user.id, verified_at: now, catatan_verifikasi: catatan ?? null }).eq("pengajuan_id", pengajuanId);
    await db().from("pengajuan_sppd")
      .update({ status: statusBaru, catatan_perbaikan: catatan ?? null, updated_at: now }).eq("id", pengajuanId);
  }

  const raw = await kv.get(`pengajuan:${pengajuanId}`);
  if (raw) {
    const existing = typeof raw === "string" ? JSON.parse(raw) : raw;
    await kv.set(`pengajuan:${pengajuanId}`, JSON.stringify({ ...existing, status: statusBaru, catatanPerbaikan: catatan, updatedAt: now }));
  }

  return c.json({ success: true, status: statusBaru });
});

// ─── STATS ────────────────────────────────────────────────────────────────
app.get("/make-server-e15eeec0/stats", async (c) => {
  let data: any[] = [];

  if (await tableExists("pengajuan_sppd")) {
    const { data: rows } = await db().from("pengajuan_sppd").select("status, tipe_perjalanan");
    data = rows ?? [];
  } else {
    const items = await kv.getByPrefix("pengajuan:");
    data = items.map((v: any) => { try { return typeof v === "string" ? JSON.parse(v) : v; } catch { return null; } }).filter(Boolean);
    // Normalise field names for KV
    data = data.map((d: any) => ({ status: d.status, tipe_perjalanan: d.tipePerjalanan }));
  }

  return c.json({
    total:      data.length,
    disetujui:  data.filter((d: any) => d.status === "selesai").length,
    ditolak:    data.filter((d: any) => d.status === "perbaikan").length,
    menunggu:   data.filter((d: any) => d.status === "menunggu_verifikasi").length,
    belumSpj:   data.filter((d: any) => d.status === "belum_spj").length,
    dalamDaerah: data.filter((d: any) => d.tipe_perjalanan === "Dalam Daerah").length,
    luarDaerah:  data.filter((d: any) => d.tipe_perjalanan === "Luar Daerah").length,
  });
});

// ─── HELPERS ──────────────────────────────────────────────────────────────
function norm(row: any) {
  return {
    id:               row.id,
    noSpt:            row.no_spt,
    noSppd:           row.no_sppd,
    pembuat:          row.pembuat,
    pelaksana:        row.pelaksana ?? [],
    kota:             row.kota,
    totalAnggaran:    row.total_anggaran,
    status:           row.status,
    tipePerjalanan:   row.tipe_perjalanan,
    tempatBerangkat:  row.tempat_berangkat,
    tanggalPergi:     row.tanggal_pergi,
    tanggalKembali:   row.tanggal_kembali,
    keperluan:        row.keperluan,
    alatAngkut:       row.alat_angkut,
    catatanPerbaikan: row.catatan_perbaikan,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

async function updateAnggaranUsed(tipePerjalanan: string, amount: number) {
  const kvKey = tipePerjalanan === "Dalam Daerah" ? "anggaran:dalam_daerah" : "anggaran:luar_daerah";
  const raw = await kv.get(kvKey);
  const current = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : { total: tipePerjalanan === "Dalam Daerah" ? 600000000 : 2000000000, used: 0 };
  await kv.set(kvKey, JSON.stringify({ ...current, used: (current.used ?? 0) + amount }));

  if (await tableExists("anggaran_perjalanan")) {
    const tahun = new Date().getFullYear().toString();
    const { data } = await db().from("anggaran_perjalanan").select("used").eq("tahun", tahun).eq("tipe", tipePerjalanan).maybeSingle();
    if (data) {
      await db().from("anggaran_perjalanan")
        .update({ used: (data.used ?? 0) + amount, updated_at: new Date().toISOString() })
        .eq("tahun", tahun).eq("tipe", tipePerjalanan);
    }
  }
}

Deno.serve(app.fetch);
