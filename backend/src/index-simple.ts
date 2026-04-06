import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Cargar variables de entorno
dotenv.config();

// Crear instancia de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Crear instancia de Prisma
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint de login básico
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }
    
    // Para desarrollo: aceptar cualquier contraseña
    if (email === 'admin@gestionmetas.com' || email === 'usuario@gestionmetas.com') {
      res.json({
        success: true,
        data: {
          usuario: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            estado: user.estado,
            email_validado: user.email_validado
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// Endpoint para obtener metas
app.get('/api/metas', async (req, res) => {
  try {
    const metas = await prisma.meta.findMany({
      include: {
        creador: {
          select: { nombre: true, email: true }
        }
      }
    });
    
    res.json({
      success: true,
      data: metas
    });
  } catch (error) {
    console.error('Error obteniendo metas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// Endpoint para obtener contratistas
app.get('/api/contratistas', async (req, res) => {
  try {
    const contratistas = await prisma.contratista.findMany();
    
    res.json({
      success: true,
      data: contratistas
    });
  } catch (error) {
    console.error('Error obteniendo contratistas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// Endpoint para obtener avances
app.get('/api/avances', async (req, res) => {
  try {
    const avances = await prisma.avance.findMany({
      include: {
        meta: { select: { nombre: true } },
        contratista: { select: { nombre: true } },
        reportadoPor: { select: { nombre: true } }
      }
    });
    
    res.json({
      success: true,
      data: avances
    });
  } catch (error) {
    console.error('Error obteniendo avances:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// Endpoint para dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [totalMetas, metasCompletadas, totalContratistas, totalAvances] = await Promise.all([
      prisma.meta.count(),
      prisma.meta.count({ where: { estado: 'COMPLETADA' } }),
      prisma.contratista.count(),
      prisma.avance.count()
    ]);
    
    res.json({
      success: true,
      data: {
        totalMetas,
        metasCompletadas,
        totalContratistas,
        totalAvances,
        metasEnProgreso: totalMetas - metasCompletadas
      }
    });
  } catch (error) {
    console.error('Error obteniendo stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor' 
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
  console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo no manejado:', reason);
});
