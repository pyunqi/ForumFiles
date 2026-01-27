import request from './request';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '../types';

// Login with password
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await request.post<AuthResponse>('/auth/login', data);
  return response.data;
};

// Register new user
export const register = async (data: RegisterRequest): Promise<{ message: string; user: User }> => {
  const response = await request.post<{ message: string; user: User }>('/auth/register', data);
  return response.data;
};

// Request verification code for login
export const requestVerificationCode = async (email: string): Promise<{ message: string; expiresIn: number }> => {
  const response = await request.post<{ message: string; expiresIn: number }>('/auth/send-verification-code', { email });
  return response.data;
};

// Login with verification code
export const verifyCodeLogin = async (email: string, code: string): Promise<AuthResponse> => {
  const response = await request.post<AuthResponse>('/auth/verify-code-login', { email, code });
  return response.data;
};

// Get current user info
export const getCurrentUser = async (): Promise<{ user: User }> => {
  const response = await request.get<{ user: User }>('/auth/me');
  return response.data;
};

// Logout (optional - mainly client-side)
export const logout = async (): Promise<void> => {
  try {
    await request.post('/auth/logout');
  } catch (error) {
    // Ignore errors on logout
  }
};
