import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db, getQuery, runQuery, allQuery } from '../models/db';
import { sendFileShare, sendPublicLinkNotification } from '../services/emailService';
import { validateFile } from '../utils/fileValidator';

interface User {
  id: number;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
}

interface FileRecord {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  description: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  download_count: number;
  created_at: string;
}

// Get all users
export async function getAllUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.role, u.is_active, u.created_at,
             COUNT(f.id) as files_count,
             SUM(CASE WHEN f.is_deleted = 0 THEN f.file_size ELSE 0 END) as total_file_size
      FROM users u
      LEFT JOIN files f ON u.id = f.user_id
    `;

    const params: any[] = [];

    if (search) {
      query += ' WHERE u.email LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = await allQuery<any>(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users';
    const countParams: any[] = [];

    if (search) {
      countQuery += ' WHERE email LIKE ?';
      countParams.push(`%${search}%`);
    }

    const countResult = await getQuery<{ count: number }>(countQuery, countParams);
    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.is_active === 1,
        filesCount: user.files_count || 0,
        totalFileSize: user.total_file_size || 0,
        createdAt: user.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
}

// Get all files
export async function getAllFiles(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const userId = req.query.userId as string;
    const offset = (page - 1) * limit;

    let query = `
      SELECT f.*, u.email as user_email
      FROM files f
      JOIN users u ON f.user_id = u.id
      WHERE f.is_deleted = 0
    `;

    const params: any[] = [];

    if (search) {
      query += ' AND (f.original_filename LIKE ? OR f.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (userId) {
      query += ' AND f.user_id = ?';
      params.push(parseInt(userId));
    }

    query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const files = await allQuery<any>(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM files WHERE is_deleted = 0';
    const countParams: any[] = [];

    if (search) {
      countQuery += ' AND (original_filename LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(parseInt(userId));
    }

    const countResult = await getQuery<{ count: number }>(countQuery, countParams);
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
        user: {
          id: file.user_id,
          email: file.user_email
        },
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
    console.error('Get all files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
}

// Deactivate/activate user
export async function toggleUserStatus(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;

    await runQuery(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive ? 1 : 0, userId]
    );

    res.json({
      message: isActive ? 'User activated successfully' : 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
}

// Delete user (admin)
export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);

    // Prevent deleting yourself
    if (req.user?.userId === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = await getQuery<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's files first (soft delete)
    await runQuery(
      'UPDATE files SET is_deleted = 1 WHERE user_id = ?',
      [userId]
    );

    // Delete user
    await runQuery(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    res.json({ message: `User ${user.email} deleted successfully` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

// Delete file (admin)
export async function deleteFileAdmin(req: Request, res: Response) {
  try {
    const fileId = parseInt(req.params.id);

    // Get file record
    const file = await getQuery<FileRecord>(
      'SELECT * FROM files WHERE id = ? AND is_deleted = 0',
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Soft delete
    await runQuery(
      'UPDATE files SET is_deleted = 1 WHERE id = ?',
      [fileId]
    );

    // Delete physical file
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}

// Share file via email
export async function shareFile(req: Request, res: Response) {
  try {
    const { fileId, recipientEmail, message } = req.body;

    if (!fileId || !recipientEmail) {
      return res.status(400).json({ error: 'File ID and recipient email are required' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get file record
    const file = await getQuery<FileRecord>(
      'SELECT * FROM files WHERE id = ? AND is_deleted = 0',
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Record the share
    await runQuery(
      'INSERT INTO file_shares (file_id, shared_by, recipient_email, message) VALUES (?, ?, ?, ?)',
      [fileId, req.user!.userId, recipientEmail, message || null]
    );

    // Generate download URL (using admin direct download)
    const downloadUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/file/${fileId}/download`;

    // Send email
    await sendFileShare(recipientEmail, file.original_filename, downloadUrl, message);

    res.json({ message: 'File shared successfully' });
  } catch (error) {
    console.error('Share file error:', error);
    res.status(500).json({ error: 'Failed to share file' });
  }
}

