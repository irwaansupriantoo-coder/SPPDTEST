import { PDFDocument } from 'pdf-lib';
import { getFile, saveFile } from './fileStore';

export async function mergePdfs(keys: string[], outputKey: string): Promise<string> {
  const mergedPdf = await PDFDocument.create();
  let mergedCount = 0;

  for (const key of keys) {
    try {
      const file = await getFile(key);
      if (file && typeof (file as any).arrayBuffer === 'function') {
        const arrayBuffer = await file.arrayBuffer();
        
        // Try to load as PDF
        try {
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          mergedCount++;
        } catch (e) {
          // If it's not a PDF, try to load as image
          try {
            const bytes = new Uint8Array(arrayBuffer);
            let image;
            // Very basic signature check for PNG
            if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
              image = await mergedPdf.embedPng(arrayBuffer);
            } else {
              // Assume JPG as fallback
              image = await mergedPdf.embedJpg(arrayBuffer);
            }
            
            const page = mergedPdf.addPage();
            const { width, height } = page.getSize();
            
            // scale image to fit page
            const imgDims = image.scaleToFit(width - 40, height - 40);
            
            page.drawImage(image, {
              x: width / 2 - imgDims.width / 2,
              y: height / 2 - imgDims.height / 2,
              width: imgDims.width,
              height: imgDims.height,
            });
            mergedCount++;
          } catch (imgError) {
            console.warn(`File with key ${key} is not a valid PDF or could not be loaded as image:`, imgError);
          }
        }
      }
    } catch (err) {
      console.error(`Error loading file ${key} for merging:`, err);
    }
  }

  if (mergedCount === 0) {
    throw new Error('Tidak ada file PDF atau gambar yang bisa digabungkan.');
  }

  const mergedPdfBytes = await mergedPdf.save();
  const mergedBlob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
  const mergedFile = new File([mergedBlob], `${outputKey}.pdf`, { type: 'application/pdf' });

  await saveFile(outputKey, mergedFile);
  return outputKey;
}
