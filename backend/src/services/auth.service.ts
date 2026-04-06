// Importar PrismaClient dinámicamente para evitar errores de importación
const { PrismaClient }: any = require('@prisma/client');
type PrismaClientType = any;
import { UsuarioRepository } from '@/repositories/usuario.repository';
import { SesionUsuarioRepository } from '@/repositories/sesion-usuario.repository';
import { LogAutenticacionRepository } from '@/repositories/log-autenticacion.repository';
import { EmailService } from '@/services/email.service';
import { 
  Usuario, 
  CreateUsuarioDto, 
  LoginDto, 
  AuthResponse, 
  JwtPayload,
  UsuarioEstado,
  AuthResultado,
  SesionUsuario
} from '@/types';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  generateRefreshToken,
  generateEmailValidationToken,
  generatePasswordResetToken,
  validatePasswordStrength
} from '@/utils/security';
import { 
  ConflictError, 
  UnauthorizedError, 
  BadRequestError, 
  EmailError 
} from '@/shared/errors';
import { logInfo, logError, logWarn } from '@/utils/logger';

/**
 * Servicio de autenticación
 * Implementa lógica de negocio para autenticación y gestión de usuarios
 */
export class AuthService {
  private usuarioRepository: UsuarioRepository;
  private sesionRepository: SesionUsuarioRepository;
  private logRepository: LogAutenticacionRepository;
  private emailService: EmailService;

  constructor(private prisma: PrismaClientType) {
    this.usuarioRepository = new UsuarioRepository(prisma);
    this.sesionRepository = new SesionUsuarioRepository(prisma);
    this.logRepository = new LogAutenticacionRepository(prisma);
    this.emailService = new EmailService();
  }

  /**
   * Registrar nuevo usuario
   */
  async register(userData: CreateUsuarioDto): Promise<AuthResponse> {
    try {
      // Validar fuerza de contraseña
      const passwordValidation = validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(`Contraseña débil: ${passwordValidation.errors.join(', ')}`);
      }

      // Verificar email único
      const existingUser = await this.usuarioRepository.findByEmail(userData.email);
      if (existingUser) {
        await this.logFailedAttempt(userData.email, 'unknown', 'Email already registered');
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Crear usuario con estado pendiente_validacion
      const user = await this.usuarioRepository.create({
        ...userData,
        password: hashedPassword,
        rol: userData.rol || 'USUARIO' as any,
        estado: UsuarioEstado.PENDIENTE_VALIDACION as any,
        email_validado: false,
        token_validacion_email: generateEmailValidationToken()
      } as any);

      // Enviar email de validación
      try {
        await this.emailService.sendValidationEmail(
          user.email, 
          user.token_validacion_email!
        );
      } catch (emailError) {
        logError('Failed to send validation email', emailError);
        // No fallar el registro si el email falla, pero loggear el error
      }

      logInfo(`User registered: ${user.email}`, { userId: user.id });

      return {
        user: this.sanitizeUser(user),
        message: 'User registered. Please validate your email'
      };
    } catch (error) {
      logError('Registration failed', error);
      throw error;
    }
  }

  /**
   * Iniciar sesión
   */
  async login(credentials: LoginDto, ip: string, userAgent: string): Promise<AuthResponse> {
    try {
      // Buscar usuario por email
      const user = await this.usuarioRepository.findByEmail(credentials.email);
      if (!user) {
        await this.logFailedAttempt(credentials.email, ip, 'User not found');
        throw new UnauthorizedError('Invalid credentials');
      }

      // Verificar cuenta bloqueada
      if (user.estado === UsuarioEstado.BLOQUEADO) {
        await this.logFailedAttempt(credentials.email, ip, 'Account blocked', AuthResultado.CUENTA_BLOQUEADA);
        throw new UnauthorizedError('Account blocked. Please contact administrator');
      }

      // Verificar email validado
      if (!user.email_validado) {
        await this.logFailedAttempt(credentials.email, ip, 'Email not validated');
        throw new UnauthorizedError('Email not validated. Please check your inbox');
      }

      // Verificar password
      const isPasswordValid = await verifyPassword(credentials.password, user.password);
      if (!isPasswordValid) {
        await this.handleFailedLogin(user, ip);
        throw new UnauthorizedError('Invalid credentials');
      }

      // Resetear intentos fallidos
      if (user.intentos_fallidos > 0) {
        await this.usuarioRepository.resetearIntentosFallidos(user.id);
      }

      // Generar tokens
      const sessionId = generateRefreshToken();
      const tokens = {
        accessToken: generateToken({
          userId: user.id,
          email: user.email,
          rol: user.rol as any as any,
          sessionId
        }),
        refreshToken: sessionId
      };

      // Crear sesión
      await this.sesionRepository.create({
        usuario_id: user.id,
        token_refresh: tokens.refreshToken,
        ip_address: ip,
        user_agent: userAgent,
        fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      });

      // Actualizar último login
      await this.usuarioRepository.updateUltimoLogin(user.id);

      // Log exitoso
      await this.logSuccessfulAttempt(credentials.email, ip);

      logInfo(`User logged in: ${user.email}`, { userId: user.id, ip });

      return {
        user: this.sanitizeUser(user),
        tokens
      };
    } catch (error) {
      logError('Login failed', error);
      throw error;
    }
  }

