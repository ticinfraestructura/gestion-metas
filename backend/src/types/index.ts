import { Request } from 'express';

// Enums (definidos manualmente para compatibilidad)
export enum UsuarioRol {
  ADMIN = 'ADMIN',
  USUARIO = 'USUARIO'
}

export enum UsuarioEstado {
  PENDIENTE_VALIDACION = 'PENDIENTE_VALIDACION',
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  BLOQUEADO = 'BLOQUEADO'
}

export enum MetaEstado {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}

export enum AuthResultado {
  EXITOSO = 'EXITOSO',
  FALLIDO = 'FALLIDO',
  CUENTA_BLOQUEADA = 'CUENTA_BLOQUEADA'
}

// Base entity interfaces
export interface BaseEntity {
  id: number;
  fecha_creacion: Date;
  fecha_actualizacion?: Date;
}

// User interfaces
export interface Usuario extends BaseEntity {
  nombre: string;
  email: string;
  password: string;
  rol: string; // Changed from UsuarioRol to string for compatibility
  estado: string; // Changed from UsuarioEstado to string for compatibility
  email_validado: boolean;
  token_validacion_email?: string | null; // Allow null for compatibility
  fecha_token_validacion?: Date | null; // Allow null for compatibility
  ultimo_login?: Date | null; // Allow null for compatibility
  intentos_fallidos: number;
  fecha_bloqueo?: Date | null; // Allow null for compatibility
}

export interface CreateUsuarioDto {
  nombre: string;
  email: string;
  password: string;
  rol?: string; // Changed from UsuarioRol to string for compatibility
}

export interface UpdateUsuarioDto {
  nombre?: string;
  email?: string;
  rol?: string; // Changed from UsuarioRol to string for compatibility
  estado?: string; // Changed from UsuarioEstado to string for compatibility
  password?: string;
  token_validacion_email?: string | null;
  fecha_token_validacion?: Date | null;
  intentos_fallidos?: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto extends CreateUsuarioDto {}

export interface AuthResponse {
  user: Omit<Usuario, 'password' | 'token_validacion_email' | 'fecha_token_validacion'>;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

// Meta interfaces
export interface Meta extends BaseEntity {
  nombre: string;
  descripcion?: string;
  estado: string; // Changed from MetaEstado to string for compatibility
  fecha_limite?: Date;
  creador_id: number;
}

export interface CreateMetaDto {
  nombre: string;
  descripcion?: string;
  fecha_limite?: Date;
}

export interface UpdateMetaDto {
  nombre?: string;
  descripcion?: string;
  estado?: string; // Changed from MetaEstado to string for compatibility
  fecha_limite?: Date;
}

// Contratista interfaces
export interface Contratista extends BaseEntity {
  nombre: string;
  identificacion: string;
  contacto: string;
  estado: string;
}

export interface CreateContratistaDto {
  nombre: string;
  identificacion: string;
  contacto: string;
}

export interface UpdateContratistaDto {
  nombre?: string;
  contacto?: string;
  estado?: string;
}

// Avance interfaces
export interface Avance extends BaseEntity {
  descripcion: string;
  fecha_presentacion: Date;
  numavance: number;
  reg_imagen?: string;
  meta_id: number;
  contratista_id: number;
  reportado_por_id: number;
}

export interface CreateAvanceDto {
  descripcion: string;
  meta_id: number;
  contratista_id: number;
  numavance?: number;
  reg_imagen?: string;
}

export interface UpdateAvanceDto {
  descripcion?: string;
  reg_imagen?: string;
}

// Session interfaces
export interface SesionUsuario {
  id: number;
  usuario_id: number;
  token_refresh: string;
  ip_address: string;
  user_agent?: string;
  fecha_inicio: Date;
  fecha_expiracion: Date;
  fecha_cierre?: Date;
  activa: boolean;
}

// Authentication interfaces
export interface JwtPayload {
  userId: number;
  email: string;
  rol: string; // Changed from UsuarioRol to string for compatibility
  sessionId: string;
  iat: number;
  exp: number;
}

export interface RequestWithUser extends Request {
  user?: Omit<Usuario, 'password' | 'token_validacion_email' | 'fecha_token_validacion'>;
  session?: SesionUsuario;
  headers: any;
  params: any;
}

// Helper function to sanitize user object
export const sanitizeUser = (user: any): Omit<Usuario, 'password' | 'token_validacion_email' | 'fecha_token_validacion'> => {
  const { password, token_validacion_email, fecha_token_validacion, ...sanitizedUser } = user;
  return sanitizedUser;
};

// Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// Dashboard interfaces
export interface DashboardKPIs {
  totalContratistas: number;
  totalMetas: number;
  contratistasConAvances: number;
  contratistasConMetasCompletadas: number;
  metasPorEstado: Record<MetaEstado, number>;
  avancesUltimoMes: number;
}

export interface ReportFilters {
  fechaDesde?: Date;
  fechaHasta?: Date;
  estado?: string;
  contratistaId?: number;
  metaId?: number;
  page?: number;
  limit?: number;
}
