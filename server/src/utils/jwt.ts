import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string & SignOptions['expiresIn']
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