  /**
   * Validar email
   */
  async validateEmail(token: string): Promise<void> {
    try {
      const user = await this.usuarioRepository.findByValidationToken(token);
      if (!user) {
        throw new BadRequestError('Invalid or expired validation token');
      }

      // Verificar token no expirado (24 horas)
      const tokenAge = Date.now() - (user.fecha_token_validacion?.getTime() || 0);
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      if (tokenAge > maxAge) {
        throw new BadRequestError('Validation token expired');
      }

      // Activar cuenta
      await this.usuarioRepository.validarEmail(user.id);

      logInfo(`Email validated: ${user.email}`, { userId: user.id });
    } catch (error) {
      logError('Email validation failed', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await this.sesionRepository.cerrarSesion(refreshToken);
      logInfo('User logged out', { refreshToken });
    } catch (error) {
      logError('Logout failed', error);
      throw error;
    }
  }

  /**
   * Refrescar token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const session = await this.sesionRepository.findByRefreshToken(refreshToken);
      if (!session || !session.activa || session.fecha_expiracion < new Date()) {
        throw new UnauthorizedError('Invalid or expired session');
      }

      const user = await this.usuarioRepository.findById(session.usuario_id);
      if (!user || user.estado !== UsuarioEstado.ACTIVO) {
        throw new UnauthorizedError('User not active');
      }

      const accessToken = generateToken({
        userId: user.id,
        email: user.email,
        rol: user.rol as any as any,
        sessionId: refreshToken
      });

      return { accessToken };
    } catch (error) {
      logError('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.usuarioRepository.findByEmail(email);
      if (!user) {
        // No revelar si el email existe o no
        logWarn(`Forgot password attempt for non-existent email: ${email}`);
        return;
      }

      const resetToken = generatePasswordResetToken();
      await this.usuarioRepository.update(user.id, {
        token_validacion_email: resetToken,
        fecha_token_validacion: new Date()
      });

      await this.emailService.sendPasswordResetEmail(email, resetToken);

      logInfo(`Password reset requested: ${email}`, { userId: user.id });
    } catch (error) {
      logError('Forgot password failed', error);
      throw error;
    }
  }

  /**
   * Resetear contraseña
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const user = await this.usuarioRepository.findByValidationToken(token);
      if (!user) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      // Verificar token no expirado (1 hora)
      const tokenAge = Date.now() - (user.fecha_token_validacion?.getTime() || 0);
      const maxAge = 1 * 60 * 60 * 1000; // 1 hora
      if (tokenAge > maxAge) {
        throw new BadRequestError('Reset token expired');
      }

      // Validar nueva contraseña
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(`Contraseña débil: ${passwordValidation.errors.join(', ')}`);
      }

      const hashedPassword = await hashPassword(newPassword);

      await this.usuarioRepository.update(user.id, {
        password: hashedPassword,
        token_validacion_email: null,
        fecha_token_validacion: null,
        intentos_fallidos: 0
      });

      // Cerrar todas las sesiones activas
      await this.sesionRepository.cerrarTodasLasSesiones(user.id);

      logInfo(`Password reset completed: ${user.email}`, { userId: user.id });
    } catch (error) {
      logError('Password reset failed', error);
      throw error;
    }
  }

  /**
   * Manejar intentos fallidos de login
   */
  private async handleFailedLogin(user: Usuario, ip: string): Promise<void> {
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
    const updatedUser = await this.usuarioRepository.incrementarIntentosFallidos(user.id);

    await this.logFailedAttempt(user.email, ip, 'Invalid password');

    if (updatedUser.intentos_fallidos >= maxAttempts) {
      await this.usuarioRepository.bloquearUsuario(user.id);
      await this.logFailedAttempt(user.email, ip, 'Account locked due to failed attempts', AuthResultado.CUENTA_BLOQUEADA);
      logWarn(`User locked due to failed attempts: ${user.email}`, { userId: user.id, attempts: updatedUser.intentos_fallidos });
    }
  }

  /**
   * Log de intento exitoso
   */
  private async logSuccessfulAttempt(email: string, ip: string): Promise<void> {
    await this.logRepository.create({
      email,
      ip_address: ip,
      resultado: AuthResultado.EXITOSO
    });
  }

  /**
   * Log de intento fallido
   */
  private async logFailedAttempt(email: string, ip: string, motivo: string, resultado: AuthResultado = AuthResultado.FALLIDO): Promise<void> {
    await this.logRepository.create({
      email,
      ip_address: ip,
      resultado,
      motivo
    });
  }

  /**
   * Sanitizar datos de usuario para respuesta
   */
  private sanitizeUser(user: Usuario): Omit<Usuario, 'password' | 'token_validacion_email' | 'fecha_token_validacion'> {
    const { password, token_validacion_email, fecha_token_validacion, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
