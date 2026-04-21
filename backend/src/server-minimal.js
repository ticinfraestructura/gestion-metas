const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3001;

// Crear carpeta de uploads si no existe
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext    = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  const ext  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext || mime) cb(null, true);
  else cb(new Error('Tipo de archivo no permitido. Use imágenes, PDF o documentos Office.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Usuarios en memoria ──
let usuarios = [
  { id: 1, nombre: 'Administrador',  email: 'admin@gestionmetas.com',   password: 'admin123', rol: 'ADMIN',   estado: 'ACTIVO',   telefono: '',              fechaCreacion: '2025-01-01' },
  { id: 2, nombre: 'Usuario Prueba', email: 'usuario@gestionmetas.com', password: 'user123',  rol: 'USUARIO', estado: 'ACTIVO',   telefono: '',              fechaCreacion: '2025-01-01' },
  { id: 3, nombre: 'Ana Rodríguez',  email: 'ana@gestionmetas.com',     password: 'ana123',   rol: 'USUARIO', estado: 'ACTIVO',   telefono: '+58 412 555 0101', fechaCreacion: '2025-02-10' },
  { id: 4, nombre: 'Carlos Méndez',  email: 'carlos@gestionmetas.com',  password: 'carlos123',rol: 'USUARIO', estado: 'ACTIVO',   telefono: '+58 414 555 0202', fechaCreacion: '2025-03-05' },
  { id: 5, nombre: 'Laura Gómez',    email: 'laura@gestionmetas.com',   password: 'laura123', rol: 'ADMIN',   estado: 'INACTIVO', telefono: '+58 416 555 0303', fechaCreacion: '2025-03-20' },
];
let nextUserId = 6;

// Endpoint de login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = usuarios.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }
  if (user.estado === 'INACTIVO') {
    return res.status(403).json({ success: false, message: 'Usuario inactivo. Contacte al administrador.' });
  }
  const { password: _, ...userSafe } = user;
  res.json({
    success: true,
    data: {
      usuario: userSafe,
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now()
    }
  });
});

// CRUD Usuarios
app.get('/api/users', (req, res) => {
  const data = usuarios.map(({ password: _, ...u }) => u);
  res.json({ success: true, data });
});

app.get('/api/users/:id', (req, res) => {
  const user = usuarios.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  const { password: _, ...userSafe } = user;
  res.json({ success: true, data: userSafe });
});

app.post('/api/users', (req, res) => {
  const { nombre, email, password, rol, estado, telefono } = req.body;
  if (!nombre?.trim() || !email?.trim() || !password?.trim())
    return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios' });
  if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(400).json({ success: false, message: 'El email ya está registrado' });
  const newUser = {
    id: nextUserId++,
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    password: password.trim(),
    rol: rol || 'USUARIO',
    estado: estado || 'ACTIVO',
    telefono: telefono || '',
    fechaCreacion: new Date().toISOString().split('T')[0],
  };
  usuarios.push(newUser);
  const { password: _, ...userSafe } = newUser;
  res.json({ success: true, message: 'Usuario creado exitosamente', data: userSafe });
});

app.put('/api/users/:id', (req, res) => {
  const idx = usuarios.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  const { nombre, email, password, rol, estado, telefono } = req.body;
  if (email && usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== usuarios[idx].id))
    return res.status(400).json({ success: false, message: 'El email ya está en uso por otro usuario' });
  usuarios[idx] = {
    ...usuarios[idx],
    ...(nombre    ? { nombre: nombre.trim() }                  : {}),
    ...(email     ? { email: email.trim().toLowerCase() }      : {}),
    ...(password  ? { password: password.trim() }              : {}),
    ...(rol       ? { rol }                                    : {}),
    ...(estado    ? { estado }                                 : {}),
    ...(telefono !== undefined ? { telefono }                  : {}),
  };
  const { password: _, ...userSafe } = usuarios[idx];
  res.json({ success: true, message: 'Usuario actualizado exitosamente', data: userSafe });
});

app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 1) return res.status(400).json({ success: false, message: 'No se puede eliminar al administrador principal' });
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  usuarios.splice(idx, 1);
  res.json({ success: true, message: 'Usuario eliminado exitosamente' });
});

// Base de datos en memoria para metas
let metas = [
  { id: 1, codigo: 'META-001', nombre: 'Construcción de Sede Corporativa', descripcion: 'Construcción completa del edificio principal de la nueva sede corporativa, incluyendo estructura, acabados y urbanismo exterior.', estado: 'EN_PROGRESO', fecha_limite: '2025-12-31', unidades: 8500.00, creador: { nombre: 'Administrador', email: 'admin@gestionmetas.com' } },
  { id: 2, codigo: 'META-002', nombre: 'Sistema Integral de Seguridad', descripcion: 'Instalación de cámaras IP, control de acceso biométrico, sistema de alarmas y centro de monitoreo en todas las instalaciones.', estado: 'EN_PROGRESO', fecha_limite: '2025-09-30', unidades: 120.00, creador: { nombre: 'Administrador', email: 'admin@gestionmetas.com' } },
  { id: 3, codigo: 'META-003', nombre: 'Renovación y Mantenimiento de Infraestructura', descripcion: 'Renovación completa de fachadas, impermeabilización de techos, pintura general y mantenimiento de áreas comunes.', estado: 'EN_PROGRESO', fecha_limite: '2025-11-30', unidades: 100.00, creador: { nombre: 'Usuario Prueba', email: 'usuario@gestionmetas.com' } },
  { id: 4, codigo: 'META-004', nombre: 'Modernización de Red Eléctrica', descripcion: 'Sustitución del tablero eléctrico principal, instalación de UPS, planta eléctrica de emergencia y cableado estructurado.', estado: 'PENDIENTE', fecha_limite: '2025-08-31', unidades: 75.50, creador: { nombre: 'Administrador', email: 'admin@gestionmetas.com' } },
  { id: 5, codigo: 'META-005', nombre: 'Adecuación de Espacios de Trabajo', descripcion: 'Remodelación de oficinas, instalación de divisiones modulares, mobiliario ergonómico y adecuación de salas de reuniones.', estado: 'COMPLETADA', fecha_limite: '2025-06-30', unidades: 200.00, creador: { nombre: 'Usuario Prueba', email: 'usuario@gestionmetas.com' } }
];
let nextMetaId = 6;

// Helper: calcula % de completación de una meta basado en el último avance reportado
const calcPorcentajeMeta = (metaId) => {
  const avsMeta = avances.filter(a => a.metaId === metaId);
  if (!avsMeta.length) return 0;
  // Toma el porcentaje más alto reportado (el avance más reciente)
  return Math.min(100, Math.max(...avsMeta.map(a => a.porcentaje_avance || 0)));
};

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const completadas  = metas.filter(m => m.estado === 'COMPLETADA').length;
  const enProgreso   = metas.filter(m => m.estado === 'EN_PROGRESO').length;
  const pcts = metas.map(m => {
    const mavances = avances.filter(a => a.metaId === m.id);
    return mavances.length ? Math.max(...mavances.map(a => a.porcentaje_avance || 0)) : 0;
  });
  const promedio = pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : 0;
  res.json({
    success: true,
    data: {
      totalMetas:          metas.length,
      metasCompletadas:    completadas,
      metasEnProgreso:     enProgreso,
      totalContratistas:   contratistas.length,
      totalAvances:        avances.length,
      totalAlcances:       alcances.length,
      promedioCompletacion: promedio,
    }
  });
});

