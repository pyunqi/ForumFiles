import crypto from 'crypto';
import path from 'path';
import { FileTypeResult, fileTypeFromBuffer } from 'file-type';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600'); // 100MB

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  // Audio/Video
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'video/mpeg',
  'video/quicktime'
];

export interface FileValidationResult {
  isValid: boolean;
  sanitizedFilename: string;
  mimeType: string;
  hash: string;
  size: number;
  error?: string;
}

export async function validateFile(
  buffer: Buffer,
  filename: string
): Promise<FileValidationResult> {
  try {
    // 1. Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      return {
        isValid: false,
        sanitizedFilename: '',
        mimeType: '',
        hash: '',
        size: buffer.length,
        error: 'File size exceeds 100MB limit'
      };
    }

    // 2. Check file type using magic numbers
    const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(buffer);

    // For text files and some archives, file-type may not detect them
    // Allow based on extension if fileType is undefined
    const ext = path.extname(filename).toLowerCase();
    const textExtensions = ['.txt', '.csv', '.md', '.json'];

    let mimeType: string;

    if (!fileType && textExtensions.includes(ext)) {
      mimeType = 'text/plain';
    } else if (fileType) {
      mimeType = fileType.mime;
    } else {
      return {
        isValid: false,
        sanitizedFilename: '',
        mimeType: '',
        hash: '',
        size: buffer.length,
        error: 'Unable to determine file type'
      };
    }

    // 3. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        isValid: false,
        sanitizedFilename: '',
        mimeType,
        hash: '',
        size: buffer.length,
        error: `File type ${mimeType} is not allowed`
      };
    }

    // 4. Sanitize filename (prevent path traversal attacks)
    const sanitizedFilename = path
      .basename(filename)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255); // Limit filename length

    // 5. Calculate file hash (SHA256)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      isValid: true,
      sanitizedFilename,
      mimeType,
      hash,
      size: buffer.length
    };
  } catch (error) {
    return {
      isValid: false,
      sanitizedFilename: '',
      mimeType: '',
      hash: '',
      size: buffer.length,
      error: 'Error validating file: ' + (error as Error).message
    };
  }
}
