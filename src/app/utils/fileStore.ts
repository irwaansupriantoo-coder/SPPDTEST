import { getSupabaseClient } from './supabaseClient';

const BUCKET_NAME = 'sppd-documents';

export const saveFile = async (key: string, file: File | Blob | string): Promise<void> => {
  const sb = getSupabaseClient();
  
  let fileBody: File | Blob | string = file;
  let contentType = 'application/octet-stream';
  
  if (file instanceof File) {
    contentType = file.type;
  } else if (file instanceof Blob) {
    contentType = file.type;
  } else if (typeof file === 'string') {
    // If it's a string (e.g. base64 or just text), we keep it as is, or we can convert it.
    // For simplicity, we just pass the string.
    contentType = 'text/plain';
  }

  // Replace slashes in the key to avoid nested folders, or keep them?
  // Supabase supports nested folders. We'll keep them, but ensure no leading slash.
  const cleanKey = key.replace(/^\//, '');

  const { error } = await sb.storage.from(BUCKET_NAME).upload(cleanKey, fileBody, {
    upsert: true,
    contentType
  });

  if (error) {
    console.error('Error uploading file to Supabase:', error);
    throw error;
  }
};

export const getFile = async (key: string): Promise<File | Blob | string | undefined> => {
  const sb = getSupabaseClient();
  const cleanKey = key.replace(/^\//, '');

  const { data, error } = await sb.storage.from(BUCKET_NAME).download(cleanKey);

  if (error || !data) {
    console.warn(`File ${key} not found in Supabase:`, error);
    return undefined;
  }

  return data as Blob;
};

export const deleteFile = async (key: string): Promise<void> => {
  const sb = getSupabaseClient();
  const cleanKey = key.replace(/^\//, '');

  const { error } = await sb.storage.from(BUCKET_NAME).remove([cleanKey]);

  if (error) {
    console.error('Error deleting file from Supabase:', error);
    throw error;
  }
};

export const deleteFilesContaining = async (substring: string): Promise<void> => {
  const sb = getSupabaseClient();
  
  // Supabase doesn't support substring search directly in `list`.
  // We have to list all files in the bucket and filter. 
  // For small buckets this is fine, but for large ones it requires pagination.
  // We'll implement a simple list for now.
  let allFiles: any[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await sb.storage.from(BUCKET_NAME).list('', {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      console.error('Error listing files for deletion:', error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allFiles = [...allFiles, ...data];
      if (data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }
  }

  const keysToDelete = allFiles
    .map(f => f.name)
    .filter(name => name.includes(substring));

  if (keysToDelete.length > 0) {
    const { error } = await sb.storage.from(BUCKET_NAME).remove(keysToDelete);
    if (error) {
      console.error('Error deleting multiple files:', error);
      throw error;
    }
  }
};

