import { get } from "idb-keyval";
import {
  getLaporanStatus,
  getPelaksanaData,
  getProgramData,
  setPelaksanaData,
} from "./supabaseDataStore";

export const hydrateLaporanDataAsync = async (d: any) => {
  let status = "belum_spj"; // Default to belum_spj for new Laporan
  try {
    const storedStatus = await getLaporanStatus(d.noSppd);
    if (storedStatus) {
      status = storedStatus;
    }
  } catch (e) {}

  let hydratedPelaksana = d.pelaksana;
  let hydratedTotalAnggaran = d.totalAnggaran;

  try {
    const storedPelaksana = await getPelaksanaData(d.noSppd);
    if (storedPelaksana && storedPelaksana.length > 0) {
      hydratedPelaksana = storedPelaksana;
      hydratedTotalAnggaran = hydratedPelaksana.reduce(
        (sum: number, p: any) =>
          sum +
          (p.totalBiayaHotel || 0) +
          (p.totalSewaKendaraan || 0) +
          (p.totalUangHarian || 0) +
          (p.totalPesawat || 0) +
          (p.totalKeretaApi || 0) +
          (p.totalBiayaTol || 0) +
          (p.totalTaxiBandara || 0) +
          (p.totalBiayaRepresentatif || 0),
        0
      );
    }
  } catch (e) {}

  // Async IndexedDB Draft Rescue (keep idb-keyval for draft data)
  try {
    const draft = await get(`draft_traveler_data_${d.noSppd}`);
    if (draft) {
      let total = 0;
      hydratedPelaksana = hydratedPelaksana.map((p: any) => {
        if (draft[p.nip]) {
          const tData = draft[p.nip];
          const hotel = tData.totalBiayaHotel || 0;
          const tiket =
            (tData.pesawat?.enabled ? tData.pesawat.subtotal : 0) +
            (tData.keretaApi?.enabled ? tData.keretaApi.subtotal : 0);
          const taxi = tData.taxiBandara?.enabled ? tData.taxiBandara.subtotal : 0;
          const sewa = tData.sewaKendaraan?.enabled ? tData.sewaKendaraan.subtotal : 0;
          const representatif = tData.biayaRepresentatif?.enabled
            ? tData.biayaRepresentatif.subtotal
            : 0;
          const harian = tData.totalUangHarian || 0;
          const tol = tData.biayaTol?.enabled
            ? parseInt(String(tData.biayaTol.total).replace(/\D/g, "")) || 0
            : 0;

          const pTotal = hotel + tiket + taxi + sewa + representatif + harian + tol;
          total += pTotal;

          return {
            ...p,
            totalBiayaHotel: hotel,
            totalUangHarian: harian,
            totalSewaKendaraan: sewa,
            totalPesawat: tData.pesawat?.enabled ? tData.pesawat.subtotal : 0,
            totalKeretaApi: tData.keretaApi?.enabled ? tData.keretaApi.subtotal : 0,
            totalBiayaTol: tol,
            totalTaxiBandara: taxi,
            totalBiayaRepresentatif: representatif,
          };
        }
        return p;
      });
      hydratedTotalAnggaran = total;
      
      // Sync pelaksana data to Supabase for future loading
      setPelaksanaData(d.noSppd, hydratedPelaksana).catch(() => {});
    }
  } catch (e) {}

  try {
    const { program: storedProgram, dates: storedDates } = await getProgramData(d.noSppd);

    const parsedDates = storedDates || {};
    const parsedProgram = storedProgram || {};

    return {
      ...d,
      status,
      pelaksana: hydratedPelaksana,
      totalAnggaran: hydratedTotalAnggaran,
      maksud:
        d.keperluan ||
        d.maksud ||
        d.untuk ||
        (parsedProgram as any).maksud ||
        (parsedProgram as any).untuk ||
        "Melaksanakan tugas dinas",
      tanggalPergi: (parsedDates as any).tanggalPergi || d.tanggalPergi || "2024-10-13",
      tanggalKembali:
        (parsedDates as any).tanggalKembali || d.tanggalKembali || "2024-10-20",
      ...parsedProgram,
    };
  } catch (e) {}

  return {
    ...d,
    status,
    pelaksana: hydratedPelaksana,
    totalAnggaran: hydratedTotalAnggaran,
    maksud: d.keperluan || d.maksud || d.untuk || "Melaksanakan tugas dinas",
    tanggalPergi: d.tanggalPergi || "2024-10-13",
    tanggalKembali: d.tanggalKembali || "2024-10-20",
  };
};
