// User related types
export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  is_active?: boolean;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// File related types
export interface FileInfo {
  id: number;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploaderId: number;
  uploaderName?: string;
  uploadDate: string;
  downloadCount: number;
  isPublic: boolean;
  sharePassword?: string;
  publicUrl?: string;
}

export interface FileUploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface ShareFileRequest {
  fileId: number;
  password?: string;
}

export interface ShareFileResponse {
  publicUrl: string;
  password?: string;
}

export interface PublicDownloadRequest {
  filename: string;
  password?: string;
}

// Admin related types
export interface AdminStats {
  totalUsers: number;
  totalFiles: number;
  totalStorage: number;
}

export interface UserWithFiles extends User {
  fileCount: number;
  totalStorage: number;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Toast notification types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}
