import { PrismaClient, SesionUsuario } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * Repositorio de sesiones de usuario
 */
export class SesionUsuarioRepository extends BaseRepository<SesionUsuario, any, any> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'sesionUsuario');
  }

  /**
   * Buscar sesión por refresh token
   */
  async findByRefreshToken(token: string): Promise<SesionUsuario | null> {
    try {
      return await this.model.findUnique({ 
        where: { token_refresh: token },
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              rol: true,
              estado: true
            }
          }
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to find session by refresh token: ${error.message}`);
    }
  }

  /**
   * Cerrar sesión
   */
  async cerrarSesion(refreshToken: string): Promise<void> {
    try {
      await this.model.update({
        where: { token_refresh: refreshToken },
        data: {
          activa: false,
          fecha_cierre: new Date()
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to close session: ${error.message}`);
    }
  }

  /**
   * Cerrar todas las sesiones de un usuario
   */
  async cerrarTodasLasSesiones(usuarioId: number): Promise<void> {
    try {
      await this.model.updateMany({
        where: { 
          usuario_id: usuarioId,
          activa: true
        },
        data: {
          activa: false,
          fecha_cierre: new Date()
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to close all sessions: ${error.message}`);
    }
  }

  /**
   * Limpiar sesiones expiradas
   */
  async limpiarSesionesExpiradas(): Promise<number> {
    try {
      const result = await this.model.updateMany({
        where: {
          activa: true,
          fecha_expiracion: {
            lt: new Date()
          }
        },
        data: {
          activa: false,
          fecha_cierre: new Date()
        }
      });
      return result.count;
    } catch (error: any) {
      throw new Error(`Failed to clean expired sessions: ${error.message}`);
    }
  }

  /**
   * Obtener sesiones activas de un usuario
   */
  async getSesionesActivas(usuarioId: number): Promise<SesionUsuario[]> {
    try {
      return await this.model.findMany({
        where: {
          usuario_id: usuarioId,
          activa: true,
          fecha_expiracion: {
            gt: new Date()
          }
        },
        orderBy: {
          fecha_inicio: 'desc'
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to get active sessions: ${error.message}`);
    }
  }

  /**
   * Contar sesiones activas
   */
  async contarSesionesActivas(usuarioId?: number): Promise<number> {
    try {
      const where: any = {
        activa: true,
        fecha_expiracion: {
          gt: new Date()
        }
      };
      
      if (usuarioId) {
        where.usuario_id = usuarioId;
      }

      return await this.model.count({ where });
    } catch (error: any) {
      throw new Error(`Failed to count active sessions: ${error.message}`);
    }
  }
}
