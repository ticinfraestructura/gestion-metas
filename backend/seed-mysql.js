const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos MySQL...');

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const usuarios = await Promise.all([
    prisma.usuario.upsert({ where: { email: 'admin@gestionmetas.com' },    update: {}, create: { nombre: 'Administrador',  email: 'admin@gestionmetas.com',   password: 'admin123',  rol: 'ADMIN',   estado: 'ACTIVO',   telefono: '' } }),
    prisma.usuario.upsert({ where: { email: 'usuario@gestionmetas.com' },  update: {}, create: { nombre: 'Usuario Prueba', email: 'usuario@gestionmetas.com', password: 'user123',   rol: 'USUARIO', estado: 'ACTIVO',   telefono: '' } }),
    prisma.usuario.upsert({ where: { email: 'ana@gestionmetas.com' },      update: {}, create: { nombre: 'Ana Rodríguez',  email: 'ana@gestionmetas.com',     password: 'ana123',    rol: 'USUARIO', estado: 'ACTIVO',   telefono: '+58 412 555 0101' } }),
    prisma.usuario.upsert({ where: { email: 'carlos@gestionmetas.com' },   update: {}, create: { nombre: 'Carlos Méndez',  email: 'carlos@gestionmetas.com',  password: 'carlos123', rol: 'USUARIO', estado: 'ACTIVO',   telefono: '+58 414 555 0202' } }),
    prisma.usuario.upsert({ where: { email: 'laura@gestionmetas.com' },    update: {}, create: { nombre: 'Laura Gómez',    email: 'laura@gestionmetas.com',   password: 'laura123',  rol: 'ADMIN',   estado: 'INACTIVO', telefono: '+58 416 555 0303' } }),
  ]);
  console.log(`✅ ${usuarios.length} usuarios creados`);

  const adminId   = usuarios[0].id;
  const usuario2Id = usuarios[1].id;

  // ── Metas ─────────────────────────────────────────────────────────────────
  const metasData = [
    { codigo: 'META-001', nombre: 'Construcción de Sede Corporativa',         descripcion: 'Construcción completa del edificio principal de la nueva sede corporativa, incluyendo estructura, acabados y urbanismo exterior.',                                                    estado: 'EN_PROGRESO', fecha_limite: '2025-12-31', unidades: 8500.00, creador_id: adminId },
    { codigo: 'META-002', nombre: 'Sistema Integral de Seguridad',            descripcion: 'Instalación de cámaras IP, control de acceso biométrico, sistema de alarmas y centro de monitoreo en todas las instalaciones.',                                                          estado: 'EN_PROGRESO', fecha_limite: '2025-09-30', unidades: 120.00, creador_id: adminId },
    { codigo: 'META-003', nombre: 'Renovación y Mantenimiento de Infraestructura', descripcion: 'Renovación completa de fachadas, impermeabilización de techos, pintura general y mantenimiento de áreas comunes.',                                                                  estado: 'EN_PROGRESO', fecha_limite: '2025-11-30', unidades: 100.00, creador_id: usuario2Id },
    { codigo: 'META-004', nombre: 'Modernización de Red Eléctrica',           descripcion: 'Sustitución del tablero eléctrico principal, instalación de UPS, planta eléctrica de emergencia y cableado estructurado.',                                                               estado: 'PENDIENTE',   fecha_limite: '2025-08-31', unidades: 75.50,  creador_id: adminId },
    { codigo: 'META-005', nombre: 'Adecuación de Espacios de Trabajo',        descripcion: 'Remodelación de oficinas, instalación de divisiones modulares, mobiliario ergonómico y adecuación de salas de reuniones.',                                                                estado: 'COMPLETADA',  fecha_limite: '2025-06-30', unidades: 200.00, creador_id: usuario2Id },
  ];
  const metas = [];
  for (const m of metasData) {
    const meta = await prisma.meta.upsert({ where: { codigo: m.codigo }, update: {}, create: m });
    metas.push(meta);
  }
  console.log(`✅ ${metas.length} metas creadas`);

  // ── Contratistas ──────────────────────────────────────────────────────────
  const contratistasData = [
    { codigo: 'CONT-001', nombre: 'Constructora Bolívar C.A.',        identificacion: 'J-30512345-6', contacto: 'gerencia@constructorabolivar.com',  telefono: '0212-511-0101', estado: 'activo' },
    { codigo: 'CONT-002', nombre: 'Ingeniería Integral XYZ S.A.',     identificacion: 'J-28765432-1', contacto: 'info@ingenieriaxyz.com',            telefono: '0212-522-0202', estado: 'activo' },
    { codigo: 'CONT-003', nombre: 'Servicios Técnicos Pro C.A.',      identificacion: 'J-29456789-3', contacto: 'servicios@tecnicopro.com',          telefono: '0212-533-0303', estado: 'activo' },
    { codigo: 'CONT-004', nombre: 'Electro Soluciones del Norte',     identificacion: 'J-31234567-8', contacto: 'ventas@electrosoluciones.com',      telefono: '0261-544-0404', estado: 'activo' },
    { codigo: 'CONT-005', nombre: 'Pinturas y Acabados Élite S.R.L.', identificacion: 'J-27891234-5', contacto: 'contacto@acabadoselite.com',         telefono: '0241-555-0505', estado: 'activo' },
    { codigo: 'CONT-006', nombre: 'Seguridad Total 24/7 C.A.',        identificacion: 'J-32109876-2', contacto: 'seguridad@total247.com',            telefono: '0212-566-0606', estado: 'activo' },
    { codigo: 'CONT-007', nombre: 'Arquitectura Moderna Grupo',       identificacion: 'J-26543210-9', contacto: 'proyectos@arquitecturamoderna.com', telefono: '0212-577-0707', estado: 'activo' },
    { codigo: 'CONT-008', nombre: 'Metalmecánica Industrial S.A.',    identificacion: 'J-33456789-0', contacto: 'info@metalmecanica.com',            telefono: '0241-588-0808', estado: 'activo' },
    { codigo: 'CONT-009', nombre: 'Consultoría TEC Venezuela',        identificacion: 'J-25678901-4', contacto: 'consultoria@tecvenezuela.com',      telefono: '0212-599-0909', estado: 'activo' },
    { codigo: 'CONT-010', nombre: 'Impermeabilizaciones del Sur',     identificacion: 'J-34567890-1', contacto: 'impermeabilizaciones@sur.com',      telefono: '0291-610-1010', estado: 'activo' },
    { codigo: 'CONT-011', nombre: 'Mobiliario Corporativo C.A.',      identificacion: 'J-24789012-7', contacto: 'ventas@mobcorporativo.com',         telefono: '0212-621-1111', estado: 'activo' },
    { codigo: 'CONT-012', nombre: 'Redes y Telecomunicaciones Pro',   identificacion: 'J-35678901-2', contacto: 'soporte@redestelecpro.com',         telefono: '0212-632-1212', estado: 'activo' },
  ];
  const contratistas = [];
  for (const c of contratistasData) {
    const cont = await prisma.contratista.upsert({ where: { codigo: c.codigo }, update: {}, create: c });
    contratistas.push(cont);
  }
  console.log(`✅ ${contratistas.length} contratistas creados`);

  // Helper: find by código
  const C = (cod) => contratistas.find(c => c.codigo === cod);
  const M = (cod) => metas.find(m => m.codigo === cod);

  // ── Alcances ──────────────────────────────────────────────────────────────
  const alcancesData = [
    { contratistaId: C('CONT-001').id, metaId: M('META-001').id, descripcion: 'Cimentación, estructura de concreto y obra gris del edificio principal',     fecha_inicio: '2025-01-10', fecha_fin: '2025-07-31', periodicidad: 'MENSUAL', porcentaje_asignado: 50 },
    { contratistaId: C('CONT-007').id, metaId: M('META-001').id, descripcion: 'Diseño arquitectónico, supervisión de obra y acabados interiores',            fecha_inicio: '2025-01-10', fecha_fin: '2025-11-30', periodicidad: 'MENSUAL', porcentaje_asignado: 30 },
    { contratistaId: C('CONT-008').id, metaId: M('META-001').id, descripcion: 'Fabricación e instalación de estructuras metálicas, escaleras y barandas',   fecha_inicio: '2025-03-01', fecha_fin: '2025-09-30', periodicidad: 'MENSUAL', porcentaje_asignado: 20 },
    { contratistaId: C('CONT-006').id, metaId: M('META-002').id, descripcion: 'Instalación de cámaras IP, DVR y configuración del centro de monitoreo',    fecha_inicio: '2025-02-01', fecha_fin: '2025-08-31', periodicidad: 'MENSUAL', porcentaje_asignado: 60 },
    { contratistaId: C('CONT-002').id, metaId: M('META-002').id, descripcion: 'Instalación de control de acceso biométrico en todos los accesos',          fecha_inicio: '2025-02-15', fecha_fin: '2025-07-31', periodicidad: 'MENSUAL', porcentaje_asignado: 25 },
    { contratistaId: C('CONT-012').id, metaId: M('META-002').id, descripcion: 'Tendido de red estructurada y fibra óptica para el sistema de seguridad',   fecha_inicio: '2025-03-01', fecha_fin: '2025-06-30', periodicidad: 'MENSUAL', porcentaje_asignado: 15 },
    { contratistaId: C('CONT-005').id, metaId: M('META-003').id, descripcion: 'Pintura general de fachadas, áreas comunes e interiores de oficinas',        fecha_inicio: '2025-03-01', fecha_fin: '2025-09-30', periodicidad: 'MENSUAL', porcentaje_asignado: 40 },
    { contratistaId: C('CONT-010').id, metaId: M('META-003').id, descripcion: 'Impermeabilización de techos, terrazas y fachadas exteriores',              fecha_inicio: '2025-04-01', fecha_fin: '2025-08-31', periodicidad: 'MENSUAL', porcentaje_asignado: 35 },
    { contratistaId: C('CONT-003').id, metaId: M('META-003').id, descripcion: 'Mantenimiento preventivo de ascensores, HVAC y sistemas hidráulicos',       fecha_inicio: '2025-01-15', fecha_fin: '2025-12-31', periodicidad: 'MENSUAL', porcentaje_asignado: 25 },
    { contratistaId: C('CONT-004').id, metaId: M('META-004').id, descripcion: 'Sustitución del tablero principal, instalación de planta y UPS',            fecha_inicio: '2025-05-01', fecha_fin: '2025-10-31', periodicidad: 'MENSUAL', porcentaje_asignado: 70 },
    { contratistaId: C('CONT-009').id, metaId: M('META-004').id, descripcion: 'Consultoría técnica, supervisión y certificación eléctrica COVENIN',       fecha_inicio: '2025-05-01', fecha_fin: '2025-11-30', periodicidad: 'MENSUAL', porcentaje_asignado: 30 },
    { contratistaId: C('CONT-011').id, metaId: M('META-005').id, descripcion: 'Suministro e instalación de mobiliario ergonómico y divisiones modulares',  fecha_inicio: '2025-01-05', fecha_fin: '2025-05-31', periodicidad: 'MENSUAL', porcentaje_asignado: 65 },
    { contratistaId: C('CONT-007').id, metaId: M('META-005').id, descripcion: 'Remodelación arquitectónica de oficinas y salas de reuniones',              fecha_inicio: '2025-01-05', fecha_fin: '2025-06-15', periodicidad: 'MENSUAL', porcentaje_asignado: 35 },
  ];
  const alcances = await prisma.alcance.createMany({ data: alcancesData });
  console.log(`✅ ${alcances.count} alcances creados`);

  // ── Avances (muestra representativa) ─────────────────────────────────────
  const allAlcances = await prisma.alcance.findMany();
  const AL = (cId, mId) => allAlcances.find(a => a.contratistaId === C(cId).id && a.metaId === M(mId).id)?.id || null;

  const avancesData = [
    // META-001 CONT-001 (alcance 50% de 8500 = 4250 uds) — delta × 8500 × 0.50
    { numavance: 1, porcentaje_avance: 20,  aporte_meta:  850.00, descripcion: 'Excavación y preparación del terreno completada. Estudios de suelo realizados.', fecha_presentacion: '2025-02-15', metaId: M('META-001').id, contratistaId: C('CONT-001').id, alcanceId: AL('CONT-001','META-001'), reportado_por_id: adminId },
    { numavance: 2, porcentaje_avance: 45,  aporte_meta: 1062.50, descripcion: 'Cimentación completada al 100%. Vaciados 800 m³ de concreto en zapatas y vigas de fundación.', fecha_presentacion: '2025-03-31', metaId: M('META-001').id, contratistaId: C('CONT-001').id, alcanceId: AL('CONT-001','META-001'), reportado_por_id: adminId },
    { numavance: 3, porcentaje_avance: 60,  aporte_meta:  637.50, descripcion: 'Estructura de concreto de pisos 1 al 4 completada. Encofrado y vaciado del piso 5 en proceso.', fecha_presentacion: '2025-04-30', metaId: M('META-001').id, contratistaId: C('CONT-001').id, alcanceId: AL('CONT-001','META-001'), reportado_por_id: adminId },
    { numavance: 4, porcentaje_avance: 85,  aporte_meta: 1062.50, descripcion: 'Obra gris de los 8 pisos concluida al 100%. Inicio de instalaciones en pisos 1 al 3.', fecha_presentacion: '2025-06-30', metaId: M('META-001').id, contratistaId: C('CONT-001').id, alcanceId: AL('CONT-001','META-001'), reportado_por_id: adminId },
    { numavance: 5, porcentaje_avance: 98,  aporte_meta:  552.50, descripcion: 'Edificio prácticamente terminado. Acabados finales. Pruebas de instalaciones aprobadas.', fecha_presentacion: '2025-12-15', metaId: M('META-001').id, contratistaId: C('CONT-001').id, alcanceId: AL('CONT-001','META-001'), reportado_por_id: adminId },
    // META-002 CONT-006 (alcance 60% de 120 = 72 uds) — delta × 120 × 0.60
    { numavance: 1, porcentaje_avance: 30,  aporte_meta:  21.60, descripcion: 'Instalación de 40 cámaras IP en perímetro externo. Configuración inicial del DVR completada.', fecha_presentacion: '2025-03-10', metaId: M('META-002').id, contratistaId: C('CONT-006').id, alcanceId: AL('CONT-006','META-002'), reportado_por_id: adminId },
    { numavance: 2, porcentaje_avance: 65,  aporte_meta:  25.20, descripcion: '80 cámaras interiores instaladas en pisos 1 al 4. Centro de monitoreo operativo al 70%.', fecha_presentacion: '2025-04-15', metaId: M('META-002').id, contratistaId: C('CONT-006').id, alcanceId: AL('CONT-006','META-002'), reportado_por_id: adminId },
    { numavance: 3, porcentaje_avance: 95,  aporte_meta:  21.60, descripcion: '120 cámaras IP operativas. Centro de monitoreo equipado. Integración con sistema de alarma.', fecha_presentacion: '2025-06-30', metaId: M('META-002').id, contratistaId: C('CONT-006').id, alcanceId: AL('CONT-006','META-002'), reportado_por_id: adminId },
    // META-002 CONT-002 (alcance 25% de 120 = 30 uds) — delta × 120 × 0.25
    { numavance: 1, porcentaje_avance: 50,  aporte_meta:  15.00, descripcion: 'Lectores biométricos instalados en 8 accesos. Enrolamiento de 120 empleados completado.', fecha_presentacion: '2025-03-25', metaId: M('META-002').id, contratistaId: C('CONT-002').id, alcanceId: AL('CONT-002','META-002'), reportado_por_id: adminId },
    { numavance: 2, porcentaje_avance: 100, aporte_meta:  15.00, descripcion: 'Sistema de control de acceso biométrico 100% operativo. Capacitación finalizada.', fecha_presentacion: '2025-06-15', metaId: M('META-002').id, contratistaId: C('CONT-002').id, alcanceId: AL('CONT-002','META-002'), reportado_por_id: adminId },
    // META-003 CONT-005 (alcance 40% de 100 = 40 uds) — delta × 100 × 0.40
    { numavance: 1, porcentaje_avance: 55,  aporte_meta:  22.00, descripcion: 'Pintura de fachada norte y sur completada (3.200 m²). Preparación de fachadas este y oeste.', fecha_presentacion: '2025-04-20', metaId: M('META-003').id, contratistaId: C('CONT-005').id, alcanceId: AL('CONT-005','META-003'), reportado_por_id: adminId },
    { numavance: 2, porcentaje_avance: 90,  aporte_meta:  14.00, descripcion: 'Fachadas externas al 100%. Interiores pisos 6 al 8 en proceso. Señalización completada.', fecha_presentacion: '2025-07-30', metaId: M('META-003').id, contratistaId: C('CONT-005').id, alcanceId: AL('CONT-005','META-003'), reportado_por_id: adminId },
    { numavance: 3, porcentaje_avance: 100, aporte_meta:   4.00, descripcion: 'Obra de pintura concluida en su totalidad. 18.000 m² intervenidos. Acta de entrega firmada.', fecha_presentacion: '2025-09-30', metaId: M('META-003').id, contratistaId: C('CONT-005').id, alcanceId: AL('CONT-005','META-003'), reportado_por_id: adminId },
    // META-004 CONT-004 (alcance 70% de 75.50 = 52.85 uds) — delta × 75.50 × 0.70
    { numavance: 1, porcentaje_avance: 25,  aporte_meta:  13.21, descripcion: 'Desmontaje del tablero antiguo. Instalación del nuevo tablero principal 400A iniciada.', fecha_presentacion: '2025-05-20', metaId: M('META-004').id, contratistaId: C('CONT-004').id, alcanceId: AL('CONT-004','META-004'), reportado_por_id: adminId },
    { numavance: 2, porcentaje_avance: 75,  aporte_meta:  26.43, descripcion: 'Planta de emergencia 250 kVA instalada y sincronizada. Transfer automático configurado.', fecha_presentacion: '2025-08-10', metaId: M('META-004').id, contratistaId: C('CONT-004').id, alcanceId: AL('CONT-004','META-004'), reportado_por_id: adminId },
    { numavance: 3, porcentaje_avance: 100, aporte_meta:  13.21, descripcion: 'Red eléctrica modernizada al 100%. Eficiencia mejorada en 35%. Acta de recepción firmada.', fecha_presentacion: '2025-11-30', metaId: M('META-004').id, contratistaId: C('CONT-004').id, alcanceId: AL('CONT-004','META-004'), reportado_por_id: adminId },
    // META-005 CONT-011 (alcance 65% de 200 = 130 uds) — delta × 200 × 0.65
    { numavance: 1, porcentaje_avance: 60,  aporte_meta:  78.00, descripcion: 'Suministro y ensamblaje de 80 puestos ergonómicos. Divisiones modulares en planta baja.', fecha_presentacion: '2025-02-28', metaId: M('META-005').id, contratistaId: C('CONT-011').id, alcanceId: AL('CONT-011','META-005'), reportado_por_id: adminId },
    { numavance: 2, porcentaje_avance: 100, aporte_meta:  52.00, descripcion: '200 puestos equipados al 100%. 10 salas y 2 auditorios amoblados. Acta definitiva firmada.', fecha_presentacion: '2025-05-30', metaId: M('META-005').id, contratistaId: C('CONT-011').id, alcanceId: AL('CONT-011','META-005'), reportado_por_id: adminId },
  ];

  const avancesResult = await prisma.avance.createMany({ data: avancesData });
  console.log(`✅ ${avancesResult.count} avances creados`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('📧 Admin:   admin@gestionmetas.com  /  admin123');
  console.log('📧 Usuario: usuario@gestionmetas.com /  user123');
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
