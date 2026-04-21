import React, { useEffect, useRef, useState } from 'react';
import { Plus, Search, Calendar, FileText, RefreshCw, AlertCircle, X, CheckCircle, Upload, Paperclip, Trash2 } from 'lucide-react';

interface Avance {
  id: number;
  descripcion: string;
  numavance: number;
  porcentaje_avance: number;
  aporte_meta?: number | null;
  fecha_presentacion: string;
  metaId?: number | null;
  contratistaId?: number | null;
  alcanceId?: number | null;
  meta?: { nombre: string; codigo?: string };
  contratista?: { nombre: string; codigo?: string };
  reportadoPor?: { nombre: string };
  reg_imagen?: string;
}
interface Catalogo { id: number; codigo?: string; nombre: string; }
interface Alcance { id: number; contratistaId: number; metaId: number; descripcion: string; periodicidad: string; fecha_inicio: string; fecha_fin: string; meta?: { nombre: string }; }

const API_URL = 'http://localhost:3001/api';
const EMPTY_FORM = { descripcion: '', numavance: '1', porcentaje_avance: '0', aporte_meta: '', fecha_presentacion: '', metaId: '', contratistaId: '', alcanceId: '' };

/* ───── Modal ───── */
const AvanceModal: React.FC<{
  avance: Avance | null;
  metas: Catalogo[];
  contratistas: Catalogo[];
  alcances: Alcance[];
  onClose: () => void;
  onSave: () => void;
}> = ({ avance, metas, contratistas, alcances, onClose, onSave }) => {
  const toDateInput = (iso: string) => iso ? iso.substring(0, 10) : '';
  const [form, setForm] = useState(
    avance
      ? { descripcion: avance.descripcion, numavance: String(avance.numavance),
          porcentaje_avance: String(avance.porcentaje_avance ?? 0),
          aporte_meta: avance.aporte_meta != null ? String(avance.aporte_meta) : '',
          fecha_presentacion: toDateInput(avance.fecha_presentacion),
          metaId: String(avance.metaId || ''), contratistaId: String(avance.contratistaId || ''),
          alcanceId: String(avance.alcanceId || '') }
      : { ...EMPTY_FORM }
  );
  const alcancesFiltrados = alcances.filter(a => String(a.contratistaId) === form.contratistaId);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>(avance?.reg_imagen || '');
  const [preview, setPreview]     = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) { setError('El archivo supera el límite de 10 MB'); return; }
    setFile(selected);
    setError('');
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('archivo', file);
      const res  = await fetch(`${API_URL}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setUploadedUrl(data.data.url);
        setSuccess(`Archivo "${data.data.originalname}" subido correctamente`);
        setFile(null);
        setPreview('');
        if (fileRef.current) fileRef.current.value = '';
      } else { setError(data.message || 'Error al subir archivo'); }
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setUploading(false); }
  };

  const removeFile = () => {
    setUploadedUrl(''); setFile(null); setPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descripcion.trim() || !form.numavance || !form.fecha_presentacion || !form.metaId || !form.contratistaId) {
      setError('Descripción, número, fecha, meta y contratista son obligatorios'); return;
    }
    if (file && !uploadedUrl) { setError('Tienes un archivo seleccionado sin subir. Haz clic en "Subir Archivo" primero.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, reg_imagen: uploadedUrl };
      const url    = avance ? `${API_URL}/avances/${avance.id}` : `${API_URL}/avances`;
      const method = avance ? 'PUT' : 'POST';
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { setSuccess(data.message); setTimeout(() => { onSave(); onClose(); }, 700); }
      else setError(data.message || 'Error al guardar');
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setSaving(false); }
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const filename = (url: string) => url.split('/').pop() || url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" style={{maxHeight:'90vh',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">{avance ? 'Editar Avance' : 'Nuevo Avance'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-3">
          {error   && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>}
          {success && <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-md text-sm"><CheckCircle className="h-4 w-4 flex-shrink-0" />{success}</div>}

          {/* Sección 1 — azul pizarra */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Número de Avance *</label>
                <input type="number" name="numavance" min="1" value={form.numavance} onChange={change} className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Fecha *</label>
                <input type="date" name="fecha_presentacion" value={form.fecha_presentacion} onChange={change} className="input" />
              </div>
            </div>
          </div>

          {/* Sección 2 — azul cielo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Contratista que reporta *</label>
            <select name="contratistaId" value={form.contratistaId}
              onChange={e => { change(e); setForm(p => ({ ...p, alcanceId: '' })); }}
              className="input">
              <option value="">-- Seleccionar contratista --</option>
              {contratistas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Sección 3 — índigo */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <label className="block text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Meta asociada *</label>
            <select name="metaId" value={form.metaId} onChange={change} className="input">
              <option value="">-- Seleccionar meta --</option>
              {metas.map(m => <option key={m.id} value={m.id}>{m.codigo ? `[${m.codigo}] ` : ''}{m.nombre}</option>)}
            </select>
          </div>

          {/* Sección 4 — verde azulado */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
            <label className="block text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Alcance del contrato</label>
            <select name="alcanceId" value={form.alcanceId} onChange={change} className="input"
              disabled={!form.contratistaId}>
              <option value="">-- Seleccionar alcance --</option>
              {alcancesFiltrados.map(a => <option key={a.id} value={a.id}>{a.descripcion}</option>)}
            </select>
            {form.contratistaId && alcancesFiltrados.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Este contratista no tiene alcances registrados</p>
            )}
          </div>

          {/* Sección 5 — ámbar */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
              Porcentaje de avance: <span className="text-lg font-bold">{form.porcentaje_avance}%</span>
            </label>
            <input
              type="range" name="porcentaje_avance" min="0" max="100" step="5"
              value={form.porcentaje_avance} onChange={change}
              className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-xs text-amber-500 mt-1">
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>

          {/* Sección 6 — naranja: aporte a unidades de la meta */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <label className="block text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
              Aporte a Unidades de Meta
            </label>
            <input type="number" name="aporte_meta" value={form.aporte_meta} onChange={change}
              className="input" placeholder="0.00" min="0" step="0.01" />
            <p className="text-xs text-orange-500 mt-1">
              Unidades completadas en este período de reporte (máx. 2 decimales). Si se deja vacío, se estima automáticamente.
            </p>
          </div>

          {/* Sección 7 — violeta */}
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
            <label className="block text-xs font-semibold text-violet-700 uppercase tracking-wide mb-1">Descripción *</label>
            <textarea name="descripcion" value={form.descripcion} onChange={change}
              rows={3} className="input resize-none" placeholder="Descripción detallada del avance realizado..." />
          </div>

          {/* Sección 7 — verde */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <label className="block text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Evidencia / Archivo adjunto</label>

            {/* Archivo ya subido */}
            {uploadedUrl && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {isImage(uploadedUrl) ? (
                  <div className="relative">
                    <img src={uploadedUrl} alt="evidencia" className="w-full max-h-40 object-cover rounded-md mb-2" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-700">
                    <Paperclip className="h-4 w-4" />
                    <a href={uploadedUrl} target="_blank" rel="noreferrer" className="text-sm underline truncate">{filename(uploadedUrl)}</a>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-blue-600 truncate">{filename(uploadedUrl)}</span>
                  <button type="button" onClick={removeFile} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                    <Trash2 className="h-3 w-3" />Quitar
                  </button>
                </div>
              </div>
            )}

            {/* Preview del archivo seleccionado (aún no subido) */}
            {preview && !uploadedUrl && (
              <div className="mb-3">
                <img src={preview} alt="preview" className="w-full max-h-36 object-cover rounded-md border border-gray-200" />
              </div>
            )}

            {/* Zona de drop / selección */}
            {!uploadedUrl && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {file ? (
                    <span className="font-medium text-primary-600">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  ) : (
                    <><span className="font-medium text-primary-600">Haz clic para seleccionar</span> o arrastra el archivo<br />
                    <span className="text-xs text-gray-400">Imágenes, PDF, Word, Excel — máx. 10 MB</span></>
                  )}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Botón subir */}
            {file && !uploadedUrl && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Subiendo archivo...' : 'Subir Archivo'}
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" disabled={saving || uploading} className="btn-primary">
              {saving ? 'Guardando...' : (avance ? 'Guardar Cambios' : 'Registrar Avance')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ───── Confirm Delete ───── */
const ConfirmDelete: React.FC<{
  avance: Avance;
  onClose: () => void;
  onDeleted: () => void;
}> = ({ avance, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await fetch(`${API_URL}/avances/${avance.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { onDeleted(); onClose(); }
      else setError(data.message || 'Error al eliminar');
    } catch { setError('No se puede conectar con el servidor'); }
    finally { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar avance?</h2>
        <p className="text-gray-600 text-sm mb-1">Esta acción no se puede deshacer.</p>
        <p className="text-gray-800 font-medium text-sm mb-4">
          Avance #{avance.numavance} —
          {avance.meta?.codigo && <span className="mx-1 font-mono text-xs font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">{avance.meta.codigo}</span>}
          {avance.meta?.nombre || 'Sin meta'}
        </p>
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
const Avances: React.FC = () => {
  const [avances, setAvances]           = useState<Avance[]>([]);
  const [filtered, setFiltered]         = useState<Avance[]>([]);
  const [metas, setMetas]               = useState<Catalogo[]>([]);
  const [contratistas, setContratistas] = useState<Catalogo[]>([]);
  const [alcances, setAlcances]         = useState<Alcance[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [modal, setModal]               = useState<Avance | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Avance | null>(null);

  const fetchAll = async () => {
    setLoading(true); setError('');
    try {
      const [avRes, mRes, cRes, alRes] = await Promise.all([
        fetch(`${API_URL}/avances`),
        fetch(`${API_URL}/metas`),
        fetch(`${API_URL}/contratistas`),
        fetch(`${API_URL}/alcances`),
      ]);
      const [av, m, c, al] = await Promise.all([avRes.json(), mRes.json(), cRes.json(), alRes.json()]);
      if (av.success) { setAvances(av.data); setFiltered(av.data); }
      else setError('Error al cargar los avances');
      if (m.success)  setMetas(m.data.map((x: Catalogo) => ({ id: x.id, codigo: (x as any).codigo, nombre: x.nombre })));
      if (c.success)  setContratistas(c.data);
      if (al.success) setAlcances(al.data);
    } catch { setError('No se puede conectar con el servidor.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(avances.filter(a =>
      a.descripcion.toLowerCase().includes(q) ||
      (a.meta?.nombre || '').toLowerCase().includes(q) ||
      (a.contratista?.nombre || '').toLowerCase().includes(q)
    ));
  }, [search, avances]);

  return (
    <div className="space-y-6">
      {modal !== null && (
        <AvanceModal
          avance={modal === 'new' ? null : modal}
          metas={metas}
          contratistas={contratistas}
          alcances={alcances}
          onClose={() => setModal(null)}
          onSave={fetchAll}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          avance={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchAll}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avances</h1>
          <p className="text-gray-600">Registro y seguimiento de avances ({filtered.length} registros)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="btn-outline flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />Actualizar
          </button>
          <button onClick={() => setModal('new')} className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />Nuevo Avance
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
          <input type="text" placeholder="Buscar por descripción, meta o contratista..." className="input pl-10"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-gray-600">Cargando avances...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No se encontraron avances</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((avance, idx) => {
              const cardStyles = [
                { card: 'bg-sky-50 border-sky-300',     header: 'bg-sky-100 border border-sky-300 text-sky-800' },
                { card: 'bg-lime-50 border-lime-300',   header: 'bg-lime-100 border border-lime-300 text-lime-800' },
                { card: 'bg-rose-50 border-rose-300',   header: 'bg-rose-100 border border-rose-300 text-rose-800' },
                { card: 'bg-purple-50 border-purple-300', header: 'bg-purple-100 border border-purple-300 text-purple-800' },
              ];
              const style = cardStyles[idx % 4];
              return (
              <div key={avance.id} className={`rounded-xl p-4 hover:shadow-lg transition-shadow border-2 ${style.card}`}>

                {/* ── Cabecera ── */}
                <div className={`flex justify-between items-start mb-3 rounded-lg px-3 py-2 ${style.header}`}>
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Avance #{avance.numavance}
                      {avance.meta && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          —{avance.meta.codigo && <span className="mx-1 font-mono font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded text-xs">{avance.meta.codigo}</span>}{avance.meta.nombre}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center mt-0.5 text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {new Date(avance.fecha_presentacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      <span className="mx-2 text-gray-300">|</span>
                      {avance.contratista?.codigo && <span className="mr-1 font-mono font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded text-xs border border-green-200">{avance.contratista.codigo}</span>}
                      <span className="font-medium text-gray-600">{avance.reportadoPor?.nombre || avance.contratista?.nombre || '-'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setModal(avance)} className="btn-outline text-sm">Editar</button>
                    <button onClick={() => setDeleteTarget(avance)} className="btn-outline text-sm text-red-600 hover:text-red-900">Eliminar</button>
                  </div>
                </div>

                {/* ── Barra de progreso — ámbar ── */}
                <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Porcentaje de avance reportado</span>
                    <span className={`text-sm font-bold ${
                      avance.porcentaje_avance >= 100 ? 'text-green-600' :
                      avance.porcentaje_avance >= 60  ? 'text-blue-600'  :
                      avance.porcentaje_avance >= 30  ? 'text-yellow-600': 'text-red-500'
                    }`}>{avance.porcentaje_avance ?? 0}%</span>
                  </div>
                  <div className="w-full bg-amber-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        (avance.porcentaje_avance ?? 0) >= 100 ? 'bg-green-500' :
                        (avance.porcentaje_avance ?? 0) >= 60  ? 'bg-blue-500'  :
                        (avance.porcentaje_avance ?? 0) >= 30  ? 'bg-yellow-500': 'bg-red-400'
                      }`}
                      style={{ width: `${avance.porcentaje_avance ?? 0}%` }}
                    />
                  </div>
                </div>

                {/* ── Info: Contratista / Meta / Nº reporte / Aporte ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm">
                    <span className="font-semibold text-blue-700 text-xs uppercase tracking-wide">Contratista</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {avance.contratista?.codigo && <span className="font-mono font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded text-xs border border-green-200">{avance.contratista.codigo}</span>}
                      <p className="text-gray-800 font-medium truncate">{avance.contratista?.nombre || '-'}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-sm">
                    <span className="font-semibold text-indigo-700 text-xs uppercase tracking-wide">Meta</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {avance.meta?.codigo && <span className="font-mono font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded text-xs border border-primary-200">{avance.meta.codigo}</span>}
                      <p className="text-gray-800 font-medium truncate">{avance.meta?.nombre || '-'}</p>
                    </div>
                  </div>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 text-sm">
                    <span className="font-semibold text-teal-700 text-xs uppercase tracking-wide">Número de reporte</span>
                    <p className="text-gray-800 font-medium mt-0.5">#{avance.numavance}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm">
                    <span className="font-semibold text-orange-700 text-xs uppercase tracking-wide">Aporte a Meta</span>
                    <p className="text-gray-800 font-bold mt-0.5 text-base">
                      {avance.aporte_meta != null
                        ? <span className="text-orange-700">{Number(avance.aporte_meta).toFixed(2)}<span className="text-xs font-normal text-orange-400 ml-1">uds</span></span>
                        : <span className="text-gray-400 text-sm">auto</span>
                      }
                    </p>
                  </div>
                </div>

                {/* ── Descripción — violeta ── */}
                <div className="bg-violet-50 border border-violet-200 p-3 rounded-lg">
                  <div className="flex items-center mb-1.5">
                    <FileText className="h-4 w-4 mr-2 text-violet-500" />
                    <span className="font-semibold text-violet-700 text-xs uppercase tracking-wide">Descripción</span>
                  </div>
                  <p className="text-gray-700 text-sm">{avance.descripcion}</p>
                </div>

                {/* ── Evidencia — esmeralda ── */}
                {avance.reg_imagen && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <span className="font-semibold text-emerald-700 text-xs uppercase tracking-wide block mb-2">Evidencia adjunta</span>
                    {/\.(jpg|jpeg|png|gif|webp)$/i.test(avance.reg_imagen) ? (
                      <a href={avance.reg_imagen} target="_blank" rel="noreferrer">
                        <img src={avance.reg_imagen} alt="evidencia" className="w-full max-h-48 object-cover rounded-lg border border-emerald-200 hover:opacity-90 transition-opacity" />
                        <p className="text-xs text-emerald-500 mt-1 text-center">Ver imagen completa</p>
                      </a>
                    ) : (
                      <a href={avance.reg_imagen} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 bg-white px-3 py-2 rounded-md border border-emerald-300">
                        <Paperclip className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{avance.reg_imagen.split('/').pop()}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Avances;
