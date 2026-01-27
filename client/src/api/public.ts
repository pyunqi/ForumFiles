import request from './request';

export interface PublicLinkInfo {
  filename: string;
  description: string;
  fileSize: number;
  mimeType: string;
  requiresPassword: boolean;
  expiresAt: string | null;
  downloadCount: number;
  maxDownloads: number | null;
}

export interface DownloadPublicFileRequest {
  password: string;
}

// Get public link info
export const getPublicLinkInfo = async (linkCode: string): Promise<PublicLinkInfo> => {
  const response = await request.get<PublicLinkInfo>(`/public/link/${linkCode}`);
  return response.data;
};

// Download file via public link
export const downloadPublicFile = async (linkCode: string, password: string): Promise<Blob> => {
  const response = await request.post(
    `/public/link/${linkCode}/download`,
    { password },
    { responseType: 'blob' }
  );
  return response.data;
};
