import React, { useEffect, useState } from 'react';
import {
  UserCog, Plus, Search, RefreshCw, AlertCircle, X,
  CheckCircle, Eye, EyeOff, Shield, User as UserIcon,
  Phone, Mail, Calendar, Pencil, Trash2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const API = 'http://localhost:3001/api';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'USUARIO';
  estado: 'ACTIVO' | 'INACTIVO';
  telefono: string;
  fechaCreacion: string;
}

const ROLES = [
  { value: 'USUARIO', label: 'Usuario' },
  { value: 'ADMIN',   label: 'Administrador' },
];

const ESTADOS = [
  { value: 'ACTIVO',   label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

const rolColor: Record<string, string> = {
  ADMIN:   'bg-purple-100 text-purple-800 border-purple-200',
  USUARIO: 'bg-blue-100 text-blue-800 border-blue-200',
};

const estadoColor: Record<string, string> = {
  ACTIVO:   'bg-green-100 text-green-800',
  INACTIVO: 'bg-red-100 text-red-800',
};

const EMPTY_FORM = { nombre: '', email: '', password: '', rol: 'USUARIO' as const, estado: 'ACTIVO' as const, telefono: '' };

/* ───── Modal Crear / Editar ───── */
interface ModalProps {
  usuario: Usuario | null;
  onClose: () => void;
  onSave: () => void;
  currentUserId: number;
}

const UsuarioModal: React.FC<ModalProps> = ({ usuario, onClose, onSave, currentUserId }) => {
  const [form, setForm] = useState(
    usuario
      ? { nombre: usuario.nombre, email: usuario.email, password: '', rol: usuario.rol, estado: usuario.estado, telefono: usuario.telefono || '' }
      : { ...EMPTY_FORM }
  );
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) { setError('Nombre y email son obligatorios'); return; }
    if (!usuario && !form.password.trim()) { setError('La contraseña es obligatoria para nuevos usuarios'); return; }

    setSaving(true); setError('');
    try {
      const body: any = { nombre: form.nombre, email: form.email, rol: form.rol, estado: form.estado, telefono: form.telefono };
      if (form.password.trim()) body.password = form.password;

      const url    = usuario ? `${API}/users/${usuario.id}` : `${API}/users`;
      const method = usuario ? 'PUT' : 'POST';
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setTimeout(() => { onSave(); onClose(); }, 800);
      } else {
        setError(data.message || 'Error al guardar');
      }
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setSaving(false); }
  };

  const isEditingSelf = usuario?.id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary-600" />
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-md text-sm">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />{success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="nombre" value={form.nombre} onChange={handleChange}
                  className="input pl-9" placeholder="Nombre del usuario" />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="input pl-9" placeholder="correo@ejemplo.com" />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {usuario ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
              </label>
              <div className="relative">
                <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  className="input pr-10" placeholder={usuario ? '••••••••' : 'Mínimo 6 caracteres'} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="telefono" value={form.telefono} onChange={handleChange}
                  className="input pl-9" placeholder="+58 4XX XXX XXXX" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select name="rol" value={form.rol} onChange={handleChange} className="input"
                disabled={isEditingSelf}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              {isEditingSelf && <p className="text-xs text-gray-400 mt-1">No puedes cambiar tu propio rol</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select name="estado" value={form.estado} onChange={handleChange} className="input"
                disabled={isEditingSelf}>
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
              {isEditingSelf && <p className="text-xs text-gray-400 mt-1">No puedes cambiar tu propio estado</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : (usuario ? 'Guardar Cambios' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ───── Modal Confirmar Eliminación ───── */
interface DeleteProps { usuario: Usuario; onClose: () => void; onDeleted: () => void; }

const ConfirmDelete: React.FC<DeleteProps> = ({ usuario, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/users/${usuario.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { onDeleted(); onClose(); }
      else setError(data.message || 'Error al eliminar');
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar usuario?</h2>
        <p className="text-gray-600 text-sm mb-1">Esta acción no se puede deshacer.</p>
        <p className="text-gray-800 font-medium text-sm mb-4">«{usuario.nombre}» — {usuario.email}</p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Cancelar</button>
          <button onClick={handleDelete} disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───── Página principal ───── */
const Usuarios: React.FC = () => {
  const { usuario: currentUser } = useAuthStore();
  const [usuarios, setUsuarios]     = useState<Usuario[]>([]);
  const [filtered, setFiltered]     = useState<Usuario[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filterRol, setFilterRol]   = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [modalUser, setModalUser]   = useState<Usuario | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/users`);
      const data = await res.json();
      if (data.success) { setUsuarios(data.data); setFiltered(data.data); }
      else setError('Error al cargar usuarios');
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(usuarios.filter(u =>
      (u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (filterRol    ? u.rol    === filterRol    : true) &&
      (filterEstado ? u.estado === filterEstado : true)
    ));
  }, [search, filterRol, filterEstado, usuarios]);

  const toggleEstado = async (u: Usuario) => {
    const newEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      const res  = await fetch(`${API}/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      });
      const data = await res.json();
      if (data.success) fetchUsuarios();
      else setError(data.message || 'Error al cambiar estado');
    } catch { setError('No se puede conectar con el servidor'); }
  };

  const activos   = usuarios.filter(u => u.estado === 'ACTIVO').length;
  const admins    = usuarios.filter(u => u.rol === 'ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Modals */}
      {modalUser !== null && (
        <UsuarioModal
          usuario={modalUser === 'new' ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSave={fetchUsuarios}
          currentUserId={currentUser?.id ?? -1}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          usuario={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchUsuarios}
        />
      )}

      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">{usuarios.length} usuarios registrados · {activos} activos · {admins} administradores</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsuarios} className="btn-outline flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />Actualizar
          </button>
          <button onClick={() => setModalUser('new')} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />Nuevo Usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total usuarios', value: usuarios.length, icon: UserCog, color: 'text-primary-600 bg-primary-100' },
          { label: 'Activos',        value: activos,         icon: CheckCircle, color: 'text-green-600 bg-green-100' },
          { label: 'Inactivos',      value: usuarios.length - activos, icon: X, color: 'text-red-600 bg-red-100' },
          { label: 'Administradores',value: admins,          icon: Shield, color: 'text-purple-600 bg-purple-100' },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre o email..."
              className="input pl-10 w-full" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterRol} onChange={e => setFilterRol(e.target.value)} className="input w-auto">
            <option value="">Todos los roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input w-auto">
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-gray-600">Cargando usuarios...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3" />Creación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No se encontraron usuarios</td></tr>
                ) : (
                  filtered.map(u => {
                    const isSelf    = u.id === currentUser?.id;
                    const isAdminRoot = u.id === 1;
                    return (
                      <tr key={u.id} className={`hover:bg-gray-50 ${isSelf ? 'bg-primary-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                              u.rol === 'ADMIN' ? 'bg-purple-100' : 'bg-blue-100'
                            }`}>
                              {u.rol === 'ADMIN'
                                ? <Shield className="h-4 w-4 text-purple-600" />
                                : <UserIcon className="h-4 w-4 text-blue-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {u.nombre}
                                {isSelf && <span className="ml-2 text-xs text-primary-600 font-semibold">(tú)</span>}
                              </p>
                              <p className="text-xs text-gray-400">ID #{u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-700">{u.email}</p>
                          {u.telefono && <p className="text-xs text-gray-400">{u.telefono}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${rolColor[u.rol] || ''}`}>
                            {u.rol === 'ADMIN' ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                            {ROLES.find(r => r.value === u.rol)?.label || u.rol}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor[u.estado] || ''}`}>
                            {u.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.fechaCreacion}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* Toggle estado */}
                            {!isSelf && !isAdminRoot && (
                              <button
                                onClick={() => toggleEstado(u)}
                                title={u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                                className={`p-1.5 rounded-md transition-colors ${
                                  u.estado === 'ACTIVO'
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                              >
                                {u.estado === 'ACTIVO' ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                              </button>
                            )}
                            <button onClick={() => setModalUser(u)} title="Editar"
                              className="p-1.5 rounded-md text-primary-600 hover:bg-primary-50 transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                            {!isSelf && !isAdminRoot && (
                              <button onClick={() => setDeleteTarget(u)} title="Eliminar"
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;
