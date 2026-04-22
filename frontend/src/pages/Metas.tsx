import React, { useEffect, useState } from 'react';
import { Target, Plus, Search, RefreshCw, AlertCircle, X, CheckCircle, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';

import { API_BASE as API } from '../config';

interface Meta {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: string;
  fecha_limite: string;
  unidades?: number | null;
  total_aporte_meta?: number;
  porcentaje_completacion?: number;
  creador?: { nombre: string; email: string };
}

interface AlcanceContrib {
  id: number;
  contratistaId: number;
  metaId: number;
  porcentaje_asignado: number;
  descripcion: string;
  contratista?: { nombre: string; codigo?: string };
}

interface AvanceMin {
  metaId: number;
  contratistaId: number;
  porcentaje_avance: number;
  numavance: number;
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 30 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-700">{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROGRESO', label: 'En Progreso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const estadoColors: Record<string, string> = {
  EN_PROGRESO: 'bg-yellow-100 text-yellow-800',
  PENDIENTE:   'bg-gray-100 text-gray-700',
  COMPLETADA:  'bg-green-100 text-green-800',
  CANCELADA:   'bg-red-100 text-red-800',
};

const EMPTY_FORM = { codigo: '', nombre: '', descripcion: '', estado: 'PENDIENTE', fecha_limite: '', unidades: '' };

/* ───── Modal ───── */
interface ModalProps {
  meta: Meta | null;
  onClose: () => void;
  onSave: () => void;
}

const MetaModal: React.FC<ModalProps> = ({ meta, onClose, onSave }) => {
  const [form, setForm] = useState(meta
    ? { codigo: meta.codigo || '', nombre: meta.nombre, descripcion: meta.descripcion, estado: meta.estado, fecha_limite: meta.fecha_limite, unidades: meta.unidades != null ? String(meta.unidades) : '' }
    : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.descripcion.trim() || !form.fecha_limite) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url  = meta ? `${API}/metas/${meta.id}` : `${API}/metas`;
      const method = meta ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setTimeout(() => { onSave(); onClose(); }, 800);
      } else {
        setError(data.message || 'Error al guardar');
      }
    } catch {
      setError('No se puede conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {meta ? 'Editar Meta' : 'Nueva Meta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input name="codigo" value={form.codigo} onChange={handleChange}
                className="input font-mono uppercase" placeholder="AUTO" />
              <p className="text-xs text-gray-400 mt-1">Dejar vacío para auto-generar</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <textarea name="nombre" value={form.nombre} onChange={handleChange}
                rows={2} className="input resize-none" placeholder="Nombre de la meta" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
              rows={4} className="input resize-none" placeholder="Descripción detallada de la meta" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select name="estado" value={form.estado} onChange={handleChange} className="input">
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite *</label>
              <input type="date" name="fecha_limite" value={form.fecha_limite} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad(es)</label>
              <input type="number" name="unidades" value={form.unidades} onChange={handleChange}
                className="input" placeholder="0.00" min="0" step="0.01" />
              <p className="text-xs text-gray-400 mt-1">Numérico o % (máx. 2 decimales)</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : (meta ? 'Guardar Cambios' : 'Crear Meta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ───── Confirm Delete ───── */
interface ConfirmProps {
  meta: Meta;
  onClose: () => void;
  onDeleted: () => void;
}

const ConfirmDelete: React.FC<ConfirmProps> = ({ meta, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API}/metas/${meta.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { onDeleted(); onClose(); }
      else setError(data.message || 'Error al eliminar');
    } catch {
      setError('No se puede conectar con el servidor');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar meta?</h2>
        <p className="text-gray-600 text-sm mb-1">Esta acción no se puede deshacer.</p>
        <p className="text-gray-800 font-medium text-sm mb-4">«{meta.nombre}»</p>
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
const Metas: React.FC = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [filtered, setFiltered] = useState<Meta[]>([]);
  const [alcances, setAlcances] = useState<AlcanceContrib[]>([]);
  const [avancesData, setAvancesData] = useState<AvanceMin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalMeta, setModalMeta] = useState<Meta | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meta | null>(null);
  const [expandedMetaId, setExpandedMetaId] = useState<number | null>(null);

  const fetchMetas = async () => {
    setLoading(true); setError('');
    try {
      const [mRes, aRes, avRes] = await Promise.all([fetch(`${API}/metas`), fetch(`${API}/alcances`), fetch(`${API}/avances`)]);
      const [mData, aData, avData] = await Promise.all([mRes.json(), aRes.json(), avRes.json()]);
      if (mData.success) { const sorted = [...mData.data].sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()); setMetas(sorted); setFiltered(sorted); }
      else setError('Error al cargar las metas');
      if (aData.success) setAlcances(aData.data);
      if (avData.success) setAvancesData(avData.data);
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMetas(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(metas.filter(m =>
      m.nombre.toLowerCase().includes(q) || m.descripcion.toLowerCase().includes(q)
    ));
  }, [search, metas]);

  return (
    <div className="space-y-6">
      {/* Modal */}
      {modalMeta !== null && (
        <MetaModal
          meta={modalMeta === 'new' ? null : modalMeta}
          onClose={() => setModalMeta(null)}
          onSave={fetchMetas}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          meta={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchMetas}
        />
      )}

      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
          <p className="text-gray-600">Gestión de metas del proyecto ({filtered.length} metas)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMetas} className="btn-outline flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />Actualizar
          </button>
          <button onClick={() => setModalMeta('new')} className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />Nueva Meta
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      <div className="card p-6">
        {/* Búsqueda */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar metas..." className="input pl-10"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-gray-600">Cargando metas...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{minWidth:'140px'}}>
                    <div className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Completación</div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unidad(es)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Límite</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contribuidores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">No se encontraron metas</td></tr>
                ) : (
                  filtered.map((meta, idx) => {
                    const rowColors = ['bg-sky-50','bg-lime-50','bg-rose-50','bg-purple-50'];
                    const rowColor  = rowColors[idx % 4];
                    const contrib = alcances.filter(a => a.metaId === meta.id);
                    const expanded = expandedMetaId === meta.id;
                    const totalPct = contrib.reduce((s, a) => s + a.porcentaje_asignado, 0);
                    return (
                      <React.Fragment key={meta.id}>
                        <tr className={`hover:brightness-95 transition-colors ${expanded ? 'ring-2 ring-inset ring-primary-200' : ''} ${rowColor}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-mono font-bold border border-primary-200">
                              {meta.codigo || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Target className="h-4 w-4 text-primary-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{meta.nombre}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">{meta.descripcion}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoColors[meta.estado] || 'bg-gray-100 text-gray-700'}`}>
                              {ESTADOS.find(e => e.value === meta.estado)?.label || meta.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4" style={{minWidth:'140px'}}>
                            <ProgressBar value={meta.porcentaje_completacion ?? 0} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right" style={{minWidth:'150px'}}>
                            {meta.unidades != null ? (() => {
                              const aporte = meta.total_aporte_meta ?? 0;
                              const pct = meta.unidades > 0 ? Math.min(100, (aporte / meta.unidades) * 100) : 0;
                              const barColor = pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 30 ? 'bg-yellow-500' : 'bg-red-400';
                              return (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-gray-500">
                                    <span className="font-bold text-orange-600">{aporte.toFixed(2)}</span>
                                    <span className="text-gray-300 mx-1">/</span>
                                    <span className="font-semibold text-indigo-700">{Number(meta.unidades).toFixed(2)}</span>
                                  </span>
                                  <div className="w-28 bg-gray-200 rounded-full h-1.5">
                                    <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className={`text-xs font-bold ${
                                    pct >= 100 ? 'text-green-600' : pct >= 60 ? 'text-blue-600' : pct >= 30 ? 'text-yellow-600' : 'text-red-500'
                                  }`}>{pct.toFixed(1)}% avance unidades</span>
                                </div>
                              );
                            })() : <span className="text-gray-300 text-sm">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meta.fecha_limite}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meta.creador?.nombre || '-'}</td>
                          {/* Contribuidores toggle */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setExpandedMetaId(expanded ? null : meta.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                contrib.length === 0
                                  ? 'border-gray-200 text-gray-400 cursor-default'
                                  : expanded
                                  ? 'border-primary-300 bg-primary-100 text-primary-700'
                                  : 'border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100'
                              }`}
                              disabled={contrib.length === 0}
                            >
                              <Users className="h-3.5 w-3.5" />
                              {contrib.length} contratista{contrib.length !== 1 ? 's' : ''}
                              {contrib.length > 0 && (expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                            <button onClick={() => setModalMeta(meta)}
                              className="text-primary-600 hover:text-primary-900 font-medium">Editar</button>
                            <button onClick={() => setDeleteTarget(meta)}
                              className="text-red-600 hover:text-red-900 font-medium">Eliminar</button>
                          </td>
                        </tr>

                        {/* ─ Panel de contribuidores expandible ─ */}
                        {expanded && contrib.length > 0 && (
                          <tr>
                            <td colSpan={9} className="px-0 py-0 bg-primary-50/40 border-b border-primary-100">
                              <div className="px-8 py-4">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    Contribuidores a {meta.codigo} — {meta.nombre}
                                  </p>
                                  <span className="text-xs text-gray-500">Total asignado: <strong>{totalPct}%</strong></span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                  {contrib
                                    .sort((a, b) => b.porcentaje_asignado - a.porcentaje_asignado)
                                    .map(al => {
                                      const contribAvances = avancesData.filter(av => av.metaId === meta.id && av.contratistaId === al.contratistaId);
                                      const latestPct = contribAvances.length > 0
                                        ? Math.max(...contribAvances.map(av => av.porcentaje_avance || 0))
                                        : null;
                                      const avColor = latestPct == null ? 'text-gray-400' : latestPct >= 80 ? 'text-green-600' : latestPct >= 50 ? 'text-blue-600' : latestPct >= 20 ? 'text-yellow-600' : 'text-red-500';
                                      const avBarColor = latestPct == null ? 'bg-gray-300' : latestPct >= 80 ? 'bg-green-500' : latestPct >= 50 ? 'bg-blue-500' : latestPct >= 20 ? 'bg-yellow-500' : 'bg-red-400';
                                      return (
                                    <div key={al.id} className="bg-white border border-primary-100 rounded-lg px-4 py-3 shadow-sm">
                                      <div className="flex items-center gap-2 mb-2">
                                        {al.contratista?.codigo && (
                                          <span className="font-mono text-xs font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 flex-shrink-0">
                                            {al.contratista.codigo}
                                          </span>
                                        )}
                                        <span className="text-sm font-medium text-gray-800 truncate" title={al.contratista?.nombre}>
                                          {al.contratista?.nombre || '—'}
                                        </span>
                                        <span className="ml-auto font-bold text-primary-700 text-sm flex-shrink-0">
                                          {al.porcentaje_asignado}% asignado
                                        </span>
                                      </div>
                                      {/* Avance real reportado */}
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-500">Avance reportado</span>
                                        <span className={`text-xs font-bold ${avColor}`}>
                                          {latestPct != null ? `${latestPct}%` : 'Sin avances'}
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                                        <div
                                          className={`h-2 rounded-full transition-all ${avBarColor}`}
                                          style={{ width: `${latestPct ?? 0}%` }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-400 truncate" title={al.descripcion}>{al.descripcion}</p>
                                    </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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

export default Metas;
