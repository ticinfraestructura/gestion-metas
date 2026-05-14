import React, { useEffect, useState } from 'react';
import {
  ClipboardList, Plus, Search, RefreshCw, AlertCircle, X,
  CheckCircle, Pencil, Trash2, Calendar, Target, Users, Percent,
} from 'lucide-react';
import { API_BASE as API } from '../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiFetch';

interface Alcance {
  id: number;
  contratistaId: number;
  metaId: number;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  periodicidad: string;
  porcentaje_asignado: number;
  meta?: { id: number; nombre: string; codigo?: string };
  contratista?: { id: number; nombre: string; codigo?: string };
}
interface Catalogo { id: number; nombre: string; codigo?: string; }

const PERIODICIDADES = ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL'];
const PERIOD_COLOR: Record<string, string> = {
  DIARIO: 'bg-purple-100 text-purple-700',
  SEMANAL: 'bg-blue-100 text-blue-700',
  QUINCENAL: 'bg-yellow-100 text-yellow-700',
  MENSUAL: 'bg-green-100 text-green-700',
};
const EMPTY_FORM = { contratistaId: '', metaId: '', descripcion: '', fecha_inicio: '', fecha_fin: '', periodicidad: 'MENSUAL', porcentaje_asignado: '100' };

/* ───── Modal Crear / Editar Actividad ───── */
const ActividadModal: React.FC<{
  alcance: Alcance | null;
  contratistas: Catalogo[];
  metas: Catalogo[];
  onClose: () => void;
  onSave: () => void;
}> = ({ alcance, contratistas, metas, onClose, onSave }) => {
  const [form, setForm] = useState(
    alcance
      ? {
          contratistaId: String(alcance.contratistaId),
          metaId: String(alcance.metaId),
          descripcion: alcance.descripcion,
          fecha_inicio: alcance.fecha_inicio?.split('T')[0] || '',
          fecha_fin: alcance.fecha_fin?.split('T')[0] || '',
          periodicidad: alcance.periodicidad,
          porcentaje_asignado: String(alcance.porcentaje_asignado),
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contratistaId || !form.metaId || !form.descripcion.trim() || !form.fecha_inicio || !form.fecha_fin || !form.periodicidad) {
      setError('Todos los campos son obligatorios'); return;
    }
    setSaving(true);
    try {
      const url = alcance ? `${API}/alcances/${alcance.id}` : `${API}/alcances`;
      const fn  = alcance ? apiPut : apiPost;
      const res = await fn(url, form);
      const data = await res.json();
      if (data.success) { setSuccess(data.message); setTimeout(() => { onSave(); onClose(); }, 700); }
      else setError(data.message || 'Error al guardar');
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary-600" />
            {alcance ? 'Editar Actividad' : 'Nueva Actividad'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error   && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>}
          {success && <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-md text-sm"><CheckCircle className="h-4 w-4 flex-shrink-0" />{success}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contratista *</label>
            <select name="contratistaId" value={form.contratistaId} onChange={change} className="input">
              <option value="">-- Seleccionar contratista --</option>
              {contratistas.map(c => <option key={c.id} value={c.id}>{c.codigo ? `[${c.codigo}] ` : ''}{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta asociada *</label>
            <select name="metaId" value={form.metaId} onChange={change} className="input">
              <option value="">-- Seleccionar meta --</option>
              {metas.map(m => <option key={m.id} value={m.id}>{m.codigo ? `[${m.codigo}] ` : ''}{m.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la actividad *</label>
            <textarea name="descripcion" value={form.descripcion} onChange={change}
              rows={3} className="input resize-none" placeholder="Describe los entregables o actividades a realizar..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
              <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={change} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin *</label>
              <input type="date" name="fecha_fin" value={form.fecha_fin} onChange={change} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidad del reporte *</label>
              <select name="periodicidad" value={form.periodicidad} onChange={change} className="input">
                {PERIODICIDADES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">% asignado a la meta</label>
              <div className="relative">
                <input type="number" name="porcentaje_asignado" min="1" max="100"
                  value={form.porcentaje_asignado} onChange={change} className="input pr-8" />
                <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : (alcance ? 'Guardar Cambios' : 'Crear Actividad')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ───── Confirmar eliminación ───── */
const ConfirmDelete: React.FC<{
  alcance: Alcance;
  onClose: () => void;
  onDeleted: () => void;
}> = ({ alcance, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await apiDelete(`${API}/alcances/${alcance.id}`);
      const data = await res.json();
      if (data.success) { onDeleted(); onClose(); }
      else setError(data.message || 'Error al eliminar');
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar actividad?</h2>
        <p className="text-gray-600 text-sm mb-1">Esta acción no se puede deshacer.</p>
        <p className="text-gray-800 font-medium text-sm mb-4">«{alcance.descripcion.substring(0, 80)}{alcance.descripcion.length > 80 ? '...' : ''}»</p>
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
const Actividades: React.FC = () => {
  const [alcances, setAlcances]       = useState<Alcance[]>([]);
  const [filtered, setFiltered]       = useState<Alcance[]>([]);
  const [contratistas, setContratistas] = useState<Catalogo[]>([]);
  const [metas, setMetas]             = useState<Catalogo[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filterContratista, setFilterContratista] = useState('');
  const [filterMeta, setFilterMeta]   = useState('');
  const [modal, setModal]             = useState<Alcance | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Alcance | null>(null);

  const fetchAll = async () => {
    setLoading(true); setError('');
    try {
      const [aRes, cRes, mRes] = await Promise.all([
        apiGet(`${API}/alcances`),
        apiGet(`${API}/contratistas`),
        apiGet(`${API}/metas`),
      ]);
      const [a, c, m] = await Promise.all([aRes.json(), cRes.json(), mRes.json()]);
      if (a.success) { setAlcances(a.data); setFiltered(a.data); }
      else setError(a.message || 'Error al cargar actividades');
      if (c.success) setContratistas(c.data);
      if (m.success) setMetas(m.data);
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(alcances.filter(a =>
      (a.descripcion.toLowerCase().includes(q) ||
       (a.contratista?.nombre || '').toLowerCase().includes(q) ||
       (a.meta?.nombre || '').toLowerCase().includes(q)) &&
      (filterContratista ? String(a.contratistaId) === filterContratista : true) &&
      (filterMeta        ? String(a.metaId) === filterMeta : true)
    ));
  }, [search, filterContratista, filterMeta, alcances]);

  return (
    <div className="space-y-6">
      {modal !== null && (
        <ActividadModal
          alcance={modal === 'new' ? null : modal}
          contratistas={contratistas}
          metas={metas}
          onClose={() => setModal(null)}
          onSave={fetchAll}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          alcance={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchAll}
        />
      )}

      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actividades</h1>
          <p className="text-gray-600">Actividades asignadas a contratistas por meta · {filtered.length} registros</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="btn-outline flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />Actualizar
          </button>
          <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />Nueva Actividad
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
          { label: 'Total actividades', value: alcances.length,      icon: ClipboardList, color: 'text-primary-600 bg-primary-100' },
          { label: 'Contratistas',      value: new Set(alcances.map(a => a.contratistaId)).size, icon: Users, color: 'text-green-600 bg-green-100' },
          { label: 'Metas cubiertas',   value: new Set(alcances.map(a => a.metaId)).size,        icon: Target, color: 'text-blue-600 bg-blue-100' },
          { label: 'Mensuales',         value: alcances.filter(a => a.periodicidad === 'MENSUAL').length, icon: Calendar, color: 'text-yellow-600 bg-yellow-100' },
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
            <input type="text" placeholder="Buscar por actividad, contratista o meta..."
              className="input pl-10 w-full" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterContratista} onChange={e => setFilterContratista(e.target.value)} className="input w-auto">
            <option value="">Todos los contratistas</option>
            {contratistas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={filterMeta} onChange={e => setFilterMeta(e.target.value)} className="input w-auto">
            <option value="">Todas las metas</option>
            {metas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-gray-600">Cargando actividades...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contratista</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actividad / Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vigencia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodicidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No se encontraron actividades</td></tr>
                ) : (
                  filtered.map((a, idx) => {
                    const rowColors = ['bg-sky-50', 'bg-lime-50', 'bg-rose-50', 'bg-purple-50'];
                    return (
                      <tr key={a.id} className={`hover:brightness-95 transition-colors ${rowColors[idx % 4]}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-xs">{a.contratista?.nombre || `#${a.contratistaId}`}</p>
                              {a.contratista?.codigo && <p className="text-xs text-gray-400 font-mono">{a.contratista.codigo}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-gray-900 text-xs">{a.meta?.nombre || `#${a.metaId}`}</p>
                              {a.meta?.codigo && <p className="text-xs text-gray-400 font-mono">{a.meta.codigo}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-gray-700 text-xs line-clamp-2">{a.descripcion}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {a.fecha_inicio?.split('T')[0]} → {a.fecha_fin?.split('T')[0]}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${PERIOD_COLOR[a.periodicidad] || 'bg-gray-100 text-gray-700'}`}>
                            {a.periodicidad}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700 text-xs">{a.porcentaje_asignado}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setModal(a)} title="Editar"
                              className="p-1.5 rounded-md text-primary-600 hover:bg-primary-50 transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(a)} title="Eliminar"
                              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
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

export default Actividades;
