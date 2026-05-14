const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const jwt      = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const JWT_SECRET = process.env.JWT_SECRET || 'gestion-metas-secret-2026';

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
    const user = await prisma.usuario.findUnique({
      where: { email: email?.toLowerCase() },
      include: { contratista: { select: { id: true, nombre: true, codigo: true } } },
    });
    if (!user || user.password !== password)
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    if (user.estado === 'INACTIVO')
      return res.status(403).json({ success: false, message: 'Usuario inactivo. Contacte al administrador.' });
    const { password: _, ...userSafe } = user;
    const payload = { id: user.id, rol: user.rol, contratistaId: user.contratistaId };
    const token        = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      data: {
        usuario: { ...userSafe, fechaCreacion: userSafe.fechaCreacion?.toISOString().split('T')[0] },
        token,
        refreshToken,
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      include: { contratista: { select: { id: true, nombre: true, codigo: true } } },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const { password: _, ...safe } = user;
    res.json({ success: true, data: { ...safe, fechaCreacion: safe.fechaCreacion?.toISOString().split('T')[0] } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE AUTH
// ═════════════════════════════════════════════════════════════════════════════
async function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const exists = await prisma.usuario.findUnique({ where: { id: decoded.id }, select: { id: true } });
    if (!exists) return res.status(401).json({ success: false, message: 'Sesión expirada. Por favor inicia sesión nuevamente.' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}
function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'ADMIN') return res.status(403).json({ success: false, message: 'Requiere rol ADMIN' });
  next();
}
function requireAdminOrSupervisor(req, res, next) {
  if (!['ADMIN','SUPERVISOR'].includes(req.user?.rol))
    return res.status(403).json({ success: false, message: 'Requiere rol ADMIN o SUPERVISOR' });
  next();
}

// ═════════════════════════════════════════════════════════════════════════════
// USUARIOS
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await prisma.usuario.findMany({
      orderBy: { id: 'asc' },
      include: { contratista: { select: { id: true, nombre: true, codigo: true } } },
    });
    const data = rows.map(({ password: _, ...u }) => ({
      ...u, fechaCreacion: u.fechaCreacion?.toISOString().split('T')[0]
    }));
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { contratista: { select: { id: true, nombre: true, codigo: true } } },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const { password: _, ...userSafe } = user;
    res.json({ success: true, data: { ...userSafe, fechaCreacion: userSafe.fechaCreacion?.toISOString().split('T')[0] } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { nombre, email, password, rol, estado, telefono, codigo, identificacion, contacto } = req.body;
    if (!nombre?.trim() || !email?.trim() || !password?.trim())
      return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios' });
    const exists = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (exists) return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    let contratistaId = null;
    if (rol === 'CONTRATISTA') {
      const contratista = await prisma.contratista.create({
        data: {
          nombre: nombre.trim(),
          codigo: codigo?.trim() || '',
          identificacion: identificacion?.trim() || '',
          contacto: contacto?.trim() || '',
          estado: estado || 'ACTIVO',
        },
      });
      contratistaId = contratista.id;
    }
    const user = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        rol: rol || 'CONTRATISTA',
        estado: estado || 'ACTIVO',
        telefono: telefono || '',
        contratistaId,
      },
      include: { contratista: { select: { id: true, nombre: true, codigo: true } } },
    });
    const { password: _, ...userSafe } = user;
    res.json({ success: true, message: 'Usuario creado exitosamente', data: { ...userSafe, fechaCreacion: userSafe.fechaCreacion?.toISOString().split('T')[0] } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, email, password, rol, estado, telefono, codigo, identificacion, contacto } = req.body;
    if (email) {
      const dup = await prisma.usuario.findFirst({ where: { email: email.toLowerCase(), NOT: { id } } });
      if (dup) return res.status(400).json({ success: false, message: 'El email ya está en uso' });
    }
    const current = await prisma.usuario.findUnique({ where: { id }, select: { contratistaId: true, nombre: true } });
    let newContratistaId = current?.contratistaId ?? null;
    if (rol === 'CONTRATISTA') {
      if (newContratistaId) {
        const upd = {};
        if (nombre)              upd.nombre        = nombre.trim();
        if (codigo !== undefined) upd.codigo        = codigo?.trim() || '';
        if (identificacion)      upd.identificacion = identificacion.trim();
        if (contacto !== undefined) upd.contacto    = contacto?.trim() || '';
        if (estado)              upd.estado         = estado;
        await prisma.contratista.update({ where: { id: newContratistaId }, data: upd });
      } else {
        const c = await prisma.contratista.create({
          data: {
            nombre: nombre?.trim() || current?.nombre || '',
            codigo: codigo?.trim() || '',
            identificacion: identificacion?.trim() || '',
            contacto: contacto?.trim() || '',
            estado: estado || 'ACTIVO',
          },
        });
        newContratistaId = c.id;
      }
    } else if (rol === 'ADMIN') {
      newContratistaId = null;
    }
    const data = {};
    if (nombre)   data.nombre   = nombre.trim();
    if (email)    data.email    = email.trim().toLowerCase();
    if (password) data.password = password.trim();
    if (rol)      data.rol      = rol;
    if (estado)   data.estado   = estado;
    if (telefono !== undefined) data.telefono = telefono;
    data.contratistaId = newContratistaId;
    const user = await prisma.usuario.update({
      where: { id }, data,
      include: { contratista: { select: { id: true, nombre: true, codigo: true } } },
    });
    const { password: _, ...userSafe } = user;
    res.json({ success: true, message: 'Usuario actualizado exitosamente', data: { ...userSafe, fechaCreacion: userSafe.fechaCreacion?.toISOString().split('T')[0] } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
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
  const meta = await prisma.meta.findUnique({ where: { id: metaId }, select: { unidades: true } });
  if (meta?.unidades) {
    const result = await prisma.avance.aggregate({
      where: { metaId, aporte_meta: { not: null } },
      _sum: { aporte_meta: true },
    });
    const total = result._sum.aporte_meta || 0;
    return Math.min(100, Math.round((total / meta.unidades) * 10000) / 100);
  }
  const avances = await prisma.avance.findMany({ where: { metaId }, select: { porcentaje_avance: true } });
  if (!avances.length) return 0;
  return Math.min(100, Math.max(...avances.map(a => a.porcentaje_avance || 0)));
};

const calcTotalAporteMeta = async (metaId) => {
  const result = await prisma.avance.aggregate({
    where: { metaId, aporte_meta: { not: null } },
    _sum: { aporte_meta: true },
  });
  return Math.round((result._sum.aporte_meta || 0) * 100) / 100;
};

const formatMeta = async (m) => ({
  ...m,
  fecha_limite: m.fecha_limite || '',
  creador: m.creador ? { nombre: m.creador.nombre, email: m.creador.email } : null,
  porcentaje_completacion: await calcPorcentajeMeta(m.id),
  total_aporte_meta: await calcTotalAporteMeta(m.id),
});

// ═════════════════════════════════════════════════════════════════════════════
// METAS
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/metas', authenticate, async (req, res) => {
  try {
    let where = {};
    if (req.user.rol === 'CONTRATISTA' && req.user.contratistaId) {
      const alcances = await prisma.alcance.findMany({ where: { contratistaId: req.user.contratistaId }, select: { metaId: true } });
      where = { id: { in: alcances.map(a => a.metaId) } };
    }
    const rows = await prisma.meta.findMany({ where, include: { creador: true }, orderBy: { id: 'asc' } });
    const data = await Promise.all(rows.map(formatMeta));
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/metas/:id', authenticate, async (req, res) => {
  try {
    const meta = await prisma.meta.findUnique({ where: { id: parseInt(req.params.id) }, include: { creador: true } });
    if (!meta) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
    res.json({ success: true, data: await formatMeta(meta) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/metas', authenticate, requireAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, estado, fecha_limite, codigo, unidades } = req.body;
    if (!codigo?.trim())
      return res.status(400).json({ success: false, message: 'El código de la meta es obligatorio' });
    if (!nombre || !descripcion || !estado || !fecha_limite)
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    const codigoFinal = codigo.trim().toUpperCase();
    const dup = await prisma.meta.findUnique({ where: { codigo: codigoFinal } });
    if (dup) return res.status(400).json({ success: false, message: `El código '${codigoFinal}' ya está en uso.` });
    const unidadesVal = unidades !== undefined && unidades !== '' ? Math.round(parseFloat(unidades) * 100) / 100 : null;
    const meta = await prisma.meta.create({
      data: { codigo: codigoFinal, nombre, descripcion, estado, fecha_limite, unidades: unidadesVal, creador_id: req.user.id },
      include: { creador: true },
    });
    res.status(201).json({ success: true, data: await formatMeta(meta), message: 'Meta creada exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/metas/:id', authenticate, requireAdmin, async (req, res) => {
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

app.delete('/api/metas/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.meta.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Meta eliminada exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// CONTRATISTAS
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/contratistas', authenticate, async (req, res) => {
  try {
    const data = await prisma.contratista.findMany({ orderBy: { id: 'asc' } });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/contratistas/:id', authenticate, async (req, res) => {
  try {
    const c = await prisma.contratista.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!c) return res.status(404).json({ success: false, message: 'Contratista no encontrado' });
    res.json({ success: true, data: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/contratistas', authenticate, requireAdmin, async (req, res) => {
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

app.put('/api/contratistas/:id', authenticate, requireAdmin, async (req, res) => {
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

app.delete('/api/contratistas/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.contratista.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Contratista eliminado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// ALCANCES
// ═════════════════════════════════════════════════════════════════════════════
const includeAlcance = { contratista: true, meta: true };

app.get('/api/alcances', authenticate, async (req, res) => {
  try {
    let where = {};
    if (req.user.rol === 'CONTRATISTA' && req.user.contratistaId)
      where = { contratistaId: req.user.contratistaId };
    const data = await prisma.alcance.findMany({ where, include: includeAlcance, orderBy: { id: 'asc' } });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/alcances/contratista/:id', authenticate, async (req, res) => {
  try {
    const data = await prisma.alcance.findMany({
      where: { contratistaId: parseInt(req.params.id) },
      include: includeAlcance,
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/alcances', authenticate, requireAdmin, async (req, res) => {
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

app.put('/api/alcances/:id', authenticate, requireAdmin, async (req, res) => {
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

app.delete('/api/alcances/:id', authenticate, requireAdmin, async (req, res) => {
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
  alcance:     { select: { id: true, descripcion: true } },
};

app.get('/api/avances', authenticate, async (req, res) => {
  try {
    let where = {};
    if (req.user.rol === 'CONTRATISTA' && req.user.contratistaId)
      where = { contratistaId: req.user.contratistaId };
    const data = await prisma.avance.findMany({ where, include: includeAvance, orderBy: { id: 'asc' } });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/avances/:id', authenticate, async (req, res) => {
  try {
    const a = await prisma.avance.findUnique({ where: { id: parseInt(req.params.id) }, include: includeAvance });
    if (!a) return res.status(404).json({ success: false, message: 'Avance no encontrado' });
    res.json({ success: true, data: a });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/avances', authenticate, async (req, res) => {
  try {
    const { descripcion, fecha_presentacion, metaId, contratistaId, alcanceId, porcentaje_avance, reg_imagen, aporte_meta } = req.body;
    if (!descripcion || !fecha_presentacion || !metaId || !contratistaId)
      return res.status(400).json({ success: false, message: 'Descripción, fecha, meta y contratista son requeridos' });
    // CONTRATISTA solo puede reportar avances de sus propias metas
    let resolvedContratistaId = parseInt(contratistaId);
    if (req.user.rol === 'CONTRATISTA') {
      const cid = req.user.contratistaId;
      if (!cid) return res.status(403).json({ success: false, message: 'Tu usuario no tiene un contratista vinculado' });
      resolvedContratistaId = cid; // siempre forzar el propio contratista
      const alcance = await prisma.alcance.findFirst({ where: { contratistaId: cid, metaId: parseInt(metaId) } });
      if (!alcance)
        return res.status(403).json({ success: false, message: 'No tienes un alcance asignado para esta meta' });
    }
    // Auto-numerar: MAX(numavance) por contratista + 1
    const lastAvance = await prisma.avance.findFirst({
      where: { contratistaId: resolvedContratistaId },
      orderBy: { numavance: 'desc' },
      select: { numavance: true },
    });
    const nextNum = (lastAvance?.numavance ?? 0) + 1;
    const aporte = aporte_meta !== undefined && aporte_meta !== '' ? Math.round(parseFloat(aporte_meta) * 100) / 100 : null;
    const nuevo = await prisma.avance.create({
      data: {
        numavance: nextNum,
        descripcion, fecha_presentacion,
        porcentaje_avance: parseFloat(porcentaje_avance) || 0,
        aporte_meta: aporte,
        reg_imagen: reg_imagen || '',
        metaId: parseInt(metaId),
        contratistaId: resolvedContratistaId,
        alcanceId: alcanceId ? parseInt(alcanceId) : null,
        reportado_por_id: req.user.id,
      },
      include: includeAvance,
    });
    res.status(201).json({ success: true, data: nuevo, message: 'Avance registrado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/avances/:id', authenticate, async (req, res) => {
  try {
    const { descripcion, numavance, fecha_presentacion, metaId, contratistaId, alcanceId, porcentaje_avance, reg_imagen, aporte_meta } = req.body;
    const avanceId = parseInt(req.params.id);
    let resolvedContratistaId = parseInt(contratistaId);
    if (req.user.rol === 'CONTRATISTA') {
      const cid = req.user.contratistaId;
      if (!cid) return res.status(403).json({ success: false, message: 'Tu usuario no tiene un contratista vinculado' });
      // Verificar que el avance pertenece a su propio contratista
      const existing = await prisma.avance.findUnique({ where: { id: avanceId }, select: { contratistaId: true } });
      if (!existing || existing.contratistaId !== cid)
        return res.status(403).json({ success: false, message: 'No puedes editar avances de otro contratista' });
      resolvedContratistaId = cid;
    }
    const aporte = aporte_meta !== undefined && aporte_meta !== '' ? Math.round(parseFloat(aporte_meta) * 100) / 100 : null;
    // CONTRATISTA no puede modificar el porcentaje — se conserva el valor existente
    const pctData = req.user.rol === 'CONTRATISTA'
      ? {}
      : { porcentaje_avance: parseFloat(porcentaje_avance) || 0 };
    const updated = await prisma.avance.update({
      where: { id: avanceId },
      data: {
        descripcion, fecha_presentacion,
        ...pctData,
        aporte_meta: aporte,
        metaId: parseInt(metaId), contratistaId: resolvedContratistaId,
        alcanceId: alcanceId ? parseInt(alcanceId) : null,
        ...(reg_imagen !== undefined && { reg_imagen }),
      },
      include: includeAvance,
    });
    res.json({ success: true, data: updated, message: 'Avance actualizado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/avances/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.avance.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Avance eliminado exitosamente' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// UPLOAD
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
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

app.post('/api/upload', authenticate, upload.single('archivo'), (req, res) => {
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
