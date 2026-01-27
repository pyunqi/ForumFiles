import express, { RequestHandler } from 'express';
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

// Cast multer middleware to fix type compatibility issue between @types/multer and @types/express
router.post('/upload', uploadLimiter, uploadMiddleware.single('file') as unknown as RequestHandler, uploadFile);
router.get('/my-files', getMyFiles);
router.get('/:id', getFileDetails);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

export default router;
