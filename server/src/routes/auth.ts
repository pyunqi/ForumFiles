import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { authLimiter, verificationCodeLimiter } from '../middleware/rateLimiter';
import {
  register,
  login,
  sendCode,
  verifyCodeLogin,
  getMe
} from '../controllers/authController';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/send-verification-code', verificationCodeLimiter, sendCode);
router.post('/verify-code-login', authLimiter, verifyCodeLogin);

// Protected routes
router.get('/me', authMiddleware, getMe);

export default router;
