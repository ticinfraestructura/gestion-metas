export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'USUARIO';
  estado: 'PENDIENTE_VALIDACION' | 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  email_validado: boolean;
  fecha_creacion: string;
  ultimo_login?: string;
}

export interface Meta {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';
  fecha_creacion: string;
  fecha_limite?: string;
  creador_id: number;
  creador?: Usuario;
  avances?: Avance[];
}

export interface Contratista {
  id: number;
  nombre: string;
  identificacion: string;
  contacto: string;
  estado: string;
  fecha_creacion: string;
  avances?: Avance[];
}

export interface Avance {
  id: number;
  descripcion: string;
  fecha_presentacion: string;
  numavance: number;
  reg_imagen?: string;
  meta_id: number;
  contratista_id: number;
  reportado_por_id: number;
  meta?: Meta;
  contratista?: Contratista;
  reportado?: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface DashboardStats {
  totalMetas: number;
  metasCompletadas: number;
  metasEnProgreso: number;
  totalContratistas: number;
  totalAvances: number;
  avancesEsteMes: number;
}
