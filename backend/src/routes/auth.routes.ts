import { Router } from 'express';
import { authController, authValidation } from '@/controllers/auth.controller';
import { authenticateToken, validateRefreshToken } from '@/middleware/auth.middleware';

/**
 * Rutas de autenticación
 * Define todos los endpoints relacionados con autenticación y gestión de usuarios
 */
const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access   Public
 */
router.post('/register', authValidation.register, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access   Public
 */
router.post('/login', authValidation.login, authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access   Private
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/validate-email
 * @desc    Validar email de usuario
 * @access   Public
 */
router.post('/validate-email', authValidation.validateEmail, authController.validateEmail);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar token de acceso
 * @access   Public (con refresh token)
 */
router.post('/refresh', validateRefreshToken, authController.refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña
 * @access   Public
 */
router.post('/forgot-password', authValidation.forgotPassword, authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Resetear contraseña
 * @access   Public (con token de reset)
 */
router.post('/reset-password', authValidation.resetPassword, authController.resetPassword);

/**
 * @route   POST /api/auth/resend-validation
 * @desc    Reenviar email de validación
 * @access   Public
 */
router.post('/resend-validation', authController.resendValidationEmail);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario actual
 * @access   Private
 */
router.get('/me', authenticateToken, authController.checkAuth);

export default router;
