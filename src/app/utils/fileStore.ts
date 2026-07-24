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
  
  // Recursively list all files in the bucket
  const listAllFiles = async (path: string = ''): Promise<any[]> => {
    let allFiles: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await sb.storage.from(BUCKET_NAME).list(path, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) {
        console.error('Error listing files in', path, error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        for (const item of data) {
          // In Supabase storage, folders don't have an id or their id is null
          if (!item.id || item.metadata === null) {
            // It's a folder
            const subPath = path ? `${path}/${item.name}` : item.name;
            const subFiles = await listAllFiles(subPath);
            allFiles = [...allFiles, ...subFiles];
          } else {
            // It's a file
            const fullPath = path ? `${path}/${item.name}` : item.name;
            allFiles.push({ ...item, name: fullPath });
          }
        }
        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }
    }
    return allFiles;
  };

  const allFiles = await listAllFiles();

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

