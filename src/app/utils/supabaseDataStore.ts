/**
 * supabaseDataStore.ts
 * 
 * Centralized data layer yang menggantikan semua localStorage operations.
 * Semua data bisnis disimpan di Supabase dan di-cache di memory.
 * Mendukung realtime subscription untuk update cross-device.
 */

import { getSupabaseClient, apiRequest } from './supabaseClient';
import { deleteFilesContaining } from './fileStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── In-memory cache ──────────────────────────────────────────────────────
const cache: Record<string, any> = {};

function getCached<T>(key: string): T | null {
  return cache[key] ?? null;
}

function setCache(key: string, value: any) {
  cache[key] = value;
}

// ─── Helper: Supabase client shorthand ────────────────────────────────────
function sb() {
  return getSupabaseClient();
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS PENGAJUAN SPPD
// ═══════════════════════════════════════════════════════════════════════════

export async function getStatusPengajuan(noSppd: string): Promise<string> {
  try {
    const { data: statusData } = await sb()
      .from('sppd_statuses')
      .select('status')
      .eq('no_sppd', noSppd)
      .maybeSingle();

    if (statusData?.status) {
      return statusData.status;
    }

    const { data } = await sb()
      .from('pengajuan_sppd')
      .select('status')
      .eq('no_sppd', noSppd)
      .maybeSingle();

    return data?.status || 'Menunggu Persetujuan';
  } catch (e) {
    console.error('getStatusPengajuan error:', e);
    return 'Menunggu Persetujuan';
  }
}

export async function setStatusPengajuan(noSppd: string, status: string): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Note: We don't update pengajuan_sppd.status here because "Disetujui" violates its CHECK constraint.
    // We only update sppd_statuses.

    const record: any = {
      no_sppd: noSppd,
      status,
      updated_at: now,
    };

    if (status === 'Disetujui') {
      record.approval_date = now;
    }

    const { error } = await sb()
      .from('sppd_statuses')
      .upsert(record, { onConflict: 'no_sppd' });

    if (error) {
      console.error('Supabase UPSERT Error in sppd_statuses:', error);
    }
  } catch (e) {
    console.error('setStatusPengajuan error:', e);
  }
}

