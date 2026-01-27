import express from 'express';
import {
  getPublicLinkInfo,
  downloadPublicFile
} from '../controllers/publicController';

const router = express.Router();

router.get('/link/:linkCode', getPublicLinkInfo);
router.post('/link/:linkCode/download', downloadPublicFile);

export default router;
