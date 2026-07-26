import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import QRCode from 'qrcode';
import { getFile, saveFile } from './fileStore';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Determine the placeholder symbol for a given role and document type.
 * Kwitansi: $ = Bendahara, $$ = PPTK, $$$ = Kepala Bidang
 * Rincian:  @@ = Bendahara, @@@ = Kepala Bidang
 */
function getPlaceholderSymbol(fileKey: string, role: string): string {
  const r = role.toLowerCase();
  if (fileKey.includes('kwitansi')) {
    if (r.includes('bendahara')) return '$';
    if (r.includes('pptk')) return '$$';
    if (r.includes('kpa') || r.includes('kepala bidang')) return '$$$';
    if (r.includes('pelaksana') || r.includes('pegawai')) return '$$$$';
  } else if (fileKey.includes('rincian')) {
    if (r.includes('bendahara')) return '@@';
    if (r.includes('pptk')) return '@@@';
    if (r.includes('kpa') || r.includes('kepala bidang')) return '@@@@';
    if (r.includes('pelaksana') || r.includes('pegawai')) return '#';
  }
  return '';
}

/**
 * Uses pdfjs-dist to find the exact coordinates of a text symbol in a PDF.
 */
async function findSymbolWithPdfJs(pdfBytes: ArrayBuffer, symbol: string): Promise<{ x: number; y: number; width: number; height: number } | null> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    
    // Check the last page since signatures are usually there
    const pageNum = pdf.numPages;
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    for (const item of textContent.items) {
      if ('str' in item && 'transform' in item) {
        const text = item.str.trim();
        
        // Exact match check logic
        let isMatch = false;
        if (['$', '$$', '$$$', '$$$$', '@@', '@@@', '@@@@'].includes(symbol) || /^#+$/.test(symbol)) {
          isMatch = text === symbol;
        } else {
          isMatch = text.includes(symbol);
        }

        if (isMatch) {
          // transform is [scaleX, skewY, skewX, scaleY, tx, ty]
          const tx = item.transform[4];
          const ty = item.transform[5];
          const width = item.width || 0;
          const height = item.height || item.transform[3] || 10;
          return { x: tx, y: ty, width, height };
        }
      }
    }
  } catch (e) {
    console.error("Failed to parse PDF with pdfjs-dist:", e);
  }
  return null;
}

