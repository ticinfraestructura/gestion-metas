import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload } from '@/types';

/**
 * Utilidades de seguridad
 * Implementa funciones criptográficas y de tokenización
 */

/**
 * Hashea una contraseña usando bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verifica una contraseña contra su hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Genera un token JWT
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  } as jwt.SignOptions);
};

/**
 * Genera un refresh token
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Verifica un token JWT
 */
export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.verify(token, secret) as JwtPayload;
};

/**
 * Genera un token de validación de email
 */
export const generateEmailValidationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Genera un token de reset de contraseña
 */
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Sanitiza un string para prevenir XSS
 */
export const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Genera un hash para verificación
 */
export const generateHash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Verifica si un token ha expirado
 */
export const isTokenExpired = (token: string, maxAgeHours: number): boolean => {
  try {
    // Para tokens simples (no JWT)
    const decoded = Buffer.from(token, 'hex').toString();
    const timestamp = parseInt(decoded);
    if (isNaN(timestamp)) return true;
    
    const expirationTime = timestamp + (maxAgeHours * 60 * 60 * 1000);
    return Date.now() > expirationTime;
  } catch {
    return true;
  }
};

/**
 * Crea un timestamp con hash para tokens
 */
export const createTimestampedToken = (): string => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomBytes}`;
};

/**
 * Extrae timestamp de un token con timestamp
 */
export const extractTokenTimestamp = (token: string): number | null => {
  try {
    const parts = token.split('-');
    if (parts.length < 2) return null;
    return parseInt(parts[0]);
  } catch {
    return null;
  }
};

/**
 * Genera un nonce para seguridad CSRF
 */
export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Verifica la fuerza de una contraseña
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }

  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Genera un fingerprint para sesión
 */
export const generateSessionFingerprint = (userAgent: string, ip: string): string => {
  const data = `${userAgent}-${ip}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};
