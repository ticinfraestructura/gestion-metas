import { PrismaClient, Usuario, UsuarioRol, UsuarioEstado } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CreateUsuarioDto, UpdateUsuarioDto } from '@/types';

/**
 * Repositorio de usuarios
 * Extiende el repositorio base con métodos específicos para usuarios
 */
export class UsuarioRepository extends BaseRepository<Usuario, CreateUsuarioDto, UpdateUsuarioDto> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'usuario');
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<Usuario | null> {
    try {
      return await this.model.findUnique({ where: { email } });
    } catch (error: any) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Buscar usuario por token de validación
   */
  async findByValidationToken(token: string): Promise<Usuario | null> {
    try {
      return await this.model.findUnique({ where: { token_validacion_email: token } });
    } catch (error: any) {
      throw new Error(`Failed to find user by validation token: ${error.message}`);
    }
  }

  /**
   * Buscar usuarios por rol
   */
  async findByRol(rol: UsuarioRol): Promise<Usuario[]> {
    try {
      return await this.model.findMany({ where: { rol } });
    } catch (error: any) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  }

  /**
   * Buscar usuarios por estado
   */
  async findByEstado(estado: UsuarioEstado): Promise<Usuario[]> {
    try {
      return await this.model.findMany({ where: { estado } });
    } catch (error: any) {
      throw new Error(`Failed to find users by state: ${error.message}`);
    }
  }

  /**
   * Verificar si email existe
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const user = await this.model.findUnique({ where: { email } });
      return !!user;
    } catch (error: any) {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }
  }

  /**
   * Verificar si identificación existe
   */
  async identificacionExists(identificacion: string): Promise<boolean> {
    // Note: This would be for contratistas, not users
    // Keeping for consistency with the architecture
    return false;
  }

  /**
   * Actualizar último login
   */
  async updateUltimoLogin(id: number): Promise<void> {
    try {
      await this.model.update({
        where: { id },
        data: { ultimo_login: new Date() }
      });
    } catch (error: any) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Incrementar intentos fallidos
   */
  async incrementarIntentosFallidos(id: number): Promise<Usuario> {
    try {
      return await this.model.update({
        where: { id },
        data: {
          intentos_fallidos: {
            increment: 1
          }
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to increment failed attempts: ${error.message}`);
    }
  }

  /**
   * Resetear intentos fallidos
   */
  async resetearIntentosFallidos(id: number): Promise<void> {
    try {
      await this.model.update({
        where: { id },
        data: { intentos_fallidos: 0 }
      });
    } catch (error: any) {
      throw new Error(`Failed to reset failed attempts: ${error.message}`);
    }
  }

  /**
   * Bloquear usuario
   */
  async bloquearUsuario(id: number): Promise<Usuario> {
    try {
      return await this.model.update({
        where: { id },
        data: {
          estado: UsuarioEstado.BLOQUEADO,
          fecha_bloqueo: new Date()
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to block user: ${error.message}`);
    }
  }

  /**
   * Validar email de usuario
   */
  async validarEmail(id: number): Promise<Usuario> {
    try {
      return await this.model.update({
        where: { id },
        data: {
          email_validado: true,
          estado: UsuarioEstado.ACTIVO,
          token_validacion_email: null,
          fecha_token_validacion: null
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to validate email: ${error.message}`);
    }
  }

  /**
   * Actualizar token de validación
   */
  async actualizarTokenValidacion(id: number, token: string): Promise<Usuario> {
    try {
      return await this.model.update({
        where: { id },
        data: {
          token_validacion_email: token,
          fecha_token_validacion: new Date()
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to update validation token: ${error.message}`);
    }
  }

  /**
   * Obtener usuarios activos con relaciones
   */
  async getActivosConRelaciones(): Promise<Usuario[]> {
    try {
      return await this.model.findMany({
        where: { estado: UsuarioEstado.ACTIVO },
        include: {
          metas_creadas: {
            select: {
              id: true,
              nombre: true,
              estado: true
            }
          },
          avances: {
            select: {
              id: true,
              descripcion: true,
              fecha_presentacion: true
            }
          }
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to get active users with relations: ${error.message}`);
    }
  }

  /**
   * Buscar usuarios con filtros avanzados
   */
  async buscarConFiltros(filtros: {
    rol?: UsuarioRol;
    estado?: UsuarioEstado;
    emailValidado?: boolean;
    fechaDesde?: Date;
    fechaHasta?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ usuarios: Usuario[]; total: number }> {
    try {
      const where: any = {};

      if (filtros.rol) where.rol = filtros.rol;
      if (filtros.estado) where.estado = filtros.estado;
      if (filtros.emailValidado !== undefined) where.email_validado = filtros.emailValidado;
      
      if (filtros.fechaDesde || filtros.fechaHasta) {
        where.fecha_creacion = {};
        if (filtros.fechaDesde) where.fecha_creacion.gte = filtros.fechaDesde;
        if (filtros.fechaHasta) where.fecha_creacion.lte = filtros.fechaHasta;
      }

      const skip = filtros.page && filtros.limit ? (filtros.page - 1) * filtros.limit : undefined;
      const take = filtros.limit;

      const [usuarios, total] = await Promise.all([
        this.model.findMany({
          where,
          skip,
          take,
          orderBy: { fecha_creacion: 'desc' }
        }),
        this.model.count({ where })
      ]);

      return { usuarios, total };
    } catch (error: any) {
      throw new Error(`Failed to search users with filters: ${error.message}`);
    }
  }
}
