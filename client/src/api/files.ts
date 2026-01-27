import request from './request';

export interface FileInfo {
  id: number;
  filename: string;
  description: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  createdAt: string;
  user?: {
    id: number;
    email: string;
  };
}

export interface PublicFileInfo {
  id: number;
  filename: string;
  description: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  createdAt: string;
}

export interface GetPublicFilesResponse {
  files: PublicFileInfo[];
}

export interface UploadFileResponse {
  message: string;
  file: FileInfo;
}

export interface GetFilesResponse {
  files: FileInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Upload single file with description
export const uploadFile = async (
  file: File,
  description: string,
  onProgress?: (progress: number) => void
): Promise<FileInfo> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', description);

  const response = await request.post<UploadFileResponse>(
    '/files/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    }
  );

  return response.data.file;
};

// Get user's files
export const getMyFiles = async (
  page: number = 1,
  limit: number = 20
): Promise<GetFilesResponse> => {
  const response = await request.get<GetFilesResponse>(
    '/files/my-files',
    { params: { page, limit } }
  );
  return response.data;
};

// Delete file
export const deleteFile = async (fileId: number): Promise<void> => {
  await request.delete(`/files/${fileId}`);
};

// Download file (authenticated)
export const downloadFile = async (fileId: number): Promise<Blob> => {
  const response = await request.get(`/files/${fileId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

// Get file details
export const getFileDetails = async (fileId: number): Promise<FileInfo> => {
  const response = await request.get<{ file: FileInfo }>(`/files/${fileId}`);
  return response.data.file;
};

// Get public files (files shared by admin for all users)
export const getPublicFiles = async (): Promise<GetPublicFilesResponse> => {
  const response = await request.get<GetPublicFilesResponse>('/files/public');
  return response.data;
};

// Download public file
export const downloadPublicFile = async (fileId: number, filename: string): Promise<void> => {
  const response = await request.get(`/files/public/${fileId}/download`, {
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
