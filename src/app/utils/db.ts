import { saveFile, getFile } from './fileStore';

// Helper to convert base64 data URL to Blob
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Helper to convert Blob to base64 data URL
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function saveFileToDB(key: string, data: string): Promise<void> {
  if (data && data.startsWith('data:')) {
    const blob = dataURLtoBlob(data);
    await saveFile(key, blob);
  } else {
    // fallback if it's not a data URL for some reason
    await saveFile(key, data);
  }
}

export async function getFileFromDB(key: string): Promise<string | null> {
  try {
    const file = await getFile(key);
    if (!file) return null;
    
    if (file instanceof Blob || file instanceof File) {
      return await blobToDataURL(file);
    }
    
    if (typeof file === 'string') {
      return file;
    }
    
    return null;
  } catch (err) {
    console.error("Error in getFileFromDB:", err);
    return null;
  }
}
