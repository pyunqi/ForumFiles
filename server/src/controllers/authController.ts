import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { getQuery, runQuery } from '../models/db';
import { generateToken } from '../utils/jwt';
import { sendVerificationCode } from '../services/emailService';

interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  is_active: number;
}

// User registration
export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await getQuery<User>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    await runQuery(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, 'user']
    );

    const newUser = await getQuery<User>(
      'SELECT id, email, role FROM users WHERE email = ?',
      [email]
    );

    // Generate JWT token for auto-login after registration
    const token = generateToken({
      userId: newUser!.id,
      email: newUser!.email,
      role: newUser!.role
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser!.id,
        email: newUser!.email,
        role: newUser!.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// User login with password
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await getQuery<User>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Send verification code
export async function sendCode(req: Request, res: Response) {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user exists
    const user = await getQuery<User>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: 'Email not registered' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await runQuery(
      'INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );

    // Send email
    await sendVerificationCode(email, code);

    res.json({
      message: 'Verification code sent to your email',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
}

// Login with verification code
export async function verifyCodeLogin(req: Request, res: Response) {
  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Find valid code
    const verificationCode = await getQuery<any>(
      `SELECT * FROM verification_codes
       WHERE email = ? AND code = ? AND expires_at > datetime('now') AND is_used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (!verificationCode) {
      return res.status(401).json({ error: 'Invalid or expired verification code' });
    }

    // Mark code as used
    await runQuery(
      'UPDATE verification_codes SET is_used = 1 WHERE id = ?',
      [verificationCode.id]
    );

    // Find user
    const user = await getQuery<User>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify code login error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

// Get current user info
export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await getQuery<User>(
      'SELECT id, email, role, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
}
