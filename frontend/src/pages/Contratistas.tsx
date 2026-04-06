import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Mail, RefreshCw, AlertCircle, Building2, X, CheckCircle, Phone, ClipboardList, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const API = 'http://localhost:3001/api';

interface Contratista {
  id: number;
  codigo?: string;
  nombre: string;
  identificacion: string;
  contacto: string;
  telefono?: string;
  estado: string;
}

interface Alcance {
  id: number;
  contratistaId: number;
  metaId: number;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  periodicidad: string;
  porcentaje_asignado: number;
  meta?: { id?: number; nombre: string; codigo?: string };
  contratista?: { nombre: string; codigo?: string };
}

interface Catalogo { id: number; nombre: string; }

const EMPTY = { codigo: '', nombre: '', identificacion: '', contacto: '', telefono: '', estado: 'activo' };
const PERIODICIDADES = ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL'];
const EMPTY_ALCANCE = { contratistaId: '', metaId: '', descripcion: '', fecha_inicio: '', fecha_fin: '', periodicidad: 'MENSUAL', porcentaje_asignado: '100' };

/* ───── Modal ───── */
const ContratistaModal: React.FC<{
  contratista: Contratista | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ contratista, onClose, onSave }) => {
  const [form, setForm] = useState(
    contratista
      ? { codigo: contratista.codigo || '', nombre: contratista.nombre, identificacion: contratista.identificacion, contacto: contratista.contacto, telefono: contratista.telefono || '', estado: contratista.estado }
      : { ...EMPTY }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.identificacion.trim() || !form.contacto.trim()) {
      setError('Nombre, identificación y contacto son obligatorios'); return;
    }
    setSaving(true);
    try {
      const url    = contratista ? `${API}/contratistas/${contratista.id}` : `${API}/contratistas`;
      const method = contratista ? 'PUT' : 'POST';
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
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
          <h2 className="text-lg font-semibold text-gray-900">{contratista ? 'Editar Contratista' : 'Nuevo Contratista'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error   && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}
          {success && <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-md text-sm"><CheckCircle className="h-4 w-4" />{success}</div>}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input name="codigo" value={form.codigo} onChange={change} className="input font-mono uppercase" placeholder="AUTO" />
              <p className="text-xs text-gray-400 mt-1">Dejar vacío para auto-generar</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={change} className="input" placeholder="Nombre de la empresa" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identificación (RIF) *</label>
              <input name="identificacion" value={form.identificacion} onChange={change} className="input" placeholder="J-000000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select name="estado" value={form.estado} onChange={change} className="input">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo de Contacto *</label>
            <input name="contacto" type="email" value={form.contacto} onChange={change} className="input" placeholder="contacto@empresa.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={change} className="input" placeholder="0212-555-0000" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : (contratista ? 'Guardar Cambios' : 'Crear Contratista')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ───── Modal Alcance ───── */
const AlcanceModal: React.FC<{
  alcance: Alcance | null;
  contratistaFijo?: Contratista;
  metas: Catalogo[];
  contratistas: Catalogo[];
  onClose: () => void;
  onSave: () => void;
}> = ({ alcance, contratistaFijo, metas, contratistas, onClose, onSave }) => {
  const [form, setForm] = useState(
    alcance
      ? { contratistaId: String(alcance.contratistaId), metaId: String(alcance.metaId), descripcion: alcance.descripcion, fecha_inicio: alcance.fecha_inicio, fecha_fin: alcance.fecha_fin, periodicidad: alcance.periodicidad, porcentaje_asignado: String(alcance.porcentaje_asignado) }
      : { ...EMPTY_ALCANCE, contratistaId: contratistaFijo ? String(contratistaFijo.id) : '' }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contratistaId || !form.metaId || !form.descripcion || !form.fecha_inicio || !form.fecha_fin || !form.periodicidad) {
      setError('Todos los campos son obligatorios'); return;
    }
    setSaving(true);
    try {
      const url    = alcance ? `${API}/alcances/${alcance.id}` : `${API}/alcances`;
      const method = alcance ? 'PUT' : 'POST';
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
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
          <h2 className="text-lg font-semibold text-gray-900">{alcance ? 'Editar Alcance' : 'Nuevo Alcance'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error   && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}
          {success && <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-md text-sm"><CheckCircle className="h-4 w-4" />{success}</div>}

          {!contratistaFijo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contratista *</label>
              <select name="contratistaId" value={form.contratistaId} onChange={change} className="input">
                <option value="">-- Seleccionar contratista --</option>
                {contratistas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta *</label>
            <select name="metaId" value={form.metaId} onChange={change} className="input">
              <option value="">-- Seleccionar meta --</option>
              {metas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del alcance *</label>
            <textarea name="descripcion" value={form.descripcion} onChange={change}
              rows={2} className="input resize-none" placeholder="¿Qué entregables debe cumplir este contratista?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio del contrato *</label>
              <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={change} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin del contrato *</label>
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
              <input type="number" name="porcentaje_asignado" min="1" max="100" value={form.porcentaje_asignado} onChange={change} className="input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : (alcance ? 'Guardar Cambios' : 'Crear Alcance')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ───── Confirm Delete ───── */
const ConfirmDelete: React.FC<{
  contratista: Contratista;
  onClose: () => void;
  onDeleted: () => void;
}> = ({ contratista, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/contratistas/${contratista.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { onDeleted(); onClose(); }
      else setError(data.message || 'Error al eliminar');
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar contratista?</h2>
        <p className="text-gray-600 text-sm mb-1">Esta acción no se puede deshacer.</p>
        <p className="text-gray-800 font-medium text-sm mb-4">
          {contratista.codigo && <span className="mr-2 font-mono text-xs font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">{contratista.codigo}</span>}
          «{contratista.nombre}»
        </p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Cancelar</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Contratistas: React.FC = () => {
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [filtered, setFiltered]         = useState<Contratista[]>([]);
  const [alcances, setAlcances]         = useState<Alcance[]>([]);
  const [metas, setMetas]               = useState<Catalogo[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [modal, setModal]               = useState<Contratista | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contratista | null>(null);
  const [alcanceModal, setAlcanceModal] = useState<{ alcance: Alcance | null; contratista: Contratista } | null>(null);
  const [expandedId, setExpandedId]     = useState<number | null>(null);

  const fetchAll = async () => {
    setLoading(true); setError('');
    try {
      const [cRes, aRes, mRes] = await Promise.all([
        fetch(`${API}/contratistas`),
        fetch(`${API}/alcances`),
        fetch(`${API}/metas`),
      ]);
      const [c, a, m] = await Promise.all([cRes.json(), aRes.json(), mRes.json()]);
      if (c.success) { setContratistas(c.data); setFiltered(c.data); }
      else setError('Error al cargar los contratistas');
      if (a.success) setAlcances(a.data);
      if (m.success) setMetas(m.data);
    } catch { setError('No se puede conectar con el servidor.'); }
    finally { setLoading(false); }
  };

  const deleteAlcance = async (id: number) => {
    await fetch(`${API}/alcances/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(contratistas.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      (c.codigo || '').toLowerCase().includes(q) ||
      c.identificacion.toLowerCase().includes(q) ||
      c.contacto.toLowerCase().includes(q)
    ));
  }, [search, contratistas]);

  const periodColor: Record<string, string> = {
    DIARIO: 'bg-purple-100 text-purple-700',
    SEMANAL: 'bg-blue-100 text-blue-700',
    QUINCENAL: 'bg-yellow-100 text-yellow-700',
    MENSUAL: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      {modal !== null && (
        <ContratistaModal
          contratista={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={fetchAll}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          contratista={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchAll}
        />
      )}
      {alcanceModal && (
        <AlcanceModal
          alcance={alcanceModal.alcance}
          contratistaFijo={alcanceModal.contratista}
          metas={metas}
          contratistas={contratistas}
          onClose={() => setAlcanceModal(null)}
          onSave={fetchAll}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratistas</h1>
          <p className="text-gray-600">Gestión de contratistas ({filtered.length} registros)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="btn-outline flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />Actualizar
          </button>
          <button onClick={() => setModal('new')} className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />Nuevo Contratista
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      <div className="card p-6">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre, RIF o contacto..." className="input pl-10"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-gray-600">Cargando contratistas...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No se encontraron contratistas</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(c => {
              const myAlcances = alcances.filter(a => a.contratistaId === c.id);
              const expanded   = expandedId === c.id;
              return (
                <div key={c.id} className="card border border-gray-200 hover:shadow-md transition-shadow">
                  {/* ─ Cabecera ─ */}
                  <div className="p-5">
                    <div className="flex items-center mb-3">
                      <div className="h-11 w-11 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {c.codigo && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-mono font-bold border border-green-200 flex-shrink-0">
                              {c.codigo}
                            </span>
                          )}
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{c.nombre}</h3>
                        </div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          c.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>{c.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span className="truncate">{c.contacto}</span></div>
                      {c.telefono && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{c.telefono}</span></div>}
                      <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /><span><strong>RIF:</strong> {c.identificacion}</span></div>
                    </div>

                    {/* ─ Resumen de contribuciones ─ */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <ClipboardList className="h-3 w-3" /> Contribuye a ({myAlcances.length})
                      </p>
                      {myAlcances.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Sin alcances asignados aún</p>
                      ) : (
                        <div className="space-y-1.5">
                          {myAlcances.map(al => (
                            <div key={al.id} className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-md px-2.5 py-1.5">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {al.meta?.codigo && (
                                  <span className="font-mono font-bold text-primary-700 bg-white px-1.5 py-0.5 rounded border border-primary-200 text-xs flex-shrink-0">
                                    {al.meta.codigo}
                                  </span>
                                )}
                                <span className="text-xs text-gray-700 truncate" title={al.meta?.nombre}>{al.meta?.nombre || '—'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${periodColor[al.periodicidad] || 'bg-gray-100 text-gray-600'}`}>
                                  {al.periodicidad.charAt(0) + al.periodicidad.slice(1).toLowerCase()}
                                </span>
                                <span className="text-xs font-bold text-primary-700">{al.porcentaje_asignado}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setModal(c)} className="btn-outline text-xs flex-1">Editar</button>
                      <button onClick={() => setDeleteTarget(c)} className="btn-outline text-xs flex-1 text-red-600">Eliminar</button>
                    </div>
                  </div>

                  {/* ─ Detalle de alcances (expandible) ─ */}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => setExpandedId(expanded ? null : c.id)}
                      className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-primary-500" />
                        Detalle de alcances
                      </span>
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {expanded && (
                      <div className="px-5 pb-4 space-y-3">
                        {myAlcances.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Sin alcances asignados</p>
                        ) : (
                          myAlcances.map(al => (
                            <div key={al.id} className="bg-gray-50 rounded-lg p-3 text-xs">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="font-medium text-gray-800 flex-1">{al.descripcion}</p>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button onClick={() => setAlcanceModal({ alcance: al, contratista: c })} className="text-primary-600 hover:text-primary-800">Editar</button>
                                  <span className="text-gray-300">|</span>
                                  <button onClick={() => deleteAlcance(al.id)} className="text-red-500 hover:text-red-700">Quitar</button>
                                </div>
                              </div>
                              <p className="text-gray-500 mb-2"><strong>Meta:</strong> {al.meta?.nombre || '-'}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className={`px-2 py-0.5 rounded-full font-medium ${periodColor[al.periodicidad] || 'bg-gray-100 text-gray-600'}`}>
                                  <Clock className="h-3 w-3 inline mr-1" />{al.periodicidad.charAt(0) + al.periodicidad.slice(1).toLowerCase()}
                                </span>
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Calendar className="h-3 w-3" />{al.fecha_inicio} → {al.fecha_fin}
                                </span>
                                <span className="text-primary-600 font-semibold">{al.porcentaje_asignado}% de la meta</span>
                              </div>
                            </div>
                          ))
                        )}
                        <button
                          onClick={() => setAlcanceModal({ alcance: null, contratista: c })}
                          className="w-full flex items-center justify-center gap-1 py-2 border border-dashed border-primary-300 text-primary-600 hover:bg-primary-50 rounded-lg text-xs font-medium"
                        >
                          <Plus className="h-3.5 w-3.5" />Agregar Alcance
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contratistas;