export async function getTanggalPersetujuan(noSppd: string): Promise<string> {
  try {
    const { data } = await sb()
      .from('sppd_statuses')
      .select('approval_date')
      .eq('no_sppd', noSppd)
      .maybeSingle();

    return data?.approval_date || '';
  } catch (e) {
    console.error('getTanggalPersetujuan error:', e);
    return '';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
export async function resetPegawaiApprovals(noSppd: string): Promise<void> {
  try {
    const { error } = await sb()
      .from('sppd_pegawai_approvals')
      .delete()
      .eq('no_sppd', noSppd);
      
    if (error) throw error;
  } catch (e) {
    console.error('resetPegawaiApprovals error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PEGAWAI APPROVALS
// ═══════════════════════════════════════════════════════════════════════════

export async function batchGetPegawaiApprovals(noSppdList: string[]): Promise<Record<string, string[]>> {
  if (!noSppdList || noSppdList.length === 0) return {};
  try {
    const { data } = await getSupabaseClient()
      .from('sppd_pegawai_approvals')
      .select('no_sppd, nip')
      .in('no_sppd', noSppdList);
    
    const result: Record<string, string[]> = {};
    noSppdList.forEach(id => { result[id] = []; });
    (data || []).forEach((d: any) => {
      if (result[d.no_sppd]) {
        result[d.no_sppd].push(d.nip);
      }
    });
    return result;
  } catch (e) {
    console.error('batchGetPegawaiApprovals error:', e);
    return {};
  }
}

export async function getPegawaiApprovals(noSppd: string): Promise<string[]> {
  try {
    const { data } = await sb()
      .from('sppd_pegawai_approvals')
      .select('nip')
      .eq('no_sppd', noSppd);

    return (data || []).map((d: any) => d.nip);
  } catch (e) {
    console.error('getPegawaiApprovals error:', e);
    return [];
  }
}

export async function addPegawaiApproval(noSppd: string, nip: string): Promise<void> {
  try {
    await sb()
      .from('sppd_pegawai_approvals')
      .upsert({ no_sppd: noSppd, nip }, { onConflict: 'no_sppd,nip' });
  } catch (e) {
    console.error('addPegawaiApproval error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LAPORAN STATUS (SPJ status per SPPD)
// ═══════════════════════════════════════════════════════════════════════════

export async function getLaporanStatus(noSppd: string): Promise<string | null> {
  const cacheKey = `laporan_status_${noSppd}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await sb()
      .from('sppd_laporan_status')
      .select('status')
      .eq('no_sppd', noSppd)
      .maybeSingle();

    if (error) throw error;

    const status = data?.status || null;
    if (status) setCache(cacheKey, status);
    return status;
  } catch (e) {
    console.error('getLaporanStatus error:', e);
    return null;
  }
}

export async function setLaporanStatus(noSppd: string, status: string): Promise<void> {
  const cacheKey = `laporan_status_${noSppd}`;
  try {
    const { error } = await sb()
      .from('sppd_laporan_status')
      .upsert(
        { no_sppd: noSppd, status, updated_at: new Date().toISOString() },
        { onConflict: 'no_sppd' }
      );
    if (error) throw error;
    setCache(cacheKey, status);
  } catch (e) {
    console.error('setLaporanStatus error:', e);
    setCache(cacheKey, status);
  }
}

export async function setCatatanPerbaikan(noSppd: string, catatan: string | null): Promise<void> {
  try {
    const { error } = await sb()
      .from('pengajuan_sppd')
      .update({ catatan_perbaikan: catatan })
      .eq('no_sppd', noSppd);
    
    if (error) throw error;
  } catch (e) {
    console.error('setCatatanPerbaikan error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PELAKSANA DATA (biaya per pelaksana per SPPD)
// ═══════════════════════════════════════════════════════════════════════════

export async function getPelaksanaData(noSppd: string): Promise<any[] | null> {
  try {
    const { data } = await sb()
      .from('sppd_pelaksana_data')
      .select('pelaksana')
      .eq('no_sppd', noSppd)
      .maybeSingle();

    return data?.pelaksana || null;
  } catch (e) {
    console.error('getPelaksanaData error:', e);
    return null;
  }
}

export async function setPelaksanaData(noSppd: string, pelaksana: any[]): Promise<void> {
  try {
    await sb()
      .from('sppd_pelaksana_data')
      .upsert(
        { no_sppd: noSppd, pelaksana, updated_at: new Date().toISOString() },
        { onConflict: 'no_sppd' }
      );
  } catch (e) {
    console.error('setPelaksanaData error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM & DATES DATA (per SPPD)
// ═══════════════════════════════════════════════════════════════════════════

export async function getProgramData(noSppd: string): Promise<any> {
  try {
    const { data } = await sb()
      .from('sppd_program_data')
      .select('program_data, dates_data')
      .eq('no_sppd', noSppd)
      .maybeSingle();

    return {
      program: data?.program_data || null,
      dates: data?.dates_data || null,
    };
  } catch (e) {
    console.error('getProgramData error:', e);
    return { program: null, dates: null };
  }
}

export async function setProgramData(noSppd: string, programData?: any, datesData?: any): Promise<void> {
  try {
    const existing = await getProgramData(noSppd);
    await sb()
      .from('sppd_program_data')
      .upsert(
        {
          no_sppd: noSppd,
          program_data: programData ?? existing.program ?? {},
          dates_data: datesData ?? existing.dates ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'no_sppd' }
      );
  } catch (e) {
    console.error('setProgramData error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HIDDEN SPPD IDS
// ═══════════════════════════════════════════════════════════════════════════

export async function getHiddenSppdIds(): Promise<string[]> {
  try {
    const { data } = await sb()
      .from('sppd_hidden_ids')
      .select('no_sppd');

    return (data || []).map((d: any) => d.no_sppd);
  } catch (e) {
    console.error('getHiddenSppdIds error:', e);
    return [];
  }
}

export async function addHiddenSppdId(noSppd: string): Promise<void> {
  try {
    await sb()
      .from('sppd_hidden_ids')
      .upsert({ no_sppd: noSppd }, { onConflict: 'no_sppd' });
  } catch (e) {
    console.error('addHiddenSppdId error:', e);
  }
}

export async function addHiddenSppdIds(noSppdList: string[]): Promise<void> {
  try {
    const records = noSppdList.map(no_sppd => ({ no_sppd }));
    await sb()
      .from('sppd_hidden_ids')
      .upsert(records, { onConflict: 'no_sppd' });
  } catch (e) {
    console.error('addHiddenSppdIds error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ═══════════════════════════════════════════════════════════════════════════

export interface ActivityUser {
  nama: string;
  nip: string;
  role: string;
}

export type ActivityType =
  | 'login'
  | 'logout'
  | 'pengajuan_sppd'
  | 'status_sppd'
  | 'pembuatan_spj'
  | 'status_spj';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  user: ActivityUser;
  sppd?: string;
}

export async function logActivity(
  type: ActivityType,
  title: string,
  description?: string,
  sppd?: string,
  customUser?: ActivityUser
): Promise<void> {
  try {
    let currentUser: ActivityUser | null = null;
    if (customUser) {
      currentUser = customUser;
    } else {
      const { data: sessionData } = await sb().auth.getSession();
      const user = sessionData?.session?.user;
      if (user && user.user_metadata) {
        currentUser = {
          nama: user.user_metadata.nama || user.email?.split('@')[0] || 'Unknown User',
          nip: user.user_metadata.nip || 'Unknown NIP',
          role: user.user_metadata.role || 'Unknown Role',
        };
      }
    }

    if (!currentUser) return;

    await sb()
      .from('activity_logs')
      .insert({
        type,
        title,
        description: description || null,
        sppd: sppd || null,
        timestamp: new Date().toISOString(),
        user_nama: currentUser.nama,
        user_nip: currentUser.nip,
        user_role: currentUser.role,
      });
  } catch (e) {
    console.error('Failed to save activity log', e);
  }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  try {
    const { data } = await sb()
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(150);

    return (data || []).map((d: any) => ({
      id: d.id,
      type: d.type,
      title: d.title,
      description: d.description,
      sppd: d.sppd,
      timestamp: d.timestamp,
      user: {
        nama: d.user_nama,
        nip: d.user_nip,
        role: d.user_role,
      },
    }));
  } catch (e) {
    console.error('Failed to get activity logs', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILES
// ═══════════════════════════════════════════════════════════════════════════

export async function getUserProfile(nip: string): Promise<any | null> {
  try {
    const { data } = await sb()
      .from('user_profiles')
      .select('*')
      .eq('nip', nip)
      .maybeSingle();

    if (data) {
      return {
        nama: data.nama,
        pangkat: data.pangkat,
        jabatan: data.jabatan,
        profilePicture: data.profile_picture,
      };
    }
    return null;
  } catch (e) {
    console.error('getUserProfile error:', e);
    return null;
  }
}

export async function saveUserProfile(nip: string, profile: {
  nama?: string;
  pangkat?: string;
  jabatan?: string;
  profilePicture?: string;
}): Promise<void> {
  try {
    await sb()
      .from('user_profiles')
      .upsert(
        {
          nip,
          nama: profile.nama || null,
          pangkat: profile.pangkat || null,
          jabatan: profile.jabatan || null,
          profile_picture: profile.profilePicture || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'nip' }
      );
  } catch (e) {
    console.error('saveUserProfile error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KWITANSI NUMBERS
// ═══════════════════════════════════════════════════════════════════════════

export async function getKwitansiNumber(key: string): Promise<string | null> {
  try {
    const { data } = await sb()
      .from('kwitansi_numbers')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    return data?.value || null;
  } catch (e) {
    console.error('getKwitansiNumber error:', e);
    return null;
  }
}

export async function setKwitansiNumber(key: string, value: string): Promise<void> {
  try {
    await sb()
      .from('kwitansi_numbers')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
  } catch (e) {
    console.error('setKwitansiNumber error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BUKTI PEMBAYARAN
// ═══════════════════════════════════════════════════════════════════════════

export async function getBuktiPembayaran(noSppd: string): Promise<string | null> {
  try {
    const { data } = await sb()
      .from('bukti_pembayaran')
      .select('file_name')
      .eq('no_sppd', noSppd)
      .maybeSingle();

    return data?.file_name || null;
  } catch (e) {
    console.error('getBuktiPembayaran error:', e);
    return null;
  }
}

export async function setBuktiPembayaran(noSppd: string, fileName: string): Promise<void> {
  try {
    await sb()
      .from('bukti_pembayaran')
      .upsert(
        { no_sppd: noSppd, file_name: fileName, uploaded_at: new Date().toISOString() },
        { onConflict: 'no_sppd' }
      );
  } catch (e) {
    console.error('setBuktiPembayaran error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB KEGIATAN
// ═══════════════════════════════════════════════════════════════════════════

export interface SubKegiatan {
  id: string;
  program: string;
  kegiatan: string;
  nama: string;
  paguDalamDaerah: number;
  realisasiDalamDaerah: number;
  paguLuarDaerah: number;
  realisasiLuarDaerah: number;
  pengelolaNips: string[];
  pptkNip: string;
}

export async function getSubKegiatanData(): Promise<SubKegiatan[]> {
  try {
    const { data } = await sb()
      .from('sub_kegiatan')
      .select('*');

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        program: d.program,
        kegiatan: d.kegiatan,
        nama: d.nama,
        paguDalamDaerah: d.pagu_dalam_daerah || 0,
        realisasiDalamDaerah: d.realisasi_dalam_daerah || 0,
        paguLuarDaerah: d.pagu_luar_daerah || 0,
        realisasiLuarDaerah: d.realisasi_luar_daerah || 0,
        pengelolaNips: d.pengelola_nips || [],
        pptkNip: d.pptk_nip || '',
      }));
    }

    return [];
  } catch (e) {
    console.error('getSubKegiatanData error:', e);
    return [];
  }
}

export async function saveSubKegiatanData(items: SubKegiatan[]): Promise<void> {
  try {
    const records = items.map(sk => ({
      id: sk.id,
      program: sk.program,
      kegiatan: sk.kegiatan,
      nama: sk.nama,
      pagu_dalam_daerah: sk.paguDalamDaerah,
      realisasi_dalam_daerah: sk.realisasiDalamDaerah,
      pagu_luar_daerah: sk.paguLuarDaerah,
      realisasi_luar_daerah: sk.realisasiLuarDaerah,
      pengelola_nips: sk.pengelolaNips,
      pptk_nip: sk.pptkNip,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await sb()
      .from('sub_kegiatan')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      console.error('saveSubKegiatanData upsert error:', error);
      throw error;
    }
  } catch (e) {
    console.error('saveSubKegiatanData error:', e);
    throw e;
  }
}

export async function saveOneSubKegiatan(sk: SubKegiatan): Promise<void> {
  const record = {
    id: sk.id,
    program: sk.program,
    kegiatan: sk.kegiatan,
    nama: sk.nama,
    pagu_dalam_daerah: sk.paguDalamDaerah,
    realisasi_dalam_daerah: sk.realisasiDalamDaerah,
    pagu_luar_daerah: sk.paguLuarDaerah,
    realisasi_luar_daerah: sk.realisasiLuarDaerah,
    pengelola_nips: sk.pengelolaNips,
    pptk_nip: sk.pptkNip,
    updated_at: new Date().toISOString(),
  };

  console.log('[saveOneSubKegiatan] Saving:', JSON.stringify(record, null, 2));

  const { data, error } = await sb()
    .from('sub_kegiatan')
    .upsert(record, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('[saveOneSubKegiatan] Supabase error:', error);
    throw error;
  }

  console.log('[saveOneSubKegiatan] Saved successfully:', data);
}

export async function deleteSubKegiatanById(id: string): Promise<void> {
  try {
    await sb()
      .from('sub_kegiatan')
      .delete()
      .eq('id', id);
  } catch (e) {
    console.error('deleteSubKegiatanById error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// APP SETTINGS (misc key-value)
// ═══════════════════════════════════════════════════════════════════════════

export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const { data } = await sb()
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    return data?.value || null;
  } catch (e) {
    console.error('getAppSetting error:', e);
    return null;
  }
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  try {
    await sb()
      .from('app_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
  } catch (e) {
    console.error('setAppSetting error:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PENGAJUAN SPPD (direct Supabase instead of edge function)
// ═══════════════════════════════════════════════════════════════════════════

export async function getAllPengajuan(): Promise<any[]> {
  try {
    const res: any = await apiRequest('/pengajuan?limit=500');
    return res.data || [];
  } catch (e) {
    console.error('getAllPengajuan error:', e);
    return [];
  }
}

export async function createPengajuan(payload: any): Promise<any> {
  try {
    const { data: sessionData } = await sb().auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    const { data, error } = await sb()
      .from('pengajuan_sppd')
      .insert({
        no_spt: payload.noSpt,
        no_sppd: payload.noSppd,
        pembuat: payload.pembuat,
        pelaksana: payload.pelaksana || [],
        kota: payload.kota,
        total_anggaran: payload.totalAnggaran || 0,
        tipe_perjalanan: payload.tipePerjalanan,
        tempat_berangkat: payload.tempatBerangkat,
        tanggal_pergi: payload.tanggalPergi,
        tanggal_kembali: payload.tanggalKembali,
        keperluan: payload.keperluan,
        alat_angkut: payload.alatAngkut,
        ...(userId ? { created_by: userId } : {})
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: normPengajuan(data) };
  } catch (e) {
    console.error('createPengajuan error:', e);
    throw e;
  }
}

export async function updatePengajuan(id: string, updates: any): Promise<any> {
  try {
    const res = await apiRequest(`/pengajuan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res;
  } catch (e) {
    console.error('updatePengajuan error:', e);
    throw e;
  }
}

export async function setTotalAnggaranPengajuan(id: string, totalAnggaran: number): Promise<void> {
  try {
    const { error } = await sb()
      .from('pengajuan_sppd')
      .update({ total_anggaran: totalAnggaran })
      .eq('id', id);
      
    if (error) throw error;
  } catch (e) {
    console.error('setTotalAnggaranPengajuan error:', e);
  }
}

export async function deletePengajuan(id: string): Promise<void> {
  try {
    const { data: pengajuan } = await sb()
      .from('pengajuan_sppd')
      .select('no_sppd')
      .eq('id', id)
      .maybeSingle();

    if (pengajuan?.no_sppd) {
      const noSppd = pengajuan.no_sppd;
      await sb().from('sppd_statuses').delete().eq('no_sppd', noSppd);
      await sb().from('sppd_laporan_status').delete().eq('no_sppd', noSppd);
      await sb().from('sppd_pegawai_approvals').delete().eq('no_sppd', noSppd);
      await sb().from('sppd_pelaksana_data').delete().eq('no_sppd', noSppd);
      await sb().from('sppd_program_data').delete().eq('no_sppd', noSppd);
      
      // Clear associated files in IndexedDB
      try {
        await deleteFilesContaining(noSppd);
      } catch (err) {
        console.error('Failed to clean up files for', noSppd, err);
      }
      
      await sb().from('sppd_hidden_ids').delete().eq('no_sppd', noSppd);
      await sb().from('bukti_pembayaran').delete().eq('no_sppd', noSppd);
    }

    const { error } = await sb()
      .from('pengajuan_sppd')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (e) {
    console.error('deletePengajuan error:', e);
  }
}

export async function deletePengajuanByNoSppd(noSppd: string): Promise<void> {
  try {
    await sb().from('sppd_statuses').delete().eq('no_sppd', noSppd);
    await sb().from('sppd_laporan_status').delete().eq('no_sppd', noSppd);
    await sb().from('sppd_pegawai_approvals').delete().eq('no_sppd', noSppd);
    await sb().from('sppd_pelaksana_data').delete().eq('no_sppd', noSppd);
    await sb().from('sppd_program_data').delete().eq('no_sppd', noSppd);
    await sb().from('sppd_hidden_ids').delete().eq('no_sppd', noSppd);
    await sb().from('bukti_pembayaran').delete().eq('no_sppd', noSppd);
    
    // Clear associated files in Storage
    try {
      await deleteFilesContaining(noSppd);
    } catch (err) {
      console.error('Failed to clean up files for', noSppd, err);
    }

    const { error } = await sb()
      .from('pengajuan_sppd')
      .delete()
      .eq('no_sppd', noSppd);
      
    if (error) throw error;
  } catch (e) {
    console.error('deletePengajuanByNoSppd error:', e);
  }
}

export async function deletePengajuanByNoSppdList(noSppdList: string[]): Promise<void> {
  if (!noSppdList || noSppdList.length === 0) return;
  try {
    await sb().from('sppd_statuses').delete().in('no_sppd', noSppdList);
    await sb().from('sppd_laporan_status').delete().in('no_sppd', noSppdList);
    await sb().from('sppd_pegawai_approvals').delete().in('no_sppd', noSppdList);
    await sb().from('sppd_pelaksana_data').delete().in('no_sppd', noSppdList);
    await sb().from('sppd_program_data').delete().in('no_sppd', noSppdList);
    await sb().from('sppd_hidden_ids').delete().in('no_sppd', noSppdList);
    await sb().from('bukti_pembayaran').delete().in('no_sppd', noSppdList);

    // Clear associated files in Storage for all sppds
    for (const noSppd of noSppdList) {
      try {
        await deleteFilesContaining(noSppd);
      } catch (err) {
        console.error('Failed to clean up files for', noSppd, err);
      }
    }

    const { error } = await sb()
      .from('pengajuan_sppd')
      .delete()
      .in('no_sppd', noSppdList);
      
    if (error) throw error;
  } catch (e) {
    console.error('deletePengajuanByNoSppdList error:', e);
  }
}

function normPengajuan(row: any) {
  return {
    id: row.id,
    noSpt: row.no_spt,
    noSppd: row.no_sppd,
    pembuat: row.pembuat,
    pelaksana: row.pelaksana ?? [],
    kota: row.kota,
    totalAnggaran: row.total_anggaran,
    status: row.status,
    tipePerjalanan: row.tipe_perjalanan,
    tempatBerangkat: row.tempat_berangkat,
    tanggalPergi: row.tanggal_pergi,
    tanggalKembali: row.tanggal_kembali,
    keperluan: row.keperluan,
    alatAngkut: row.alat_angkut,
    catatanPerbaikan: row.catatan_perbaikan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REALTIME SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════

const activeChannels: Map<string, RealtimeChannel> = new Map();

/**
 * Subscribe to realtime changes on a table.
 * Returns an unsubscribe function.
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  channelId?: string
): () => void {
  const id = channelId || `realtime_${table}_${Date.now()}`;

  // Cleanup existing channel with same id
  const existing = activeChannels.get(id);
  if (existing) {
    sb().removeChannel(existing);
    activeChannels.delete(id);
  }

  const channel = sb()
    .channel(id)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload: any) => {
        // Invalidate cache on any change
        invalidateCacheForTable(table);
        callback(payload);
      }
    )
    .subscribe();

  activeChannels.set(id, channel);

  return () => {
    sb().removeChannel(channel);
    activeChannels.delete(id);
  };
}

function invalidateCacheForTable(table: string) {
  const prefixMap: Record<string, string> = {
    sppd_statuses: 'status_',
    sppd_laporan_status: 'laporan_status_',
  };

  const prefix = prefixMap[table];
  if (prefix) {
    for (const key of Object.keys(cache)) {
      if (key.startsWith(prefix)) {
        delete cache[key];
      }
    }
  }
}

/**
 * Cleanup all active realtime subscriptions
 */
export function cleanupSubscriptions(): void {
  for (const [id, channel] of activeChannels) {
    sb().removeChannel(channel);
    activeChannels.delete(id);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH LOAD for status (used in list views)
// ═══════════════════════════════════════════════════════════════════════════

export async function batchGetStatusPengajuan(noSppdList: string[]): Promise<Record<string, string>> {
  if (noSppdList.length === 0) return {};

  try {
    const result: Record<string, string> = {};

    // 1. Fetch from pengajuan_sppd (sebagai fallback base)
    const { data: mainData } = await sb()
      .from('pengajuan_sppd')
      .select('no_sppd, status')
      .in('no_sppd', noSppdList);

    (mainData || []).forEach((d: any) => {
      result[d.no_sppd] = d.status || 'Menunggu Persetujuan';
    });

    // 2. Fetch from sppd_statuses (sebagai prioritas utama/override)
    const { data: statusData } = await sb()
      .from('sppd_statuses')
      .select('no_sppd, status')
      .in('no_sppd', noSppdList);

    (statusData || []).forEach((d: any) => {
      if (d.status) {
        result[d.no_sppd] = d.status;
      }
    });

    // Fill defaults for missing
    noSppdList.forEach(ns => {
      if (!result[ns]) result[ns] = 'Menunggu Persetujuan';
    });

    return result;
  } catch (e) {
    console.error('batchGetStatusPengajuan error:', e);
    const result: Record<string, string> = {};
    noSppdList.forEach(ns => { result[ns] = 'Menunggu Persetujuan'; });
    return result;
  }
}

export async function batchGetLaporanStatus(noSppdList: string[]): Promise<Record<string, string>> {
  if (noSppdList.length === 0) return {};

  const result: Record<string, string> = {};

  try {
    const { data } = await sb()
      .from('sppd_laporan_status')
      .select('no_sppd, status')
      .in('no_sppd', noSppdList);

    (data || []).forEach((d: any) => {
      result[d.no_sppd] = d.status;
    });
  } catch (e) {
    console.error('batchGetLaporanStatus error:', e);
  }

  return result;
}

export async function batchGetTanggalPersetujuan(noSppdList: string[]): Promise<Record<string, string>> {
  if (noSppdList.length === 0) return {};

  try {
    const { data } = await sb()
      .from('sppd_statuses')
      .select('no_sppd, approval_date')
      .in('no_sppd', noSppdList);

    const result: Record<string, string> = {};
    (data || []).forEach((d: any) => {
      result[d.no_sppd] = d.approval_date || '';
    });
    return result;
  } catch (e) {
    console.error('batchGetTanggalPersetujuan error:', e);
    return {};
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH LOAD for pelaksana data (used in dashboard views)
// ═══════════════════════════════════════════════════════════════════════════

export async function batchGetPelaksanaData(noSppdList: string[]): Promise<Record<string, any[]>> {
  if (noSppdList.length === 0) return {};

  try {
    const { data } = await sb()
      .from('sppd_pelaksana_data')
      .select('no_sppd, pelaksana')
      .in('no_sppd', noSppdList);

    const result: Record<string, any[]> = {};
    (data || []).forEach((d: any) => {
      result[d.no_sppd] = d.pelaksana || [];
    });
    return result;
  } catch (e) {
    console.error('batchGetPelaksanaData error:', e);
    return {};
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH LOAD for program data (replaces sppd_data_* localStorage)
// ═══════════════════════════════════════════════════════════════════════════

export async function batchGetProgramData(noSppdList: string[]): Promise<Record<string, any>> {
  if (noSppdList.length === 0) return {};

  try {
    const { data } = await sb()
      .from('sppd_program_data')
      .select('no_sppd, program_data, dates_data')
      .in('no_sppd', noSppdList);

    const result: Record<string, any> = {};
    (data || []).forEach((d: any) => {
      result[d.no_sppd] = {
        ...(d.program_data || {}),
        dates: d.dates_data || {},
      };
    });
    return result;
  } catch (e) {
    console.error('batchGetProgramData error:', e);
    return {};
  }
}