// Generate public download link
export async function generatePublicLink(req: Request, res: Response) {
  try {
    const { fileId, expiresIn, maxDownloads } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Get file record
    const file = await getQuery<FileRecord>(
      'SELECT * FROM files WHERE id = ? AND is_deleted = 0',
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Generate unique link code
    const linkCode = crypto.randomBytes(16).toString('hex');

    // Generate 4-digit password
    const password = Math.floor(1000 + Math.random() * 9000).toString();

    // Calculate expiration date
    let expiresAt: string | null = null;
    if (expiresIn) {
      const hours = parseInt(expiresIn);
      if (hours === 24) { // 1 day
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (hours === 72) { // 3 days
        expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      } else if (hours === 168) { // 7 days
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    // Create public link record
    await runQuery(
      'INSERT INTO public_links (file_id, link_code, password, created_by, expires_at, max_downloads) VALUES (?, ?, ?, ?, ?, ?)',
      [fileId, linkCode, password, req.user!.userId, expiresAt, maxDownloads || null]
    );

    // Generate public URL
    const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/public/${linkCode}`;

    res.json({
      link: publicUrl,
      linkCode,
      password,
      expiresAt
    });
  } catch (error) {
    console.error('Generate public link error:', error);
    res.status(500).json({ error: 'Failed to generate public link' });
  }
}

// Upload public file (for users to download)
export async function uploadPublicFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { description } = req.body;
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    // Validate file
    const validation = await validateFile(fileBuffer, req.file.originalname);
    if (!validation.isValid) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: validation.error });
    }

    // Insert file record with is_public = 1
    const result = await new Promise<number>((resolve, reject) => {
      db.run(
        `INSERT INTO files (user_id, filename, original_filename, description, file_path, file_size, mime_type, file_hash, is_public)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          req.user!.userId,
          req.file!.filename,
          validation.sanitizedFilename,
          description || '',
          filePath,
          validation.size,
          validation.mimeType,
          validation.hash
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.json({
      message: 'Public file uploaded successfully',
      file: {
        id: result,
        filename: validation.sanitizedFilename,
        description: description || '',
        fileSize: validation.size,
        mimeType: validation.mimeType
      }
    });
  } catch (error) {
    console.error('Upload public file error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}

// Get all public files (admin view)
export async function getPublicFiles(req: Request, res: Response) {
  try {
    const files = await allQuery<any>(
      `SELECT f.*, u.email as user_email
       FROM files f
       JOIN users u ON f.user_id = u.id
       WHERE f.is_deleted = 0 AND f.is_public = 1
       ORDER BY f.created_at DESC`
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

// Delete public file
export async function deletePublicFile(req: Request, res: Response) {
  try {
    const fileId = parseInt(req.params.id);

    // Get file record
    const file = await getQuery<FileRecord>(
      'SELECT * FROM files WHERE id = ? AND is_deleted = 0 AND is_public = 1',
      [fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'Public file not found' });
    }

    // Soft delete
    await runQuery(
      'UPDATE files SET is_deleted = 1 WHERE id = ?',
      [fileId]
    );

    // Delete physical file
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    res.json({ message: 'Public file deleted successfully' });
  } catch (error) {
    console.error('Delete public file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}

// Set user as admin
export async function setUserAsAdmin(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const user = await getQuery<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role to admin
    await runQuery(
      'UPDATE users SET role = ? WHERE id = ?',
      ['admin', userId]
    );

    res.json({ message: `User ${user.email} is now an admin` });
  } catch (error) {
    console.error('Set user as admin error:', error);
    res.status(500).json({ error: 'Failed to set user as admin' });
  }
}

// Remove admin role from user
export async function removeAdminRole(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);

    // Prevent removing yourself as admin
    if (req.user?.userId === userId) {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    // Check if user exists
    const user = await getQuery<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role to user
    await runQuery(
      'UPDATE users SET role = ? WHERE id = ?',
      ['user', userId]
    );

    res.json({ message: `Admin role removed from ${user.email}` });
  } catch (error) {
    console.error('Remove admin role error:', error);
    res.status(500).json({ error: 'Failed to remove admin role' });
  }
}

// Get all admins
export async function getAllAdmins(req: Request, res: Response) {
  try {
    const admins = await allQuery<User>(
      'SELECT id, email, role, is_active, created_at FROM users WHERE role = ?',
      ['admin']
    );

    res.json({
      admins: admins.map(admin => ({
        id: admin.id,
        email: admin.email,
        isActive: admin.is_active === 1,
        createdAt: admin.created_at
      }))
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ error: 'Failed to get admins' });
  }
}
