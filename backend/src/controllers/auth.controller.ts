import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { ResponseFactory } from '@/shared/response-factory';
import { validate } from '@/utils/validation';
import { usuarioSchemas } from '@/utils/validation';
import { LoginDto, RegisterDto } from '@/types';
import { asyncErrorHandler } from '@/shared/errors';
import { logInfo, logError } from '@/utils/logger';

/**
 * Controlador de autenticación
 * Maneja endpoints de login, registro, validación email, etc.
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    // Inicializar Prisma Client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    this.authService = new AuthService(prisma);
  }

  /**
   * Registrar nuevo usuario
   */
  register = asyncErrorHandler(async (req: Request, res: Response) => {
    const userData: RegisterDto = req.body;
    
    const result = await this.authService.register(userData);
    
    logInfo(`User registered: ${userData.email}`);
    
    ResponseFactory.sendSuccess(res, result, 201);
  });

  /**
   * Iniciar sesión
   */
  login = asyncErrorHandler(async (req: Request, res: Response) => {
    const credentials: LoginDto = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    const result = await this.authService.login(credentials, ip, userAgent);
    
    logInfo(`User logged in: ${credentials.email}`, { ip });
    
    ResponseFactory.sendSuccess(res, result);
  });

  /**
   * Cerrar sesión
   */
  logout = asyncErrorHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    await this.authService.logout(refreshToken);
    
    logInfo('User logged out');
    
    ResponseFactory.sendSuccess(res, { message: 'Logged out successfully' });
  });

  /**
   * Validar email
   */
  validateEmail = asyncErrorHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    
    await this.authService.validateEmail(token);
    
    logInfo('Email validated successfully');
    
    ResponseFactory.sendSuccess(res, { message: 'Email validated successfully' });
  });

  /**
   * Refrescar token
   */
  refreshToken = asyncErrorHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    const result = await this.authService.refreshToken(refreshToken);
    
    ResponseFactory.sendSuccess(res, result);
  });

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword = asyncErrorHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    await this.authService.forgotPassword(email);
    
    // Siempre responder éxito para no revelar si el email existe
    ResponseFactory.sendSuccess(res, { 
      message: 'If the email exists, a password reset link has been sent' 
    });
  });

  /**
   * Resetear contraseña
   */
  resetPassword = asyncErrorHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    await this.authService.resetPassword(token, newPassword);
    
    logInfo('Password reset completed');
    
    ResponseFactory.sendSuccess(res, { message: 'Password reset successfully' });
  });

  /**
   * Reenviar email de validación
   */
  resendValidationEmail = asyncErrorHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    // Aquí deberíamos implementar la lógica para reenviar
    // Por ahora, respondemos con un mensaje genérico
    
    ResponseFactory.sendSuccess(res, { 
      message: 'If the email exists and is not validated, a new validation email has been sent' 
    });
  });

  /**
   * Verificar estado de autenticación
   */
  checkAuth = asyncErrorHandler(async (req: Request, res: Response) => {
    // Este endpoint requiere autenticación middleware
    const user = (req as any).user;
    
    ResponseFactory.sendSuccess(res, { 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        estado: user.estado
      }
    });
  });
}

// Exportar instancia del controlador con middlewares aplicados
export const authController = new AuthController();

// Exportar middlewares de validación
export const authValidation = {
  register: validate(usuarioSchemas.register),
  login: validate(usuarioSchemas.login),
  validateEmail: validate(usuarioSchemas.validateEmail),
  forgotPassword: validate(usuarioSchemas.forgotPassword),
  resetPassword: validate(usuarioSchemas.resetPassword)
};
