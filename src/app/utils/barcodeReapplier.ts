import { signPdf } from './pdfSigner';
import { getPegawaiApprovals } from './statusStore';

/**
 * Re-applies all barcodes to a document based on the current approval status.
 * This is useful when a document is re-uploaded and needs to retain previous approvals.
 */
export const reapplyBarcodes = async (docId: string, data: any) => {
  if (!['kwitansi', 'rincian', 'laporan'].includes(docId)) return;
  
  const noSppd = data.noSppd || data.no_sppd;
  if (!noSppd) return;

  const status = data.status || 'belum_spj';

  try {
    // 1. Re-apply Pegawai
    const approvedNips = await getPegawaiApprovals(noSppd);
    if (approvedNips && approvedNips.length > 0 && data.pelaksana) {
      for (const nip of approvedNips) {
        const p = data.pelaksana.find((pel: any) => (pel.nip || "").replace(/[\s-]/g, "") === nip.replace(/[\s-]/g, ""));
        if (p) {
          const pelaksanaIndex = data.pelaksana.findIndex((pel: any) => pel.nip === p.nip);
          const customSymbol = pelaksanaIndex >= 0 ? '#'.repeat(pelaksanaIndex + 1) : undefined;
          await signPdf(`sppd_${docId}_${noSppd}`, "Pelaksana", p.nama || "Pegawai", p.nip || "-", docId === 'kwitansi' && pelaksanaIndex === 0 ? "$$$$" : customSymbol);
        }
      }
    }

    // Statuses that imply Bendahara has approved or is past it
    const bendaharaApproved = ['menunggu_verifikasi_pptk', 'menunggu_verifikasi_kpa', 'menunggu_pembayaran', 'selesai'].includes(status);
    
    // Statuses that imply PPTK has approved or is past it
    const pptkApproved = ['menunggu_verifikasi_kpa', 'menunggu_pembayaran', 'selesai'].includes(status);
    
    // Statuses that imply KPA has approved or is past it
    const kpaApproved = ['menunggu_pembayaran', 'selesai'].includes(status);

    // 2. Re-apply Bendahara
    if (bendaharaApproved) {
      await signPdf(`sppd_${docId}_${noSppd}`, "Bendahara", "Wenry Adeputra, S.E.", "19910627 202321 1 019");
    }

    // 3. Re-apply PPTK
    if (pptkApproved) {
      // PPTK doesn't sign Rincian for Dalam Daerah, only Luar Daerah (as per PersetujuanSPJPPTK.tsx logic)
      if (docId !== 'rincian' || data.tipePerjalanan === 'Luar Daerah') {
        await signPdf(`sppd_${docId}_${noSppd}`, "PPTK", "Rahmawati", "199511302022032030");
      }
    }

    // 4. Re-apply KPA
    if (kpaApproved) {
      await signPdf(`sppd_${docId}_${noSppd}`, "Kepala Bidang", "Wahid Hasyim", "198202082005021002");
    }

  } catch (error) {
    console.error("Failed to reapply barcodes:", error);
  }
};
