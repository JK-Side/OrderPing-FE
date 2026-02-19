import { useCallback } from 'react';
import { postPresignedUrl } from '@/api/store';

interface UploadOptions {
  directory: string;
  fileName: string;
  file: Blob;
  contentType?: string;
  errorMessage?: string;
}

export const usePresignedUploader = () => {
  const upload = useCallback(async ({ directory, fileName, file, contentType, errorMessage }: UploadOptions) => {
    const { presignedUrl, imageUrl } = await postPresignedUrl({
      directory,
      fileName,
    });
    const resolvedContentType =
      contentType || (file instanceof File ? file.type : '') || 'application/octet-stream';
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': resolvedContentType,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(errorMessage ?? 'Failed to upload file.');
    }

    return imageUrl;
  }, []);

  return { upload };
};