// GET metas (incluye porcentaje_completacion dinámico)
app.get('/api/metas', (req, res) => {
  const data = metas.map(m => ({ ...m, porcentaje_completacion: calcPorcentajeMeta(m.id) }));
  res.json({ success: true, data });
});

// GET meta por id
app.get('/api/metas/:id', (req, res) => {
  const meta = metas.find(m => m.id === parseInt(req.params.id));
  if (!meta) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
  res.json({ success: true, data: { ...meta, porcentaje_completacion: calcPorcentajeMeta(meta.id) } });
});

// POST crear meta
app.post('/api/metas', (req, res) => {
  const { nombre, descripcion, estado, fecha_limite, codigo, unidades } = req.body;
  if (!nombre || !descripcion || !estado || !fecha_limite) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }
  const autoCode = `META-${String(nextMetaId).padStart(3, '0')}`;
  const codigoFinal = codigo && codigo.trim() ? codigo.trim().toUpperCase() : autoCode;
  if (metas.some(m => m.codigo === codigoFinal)) {
    return res.status(400).json({ success: false, message: `El código '${codigoFinal}' ya está en uso. Usa un código diferente.` });
  }
  const unidadesVal = unidades !== undefined && unidades !== '' ? Math.round(parseFloat(unidades) * 100) / 100 : null;
  const nueva = {
    id: nextMetaId++, codigo: codigoFinal,
    nombre, descripcion, estado, fecha_limite, unidades: unidadesVal,
    creador: { nombre: 'Administrador', email: 'admin@gestionmetas.com' }
  };
  metas.push(nueva);
  res.status(201).json({ success: true, data: nueva, message: 'Meta creada exitosamente' });
});

// PUT actualizar meta
app.put('/api/metas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = metas.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
  const { nombre, descripcion, estado, fecha_limite, codigo, unidades } = req.body;
  const codigoFinal = codigo && codigo.trim() ? codigo.trim().toUpperCase() : metas[idx].codigo;
  const duplicado = metas.find(m => m.codigo === codigoFinal && m.id !== id);
  if (duplicado) {
    return res.status(400).json({ success: false, message: `El código '${codigoFinal}' ya está en uso por otra meta. Usa un código diferente.` });
  }
  const unidadesVal = unidades !== undefined && unidades !== '' ? Math.round(parseFloat(unidades) * 100) / 100 : null;
  metas[idx] = { ...metas[idx], nombre, descripcion, estado, fecha_limite, codigo: codigoFinal, unidades: unidadesVal };
  res.json({ success: true, data: metas[idx], message: 'Meta actualizada exitosamente' });
});

// DELETE eliminar meta
app.delete('/api/metas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = metas.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
  metas.splice(idx, 1);
  res.json({ success: true, message: 'Meta eliminada exitosamente' });
});

// ── Contratistas en memoria ──
let contratistas = [
  { id:  1, codigo: 'CONT-001', nombre: 'Constructora Bolívar C.A.',        identificacion: 'J-30512345-6', contacto: 'gerencia@constructorabolivar.com',  telefono: '0212-511-0101', estado: 'activo' },
  { id:  2, codigo: 'CONT-002', nombre: 'Ingeniería Integral XYZ S.A.',     identificacion: 'J-28765432-1', contacto: 'info@ingenieriaxyz.com',            telefono: '0212-522-0202', estado: 'activo' },
  { id:  3, codigo: 'CONT-003', nombre: 'Servicios Técnicos Pro C.A.',      identificacion: 'J-29456789-3', contacto: 'servicios@tecnicopro.com',          telefono: '0212-533-0303', estado: 'activo' },
  { id:  4, codigo: 'CONT-004', nombre: 'Electro Soluciones del Norte',     identificacion: 'J-31234567-8', contacto: 'ventas@electrosoluciones.com',      telefono: '0261-544-0404', estado: 'activo' },
  { id:  5, codigo: 'CONT-005', nombre: 'Pinturas y Acabados Élite S.R.L.', identificacion: 'J-27891234-5', contacto: 'contacto@acabadoselite.com',         telefono: '0241-555-0505', estado: 'activo' },
  { id:  6, codigo: 'CONT-006', nombre: 'Seguridad Total 24/7 C.A.',        identificacion: 'J-32109876-2', contacto: 'seguridad@total247.com',            telefono: '0212-566-0606', estado: 'activo' },
  { id:  7, codigo: 'CONT-007', nombre: 'Arquitectura Moderna Grupo',       identificacion: 'J-26543210-9', contacto: 'proyectos@arquitecturamoderna.com', telefono: '0212-577-0707', estado: 'activo' },
  { id:  8, codigo: 'CONT-008', nombre: 'Metalmecánica Industrial S.A.',    identificacion: 'J-33456789-0', contacto: 'info@metalmecanica.com',            telefono: '0241-588-0808', estado: 'activo' },
  { id:  9, codigo: 'CONT-009', nombre: 'Consultoría TEC Venezuela',        identificacion: 'J-25678901-4', contacto: 'consultoria@tecvenezuela.com',      telefono: '0212-599-0909', estado: 'activo' },
  { id: 10, codigo: 'CONT-010', nombre: 'Impermeabilizaciones del Sur',     identificacion: 'J-34567890-1', contacto: 'impermeabilizaciones@sur.com',      telefono: '0291-610-1010', estado: 'activo' },
  { id: 11, codigo: 'CONT-011', nombre: 'Mobiliario Corporativo C.A.',      identificacion: 'J-24789012-7', contacto: 'ventas@mobcorporativo.com',         telefono: '0212-621-1111', estado: 'activo' },
  { id: 12, codigo: 'CONT-012', nombre: 'Redes y Telecomunicaciones Pro',   identificacion: 'J-35678901-2', contacto: 'soporte@redestelecpro.com',         telefono: '0212-632-1212', estado: 'activo' }
];
let nextContratistaId = 13;

app.get('/api/contratistas', (req, res) => res.json({ success: true, data: contratistas }));

app.get('/api/contratistas/:id', (req, res) => {
  const c = contratistas.find(x => x.id === parseInt(req.params.id));
  if (!c) return res.status(404).json({ success: false, message: 'Contratista no encontrado' });
  res.json({ success: true, data: c });
});

app.post('/api/contratistas', (req, res) => {
  const { nombre, identificacion, contacto, telefono, estado, codigo } = req.body;
  if (!nombre || !identificacion || !contacto) return res.status(400).json({ success: false, message: 'Nombre, identificación y contacto son requeridos' });
  const autoCode = `CONT-${String(nextContratistaId).padStart(3, '0')}`;
  const codigoFinal = codigo && codigo.trim() ? codigo.trim().toUpperCase() : autoCode;
  if (contratistas.some(c => c.codigo === codigoFinal)) {
    return res.status(400).json({ success: false, message: `El código '${codigoFinal}' ya está en uso. Usa un código diferente.` });
  }
  const nuevo = { id: nextContratistaId++, codigo: codigoFinal, nombre, identificacion, contacto, telefono: telefono || '', estado: estado || 'activo' };
  contratistas.push(nuevo);
  res.status(201).json({ success: true, data: nuevo, message: 'Contratista creado exitosamente' });
});

