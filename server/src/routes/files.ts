import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';
import {
  uploadFile,
  getMyFiles,
  downloadFile,
  deleteFile,
  getFileDetails
} from '../controllers/fileController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/upload', uploadLimiter, uploadMiddleware.single('file'), uploadFile);
router.get('/my-files', getMyFiles);
router.get('/:id', getFileDetails);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

export default router;
