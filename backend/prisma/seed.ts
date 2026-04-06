import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // Crear usuario administrador
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@gestionmetas.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@gestionmetas.com',
      password: adminPassword,
      rol: 'ADMIN',
      estado: 'ACTIVO',
      email_validado: true,
    },
  });

  console.log('Usuario administrador creado:', admin);

  // Crear usuario de prueba
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.usuario.upsert({
    where: { email: 'usuario@gestionmetas.com' },
    update: {},
    create: {
      nombre: 'Usuario de Prueba',
      email: 'usuario@gestionmetas.com',
      password: userPassword,
      rol: 'USUARIO',
      estado: 'ACTIVO',
      email_validado: true,
    },
  });

  console.log('Usuario de prueba creado:', user);

  // Crear contratistas de ejemplo
  const contratistas = [
    {
      nombre: 'Constructora ABC',
      identificacion: 'J-123456789',
      contacto: 'contacto@constructoraabc.com',
      estado: 'activo',
    },
    {
      nombre: 'Ingeniería XYZ',
      identificacion: 'J-987654321',
      contacto: 'info@ingenieriaxyz.com',
      estado: 'activo',
    },
    {
      nombre: 'Servicios Técnicos Pro',
      identificacion: 'J-456789123',
      contacto: 'servicios@tecnicopro.com',
      estado: 'activo',
    },
  ];

  for (const contratistaData of contratistas) {
    const contratista = await prisma.contratista.upsert({
      where: { identificacion: contratistaData.identificacion },
      update: {},
      create: contratistaData,
    });
    console.log('Contratista creado:', contratista);
  }

  // Crear metas de ejemplo
  const metasData = [
    {
      nombre: 'Construcción de Edificio Principal',
      descripcion: 'Construcción del edificio principal de la nueva sede corporativa.',
      estado: 'EN_PROGRESO' as const,
      fecha_limite: new Date('2024-12-31'),
      creador_id: admin.id,
    },
    {
      nombre: 'Implementación de Sistema de Seguridad',
      descripcion: 'Instalación de cámaras y sistema de monitoreo en todas las instalaciones.',
      estado: 'PENDIENTE' as const,
      fecha_limite: new Date('2024-10-31'),
      creador_id: admin.id,
    },
    {
      nombre: 'Renovación de Fachada',
      descripcion: 'Renovación completa de la fachada del edificio existente.',
      estado: 'EN_PROGRESO' as const,
      fecha_limite: new Date('2024-11-30'),
      creador_id: user.id,
    },
  ];

  const createdMetas = [];
  for (const metaData of metasData) {
    const meta = await prisma.meta.create({
      data: metaData,
    });
    createdMetas.push(meta);
    console.log('Meta creada:', meta);
  }

  // Obtener contratistas para crear avances
  const contratistaList = await prisma.contratista.findMany();

  // Crear avances de ejemplo
  if (createdMetas.length > 0 && contratistaList.length > 0) {
    const avances = [
      {
        descripcion: 'Se completó la cimentación del edificio principal. Se utilizaron 500 metros cúbicos de concreto y se instalaron las columnas principales.',
        numavance: 1,
        meta_id: createdMetas[0].id,
        contratista_id: contratistaList[0].id,
        reportado_por_id: admin.id,
        reg_imagen: 'avance1_cimentacion.jpg',
      },
      {
        descripcion: 'Se instaló el 50% del sistema de cámaras en el primer piso. Se configuró el software de monitoreo central.',
        numavance: 1,
        meta_id: createdMetas[1].id,
        contratista_id: contratistaList[1].id,
        reportado_por_id: user.id,
        reg_imagen: 'avance1_camaras.jpg',
      },
      {
        descripcion: 'Se removió el revestimiento antiguo y se preparó la superficie para nuevos materiales.',
        numavance: 1,
        meta_id: createdMetas[2].id,
        contratista_id: contratistaList[2].id,
        reportado_por_id: user.id,
        reg_imagen: 'avance1_preparacion.jpg',
      },
      {
        descripcion: 'Se completó la estructura de los primeros 3 niveles del edificio principal.',
        numavance: 2,
        meta_id: createdMetas[0].id,
        contratista_id: contratistaList[0].id,
        reportado_por_id: admin.id,
        reg_imagen: 'avance2_estructura.jpg',
      },
    ];

    for (const avanceData of avances) {
      const avance = await prisma.avance.create({
        data: avanceData,
      });
      console.log('Avance creado:', avance);
    }
  }

  console.log('Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
