import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  getAllUsers,
  getAllFiles,
  toggleUserStatus,
  deleteFileAdmin,
  shareFile,
  generatePublicLink
} from '../controllers/adminController';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getAllUsers);
router.get('/files', getAllFiles);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/files/:id', deleteFileAdmin);
router.post('/share-file', shareFile);
router.post('/generate-link', generatePublicLink);

export default router;