export const signPdf = async (fileKey: string, role: string, approverName: string, approverNip: string, customSymbol?: string): Promise<boolean> => {
  // Tidak ada barcode pada dokumen Laporan Perjalanan Dinas
  if (fileKey.includes('laporan')) {
    return true;
  }

  try {
    const file = await getFile(fileKey);
    if (!file) {
        console.error('File not found for signing');
        return false;
    }

    let pdfBytes: ArrayBuffer;
    if (file instanceof File || file instanceof Blob) {
      pdfBytes = await file.arrayBuffer();
    } else if (typeof file === 'string' && file.startsWith('data:application/pdf;base64,')) {
      const base64Data = file.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfBytes = bytes.buffer;
    } else {
      console.error('Invalid file format for signing');
      return false;
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    // Generate QR Code
    const qrData = `Ditandatangani secara elektronik oleh:\nNama: ${approverName}\nNIP: ${approverNip}\nJabatan: ${role}\nTanggal: ${new Date().toLocaleString('id-ID')}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    
    const qrCodeImageBytes = await fetch(qrCodeDataUrl).then(res => res.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrCodeImageBytes);

    const { width, height } = lastPage.getSize();
    const symbol = customSymbol || getPlaceholderSymbol(fileKey, role);

    console.log(`[signPdf] fileKey=${fileKey}, role=${role}, symbol="${symbol}", page=${width}x${height}`);

    let x: number;
    let y: number;
    let size: number;

    // Use pdfjs-dist to find the exact text position
    const symbolPos = await findSymbolWithPdfJs(pdfBytes, symbol);

    if (symbolPos) {
      console.log(`[signPdf] ✅ Found symbol "${symbol}" at PDF coordinates (${symbolPos.x}, ${symbolPos.y}) using pdfjs-dist`);
      
      // Determine appropriate size. Reduce size as requested for kwitansi to avoid covering text.
      if (fileKey.includes('kwitansi')) {
        size = 25; // Smaller size for Kwitansi
      } else if (fileKey.includes('rincian')) {
        size = 25; // Smaller size for Rincian
      } else {
        size = 35; // Standard size for others
      }

      // symbolPos.y is usually the baseline of the text.
      // We want to center the barcode around the text.
      // The center of the text is roughly symbolPos.x + width/2 and symbolPos.y + height/2
      const centerX = symbolPos.x + (symbolPos.width / 2);
      const centerY = symbolPos.y + (symbolPos.height / 2);

      x = centerX - (size / 2);
      y = centerY - (size / 2);

    } else {
      // Try to find the title or approver name as a dynamic fallback
      let dynamicTitlePos = await findSymbolWithPdfJs(pdfBytes, 'Kuasa Pengguna Anggaran');
      if (!dynamicTitlePos && role.includes('KPA')) dynamicTitlePos = await findSymbolWithPdfJs(pdfBytes, 'Kuasa Pengguna Anggaran');
      if (!dynamicTitlePos && role) dynamicTitlePos = await findSymbolWithPdfJs(pdfBytes, role);
      
      let dynamicNamePos = await findSymbolWithPdfJs(pdfBytes, approverName);

      if (dynamicTitlePos) {
        console.log(`[signPdf] ⚠ Symbol "${symbol}" not found. Dynamic fallback using title at (${dynamicTitlePos.x}, ${dynamicTitlePos.y})`);
        size = fileKey.includes('kwitansi') || fileKey.includes('rincian') ? 25 : 35;
        x = dynamicTitlePos.x + (dynamicTitlePos.width / 2) - (size / 2);
        y = dynamicTitlePos.y - size - 15; // Place below the title
      } else if (dynamicNamePos) {
        console.log(`[signPdf] ⚠ Symbol "${symbol}" not found. Dynamic fallback using name at (${dynamicNamePos.x}, ${dynamicNamePos.y})`);
        size = fileKey.includes('kwitansi') || fileKey.includes('rincian') ? 25 : 35;
        x = dynamicNamePos.x + (dynamicNamePos.width / 2) - (size / 2);
        y = dynamicNamePos.y + dynamicNamePos.height + 15; // Place above the name
      } else {
        // Fallback logic if symbol isn't found at all
        console.warn(`[signPdf] ⚠ Symbol "${symbol}", title, and name not found, using static fallback coordinates`);
      
      if (fileKey.includes('kwitansi')) {
        const margin = 7.2;
        const availW = width - 2 * margin;
        const availH = height - 2 * margin;
        const scale = Math.min(availW / 950, availH / 650);
        const imgX = margin + (availW - 950 * scale) / 2;
        const imgTop = height - margin;

        size = 25; // Make fallback size smaller too
        const r = role.toLowerCase();

        if (r.includes('kpa') || r.includes('kepala bidang')) {
          x = imgX + (225 / 950) * (950 * scale) - size / 2;
          y = imgTop - (600 / 650) * (650 * scale) - size / 2;
        } else if (r.includes('pptk')) {
          x = imgX + (515 / 950) * (950 * scale) - size / 2;
          y = imgTop - (597 / 650) * (650 * scale) - size / 2;
        } else if (r.includes('bendahara')) {
          x = imgX + (805 / 950) * (950 * scale) - size / 2;
          y = imgTop - (610 / 650) * (650 * scale) - size / 2;
        } else {
          x = width / 2 - size / 2;
          y = height * 0.15;
        }

      } else if (fileKey.includes('rincian')) {
        size = 25;
        const r = role.toLowerCase();

        if (r.includes('bendahara')) {
          // Bendahara is in the middle-left (approx 50-60% from bottom based on screenshot)
          x = Math.round(width * 0.17) - size / 2;
          y = Math.round(height * 0.55) - size / 2;
        } else if (r.includes('kpa') || r.includes('kepala bidang')) {
          x = Math.round(width * 0.73) - size / 2;
          y = Math.round(height * 0.20) - size / 2;
        } else {
          x = Math.round(width * 0.5) - size / 2;
          y = Math.round(height * 0.15);
        }

      } else {
        // Default
        size = 35;
        y = Math.round(height * 0.10);
        const r = role.toLowerCase();
        if (r.includes('bendahara')) x = Math.round(width * 0.08);
        else if (r.includes('pptk')) x = Math.round(width * 0.42);
        else if (r.includes('kpa') || r.includes('kepala bidang')) x = Math.round(width * 0.75);
        else x = Math.round(width * 0.5);
      }
    }
    }

    console.log(`[signPdf] Drawing QR at (${Math.round(x)}, ${Math.round(y)}), size=${size}, page=${width}x${height}`);

    lastPage.drawImage(qrImage, {
      x: x,
      y: y,
      width: size,
      height: size,
    });

    const modifiedPdfBytes = await pdfDoc.save();
    
    const newPdfBlob = new Blob([modifiedPdfBytes as BlobPart], { type: 'application/pdf' });
    await saveFile(fileKey, newPdfBlob);

    return true;
  } catch (error) {
    console.error('Error signing PDF:', error);
    return false;
  }
};
