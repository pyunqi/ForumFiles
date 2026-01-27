// Validation error messages
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate email format
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
};

// Validate username
export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 20) {
    return { isValid: false, error: 'Username must be at most 20 characters' };
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return { isValid: true };
};

// Validate password
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  if (password.length > 50) {
    return { isValid: false, error: 'Password must be at most 50 characters' };
  }

  return { isValid: true };
};

// Validate password confirmation
export const validatePasswordConfirmation = (
  password: string,
  confirmation: string
): ValidationResult => {
  if (!confirmation) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmation) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

// Validate verification code
export const validateVerificationCode = (code: string): ValidationResult => {
  if (!code) {
    return { isValid: false, error: 'Verification code is required' };
  }

  if (code.length !== 6) {
    return { isValid: false, error: 'Verification code must be 6 digits' };
  }

  const codeRegex = /^\d{6}$/;
  if (!codeRegex.test(code)) {
    return { isValid: false, error: 'Verification code must contain only digits' };
  }

  return { isValid: true };
};

// Validate file size
export const validateFileSize = (
  file: File,
  maxSizeMB: number = 50
): ValidationResult => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
};

// Validate file type
export const validateFileType = (
  file: File,
  allowedTypes?: string[]
): ValidationResult => {
  if (!allowedTypes || allowedTypes.length === 0) {
    return { isValid: true };
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
};

// Validate share password (optional but if provided must be valid)
export const validateSharePassword = (password?: string): ValidationResult => {
  if (!password) {
    return { isValid: true }; // Optional
  }

  if (password.length < 4) {
    return {
      isValid: false,
      error: 'Share password must be at least 4 characters',
    };
  }

  if (password.length > 20) {
    return {
      isValid: false,
      error: 'Share password must be at most 20 characters',
    };
  }

  return { isValid: true };
};
