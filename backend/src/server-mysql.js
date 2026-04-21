const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { PrismaClient } = require('@prisma/client');

const app    = express();
const prisma = new PrismaClient();
const PORT   = process.env.PORT || 3001;

// ── Uploads ──────────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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
  if (allowed.test(path.extname(file.originalname).toLowerCase()) || allowed.test(file.mimetype))
    cb(null, true);
  else cb(new Error('Tipo de archivo no permitido.'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', db: 'mysql', timestamp: new Date().toISOString() })
);

// ═════════════════════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.usuario.findUnique({ where: { email: email?.toLowerCase() } });
    if (!user || user.password !== password)
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    if (user.estado === 'INACTIVO')
      return res.status(403).json({ success: false, message: 'Usuario inactivo. Contacte al administrador.' });
    const { password: _, ...userSafe } = user;
    res.json({
      success: true,
      data: {
        usuario: { ...userSafe, fechaCreacion: userSafe.fechaCreacion?.toISOString().split('T')[0] },
        token: 'jwt-token-' + Date.now(),
        refreshToken: 'refresh-token-' + Date.now(),
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// USUARIOS
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/users', async (req, res) => {
  try {
    const rows = await prisma.usuario.findMany({ orderBy: { id: 'asc' } });
    const data = rows.map(({ password: _, ...u }) => ({
      ...u, fechaCreacion: u.fechaCreacion?.toISOString().split('T')[0]
    }));
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const { password: _, ...userSafe } = user;
    res.json({ success: true, data: { ...userSafe, fechaCreacion: userSafe.fechaCreacion?.toISOString().split('T')[0] } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { nombre, email, password, rol, estado, telefono } = req.body;
    if (!nombre?.trim() || !email?.trim() || !password?.trim())
      return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios' });
    const exists = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (exists) return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    const user = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        rol: rol || 'USUARIO',
        estado: estado || 'ACTIVO',
        telefono: telefono || '',
      }
    });
    const { password: _, ...userSafe } = user;
    res.json({ success: true, message: 'Usuario creado exitosamente', data: { ...userSafe, fechaCreacion: userSafe.fechaCreacion?.toISOString().split('T')[0] } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, email, password, rol, estado, telefono } = req.body;
    if (email) {
      const dup = await prisma.usuario.findFirst({ where: { email: email.toLowerCase(), NOT: { id } } });
      if (dup) return res.status(400).json({ success: false, message: 'El email ya está en uso' });
    }
    const data = {};
    if (nombre)   data.nombre   = nombre.trim();
    if (email)    data.email    = email.trim().toLowerCase();
    if (password) data.password = password.trim();
    if (rol)      data.rol      = rol;
    if (estado)   data.estado   = estado;
    if (telefono !== undefined) data.telefono = telefono;
    const user = await prisma.usuario.update({ where: { id }, data });
    const { password: _, ...userSafe } = user;
    res.json({ success: true, message: 'Usuario actualizado exitosamente', data: { ...userSafe, fechaCreacion: userSafe.fechaCreacion?.toISOString().split('T')[0] } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === 1) return res.status(400).json({ success: false, message: 'No se puede eliminar al administrador principal' });
    await prisma.usuario.delete({ where: { id } });
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════
const calcPorcentajeMeta = async (metaId) => {
  const avances = await prisma.avance.findMany({ where: { metaId }, select: { porcentaje_avance: true } });
  if (!avances.length) return 0;
  return Math.min(100, Math.max(...avances.map(a => a.porcentaje_avance || 0)));
};

const formatMeta = async (m) => ({
  ...m,
  fecha_limite: m.fecha_limite || '',
  creador: m.creador ? { nombre: m.creador.nombre, email: m.creador.email } : null,
  porcentaje_completacion: await calcPorcentajeMeta(m.id),
});

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [totalMetas, metasCompletadas, metasEnProgreso, totalContratistas, totalAvances, totalAlcances, metas] =
      await Promise.all([
        prisma.meta.count(),
        prisma.meta.count({ where: { estado: 'COMPLETADA' } }),
        prisma.meta.count({ where: { estado: 'EN_PROGRESO' } }),
        prisma.contratista.count(),
        prisma.avance.count(),
        prisma.alcance.count(),
        prisma.meta.findMany({ select: { id: true } }),
      ]);
    const pcts = await Promise.all(metas.map(m => calcPorcentajeMeta(m.id)));
    const promedioCompletacion = pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : 0;
    res.json({ success: true, data: { totalMetas, metasCompletadas, metasEnProgreso, totalContratistas, totalAvances, totalAlcances, promedioCompletacion } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// METAS
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/metas', async (req, res) => {
  try {
    const rows = await prisma.meta.findMany({ include: { creador: true }, orderBy: { id: 'asc' } });
    const data = await Promise.all(rows.map(formatMeta));
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/metas/:id', async (req, res) => {
  try {
    const meta = await prisma.meta.findUnique({ where: { id: parseInt(req.params.id) }, include: { creador: true } });
    if (!meta) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
    res.json({ success: true, data: await formatMeta(meta) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/metas', async (req, res) => {
  try {
    const { nombre, descripcion, estado, fecha_limite, codigo, unidades } = req.body;
    if (!nombre || !descripcion || !estado || !fecha_limite)
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    const count     = await prisma.meta.count();
    const autoCode  = `META-${String(count + 1).padStart(3, '0')}`;
    const codigoFinal = codigo?.trim() ? codigo.trim().toUpperCase() : autoCode;
    const dup = await prisma.meta.findUnique({ where: { codigo: codigoFinal } });
    if (dup) return res.status(400).json({ success: false, message: `El código '${codigoFinal}' ya está en uso.` });
    const unidadesVal = unidades !== undefined && unidades !== '' ? Math.round(parseFloat(unidades) * 100) / 100 : null;
    const meta = await prisma.meta.create({
      data: { codigo: codigoFinal, nombre, descripcion, estado, fecha_limite, unidades: unidadesVal, creador_id: 1 },
      include: { creador: true },
    });
    res.status(201).json({ success: true, data: await formatMeta(meta), message: 'Meta creada exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/metas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, descripcion, estado, fecha_limite, codigo, unidades } = req.body;
    const current = await prisma.meta.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
    const codigoFinal = codigo?.trim() ? codigo.trim().toUpperCase() : current.codigo;
    if (codigoFinal !== current.codigo) {
      const dup = await prisma.meta.findFirst({ where: { codigo: codigoFinal, NOT: { id } } });
      if (dup) return res.status(400).json({ success: false, message: `El código '${codigoFinal}' ya está en uso.` });
    }
    const unidadesVal = unidades !== undefined && unidades !== '' ? Math.round(parseFloat(unidades) * 100) / 100 : null;
    const meta = await prisma.meta.update({
      where: { id }, data: { codigo: codigoFinal, nombre, descripcion, estado, fecha_limite, unidades: unidadesVal },
      include: { creador: true },
    });
    res.json({ success: true, data: await formatMeta(meta), message: 'Meta actualizada exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/metas/:id', async (req, res) => {
  try {
    await prisma.meta.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Meta eliminada exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// CONTRATISTAS
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/contratistas', async (req, res) => {
  try {
    const data = await prisma.contratista.findMany({ orderBy: { id: 'asc' } });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/contratistas/:id', async (req, res) => {
  try {
    const c = await prisma.contratista.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!c) return res.status(404).json({ success: false, message: 'Contratista no encontrado' });
    res.json({ success: true, data: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/contratistas', async (req, res) => {
  try {
    const { nombre, identificacion, contacto, telefono, estado, codigo } = req.body;
    if (!nombre || !identificacion || !contacto)
      return res.status(400).json({ success: false, message: 'Nombre, identificación y contacto son requeridos' });
    const count    = await prisma.contratista.count();
    const autoCode = `CONT-${String(count + 1).padStart(3, '0')}`;
    const codigoFinal = codigo?.trim() ? codigo.trim().toUpperCase() : autoCode;
    const dup = await prisma.contratista.findUnique({ where: { codigo: codigoFinal } });
    if (dup) return res.status(400).json({ success: false, message: `El código '${codigoFinal}' ya está en uso.` });
    const nuevo = await prisma.contratista.create({
      data: { codigo: codigoFinal, nombre, identificacion, contacto, telefono: telefono || '', estado: estado || 'activo' }
    });
    res.status(201).json({ success: true, data: nuevo, message: 'Contratista creado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/contratistas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, identificacion, contacto, telefono, estado, codigo } = req.body;
    const current = await prisma.contratista.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ success: false, message: 'Contratista no encontrado' });
    const codigoFinal = codigo?.trim() ? codigo.trim().toUpperCase() : current.codigo;
    if (codigoFinal !== current.codigo) {
      const dup = await prisma.contratista.findFirst({ where: { codigo: codigoFinal, NOT: { id } } });
      if (dup) return res.status(400).json({ success: false, message: `El código '${codigoFinal}' ya está en uso.` });
    }
    const updated = await prisma.contratista.update({
      where: { id }, data: { codigo: codigoFinal, nombre, identificacion, contacto, telefono, estado }
    });
    res.json({ success: true, data: updated, message: 'Contratista actualizado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/contratistas/:id', async (req, res) => {
  try {
    await prisma.contratista.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Contratista eliminado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// ALCANCES
// ═════════════════════════════════════════════════════════════════════════════
const includeAlcance = { contratista: true, meta: true };

app.get('/api/alcances', async (req, res) => {
  try {
    const data = await prisma.alcance.findMany({ include: includeAlcance, orderBy: { id: 'asc' } });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/alcances/contratista/:id', async (req, res) => {
  try {
    const data = await prisma.alcance.findMany({
      where: { contratistaId: parseInt(req.params.id) },
      include: includeAlcance,
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/alcances', async (req, res) => {
  try {
    const { contratistaId, metaId, descripcion, fecha_inicio, fecha_fin, periodicidad, porcentaje_asignado } = req.body;
    if (!contratistaId || !metaId || !descripcion || !fecha_inicio || !fecha_fin || !periodicidad)
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    const nuevo = await prisma.alcance.create({
      data: {
        contratistaId: parseInt(contratistaId), metaId: parseInt(metaId),
        descripcion, fecha_inicio, fecha_fin, periodicidad,
        porcentaje_asignado: parseFloat(porcentaje_asignado) || 100,
      },
      include: includeAlcance,
    });
    res.status(201).json({ success: true, data: nuevo, message: 'Alcance registrado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/alcances/:id', async (req, res) => {
  try {
    const { contratistaId, metaId, descripcion, fecha_inicio, fecha_fin, periodicidad, porcentaje_asignado } = req.body;
    const updated = await prisma.alcance.update({
      where: { id: parseInt(req.params.id) },
      data: {
        contratistaId: parseInt(contratistaId), metaId: parseInt(metaId),
        descripcion, fecha_inicio, fecha_fin, periodicidad,
        porcentaje_asignado: parseFloat(porcentaje_asignado) || 100,
      },
      include: includeAlcance,
    });
    res.json({ success: true, data: updated, message: 'Alcance actualizado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/alcances/:id', async (req, res) => {
  try {
    await prisma.alcance.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Alcance eliminado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// AVANCES
// ═════════════════════════════════════════════════════════════════════════════
const includeAvance = {
  meta:        { select: { nombre: true, codigo: true } },
  contratista: { select: { nombre: true, codigo: true } },
  reportadoPor:{ select: { nombre: true } },
};

app.get('/api/avances', async (req, res) => {
  try {
    const data = await prisma.avance.findMany({ include: includeAvance, orderBy: { id: 'asc' } });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/avances/:id', async (req, res) => {
  try {
    const a = await prisma.avance.findUnique({ where: { id: parseInt(req.params.id) }, include: includeAvance });
    if (!a) return res.status(404).json({ success: false, message: 'Avance no encontrado' });
    res.json({ success: true, data: a });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/avances', async (req, res) => {
  try {
    const { descripcion, numavance, fecha_presentacion, metaId, contratistaId, alcanceId, porcentaje_avance, reg_imagen } = req.body;
    if (!descripcion || !numavance || !fecha_presentacion || !metaId || !contratistaId)
      return res.status(400).json({ success: false, message: 'Descripción, número, fecha, meta y contratista son requeridos' });
    const nuevo = await prisma.avance.create({
      data: {
        numavance: parseInt(numavance),
        descripcion, fecha_presentacion,
        porcentaje_avance: parseFloat(porcentaje_avance) || 0,
        reg_imagen: reg_imagen || '',
        metaId: parseInt(metaId),
        contratistaId: parseInt(contratistaId),
        alcanceId: alcanceId ? parseInt(alcanceId) : null,
        reportado_por_id: parseInt(contratistaId) > 0 ? 1 : 1,
      },
      include: includeAvance,
    });
    res.status(201).json({ success: true, data: nuevo, message: 'Avance registrado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/avances/:id', async (req, res) => {
  try {
    const { descripcion, numavance, fecha_presentacion, metaId, contratistaId, alcanceId, porcentaje_avance, reg_imagen } = req.body;
    const updated = await prisma.avance.update({
      where: { id: parseInt(req.params.id) },
      data: {
        numavance: parseInt(numavance), descripcion, fecha_presentacion,
        porcentaje_avance: parseFloat(porcentaje_avance) || 0,
        metaId: parseInt(metaId), contratistaId: parseInt(contratistaId),
        alcanceId: alcanceId ? parseInt(alcanceId) : null,
        ...(reg_imagen !== undefined && { reg_imagen }),
      },
      include: includeAvance,
    });
    res.json({ success: true, data: updated, message: 'Avance actualizado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/avances/:id', async (req, res) => {
  try {
    await prisma.avance.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Avance eliminado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// UPLOAD
// ═════════════════════════════════════════════════════════════════════════════
app.post('/api/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
  const url = `${process.env.BACKEND_URL || 'http://localhost:' + PORT}/uploads/${req.file.filename}`;
  res.json({ success: true, data: { filename: req.file.filename, originalname: req.file.originalname, url, size: req.file.size }, message: 'Archivo subido exitosamente' });
});

// ── Error handler multer ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ success: false, message: 'Archivo demasiado grande. Máximo 10 MB.' });
  if (err.message) return res.status(400).json({ success: false, message: err.message });
  next(err);
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor MySQL+Prisma corriendo en puerto ${PORT}`);
  console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🗄️  Base de datos: MySQL via Prisma`);
});
