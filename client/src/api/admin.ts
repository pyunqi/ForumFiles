import request from './request';
import { FileInfo, GetFilesResponse } from './files';

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
