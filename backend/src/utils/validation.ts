import Joi from 'joi';
import { UsuarioRol, UsuarioEstado, MetaEstado } from '@/types';

/**
 * Esquemas de validación usando Joi
 * Implementa validación centralizada y reutilizable (DRY)
 */

// Esquemas base
const baseString = Joi.string().trim();
const baseEmail = baseString.email().max(150);
const basePassword = baseString.min(8).max(100).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/);

// Validación de usuarios
export const usuarioSchemas = {
  // Registro de usuario
  register: Joi.object({
    nombre: baseString.min(3).max(100).required()
      .messages({
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'string.max': 'El nombre no puede exceder 100 caracteres',
        'any.required': 'El nombre es requerido'
      }),
    email: baseEmail.required()
      .messages({
        'string.email': 'El email debe ser válido',
        'any.required': 'El email es requerido'
      }),
    password: basePassword.required()
      .messages({
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.pattern.base': 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
        'any.required': 'La contraseña es requerida'
      }),
    rol: Joi.string().valid(...Object.values(UsuarioRol)).default(UsuarioRol.USUARIO)
  }),

  // Login
  login: Joi.object({
    email: baseEmail.required(),
    password: baseString.required()
  }),

  // Actualización de usuario
  update: Joi.object({
    nombre: baseString.min(3).max(100),
    email: baseEmail,
    rol: Joi.string().valid(...Object.values(UsuarioRol)),
    estado: Joi.string().valid(...Object.values(UsuarioEstado))
  }).min(1),

  // Validación de email
  validateEmail: Joi.object({
    token: baseString.required()
  }),

  // Recuperación de contraseña
  forgotPassword: Joi.object({
    email: baseEmail.required()
  }),

  // Reset de contraseña
  resetPassword: Joi.object({
    token: baseString.required(),
    password: basePassword.required()
  })
};

// Validación de metas
export const metaSchemas = {
  create: Joi.object({
    nombre: baseString.min(3).max(200).required()
      .messages({
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'string.max': 'El nombre no puede exceder 200 caracteres',
        'any.required': 'El nombre es requerido'
      }),
    descripcion: baseString.max(1000).optional(),
    fecha_limite: Joi.date().min('now').optional()
      .messages({
        'date.min': 'La fecha límite debe ser futura'
      })
  }),

  update: Joi.object({
    nombre: baseString.min(3).max(200),
    descripcion: baseString.max(1000),
    estado: Joi.string().valid(...Object.values(MetaEstado)),
    fecha_limite: Joi.date().min('now')
  }).min(1)
};

// Validación de contratistas
export const contratistaSchemas = {
  create: Joi.object({
    nombre: baseString.min(3).max(100).required(),
    identificacion: baseString.min(5).max(50).required(),
    contacto: baseString.max(150).required()
  }),

  update: Joi.object({
    nombre: baseString.min(3).max(100),
    contacto: baseString.max(150),
    estado: baseString.max(20)
  }).min(1)
};

// Validación de avances
export const avanceSchemas = {
  create: Joi.object({
    descripcion: baseString.min(10).max(2000).required(),
    meta_id: Joi.number().integer().positive().required(),
    contratista_id: Joi.number().integer().positive().required(),
    numavance: Joi.number().integer().positive().default(1),
    reg_imagen: baseString.uri().optional()
  }),

  update: Joi.object({
    descripcion: baseString.min(10).max(2000),
    reg_imagen: baseString.uri()
  }).min(1)
};

// Validación de reportes y filtros
export const reportSchemas = {
  filters: Joi.object({
    fechaDesde: Joi.date().optional(),
    fechaHasta: Joi.date().min(Joi.ref('fechaDesde')).optional(),
    estado: baseString.optional(),
    contratistaId: Joi.number().integer().positive().optional(),
    metaId: Joi.number().integer().positive().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

/**
 * Middleware de validación genérico
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        }
      });
    }

    req.body = value;
    next();
  };
};

/**
 * Validación de parámetros de query
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: {
          message: 'Query validation failed',
          code: 'QUERY_VALIDATION_ERROR',
          details: errors
        }
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Validación de parámetros de ruta
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Parameters validation failed',
          code: 'PARAMS_VALIDATION_ERROR',
          details: error.details.map(detail => detail.message)
        }
      });
    }

    req.params = value;
    next();
  };
};

// Esquemas para parámetros
export const paramSchemas = {
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};
