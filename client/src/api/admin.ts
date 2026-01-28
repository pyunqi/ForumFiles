import request from './request';
import { GetFilesResponse, FileInfo } from './files';

export interface AdminUser {
  id: number;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  filesCount: number;
  totalFileSize: number;
  createdAt: string;
}

export interface GetUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ShareFileRequest {
  fileId: number;
  recipientEmail: string;
  message?: string;
}

export interface GeneratePublicLinkRequest {
  fileId: number;
  expiresIn?: number; // hours: 24, 72, 168 for 1, 3, 7 days
  maxDownloads?: number;
}

export interface GeneratePublicLinkResponse {
  link: string;
  linkCode: string;
  password: string;
  expiresAt: string | null;
}

// Get all users
export const getAllUsers = async (
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<GetUsersResponse> => {
  const response = await request.get<GetUsersResponse>(
    '/admin/users',
    { params: { page, limit, search } }
  );
  return response.data;
};

// Get all files (admin view)
export const getAllFiles = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  userId?: number
): Promise<GetFilesResponse> => {
  const response = await request.get<GetFilesResponse>(
    '/admin/files',
    { params: { page, limit, search, userId } }
  );
  return response.data;
};

// Export all files for Excel
export const exportAllFiles = async (search?: string): Promise<{ files: FileInfo[] }> => {
  const response = await request.get<{ files: FileInfo[] }>(
    '/admin/files/export',
    { params: { search } }
  );
  return response.data;
};

// Toggle user active status
export const toggleUserStatus = async (
  userId: number,
  isActive: boolean
): Promise<{ message: string }> => {
  const response = await request.put<{ message: string }>(
    `/admin/users/${userId}/toggle-status`,
    { isActive }
  );
  return response.data;
};

// Delete user
export const deleteUser = async (userId: number): Promise<{ message: string }> => {
  const response = await request.delete<{ message: string }>(`/admin/users/${userId}`);
  return response.data;
};

// Delete file (admin)
export const deleteFileAdmin = async (fileId: number): Promise<void> => {
  await request.delete(`/admin/files/${fileId}`);
};

// Share file via email
export const shareFile = async (data: ShareFileRequest): Promise<{ message: string }> => {
  const response = await request.post<{ message: string }>(
    '/admin/share-file',
    data
  );
  return response.data;
};

// Generate public download link
export const generatePublicLink = async (
  data: GeneratePublicLinkRequest
): Promise<GeneratePublicLinkResponse> => {
  const response = await request.post<GeneratePublicLinkResponse>(
    '/admin/generate-link',
    data
  );
  return response.data;
};

// Upload public file (for users to download)
export const uploadPublicFile = async (
  file: File,
  description: string,
  onProgress?: (progress: number) => void
): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', description);

  const response = await request.post<{ message: string }>(
    '/admin/upload-public',
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

  return response.data;
};

// Get public files list (admin view)
export const getPublicFilesAdmin = async (): Promise<GetFilesResponse> => {
  const response = await request.get<GetFilesResponse>('/admin/public-files');
  return response.data;
};

// Delete public file
export const deletePublicFile = async (fileId: number): Promise<void> => {
  await request.delete(`/admin/public-files/${fileId}`);
};

// Admin management
export interface AdminInfo {
  id: number;
  email: string;
  isActive: boolean;
  createdAt: string;
}

// Get all admins
export const getAllAdmins = async (): Promise<{ admins: AdminInfo[] }> => {
  const response = await request.get<{ admins: AdminInfo[] }>('/admin/admins');
  return response.data;
};

// Set user as admin
export const setUserAsAdmin = async (userId: number): Promise<{ message: string }> => {
  const response = await request.put<{ message: string }>(`/admin/users/${userId}/set-admin`);
  return response.data;
};

// Remove admin role
export const removeAdminRole = async (userId: number): Promise<{ message: string }> => {
  const response = await request.put<{ message: string }>(`/admin/users/${userId}/remove-admin`);
  return response.data;
};
