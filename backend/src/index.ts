import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import { ResponseFactory } from '@/shared/response-factory';
import { logInfo, logError, requestLogger } from '@/utils/logger';

// Importar rutas
import authRoutes from '@/routes/auth.routes';

// Cargar variables de entorno
dotenv.config();

// Crear instancia de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Crear instancia de Prisma
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

/**
 * Middleware de seguridad
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

/**
 * Configuración de CORS
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Rate limiting
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // límite por IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login
  message: {
    error: 'Too many login attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

/**
 * Middleware de parsing
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Logging de requests
 */
app.use(requestLogger);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  ResponseFactory.sendSuccess(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);

// TODO: Agregar más rutas cuando se implementen
// app.use('/api/usuarios', usuarioRoutes);
// app.use('/api/metas', metaRoutes);
// app.use('/api/contratistas', contratistaRoutes);
// app.use('/api/avances', avanceRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/dashboard', dashboardRoutes);

/**
 * 404 handler
 */
app.use('*', (req, res) => {
  ResponseFactory.notFound(res, 'Route');
});

/**
 * Global error handler
 */
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('Unhandled error', error);

  // Error de validación
  if (error.name === 'ValidationError') {
    return ResponseFactory.validationError(res, error.details);
  }

  // Error de Prisma
  if (error.code === 'P2002') {
    return ResponseFactory.conflict(res, 'Resource already exists');
  }

  if (error.code === 'P2025') {
    return ResponseFactory.notFound(res, 'Resource');
  }

  // Error personalizado
  if (error.statusCode) {
    return ResponseFactory.sendError(res, error.message, error.statusCode, error.code);
  }

  // Error genérico
  ResponseFactory.internalError(res, 'Internal server error');
});

/**
 * Conectar a la base de datos y iniciar servidor
 */
async function startServer() {
  try {
    // Conectar a Prisma
    await prisma.$connect();
    logInfo('Connected to database successfully');

    // Iniciar servidor
    app.listen(PORT, () => {
      logInfo(`Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  logInfo('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logInfo('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Iniciar servidor
startServer();
