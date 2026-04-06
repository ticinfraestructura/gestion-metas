import { PrismaClient, LogAutenticacion } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * Repositorio de logs de autenticación
 */
export class LogAutenticacionRepository extends BaseRepository<LogAutenticacion, any, any> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'logAutenticacion');
  }

  /**
   * Crear log de autenticación
   */
  async createLog(data: {
    email: string;
    ip_address: string;
    user_agent?: string;
    resultado: string;
    motivo?: string;
    usuario_id?: number;
  }): Promise<LogAutenticacion> {
    try {
      return await this.model.create({ data });
    } catch (error: any) {
      throw new Error(`Failed to create auth log: ${error.message}`);
    }
  }

  /**
   * Obtener logs por email
   */
  async findByEmail(email: string, limit: number = 50): Promise<LogAutenticacion[]> {
    try {
      return await this.model.findMany({
        where: { email },
        orderBy: { fecha: 'desc' },
        take: limit
      });
    } catch (error: any) {
      throw new Error(`Failed to find logs by email: ${error.message}`);
    }
  }

  /**
   * Obtener logs por IP
   */
  async findByIP(ip: string, limit: number = 50): Promise<LogAutenticacion[]> {
    try {
      return await this.model.findMany({
        where: { ip_address: ip },
        orderBy: { fecha: 'desc' },
        take: limit
      });
    } catch (error: any) {
      throw new Error(`Failed to find logs by IP: ${error.message}`);
    }
  }

  /**
   * Obtener logs por resultado
   */
  async findByResultado(resultado: string, limit: number = 100): Promise<LogAutenticacion[]> {
    try {
      return await this.model.findMany({
        where: { resultado },
        orderBy: { fecha: 'desc' },
        take: limit
      });
    } catch (error: any) {
      throw new Error(`Failed to find logs by result: ${error.message}`);
    }
  }

  /**
   * Obtener logs por rango de fechas
   */
  async findByDateRange(
    fechaDesde: Date,
    fechaHasta: Date,
    filters?: {
      email?: string;
      resultado?: string;
      ip?: string;
    }
  ): Promise<LogAutenticacion[]> {
    try {
      const where: any = {
        fecha: {
          gte: fechaDesde,
          lte: fechaHasta
        }
      };

      if (filters?.email) where.email = filters.email;
      if (filters?.resultado) where.resultado = filters.resultado;
      if (filters?.ip) where.ip_address = filters.ip;

      return await this.model.findMany({
        where,
        orderBy: { fecha: 'desc' },
        take: 1000 // Limitar para evitar sobrecarga
      });
    } catch (error: any) {
      throw new Error(`Failed to find logs by date range: ${error.message}`);
    }
  }

  /**
   * Contar intentos fallidos por IP en última hora
   */
  async contarIntentosFallidosPorIP(ip: string): Promise<number> {
    try {
      const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
      
      return await this.model.count({
        where: {
          ip_address: ip,
          resultado: 'FALLIDO',
          fecha: {
            gte: unaHoraAtras
          }
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to count failed attempts by IP: ${error.message}`);
    }
  }

  /**
   * Contar intentos fallidos por email en última hora
   */
  async contarIntentosFallidosPorEmail(email: string): Promise<number> {
    try {
      const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
      
      return await this.model.count({
        where: {
          email,
          resultado: 'FALLIDO',
          fecha: {
            gte: unaHoraAtras
          }
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to count failed attempts by email: ${error.message}`);
    }
  }

  /**
   * Limpiar logs antiguos
   */
  async limpiarLogsAntiguos(dias: number = 90): Promise<number> {
    try {
      const fechaLimite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
      
      const result = await this.model.deleteMany({
        where: {
          fecha: {
            lt: fechaLimite
          }
        }
      });
      
      return result.count;
    } catch (error: any) {
      throw new Error(`Failed to clean old logs: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de autenticación
   */
  async getEstadisticas(
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<{
    total: number;
    exitosos: number;
    fallidos: number;
    bloqueados: number;
    porResultado: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
    topEmails: Array<{ email: string; count: number }>;
  }> {
    try {
      const logs = await this.findByDateRange(fechaDesde, fechaHasta);
      
      const estadisticas = {
        total: logs.length,
        exitosos: logs.filter(l => l.resultado === 'EXITOSO').length,
        fallidos: logs.filter(l => l.resultado === 'FALLIDO').length,
        bloqueados: logs.filter(l => l.resultado === 'CUENTA_BLOQUEADA').length,
        porResultado: {} as Record<string, number>,
        topIPs: [] as Array<{ ip: string; count: number }>,
        topEmails: [] as Array<{ email: string; count: number }>
      };

      // Agrupar por resultado
      logs.forEach(log => {
        estadisticas.porResultado[log.resultado] = (estadisticas.porResultado[log.resultado] || 0) + 1;
      });

      // Top IPs
      const ipCounts: Record<string, number> = {};
      logs.forEach(log => {
        ipCounts[log.ip_address] = (ipCounts[log.ip_address] || 0) + 1;
      });
      estadisticas.topIPs = Object.entries(ipCounts)
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top emails
      const emailCounts: Record<string, number> = {};
      logs.forEach(log => {
        emailCounts[log.email] = (emailCounts[log.email] || 0) + 1;
      });
      estadisticas.topEmails = Object.entries(emailCounts)
        .map(([email, count]) => ({ email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return estadisticas;
    } catch (error: any) {
      throw new Error(`Failed to get authentication statistics: ${error.message}`);
    }
  }
}
