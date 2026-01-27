import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getQuery, runQuery } from '../models/db';

interface PublicLink {
  id: number;
  file_id: number;
  link_code: string;
  password: string;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  is_active: number;
}

interface FileRecord {
  id: number;
  filename: string;
  original_filename: string;
  description: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

// Get public link info
export async function getPublicLinkInfo(req: Request, res: Response) {
  try {
    const linkCode = req.params.linkCode;

    // Get link record
    const link = await getQuery<PublicLink>(
      `SELECT * FROM public_links WHERE link_code = ? AND is_active = 1`,
      [linkCode]
    );

    if (!link) {
      return res.status(404).json({ error: 'Link not found or expired' });
    }

    // Check if link has expired
    if (link.expires_at) {
      const now = new Date().toISOString();
      if (now > link.expires_at) {
        return res.status(410).json({ error: 'Link has expired' });
      }
    }

    // Check if max downloads reached
    if (link.max_downloads !== null && link.download_count >= link.max_downloads) {
      return res.status(410).json({ error: 'Download limit reached' });
    }

    // Get file info
    const file = await getQuery<FileRecord>(
      `SELECT id, original_filename, description, file_size, mime_type
       FROM files WHERE id = ? AND is_deleted = 0`,
      [link.file_id]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      filename: file.original_filename,
      description: file.description,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      requiresPassword: true,
      expiresAt: link.expires_at,
      downloadCount: link.download_count,
      maxDownloads: link.max_downloads
    });
  } catch (error) {
    console.error('Get public link info error:', error);
    res.status(500).json({ error: 'Failed to get link info' });
  }
}

// Download file via public link
export async function downloadPublicFile(req: Request, res: Response) {
  try {
    const linkCode = req.params.linkCode;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Get link record
    const link = await getQuery<PublicLink>(
      `SELECT * FROM public_links WHERE link_code = ? AND is_active = 1`,
      [linkCode]
    );

    if (!link) {
      return res.status(404).json({ error: 'Link not found or expired' });
    }

    // Check if link has expired
    if (link.expires_at) {
      const now = new Date().toISOString();
      if (now > link.expires_at) {
        return res.status(410).json({ error: 'Link has expired' });
      }
    }

    // Check if max downloads reached
    if (link.max_downloads !== null && link.download_count >= link.max_downloads) {
      return res.status(410).json({ error: 'Download limit reached' });
    }

    // Verify password
    if (password !== link.password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Get file info
    const file = await getQuery<FileRecord>(
      `SELECT * FROM files WHERE id = ? AND is_deleted = 0`,
      [link.file_id]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Increment download counts
    await runQuery(
      'UPDATE public_links SET download_count = download_count + 1 WHERE id = ?',
      [link.id]
    );

    await runQuery(
      'UPDATE files SET download_count = download_count + 1 WHERE id = ?',
      [file.id]
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
