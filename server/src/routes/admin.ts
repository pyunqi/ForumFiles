import express, { RequestHandler } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import {
  getAllUsers,
  getAllFiles,
  toggleUserStatus,
  deleteUser,
  deleteFileAdmin,
  shareFile,
  generatePublicLink,
  uploadPublicFile,
  getPublicFiles,
  deletePublicFile,
  setUserAsAdmin,
  removeAdminRole,
  getAllAdmins
} from '../controllers/adminController';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Admin management
router.get('/admins', getAllAdmins);
router.put('/users/:id/set-admin', setUserAsAdmin);
router.put('/users/:id/remove-admin', removeAdminRole);

// User files management
router.get('/files', getAllFiles);
router.delete('/files/:id', deleteFileAdmin);
router.post('/share-file', shareFile);
router.post('/generate-link', generatePublicLink);

// Public files management (files for users to download)
router.get('/public-files', getPublicFiles);
router.post('/upload-public', uploadMiddleware.single('file') as unknown as RequestHandler, uploadPublicFile);
router.delete('/public-files/:id', deletePublicFile);

export default router;
