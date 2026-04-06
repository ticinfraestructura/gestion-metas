import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/security';
import { SesionUsuarioRepository } from '@/repositories/sesion-usuario.repository';
import { UsuarioRepository } from '@/repositories/usuario.repository';
import { ResponseFactory } from '@/shared/response-factory';
import { UnauthorizedError, TokenError } from '@/shared/errors';
import { RequestWithUser, JwtPayload } from '@/types';
import { logError } from '@/utils/logger';

/**
 * Middleware de autenticación JWT
 * Verifica tokens y gestiona sesiones de usuario
 */
export const authenticateToken = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return ResponseFactory.unauthorized(res, 'Access token required');
    }

    // Verificar token JWT
    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return ResponseFactory.unauthorized(res, 'Token expired');
      }
      return ResponseFactory.unauthorized(res, 'Invalid token');
    }

    // Crear instancias de repositorios
    const prisma = require('@prisma/client').PrismaClient;
    const prismaInstance = new prisma();
    const sesionRepository = new SesionUsuarioRepository(prismaInstance);
    const usuarioRepository = new UsuarioRepository(prismaInstance);

    // Verificar sesión activa
    const session = await sesionRepository.findByRefreshToken(decoded.sessionId);
    if (!session || !session.activa || session.fecha_expiracion < new Date()) {
      return ResponseFactory.unauthorized(res, 'Session expired');
    }

    // Obtener usuario actualizado
    const user = await usuarioRepository.findById(decoded.userId);
    if (!user) {
      return ResponseFactory.unauthorized(res, 'User not found');
    }

    // Verificar estado del usuario
    if (!user.email_validado) {
      return ResponseFactory.unauthorized(res, 'Email not validated');
    }

    // Adjuntar usuario y sesión al request
    req.user = user;
    (req as any).session = session;
    
    next();
  } catch (error) {
    logError('Authentication middleware error', error);
    return ResponseFactory.internalError(res, 'Authentication failed');
  }
};

/**
 * Middleware de autorización por roles
 */
export const requireRole = (roles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ResponseFactory.unauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.rol)) {
      return ResponseFactory.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Middleware para verificar si el usuario es admin
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Middleware para verificar si el usuario es el dueño del recurso
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ResponseFactory.unauthorized(res, 'Authentication required');
    }

    // Los admins pueden acceder a todo
    if (req.user.rol === 'ADMIN') {
      return next();
    }

    const resourceUserId = parseInt(req.params[resourceIdParam]);
    if (req.user.id !== resourceUserId) {
      return ResponseFactory.forbidden(res, 'Access denied: You can only access your own resources');
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero adjunta el usuario si existe
 */
export const optionalAuth = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Verificar token JWT
    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return next(); // Token inválido, pero no fallar
    }

    // Crear instancias de repositorios
    const prisma = require('@prisma/client').PrismaClient;
    const prismaInstance = new prisma();
    const sesionRepository = new SesionUsuarioRepository(prismaInstance);
    const usuarioRepository = new UsuarioRepository(prismaInstance);

    // Verificar sesión activa
    const session = await sesionRepository.findByRefreshToken(decoded.sessionId);
    if (!session || !session.activa || session.fecha_expiracion < new Date()) {
      return next();
    }

    // Obtener usuario
    const user = await usuarioRepository.findById(decoded.userId);
    if (!user || !user.email_validado) {
      return next();
    }

    // Adjuntar usuario y sesión al request
    req.user = user;
    (req as any).session = session;
    
    next();
  } catch (error) {
    logError('Optional auth middleware error', error);
    next(); // No fallar en caso de error
  }
};

/**
 * Middleware para validar refresh token
 */
export const validateRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ResponseFactory.unauthorized(res, 'Refresh token required');
    }

    // Crear instancia de repositorio
    const prisma = require('@prisma/client').PrismaClient;
    const prismaInstance = new prisma();
    const sesionRepository = new SesionUsuarioRepository(prismaInstance);

    // Verificar sesión
    const session = await sesionRepository.findByRefreshToken(refreshToken);
    if (!session || !session.activa || session.fecha_expiracion < new Date()) {
      return ResponseFactory.unauthorized(res, 'Invalid or expired refresh token');
    }

    // Adjuntar sesión al request
    (req as any).session = session;
    
    next();
  } catch (error) {
    logError('Refresh token validation error', error);
    return ResponseFactory.internalError(res, 'Token validation failed');
  }
};
