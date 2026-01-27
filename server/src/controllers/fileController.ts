import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getQuery, runQuery, allQuery } from '../models/db';
import { validateFile } from '../utils/fileValidator';

interface FileRecord {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  description: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_hash: string;
  download_count: number;
  created_at: string;
}

// Upload file
export async function uploadFile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const description = req.body.description || '';

    // Read file buffer
    const fileBuffer = fs.readFileSync(req.file.path);

    // Validate file
    const validation = await validateFile(fileBuffer, req.file.originalname);

    if (!validation.isValid) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: validation.error });
    }

    // Save file record to database
    await runQuery(
      `INSERT INTO files (user_id, filename, original_filename, description, file_path, file_size, mime_type, file_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        req.file.filename,
        validation.sanitizedFilename,
        description,
        req.file.path,
        validation.size,
        validation.mimeType,
        validation.hash
      ]
    );

    // Get the created file record
    const fileRecord = await getQuery<FileRecord>(
      'SELECT * FROM files WHERE user_id = ? AND file_hash = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.userId, validation.hash]
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: fileRecord!.id,
        filename: fileRecord!.original_filename,
        description: fileRecord!.description,
        fileSize: fileRecord!.file_size,
        mimeType: fileRecord!.mime_type,
        createdAt: fileRecord!.created_at
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'File upload failed' });
  }
}

// Get user's files
export async function getMyFiles(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get files
    const files = await allQuery<FileRecord>(
      `SELECT id, filename, original_filename, description, file_size, mime_type, download_count, created_at
       FROM files
       WHERE user_id = ? AND is_deleted = 0
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.userId, limit, offset]
    );

    // Get total count
    const countResult = await getQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM files WHERE user_id = ? AND is_deleted = 0',
      [req.user.userId]
    );

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      files: files.map(file => ({
        id: file.id,
        filename: file.original_filename,
        description: file.description,
        fileSize: file.file_size,
        mimeType: file.mime_type,
        downloadCount: file.download_count,
        createdAt: file.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
}

// Download file
export async function downloadFile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const fileId = parseInt(req.params.id);

    // Get file record
    const file = await getQuery<FileRecord>(
      'SELECT * FROM files WHERE id = ? AND is_deleted = 0',
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user owns the file
    if (file.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Increment download count
    await runQuery(
      'UPDATE files SET download_count = download_count + 1 WHERE id = ?',
      [fileId]
    );

    // Send file
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_filename)}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.sendFile(path.resolve(file.file_path));
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
}

// Delete file
export async function deleteFile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const fileId = parseInt(req.params.id);

    // Get file record
    const file = await getQuery<FileRecord>(
      'SELECT * FROM files WHERE id = ? AND is_deleted = 0',
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user owns the file
    if (file.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete
    await runQuery(
      'UPDATE files SET is_deleted = 1 WHERE id = ?',
      [fileId]
    );

    // Optionally delete physical file
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
}

// Get file details
export async function getFileDetails(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const fileId = parseInt(req.params.id);

    // Get file record
    const file = await getQuery<FileRecord>(
      'SELECT * FROM files WHERE id = ? AND is_deleted = 0',
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user owns the file
    if (file.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      file: {
        id: file.id,
        filename: file.original_filename,
        description: file.description,
        fileSize: file.file_size,
        mimeType: file.mime_type,
        downloadCount: file.download_count,
        createdAt: file.created_at
      }
    });
  } catch (error) {
    console.error('Get file details error:', error);
    res.status(500).json({ error: 'Failed to get file details' });
  }
}

// Get public files (for users to download)
export async function getPublicFiles(req: Request, res: Response) {
  try {
    const files = await allQuery<FileRecord>(
      `SELECT id, original_filename, description, file_size, mime_type, download_count, created_at
       FROM files
       WHERE is_deleted = 0 AND is_public = 1
       ORDER BY created_at DESC`
    );

    res.json({
      files: files.map(file => ({
        id: file.id,
        filename: file.original_filename,
        description: file.description,
        fileSize: file.file_size,
        mimeType: file.mime_type,
        downloadCount: file.download_count,
        createdAt: file.created_at
      }))
    });
  } catch (error) {
    console.error('Get public files error:', error);
    res.status(500).json({ error: 'Failed to get public files' });
  }
}

// Download public file
export async function downloadPublicFile(req: Request, res: Response) {
  try {
    const fileId = parseInt(req.params.id);

    // Get file record
    const file = await getQuery<FileRecord>(
      'SELECT * FROM files WHERE id = ? AND is_deleted = 0 AND is_public = 1',
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Increment download count
    await runQuery(
      'UPDATE files SET download_count = download_count + 1 WHERE id = ?',
      [fileId]
    );

    // Send file
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_filename)}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.sendFile(path.resolve(file.file_path));
  } catch (error) {
    console.error('Download public file error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
}