app.put('/api/contratistas/:id', (req, res) => {
  const id  = parseInt(req.params.id);
  const idx = contratistas.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Contratista no encontrado' });
  const { nombre, identificacion, contacto, telefono, estado, codigo } = req.body;
  const codigoFinal = codigo && codigo.trim() ? codigo.trim().toUpperCase() : contratistas[idx].codigo;
  const duplicado = contratistas.find(c => c.codigo === codigoFinal && c.id !== id);
  if (duplicado) return res.status(400).json({ success: false, message: `El código '${codigoFinal}' ya está en uso por otro contratista.` });
  contratistas[idx] = { ...contratistas[idx], codigo: codigoFinal, nombre, identificacion, contacto, telefono, estado };
  res.json({ success: true, data: contratistas[idx], message: 'Contratista actualizado exitosamente' });
});

app.delete('/api/contratistas/:id', (req, res) => {
  const idx = contratistas.findIndex(x => x.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Contratista no encontrado' });
  contratistas.splice(idx, 1);
  res.json({ success: true, message: 'Contratista eliminado exitosamente' });
});

// ── Alcances en memoria ──
let alcances = [
  // META-001: Sede Corporativa — 3 contratistas
  { id:  1, contratistaId:  1, metaId: 1, descripcion: 'Cimentación, estructura de concreto y obra gris del edificio principal',     fecha_inicio: '2025-01-10', fecha_fin: '2025-07-31', periodicidad: 'MENSUAL', porcentaje_asignado: 50 },
  { id:  2, contratistaId:  7, metaId: 1, descripcion: 'Diseño arquitectónico, supervisión de obra y acabados interiores',            fecha_inicio: '2025-01-10', fecha_fin: '2025-11-30', periodicidad: 'MENSUAL', porcentaje_asignado: 30 },
  { id:  3, contratistaId:  8, metaId: 1, descripcion: 'Fabricación e instalación de estructuras metálicas, escaleras y barandas',   fecha_inicio: '2025-03-01', fecha_fin: '2025-09-30', periodicidad: 'MENSUAL', porcentaje_asignado: 20 },
  // META-002: Sistema de Seguridad — 3 contratistas
  { id:  4, contratistaId:  6, metaId: 2, descripcion: 'Instalación de cámaras IP, DVR y configuración del centro de monitoreo',    fecha_inicio: '2025-02-01', fecha_fin: '2025-08-31', periodicidad: 'MENSUAL', porcentaje_asignado: 60 },
  { id:  5, contratistaId:  2, metaId: 2, descripcion: 'Instalación de control de acceso biométrico en todos los accesos',          fecha_inicio: '2025-02-15', fecha_fin: '2025-07-31', periodicidad: 'MENSUAL', porcentaje_asignado: 25 },
  { id:  6, contratistaId: 12, metaId: 2, descripcion: 'Tendido de red estructurada y fibra óptica para el sistema de seguridad',   fecha_inicio: '2025-03-01', fecha_fin: '2025-06-30', periodicidad: 'MENSUAL', porcentaje_asignado: 15 },
  // META-003: Renovación de Infraestructura — 3 contratistas
  { id:  7, contratistaId:  5, metaId: 3, descripcion: 'Pintura general de fachadas, áreas comunes e interiores de oficinas',        fecha_inicio: '2025-03-01', fecha_fin: '2025-09-30', periodicidad: 'MENSUAL', porcentaje_asignado: 40 },
  { id:  8, contratistaId: 10, metaId: 3, descripcion: 'Impermeabilización de techos, terrazas y fachadas exteriores',              fecha_inicio: '2025-04-01', fecha_fin: '2025-08-31', periodicidad: 'MENSUAL', porcentaje_asignado: 35 },
  { id:  9, contratistaId:  3, metaId: 3, descripcion: 'Mantenimiento preventivo de ascensores, HVAC y sistemas hidráulicos',       fecha_inicio: '2025-01-15', fecha_fin: '2025-12-31', periodicidad: 'MENSUAL', porcentaje_asignado: 25 },
  // META-004: Red Eléctrica — 2 contratistas
  { id: 10, contratistaId:  4, metaId: 4, descripcion: 'Sustitución del tablero principal, instalación de planta y UPS',            fecha_inicio: '2025-05-01', fecha_fin: '2025-10-31', periodicidad: 'MENSUAL', porcentaje_asignado: 70 },
  { id: 11, contratistaId:  9, metaId: 4, descripcion: 'Consultoría técnica, supervisión y certificación eléctrica COVENIN',       fecha_inicio: '2025-05-01', fecha_fin: '2025-11-30', periodicidad: 'MENSUAL', porcentaje_asignado: 30 },
  // META-005: Espacios de Trabajo — 2 contratistas
  { id: 12, contratistaId: 11, metaId: 5, descripcion: 'Suministro e instalación de mobiliario ergonómico y divisiones modulares',  fecha_inicio: '2025-01-05', fecha_fin: '2025-05-31', periodicidad: 'MENSUAL', porcentaje_asignado: 65 },
  { id: 13, contratistaId:  7, metaId: 5, descripcion: 'Remodelación arquitectónica de oficinas y salas de reuniones',              fecha_inicio: '2025-01-05', fecha_fin: '2025-06-15', periodicidad: 'MENSUAL', porcentaje_asignado: 35 }
];
let nextAlcanceId = 14;

app.get('/api/alcances', (req, res) => {
  const data = alcances.map(a => ({
    ...a,
    meta: metas.find(m => m.id === a.metaId)         || { nombre: 'Sin meta' },
    contratista: contratistas.find(c => c.id === a.contratistaId) || { nombre: 'Sin contratista' }
  }));
  res.json({ success: true, data });
});

app.get('/api/alcances/contratista/:id', (req, res) => {
  const cid = parseInt(req.params.id);
  const data = alcances.filter(a => a.contratistaId === cid).map(a => ({
    ...a,
    meta: metas.find(m => m.id === a.metaId) || { nombre: 'Sin meta' },
    contratista: contratistas.find(c => c.id === a.contratistaId) || { nombre: 'Sin contratista' }
  }));
  res.json({ success: true, data });
});

app.post('/api/alcances', (req, res) => {
  const { contratistaId, metaId, descripcion, fecha_inicio, fecha_fin, periodicidad, porcentaje_asignado } = req.body;
  if (!contratistaId || !metaId || !descripcion || !fecha_inicio || !fecha_fin || !periodicidad) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }
  const nuevo = { id: nextAlcanceId++, contratistaId: parseInt(contratistaId), metaId: parseInt(metaId), descripcion, fecha_inicio, fecha_fin, periodicidad, porcentaje_asignado: parseInt(porcentaje_asignado) || 100 };
  alcances.push(nuevo);
  res.status(201).json({ success: true, data: nuevo, message: 'Alcance registrado exitosamente' });
});

