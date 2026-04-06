import { Response } from 'express';
import { ApiResponse } from '@/types';

/**
 * Factory para crear respuestas API consistentes
 * Implementa el patrón Factory para respuestas estandarizadas
 */
export class ResponseFactory {
  /**
   * Crea una respuesta exitosa
   */
  static success<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
    return {
      success: true,
      data,
      meta
    };
  }

  /**
   * Crea una respuesta de error
   */
  static error(
    message: string, 
    code?: string, 
    details?: any
  ): ApiResponse {
    return {
      success: false,
      error: {
        message,
        code,
        details
      }
    };
  }

  /**
   * Envía respuesta exitosa HTTP
   */
  static sendSuccess<T>(
    res: Response, 
    data: T, 
    statusCode: number = 200,
    meta?: ApiResponse['meta']
  ): Response {
    return res.status(statusCode).json(this.success(data, meta));
  }

  /**
   * Envía respuesta de error HTTP
   */
  static sendError(
    res: Response,
    message: string,
    statusCode: number = 400,
    code?: string,
    details?: any
  ): Response {
    return res.status(statusCode).json(this.error(message, code, details));
  }

  /**
   * Respuesta para validación fallida
   */
  static validationError(res: Response, errors: any[]): Response {
    return this.sendError(
      res,
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      errors
    );
  }

  /**
   * Respuesta para no encontrado
   */
  static notFound(res: Response, resource: string = 'Resource'): Response {
    return this.sendError(
      res,
      `${resource} not found`,
      404,
      'NOT_FOUND'
    );
  }

  /**
   * Respuesta para no autorizado
   */
  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.sendError(res, message, 401, 'UNAUTHORIZED');
  }

  /**
   * Respuesta para prohibido
   */
  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.sendError(res, message, 403, 'FORBIDDEN');
  }

  /**
   * Respuesta para conflicto
   */
  static conflict(res: Response, message: string = 'Resource already exists'): Response {
    return this.sendError(res, message, 409, 'CONFLICT');
  }

  /**
   * Respuesta para error del servidor
   */
  static internalError(res: Response, message: string = 'Internal server error'): Response {
    return this.sendError(res, message, 500, 'INTERNAL_ERROR');
  }

  /**
   * Respuesta paginada
   */
  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number
  ): Response {
    const totalPages = Math.ceil(total / limit);
    
    return this.sendSuccess(res, data, 200, {
      total,
      page,
      limit,
      totalPages
    });
  }
}
