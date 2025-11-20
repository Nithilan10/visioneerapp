export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateDimensions(
  length: number,
  width: number,
  height?: number
): ValidationResult {
  const errors: string[] = [];
  
  if (length <= 0) {
    errors.push('Length must be greater than 0');
  }
  
  if (width <= 0) {
    errors.push('Width must be greater than 0');
  }
  
  if (height !== undefined && height <= 0) {
    errors.push('Height must be greater than 0');
  }
  
  if (length > 1000) {
    errors.push('Length is too large (max 1000)');
  }
  
  if (width > 1000) {
    errors.push('Width is too large (max 1000)');
  }
  
  if (height !== undefined && height > 1000) {
    errors.push('Height is too large (max 1000)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePrice(price: number): ValidationResult {
  const errors: string[] = [];
  
  if (price < 0) {
    errors.push('Price cannot be negative');
  }
  
  if (price > 1000000) {
    errors.push('Price is too large (max 1,000,000)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateImageFile(filename: string, mimetype?: string): ValidationResult {
  const errors: string[] = [];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!validExtensions.includes(extension)) {
    errors.push(`Invalid image format. Allowed: ${validExtensions.join(', ')}`);
  }
  
  if (mimetype && !validMimeTypes.includes(mimetype)) {
    errors.push(`Invalid MIME type. Allowed: ${validMimeTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateGLBFile(filename: string, mimetype?: string): ValidationResult {
  const errors: string[] = [];
  
  if (!filename.toLowerCase().endsWith('.glb')) {
    errors.push('File must be a .glb file');
  }
  
  if (mimetype && mimetype !== 'model/gltf-binary' && mimetype !== 'application/octet-stream') {
    errors.push('Invalid MIME type for GLB file');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '');
}

export function validatePagination(page: number, pageSize: number): ValidationResult {
  const errors: string[] = [];
  
  if (page < 1) {
    errors.push('Page must be at least 1');
  }
  
  if (pageSize < 1) {
    errors.push('Page size must be at least 1');
  }
  
  if (pageSize > 100) {
    errors.push('Page size cannot exceed 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