app.put('/api/alcances/:id', (req, res) => {
  const idx = alcances.findIndex(a => a.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Alcance no encontrado' });
  const { contratistaId, metaId, descripcion, fecha_inicio, fecha_fin, periodicidad, porcentaje_asignado } = req.body;
  alcances[idx] = { ...alcances[idx], contratistaId: parseInt(contratistaId), metaId: parseInt(metaId), descripcion, fecha_inicio, fecha_fin, periodicidad, porcentaje_asignado: parseInt(porcentaje_asignado) || 100 };
  res.json({ success: true, data: alcances[idx], message: 'Alcance actualizado exitosamente' });
});

app.delete('/api/alcances/:id', (req, res) => {
  const idx = alcances.findIndex(a => a.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Alcance no encontrado' });
  alcances.splice(idx, 1);
  res.json({ success: true, message: 'Alcance eliminado exitosamente' });
});

// ── Avances en memoria ──
let avances = [
  // ═══ META-001: Construcción Sede Corporativa ═══
  // CONT-001 Constructora Bolívar (50% del alcance total)
  { id:  1, numavance: 1, porcentaje_avance: 20, descripcion: 'Excavación y preparación del terreno completada. Estudios de suelo realizados y ejes de cimentación marcados según planos aprobados.', fecha_presentacion: '2025-02-15T09:00:00Z', metaId: 1, contratistaId: 1, alcanceId: 1, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Constructora Bolívar C.A.' }, reportadoPor: { nombre: 'Constructora Bolívar C.A.' }, reg_imagen: '' },
  { id:  2, numavance: 2, porcentaje_avance: 45, descripcion: 'Cimentación completada al 100%. Vaciados 800 m³ de concreto en zapatas y vigas de fundación. Inicio de columnas del primer piso según cronograma.', fecha_presentacion: '2025-03-31T10:00:00Z', metaId: 1, contratistaId: 1, alcanceId: 1, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Constructora Bolívar C.A.' }, reportadoPor: { nombre: 'Constructora Bolívar C.A.' }, reg_imagen: '' },
  { id: 13, numavance: 3, porcentaje_avance: 60, descripcion: 'Estructura de concreto de pisos 1 al 4 completada. Encofrado y vaciado del piso 5 en proceso. Instalación de losas de entrepiso avanzando según cronograma.', fecha_presentacion: '2025-04-30T09:00:00Z', metaId: 1, contratistaId: 1, alcanceId: 1, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Constructora Bolívar C.A.' }, reportadoPor: { nombre: 'Constructora Bolívar C.A.' }, reg_imagen: '' },
  { id: 14, numavance: 4, porcentaje_avance: 72, descripcion: 'Estructura hasta el piso 6 completada. Inicio de obra gris en pisos 1 y 2: levantamiento de paredes internas y externas según planos arquitectónicos aprobados.', fecha_presentacion: '2025-05-31T09:00:00Z', metaId: 1, contratistaId: 1, alcanceId: 1, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Constructora Bolívar C.A.' }, reportadoPor: { nombre: 'Constructora Bolívar C.A.' }, reg_imagen: '' },
  { id: 15, numavance: 5, porcentaje_avance: 85, descripcion: 'Obra gris de los 8 pisos concluida al 100%. Inicio de instalaciones hidrosanitarias y eléctricas en pisos 1 al 3. Fachada exterior en proceso de encofrado.', fecha_presentacion: '2025-06-30T09:00:00Z', metaId: 1, contratistaId: 1, alcanceId: 1, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Constructora Bolívar C.A.' }, reportadoPor: { nombre: 'Constructora Bolívar C.A.' }, reg_imagen: '' },
  { id: 43, numavance: 6, porcentaje_avance: 92, descripcion: 'Instalaciones MEP completadas en pisos 1 al 6. Friso y acabados en progreso. Trabajos de fachada con andamiaje externo al 80%. Inicio de pruebas hidrostáticas.', fecha_presentacion: '2025-10-31T09:00:00Z', metaId: 1, contratistaId: 1, alcanceId: 1, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Constructora Bolívar C.A.' }, reportadoPor: { nombre: 'Constructora Bolívar C.A.' }, reg_imagen: '' },
  { id: 49, numavance: 7, porcentaje_avance: 98, descripcion: 'Edificio prácticamente terminado. Acabados finales en pisos 7 y 8. Pruebas de todas las instalaciones aprobadas. Lista de pendientes menores para entrega definitiva en proceso.', fecha_presentacion: '2025-12-15T09:00:00Z', metaId: 1, contratistaId: 1, alcanceId: 1, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Constructora Bolívar C.A.' }, reportadoPor: { nombre: 'Constructora Bolívar C.A.' }, reg_imagen: '' },
  // CONT-007 Arquitectura Moderna (30% del alcance total)
  { id:  3, numavance: 1, porcentaje_avance: 15, descripcion: 'Entrega de planos arquitectónicos definitivos aprobados. Inicio de supervisión en campo con visitas semanales al sitio de construcción.', fecha_presentacion: '2025-02-20T11:00:00Z', metaId: 1, contratistaId: 7, alcanceId: 2, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Arquitectura Moderna Grupo' }, reportadoPor: { nombre: 'Arquitectura Moderna Grupo' }, reg_imagen: '' },
  { id: 16, numavance: 2, porcentaje_avance: 35, descripcion: 'Supervisión de vaciado de cimentación. Verificación de ejes y niveles de construcción. Aprobación de planos de estructura de concreto para pisos 1 al 4.', fecha_presentacion: '2025-03-31T11:00:00Z', metaId: 1, contratistaId: 7, alcanceId: 2, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Arquitectura Moderna Grupo' }, reportadoPor: { nombre: 'Arquitectura Moderna Grupo' }, reg_imagen: '' },
  { id: 17, numavance: 3, porcentaje_avance: 55, descripcion: 'Revisión y aprobación de planos de instalaciones MEP. Supervisión de avance de obra gris en pisos 1 al 4. Gestión de permisos de construcción ante organismos competentes.', fecha_presentacion: '2025-05-15T11:00:00Z', metaId: 1, contratistaId: 7, alcanceId: 2, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Arquitectura Moderna Grupo' }, reportadoPor: { nombre: 'Arquitectura Moderna Grupo' }, reg_imagen: '' },
  { id: 18, numavance: 4, porcentaje_avance: 70, descripcion: 'Supervisión de instalaciones en pisos 1 al 5. Selección de acabados y materiales premium con el cliente. Coordinación de subcontratistas especializados en fachada y vidriería.', fecha_presentacion: '2025-07-10T11:00:00Z', metaId: 1, contratistaId: 7, alcanceId: 2, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Arquitectura Moderna Grupo' }, reportadoPor: { nombre: 'Arquitectura Moderna Grupo' }, reg_imagen: '' },
  { id: 44, numavance: 5, porcentaje_avance: 80, descripcion: 'Revisión de acabados ejecutados en pisos 1 al 6. Coordinación de pruebas de sistemas MEP. Gestión de observaciones del inspector municipal para permiso de habitabilidad.', fecha_presentacion: '2025-09-15T11:00:00Z', metaId: 1, contratistaId: 7, alcanceId: 2, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Arquitectura Moderna Grupo' }, reportadoPor: { nombre: 'Arquitectura Moderna Grupo' }, reg_imagen: '' },
  // CONT-008 Metalmecánica Industrial (20% del alcance total)
  { id: 19, numavance: 1, porcentaje_avance: 25, descripcion: 'Fabricación en taller del 60% de la estructura metálica: columnas, vigas y correas de cubierta. Control de calidad con pruebas de soldadura certificadas por inspector NDT.', fecha_presentacion: '2025-04-15T08:00:00Z', metaId: 1, contratistaId: 8, alcanceId: 3, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Metalmecánica Industrial S.A.' }, reportadoPor: { nombre: 'Metalmecánica Industrial S.A.' }, reg_imagen: '' },
  { id: 20, numavance: 2, porcentaje_avance: 60, descripcion: 'Instalación de columnas y vigas metálicas en pisos 1 al 5 completada. Montaje de estructura de cubierta en progreso. Certificación de uniones soldadas aprobada.', fecha_presentacion: '2025-06-20T08:00:00Z', metaId: 1, contratistaId: 8, alcanceId: 3, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Metalmecánica Industrial S.A.' }, reportadoPor: { nombre: 'Metalmecánica Industrial S.A.' }, reg_imagen: '' },
  { id: 21, numavance: 3, porcentaje_avance: 85, descripcion: 'Estructura de cubierta instalada al 100%. Escaleras metálicas colocadas en 7 de 8 plantas. Barandas y pasamanos en fabricación en taller, entrega programada próxima semana.', fecha_presentacion: '2025-08-05T08:00:00Z', metaId: 1, contratistaId: 8, alcanceId: 3, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Metalmecánica Industrial S.A.' }, reportadoPor: { nombre: 'Metalmecánica Industrial S.A.' }, reg_imagen: '' },
  { id: 48, numavance: 4, porcentaje_avance: 95, descripcion: 'Escaleras, barandas y pasamanos instalados en todos los pisos. Pendiente revisión de detalles finales y retoque de pintura anticorrosiva en uniones expuestas.', fecha_presentacion: '2025-10-20T08:00:00Z', metaId: 1, contratistaId: 8, alcanceId: 3, meta: { nombre: 'Construcción de Sede Corporativa' }, contratista: { nombre: 'Metalmecánica Industrial S.A.' }, reportadoPor: { nombre: 'Metalmecánica Industrial S.A.' }, reg_imagen: '' },

  // ═══ META-002: Sistema Integral de Seguridad ═══
  // CONT-006 Seguridad Total (60% del alcance total)
  { id:  4, numavance: 1, porcentaje_avance: 30, descripcion: 'Instalación de 40 cámaras IP en perímetro externo y áreas de acceso principales. Configuración inicial del DVR y pruebas de conectividad con NOC completadas.', fecha_presentacion: '2025-03-10T14:00:00Z', metaId: 2, contratistaId: 6, alcanceId: 4, meta: { nombre: 'Sistema Integral de Seguridad' }, contratista: { nombre: 'Seguridad Total 24/7 C.A.' }, reportadoPor: { nombre: 'Seguridad Total 24/7 C.A.' }, reg_imagen: '' },
  { id:  5, numavance: 2, porcentaje_avance: 65, descripcion: 'Instalación de 80 cámaras interiores en pisos 1 al 4. Centro de monitoreo operativo al 70%. Personal de seguridad capacitado en operación del sistema CCTV.', fecha_presentacion: '2025-04-15T14:00:00Z', metaId: 2, contratistaId: 6, alcanceId: 4, meta: { nombre: 'Sistema Integral de Seguridad' }, contratista: { nombre: 'Seguridad Total 24/7 C.A.' }, reportadoPor: { nombre: 'Seguridad Total 24/7 C.A.' }, reg_imagen: '' },
  { id: 22, numavance: 3, porcentaje_avance: 88, descripcion: '120 cámaras IP instaladas y operativas en todo el edificio. Centro de monitoreo completamente equipado. Integración con sistema de alarma perimetral completada y probada.', fecha_presentacion: '2025-05-20T14:00:00Z', metaId: 2, contratistaId: 6, alcanceId: 4, meta: { nombre: 'Sistema Integral de Seguridad' }, contratista: { nombre: 'Seguridad Total 24/7 C.A.' }, reportadoPor: { nombre: 'Seguridad Total 24/7 C.A.' }, reg_imagen: '' },
  { id: 23, numavance: 4, porcentaje_avance: 95, descripcion: 'Sistema de videovigilancia al 95%. Cámaras PTZ perimetrales calibradas. Grabación en NVR con retención 30 días configurada. Pruebas de failover y redundancia aprobadas.', fecha_presentacion: '2025-06-30T14:00:00Z', metaId: 2, contratistaId: 6, alcanceId: 4, meta: { nombre: 'Sistema Integral de Seguridad' }, contratista: { nombre: 'Seguridad Total 24/7 C.A.' }, reportadoPor: { nombre: 'Seguridad Total 24/7 C.A.' }, reg_imagen: '' },
  // CONT-002 Ingeniería Integral XYZ (25% del alcance total)
  { id:  6, numavance: 1, porcentaje_avance: 50, descripcion: 'Lectores biométricos instalados en 8 accesos principales. Enrolamiento de 120 empleados completado. Configuración inicial de perfiles de acceso por área y departamento.', fecha_presentacion: '2025-03-25T10:30:00Z', metaId: 2, contratistaId: 2, alcanceId: 5, meta: { nombre: 'Sistema Integral de Seguridad' }, contratista: { nombre: 'Ingeniería Integral XYZ S.A.' }, reportadoPor: { nombre: 'Ingeniería Integral XYZ S.A.' }, reg_imagen: '' },
  { id: 24, numavance: 2, porcentaje_avance: 85, descripcion: '450 empleados enrolados en el sistema biométrico. Control de acceso operativo en todos los accesos. Perfiles de acceso por departamento configurados y validados con RRHH.', fecha_presentacion: '2025-04-30T10:30:00Z', metaId: 2, contratistaId: 2, alcanceId: 5, meta: { nombre: 'Sistema Integral de Seguridad' }, contratista: { nombre: 'Ingeniería Integral XYZ S.A.' }, reportadoPor: { nombre: 'Ingeniería Integral XYZ S.A.' }, reg_imagen: '' },
  { id: 25, numavance: 3, porcentaje_avance: 100, descripcion: 'Sistema de control de acceso biométrico 100% operativo. Integración con nómina para registro de asistencia completada. Capacitación de administradores finalizada. Acta de entrega firmada.', fecha_presentacion: '2025-06-15T10:30:00Z', metaId: 2, contratistaId: 2, alcanceId: 5, meta: { nombre: 'Sistema Integral de Seguridad' }, contratista: { nombre: 'Ingeniería Integral XYZ S.A.' }, reportadoPor: { nombre: 'Ingeniería Integral XYZ S.A.' }, reg_imagen: '' },
  // CONT-012 Redes y Telecomunicaciones (15% del alcance total)
  { id:  7, numavance: 1, porcentaje_avance: 80, descripcion: 'Tendido de 2.400 m de red estructurada Cat6A y 600 m de fibra óptica entre pisos. Certificación de todos los puntos de red con fluke completada satisfactoriamente.', fecha_presentacion: '2025-04-05T09:00:00Z', metaId: 2, contratistaId: 12, alcanceId: 6, meta: { nombre: 'Sistema Integral de Seguridad' }, contratista: { nombre: 'Redes y Telecomunicaciones Pro' }, reportadoPor: { nombre: 'Redes y Telecomunicaciones Pro' }, reg_imagen: '' },
  { id: 26, numavance: 2, porcentaje_avance: 100, descripcion: 'Red estructurada Cat6A certificada en 100% de los puntos. Fibra óptica entre pisos probada con OTDR. Documentación As-Built y garantía de 25 años sobre la instalación entregadas al cliente.', fecha_presentacion: '2025-05-10T09:00:00Z', metaId: 2, contratistaId: 12, alcanceId: 6, meta: { nombre: 'Sistema Integral de Seguridad' }, contratista: { nombre: 'Redes y Telecomunicaciones Pro' }, reportadoPor: { nombre: 'Redes y Telecomunicaciones Pro' }, reg_imagen: '' },

  // ═══ META-003: Renovación y Mantenimiento de Infraestructura ═══
  // CONT-003 Servicios Técnicos Pro (25% del alcance total)
  { id: 31, numavance: 1, porcentaje_avance: 30, descripcion: 'Mantenimiento preventivo de 3 ascensores completado: lubricación, ajuste de guías y calibración de nivelación. Diagnóstico del sistema HVAC realizado, listado de repuestos críticos levantado.', fecha_presentacion: '2025-02-20T08:00:00Z', metaId: 3, contratistaId: 3, alcanceId: 9, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Servicios Técnicos Pro C.A.' }, reportadoPor: { nombre: 'Servicios Técnicos Pro C.A.' }, reg_imagen: '' },
  // CONT-005 Pinturas y Acabados Élite (40% del alcance total)
  { id:  8, numavance: 1, porcentaje_avance: 55, descripcion: 'Pintura de fachada norte y sur completada (3.200 m²). Preparación de superficie en fachadas este y oeste: remoción, masillado y sellado en proceso con andamiaje instalado.', fecha_presentacion: '2025-04-20T08:00:00Z', metaId: 3, contratistaId: 5, alcanceId: 7, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Pinturas y Acabados Élite S.R.L.' }, reportadoPor: { nombre: 'Pinturas y Acabados Élite S.R.L.' }, reg_imagen: '' },
  // CONT-010 Impermeabilizaciones del Sur (35% del alcance total)
  { id:  9, numavance: 1, porcentaje_avance: 40, descripcion: 'Impermeabilización del techo principal (2.800 m²) completada con sistema de poliurea. Inicio de trabajos en terrazas de pisos 3 y 5 con membrana asfáltica modificada.', fecha_presentacion: '2025-05-01T10:00:00Z', metaId: 3, contratistaId: 10, alcanceId: 8, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Impermeabilizaciones del Sur' }, reportadoPor: { nombre: 'Impermeabilizaciones del Sur' }, reg_imagen: '' },
  // CONT-003 Servicios Técnicos (avance 2)
  { id: 32, numavance: 2, porcentaje_avance: 55, descripcion: 'Overhaul completo del sistema HVAC: 8 manejadoras de aire y 24 fan-coils revisados. Recarga de refrigerante R-410A y limpieza de ductos en pisos 1 al 4 completada.', fecha_presentacion: '2025-05-10T08:00:00Z', metaId: 3, contratistaId: 3, alcanceId: 9, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Servicios Técnicos Pro C.A.' }, reportadoPor: { nombre: 'Servicios Técnicos Pro C.A.' }, reg_imagen: '' },
  // CONT-005 Pinturas (avance 2)
  { id: 27, numavance: 2, porcentaje_avance: 75, descripcion: 'Pintura de interiores completada en pisos 1 al 5 (8.500 m²). Trabajo en áreas comunes, lobby principal y circulaciones verticales en curso. Pintura epóxica en estacionamiento avanzando.', fecha_presentacion: '2025-06-15T08:00:00Z', metaId: 3, contratistaId: 5, alcanceId: 7, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Pinturas y Acabados Élite S.R.L.' }, reportadoPor: { nombre: 'Pinturas y Acabados Élite S.R.L.' }, reg_imagen: '' },
  // CONT-010 Impermeabilizaciones (avance 2)
  { id: 29, numavance: 2, porcentaje_avance: 70, descripcion: 'Impermeabilización de las 4 terrazas de pisos superiores completada. Trabajos en fachadas exteriores con sistema de resina acrílica elastomérica al 60% de avance.', fecha_presentacion: '2025-06-10T10:00:00Z', metaId: 3, contratistaId: 10, alcanceId: 8, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Impermeabilizaciones del Sur' }, reportadoPor: { nombre: 'Impermeabilizaciones del Sur' }, reg_imagen: '' },
  // CONT-005 Pinturas (avance 3)
  { id: 28, numavance: 3, porcentaje_avance: 90, descripcion: 'Fachadas externas al 100%. Interiores pisos 6 al 8 en proceso. Señalización vial y demarcación de estacionamiento completada. Quedan detalles de acabados en áreas administrativas.', fecha_presentacion: '2025-07-30T08:00:00Z', metaId: 3, contratistaId: 5, alcanceId: 7, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Pinturas y Acabados Élite S.R.L.' }, reportadoPor: { nombre: 'Pinturas y Acabados Élite S.R.L.' }, reg_imagen: '' },
  // CONT-010 Impermeabilizaciones (avance 3)
  { id: 30, numavance: 3, porcentaje_avance: 95, descripcion: 'Fachadas externas impermeabilizadas al 95%. Sistema de drenaje pluvial revisado y ampliado. Prueba de inundación en todas las terrazas aprobada sin filtraciones. Pendiente retoque de bordes.', fecha_presentacion: '2025-08-20T10:00:00Z', metaId: 3, contratistaId: 10, alcanceId: 8, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Impermeabilizaciones del Sur' }, reportadoPor: { nombre: 'Impermeabilizaciones del Sur' }, reg_imagen: '' },
  // CONT-003 Servicios Técnicos (avance 3)
  { id: 33, numavance: 3, porcentaje_avance: 80, descripcion: 'Sistemas hidráulicos auditados: bombas, válvulas y tuberías principales revisadas. Reparación de 12 puntos con fugas activas. Calibración de presostatos y termostatos en todos los pisos.', fecha_presentacion: '2025-08-15T08:00:00Z', metaId: 3, contratistaId: 3, alcanceId: 9, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Servicios Técnicos Pro C.A.' }, reportadoPor: { nombre: 'Servicios Técnicos Pro C.A.' }, reg_imagen: '' },
  // CONT-005 Pinturas (avance 4 - COMPLETO)
  { id: 45, numavance: 4, porcentaje_avance: 100, descripcion: 'Obra de pintura concluida en su totalidad. 18.000 m² intervenidos entre interiores, fachadas y áreas comunes. Memoria fotográfica y acta de entrega firmada por el cliente.', fecha_presentacion: '2025-09-30T08:00:00Z', metaId: 3, contratistaId: 5, alcanceId: 7, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Pinturas y Acabados Élite S.R.L.' }, reportadoPor: { nombre: 'Pinturas y Acabados Élite S.R.L.' }, reg_imagen: '' },
  // CONT-010 Impermeabilizaciones (avance 4 - COMPLETO)
  { id: 50, numavance: 4, porcentaje_avance: 100, descripcion: 'Impermeabilización completada al 100% en todas las superficies del edificio. Garantía de 10 años sobre terrazas y fachadas entregada al cliente. Certificado de impermeabilidad emitido.', fecha_presentacion: '2025-10-05T10:00:00Z', metaId: 3, contratistaId: 10, alcanceId: 8, meta: { nombre: 'Renovación y Mantenimiento de Infraestructura' }, contratista: { nombre: 'Impermeabilizaciones del Sur' }, reportadoPor: { nombre: 'Impermeabilizaciones del Sur' }, reg_imagen: '' },

  // ═══ META-004: Modernización de Red Eléctrica ═══
  // CONT-004 Electro Soluciones del Norte (70% del alcance total)
  { id: 10, numavance: 1, porcentaje_avance: 25, descripcion: 'Desmontaje del tablero eléctrico antiguo completado. Instalación del nuevo tablero principal 400A y 24 circuitos derivados iniciada. Canalización y tendido de alimentadores en proceso.', fecha_presentacion: '2025-05-20T11:00:00Z', metaId: 4, contratistaId: 4, alcanceId: 10, meta: { nombre: 'Modernización de Red Eléctrica' }, contratista: { nombre: 'Electro Soluciones del Norte' }, reportadoPor: { nombre: 'Electro Soluciones del Norte' }, reg_imagen: '' },
  // CONT-009 Consultoría TEC Venezuela (30% del alcance total)
  { id: 37, numavance: 1, porcentaje_avance: 40, descripcion: 'Auditoría eléctrica inicial completada. Informe técnico con 47 observaciones críticas y 23 recomendaciones entregado al cliente. Inicio de supervisión de correcciones por Electro Soluciones.', fecha_presentacion: '2025-06-15T09:00:00Z', metaId: 4, contratistaId: 9, alcanceId: 11, meta: { nombre: 'Modernización de Red Eléctrica' }, contratista: { nombre: 'Consultoría TEC Venezuela' }, reportadoPor: { nombre: 'Consultoría TEC Venezuela' }, reg_imagen: '' },
  // CONT-004 Electro Soluciones (avance 2)
  { id: 34, numavance: 2, porcentaje_avance: 50, descripcion: 'Tablero principal 400A instalado y energizado con éxito. Circuitos de pisos 1 al 3 conectados y probados. Banco de capacitores instalado para corrección de factor de potencia a 0.97.', fecha_presentacion: '2025-06-30T11:00:00Z', metaId: 4, contratistaId: 4, alcanceId: 10, meta: { nombre: 'Modernización de Red Eléctrica' }, contratista: { nombre: 'Electro Soluciones del Norte' }, reportadoPor: { nombre: 'Electro Soluciones del Norte' }, reg_imagen: '' },
  // CONT-004 Electro Soluciones (avance 3)
  { id: 35, numavance: 3, porcentaje_avance: 75, descripcion: 'Planta de emergencia 250 kVA instalada, probada y sincronizada con tablero principal. Transfer automático configurado con tiempo de respuesta menor a 3 segundos según norma.', fecha_presentacion: '2025-08-10T11:00:00Z', metaId: 4, contratistaId: 4, alcanceId: 10, meta: { nombre: 'Modernización de Red Eléctrica' }, contratista: { nombre: 'Electro Soluciones del Norte' }, reportadoPor: { nombre: 'Electro Soluciones del Norte' }, reg_imagen: '' },
  // CONT-009 Consultoría TEC (avance 2)
  { id: 38, numavance: 2, porcentaje_avance: 70, descripcion: 'Supervisión de ejecución confirmada: 35 de 47 observaciones corregidas y verificadas. Ensayos de aislamiento y continuidad realizados en pisos 1 al 5. Informe parcial entregado.', fecha_presentacion: '2025-08-20T09:00:00Z', metaId: 4, contratistaId: 9, alcanceId: 11, meta: { nombre: 'Modernización de Red Eléctrica' }, contratista: { nombre: 'Consultoría TEC Venezuela' }, reportadoPor: { nombre: 'Consultoría TEC Venezuela' }, reg_imagen: '' },
  // CONT-004 Electro Soluciones (avance 4)
  { id: 36, numavance: 4, porcentaje_avance: 90, descripcion: 'UPS instaladas en sala de servidores y centros de datos de cada piso. Circuitos de iluminación de emergencia completados en todos los niveles. Medición de tierras aprobada.', fecha_presentacion: '2025-09-30T11:00:00Z', metaId: 4, contratistaId: 4, alcanceId: 10, meta: { nombre: 'Modernización de Red Eléctrica' }, contratista: { nombre: 'Electro Soluciones del Norte' }, reportadoPor: { nombre: 'Electro Soluciones del Norte' }, reg_imagen: '' },
  // CONT-009 Consultoría TEC (avance 3)
  { id: 39, numavance: 3, porcentaje_avance: 90, descripcion: 'Todas las observaciones críticas corregidas y verificadas. Expediente técnico completo preparado para certificación COVENIN. Visita de inspector externo coordinada para próximo mes.', fecha_presentacion: '2025-10-15T09:00:00Z', metaId: 4, contratistaId: 9, alcanceId: 11, meta: { nombre: 'Modernización de Red Eléctrica' }, contratista: { nombre: 'Consultoría TEC Venezuela' }, reportadoPor: { nombre: 'Consultoría TEC Venezuela' }, reg_imagen: '' },
  // CONT-004 Electro Soluciones (avance 5 - COMPLETO)
  { id: 46, numavance: 5, porcentaje_avance: 100, descripcion: 'Red eléctrica modernizada en su totalidad. Eficiencia energética mejorada en 35%. Planos As-Built, manuales de operación y mantenimiento entregados. Acta de recepción definitiva firmada.', fecha_presentacion: '2025-11-30T11:00:00Z', metaId: 4, contratistaId: 4, alcanceId: 10, meta: { nombre: 'Modernización de Red Eléctrica' }, contratista: { nombre: 'Electro Soluciones del Norte' }, reportadoPor: { nombre: 'Electro Soluciones del Norte' }, reg_imagen: '' },
  // CONT-009 Consultoría TEC (avance 4 - COMPLETO)
  { id: 47, numavance: 4, porcentaje_avance: 100, descripcion: 'Certificación COVENIN obtenida satisfactoriamente. Toda la documentación técnica, planos As-Built y manuales de operación entregados al cliente. Acta de recepción definitiva del servicio firmada.', fecha_presentacion: '2025-12-15T09:00:00Z', metaId: 4, contratistaId: 9, alcanceId: 11, meta: { nombre: 'Modernización de Red Eléctrica' }, contratista: { nombre: 'Consultoría TEC Venezuela' }, reportadoPor: { nombre: 'Consultoría TEC Venezuela' }, reg_imagen: '' },

  // ═══ META-005: Adecuación de Espacios de Trabajo ═══
  // CONT-007 Arquitectura Moderna (35% del alcance total)
  { id: 40, numavance: 1, porcentaje_avance: 30, descripcion: 'Planos de remodelación aprobados por el cliente. Demolición de divisiones obsoletas completada en pisos 2 y 3. Limpieza y desalojo de escombros realizado. Inicio de nuevas divisiones drywall.', fecha_presentacion: '2025-02-10T11:00:00Z', metaId: 5, contratistaId: 7, alcanceId: 13, meta: { nombre: 'Adecuación de Espacios de Trabajo' }, contratista: { nombre: 'Arquitectura Moderna Grupo' }, reportadoPor: { nombre: 'Arquitectura Moderna Grupo' }, reg_imagen: '' },
  // CONT-011 Mobiliario Corporativo (65% del alcance total)
  { id: 11, numavance: 1, porcentaje_avance: 60, descripcion: 'Suministro y ensamblaje de 80 puestos de trabajo ergonómicos completado. Instalación de divisiones modulares en planta baja y primer piso. Muestra de mobiliario aprobada por Gerencia General.', fecha_presentacion: '2025-02-28T14:00:00Z', metaId: 5, contratistaId: 11, alcanceId: 12, meta: { nombre: 'Adecuación de Espacios de Trabajo' }, contratista: { nombre: 'Mobiliario Corporativo C.A.' }, reportadoPor: { nombre: 'Mobiliario Corporativo C.A.' }, reg_imagen: '' },
  // CONT-007 Arquitectura (avance 2)
  { id: 41, numavance: 2, porcentaje_avance: 65, descripcion: 'Nuevas divisiones de drywall construidas en 5 pisos. Acabados de pintura y revestimiento cerámico completados en pisos 2 al 4. Instalación de cielos rasos con luminarias LED en proceso.', fecha_presentacion: '2025-03-20T11:00:00Z', metaId: 5, contratistaId: 7, alcanceId: 13, meta: { nombre: 'Adecuación de Espacios de Trabajo' }, contratista: { nombre: 'Arquitectura Moderna Grupo' }, reportadoPor: { nombre: 'Arquitectura Moderna Grupo' }, reg_imagen: '' },
  // CONT-007 Arquitectura (avance 3)
  { id: 42, numavance: 3, porcentaje_avance: 90, descripcion: 'Remodelación al 90%. 10 salas de reuniones finalizadas con acabados premium y equipamiento AV. 2 auditorios con tarima, butacas y sistema de sonido en proceso de instalación final.', fecha_presentacion: '2025-04-30T11:00:00Z', metaId: 5, contratistaId: 7, alcanceId: 13, meta: { nombre: 'Adecuación de Espacios de Trabajo' }, contratista: { nombre: 'Arquitectura Moderna Grupo' }, reportadoPor: { nombre: 'Arquitectura Moderna Grupo' }, reg_imagen: '' },
  // CONT-011 Mobiliario Corporativo (avance 2 - COMPLETO)
  { id: 12, numavance: 2, porcentaje_avance: 100, descripcion: '200 puestos de trabajo equipados al 100%. 10 salas de reuniones y 2 auditorios completamente amoblados y operativos. Inventario final auditado. Acta de entrega definitiva firmada por el cliente.', fecha_presentacion: '2025-05-30T14:00:00Z', metaId: 5, contratistaId: 11, alcanceId: 12, meta: { nombre: 'Adecuación de Espacios de Trabajo' }, contratista: { nombre: 'Mobiliario Corporativo C.A.' }, reportadoPor: { nombre: 'Mobiliario Corporativo C.A.' }, reg_imagen: '' }
];
let nextAvanceId = 51;

app.get('/api/avances', (req, res) => {
  const data = avances.map(a => ({
    ...a,
    meta: (() => { const m = metas.find(x => x.id === a.metaId); return m ? { nombre: m.nombre, codigo: m.codigo } : a.meta; })(),
    contratista: (() => { const c = contratistas.find(x => x.id === a.contratistaId); return c ? { nombre: c.nombre, codigo: c.codigo } : a.contratista; })()
  }));
  res.json({ success: true, data });
});

app.get('/api/avances/:id', (req, res) => {
  const a = avances.find(x => x.id === parseInt(req.params.id));
  if (!a) return res.status(404).json({ success: false, message: 'Avance no encontrado' });
  res.json({ success: true, data: a });
});

app.post('/api/avances', (req, res) => {
  const { descripcion, numavance, fecha_presentacion, metaId, contratistaId, alcanceId, porcentaje_avance, reg_imagen } = req.body;
  if (!descripcion || !numavance || !fecha_presentacion || !metaId || !contratistaId) {
    return res.status(400).json({ success: false, message: 'Descripción, número, fecha, meta y contratista son requeridos' });
  }
  const meta        = metas.find(m => m.id === parseInt(metaId));
  const contratista = contratistas.find(c => c.id === parseInt(contratistaId));
  const nuevo = {
    id: nextAvanceId++, numavance: parseInt(numavance), porcentaje_avance: parseInt(porcentaje_avance) || 0,
    descripcion, fecha_presentacion,
    metaId: parseInt(metaId), contratistaId: parseInt(contratistaId),
    alcanceId: alcanceId ? parseInt(alcanceId) : null,
    meta: meta ? { nombre: meta.nombre, codigo: meta.codigo } : { nombre: 'Sin meta', codigo: '' },
    contratista: contratista ? { nombre: contratista.nombre, codigo: contratista.codigo } : { nombre: 'Sin contratista', codigo: '' },
    reportadoPor: { nombre: contratista ? contratista.nombre : 'Sin contratista' },
    reg_imagen: reg_imagen || ''
  };
  avances.push(nuevo);
  res.status(201).json({ success: true, data: nuevo, message: 'Avance registrado exitosamente' });
});

app.put('/api/avances/:id', (req, res) => {
  const idx = avances.findIndex(x => x.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Avance no encontrado' });
  const { descripcion, numavance, fecha_presentacion, metaId, contratistaId, alcanceId, porcentaje_avance, reg_imagen } = req.body;
  const meta        = metas.find(m => m.id === parseInt(metaId));
  const contratista = contratistas.find(c => c.id === parseInt(contratistaId));
  avances[idx] = {
    ...avances[idx], descripcion, numavance: parseInt(numavance), porcentaje_avance: parseInt(porcentaje_avance) || 0,
    fecha_presentacion, metaId: parseInt(metaId), contratistaId: parseInt(contratistaId),
    alcanceId: alcanceId ? parseInt(alcanceId) : null,
    meta: meta ? { nombre: meta.nombre, codigo: meta.codigo } : avances[idx].meta,
    contratista: contratista ? { nombre: contratista.nombre, codigo: contratista.codigo } : avances[idx].contratista,
    reportadoPor: { nombre: contratista ? contratista.nombre : avances[idx].reportadoPor?.nombre },
    reg_imagen: reg_imagen !== undefined ? reg_imagen : avances[idx].reg_imagen
  };
  res.json({ success: true, data: avances[idx], message: 'Avance actualizado exitosamente' });
});

app.delete('/api/avances/:id', (req, res) => {
  const idx = avances.findIndex(x => x.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Avance no encontrado' });
  avances.splice(idx, 1);
  res.json({ success: true, message: 'Avance eliminado exitosamente' });
});

// ── Upload de archivos ──
app.post('/api/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
  const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    data: { filename: req.file.filename, originalname: req.file.originalname, url, size: req.file.size },
    message: 'Archivo subido exitosamente'
  });
});

// Error handler para multer
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('archivo')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Archivo demasiado grande. Máximo 10 MB.' });
  }
  next(err);
});

// ── Dashboard stats (dinámico) ──
app.get('/api/dashboard/stats', (req, res) => {
  const promedioCompletacion = metas.length
    ? Math.round(metas.reduce((acc, m) => acc + calcPorcentajeMeta(m.id), 0) / metas.length)
    : 0;
  res.json({
    success: true,
    data: {
      totalMetas: metas.length,
      metasCompletadas: metas.filter(m => m.estado === 'COMPLETADA').length,
      totalContratistas: contratistas.length,
      totalAvances: avances.length,
      totalAlcances: alcances.length,
      metasEnProgreso: metas.filter(m => m.estado === 'EN_PROGRESO').length,
      promedioCompletacion
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
  console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
