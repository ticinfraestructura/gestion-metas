import React, { useEffect, useState, useRef } from 'react';
import { FileText, Printer, RefreshCw, Search, X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const API = 'http://localhost:3001/api';

/* ─── Interfaces ─── */
interface Meta     { id: number; codigo: string; nombre: string; descripcion: string; estado: string; fecha_limite: string; porcentaje_completacion?: number; creador?: { nombre: string }; }
interface Contratista { id: number; nombre: string; identificacion: string; contacto: string; telefono: string; estado: string; }
interface Avance   { id: number; numavance: number; porcentaje_avance: number; descripcion: string; fecha_presentacion: string; meta?: { nombre: string; codigo?: string }; contratista?: { nombre: string; codigo?: string }; alcanceId?: number; }
interface Alcance  { id: number; descripcion: string; periodicidad: string; fecha_inicio: string; fecha_fin: string; porcentaje_asignado: number; meta?: { nombre: string; codigo?: string }; contratista?: { nombre: string }; }

type Tab = 'metas' | 'contratistas' | 'avances' | 'alcances';

const TABS: { key: Tab; label: string }[] = [
  { key: 'metas',        label: 'Metas' },
  { key: 'contratistas', label: 'Contratistas' },
  { key: 'avances',      label: 'Avances' },
  { key: 'alcances',     label: 'Alcances' },
];

const estadoLabel: Record<string, string> = {
  EN_PROGRESO: 'En Progreso', PENDIENTE: 'Pendiente',
  COMPLETADA: 'Completada',   CANCELADA: 'Cancelada', activo: 'Activo', inactivo: 'Inactivo',
};
const estadoClass: Record<string, string> = {
  EN_PROGRESO: 'bg-yellow-100 text-yellow-800', PENDIENTE: 'bg-gray-100 text-gray-700',
  COMPLETADA:  'bg-green-100 text-green-800',   CANCELADA: 'bg-red-100 text-red-800',
  activo:      'bg-green-100 text-green-800',   inactivo:  'bg-red-100 text-red-800',
};
const periodicidadClass: Record<string, string> = {
  DIARIO: 'bg-red-100 text-red-700', SEMANAL: 'bg-orange-100 text-orange-700',
  QUINCENAL: 'bg-blue-100 text-blue-700', MENSUAL: 'bg-purple-100 text-purple-700',
};

/* ─── Componente principal ─── */
const Reportes: React.FC = () => {
  const [tab, setTab]               = useState<Tab>('metas');
  const [metas, setMetas]           = useState<Meta[]>([]);
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [avances, setAvances]       = useState<Avance[]>([]);
  const [alcances, setAlcances]     = useState<Alcance[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterMeta, setFilterMeta]         = useState('');
  const [filterContratista, setFilterContratista] = useState('');
  const [filterMes, setFilterMes]           = useState(() => new Date().toISOString().slice(0, 7));
  const printRef = useRef<HTMLDivElement>(null);

  const mesLabel = (ym: string) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1)
      .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      .replace(/^./, c => c.toUpperCase());
  };
  const prevMes = () => {
    const d = new Date(filterMes + '-01'); d.setMonth(d.getMonth() - 1);
    setFilterMes(d.toISOString().slice(0, 7));
  };
  const nextMes = () => {
    const d = new Date(filterMes + '-01'); d.setMonth(d.getMonth() + 1);
    setFilterMes(d.toISOString().slice(0, 7));
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mr, cr, ar, alr] = await Promise.all([
        fetch(`${API}/metas`), fetch(`${API}/contratistas`),
        fetch(`${API}/avances`), fetch(`${API}/alcances`),
      ]);
      const [md, cd, ad, ald] = await Promise.all([mr.json(), cr.json(), ar.json(), alr.json()]);
      if (md.success)  setMetas(md.data);
      if (cd.success)  setContratistas(cd.data);
      if (ad.success)  setAvances(ad.data);
      if (ald.success) setAlcances(ald.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  /* reset filtros al cambiar tab */
  useEffect(() => {
    setSearch(''); setFilterEstado(''); setFilterMeta(''); setFilterContratista('');
    if (tab === 'avances') setFilterMes(new Date().toISOString().slice(0, 7));
  }, [tab]);

  /* ─── Filtrado ─── */
  const filteredMetas = metas.filter(m =>
    (!search || m.nombre.toLowerCase().includes(search.toLowerCase()) || m.codigo?.toLowerCase().includes(search.toLowerCase()) || m.descripcion.toLowerCase().includes(search.toLowerCase())) &&
    (!filterEstado || m.estado === filterEstado)
  );
  const filteredContratistas = contratistas.filter(c =>
    (!search || c.nombre.toLowerCase().includes(search.toLowerCase()) || c.identificacion.toLowerCase().includes(search.toLowerCase()) || c.contacto.toLowerCase().includes(search.toLowerCase())) &&
    (!filterEstado || c.estado === filterEstado)
  );
  const filteredAvances = avances.filter(a => {
    const fechaMes = a.fecha_presentacion ? a.fecha_presentacion.slice(0, 7) : '';
    return (
      (!filterMes || fechaMes === filterMes) &&
      (!search || a.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        (a.meta?.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.contratista?.nombre || '').toLowerCase().includes(search.toLowerCase())) &&
      (!filterMeta || (a.meta?.nombre || '') === filterMeta) &&
      (!filterContratista || (a.contratista?.nombre || '') === filterContratista)
    );
  });

  /* Resumen mensual por contratista */
  const resumenMensual = Object.values(
    filteredAvances.reduce((acc, a) => {
      const key = a.contratista?.nombre || 'Sin contratista';
      if (!acc[key]) acc[key] = { nombre: key, codigo: a.contratista?.codigo || '', count: 0, sumPct: 0, maxPct: 0 };
      acc[key].count++;
      acc[key].sumPct  += a.porcentaje_avance;
      acc[key].maxPct   = Math.max(acc[key].maxPct, a.porcentaje_avance);
      return acc;
    }, {} as Record<string, { nombre: string; codigo: string; count: number; sumPct: number; maxPct: number }>)
  ).map(r => ({ ...r, promPct: Math.round(r.sumPct / r.count) }))
   .sort((a, b) => b.promPct - a.promPct);
  const filteredAlcances = alcances.filter(a =>
    (!search || a.descripcion.toLowerCase().includes(search.toLowerCase()) || (a.meta?.nombre || '').toLowerCase().includes(search.toLowerCase()) || (a.contratista?.nombre || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterMeta || (a.meta?.nombre || '') === filterMeta) &&
    (!filterContratista || (a.contratista?.nombre || '') === filterContratista) &&
    (!filterEstado || a.periodicidad === filterEstado)
  );

  const currentCount = tab === 'metas' ? filteredMetas.length : tab === 'contratistas' ? filteredContratistas.length : tab === 'avances' ? filteredAvances.length : filteredAlcances.length;

  const handlePrint = () => window.print();

  /* ─── Tablas ─── */
  const EmptyRow = ({ cols }: { cols: number }) => (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <FileText className="h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">Sin registros con los filtros aplicados</p>
          <p className="text-xs">Modifica los filtros o agrega nuevos registros al sistema</p>
        </div>
      </td>
    </tr>
  );

  const TableMetas = () => (
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          {['Código','Nombre','Descripción','Estado','Fecha Límite','Completación','Creador'].map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {filteredMetas.length === 0 ? <EmptyRow cols={7} /> : filteredMetas.map(m => (
          <tr key={m.id} className="hover:bg-gray-50">
            <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{m.codigo || '—'}</span></td>
            <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">{m.nombre}</td>
            <td className="px-4 py-3 text-gray-600 max-w-sm text-xs">{m.descripcion}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoClass[m.estado] || 'bg-gray-100 text-gray-700'}`}>{estadoLabel[m.estado] || m.estado}</span></td>
            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.fecha_limite}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${(m.porcentaje_completacion ?? 0) >= 100 ? 'bg-green-500' : (m.porcentaje_completacion ?? 0) >= 60 ? 'bg-blue-500' : (m.porcentaje_completacion ?? 0) >= 30 ? 'bg-yellow-500' : 'bg-red-400'}`}
                    style={{ width: `${m.porcentaje_completacion ?? 0}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700">{m.porcentaje_completacion ?? 0}%</span>
              </div>
            </td>
            <td className="px-4 py-3 text-gray-600 text-xs">{m.creador?.nombre || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const TableContratistas = () => (
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          {['#','Nombre','Identificación','Contacto','Teléfono','Estado'].map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {filteredContratistas.length === 0 ? <EmptyRow cols={6} /> : filteredContratistas.map((c, idx) => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
            <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
            <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.identificacion}</td>
            <td className="px-4 py-3 text-gray-600 text-xs">{c.contacto}</td>
            <td className="px-4 py-3 text-gray-600">{c.telefono}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoClass[c.estado] || 'bg-gray-100 text-gray-700'}`}>{estadoLabel[c.estado] || c.estado}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const pctColor = (p: number) => p >= 100 ? 'bg-green-500' : p >= 60 ? 'bg-blue-500' : p >= 30 ? 'bg-yellow-500' : 'bg-red-400';
  const pctTextColor = (p: number) => p >= 100 ? 'text-green-700' : p >= 60 ? 'text-blue-700' : p >= 30 ? 'text-yellow-700' : 'text-red-600';

  const TableAvances = () => (
    <>
      {/* Resumen mensual por contratista */}
      {resumenMensual.length > 0 && (
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Resumen por contratista — {mesLabel(filterMes)}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {resumenMensual.map(r => (
              <div key={r.nombre} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                {r.codigo && <span className="font-mono text-xs font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 flex-shrink-0">{r.codigo}</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{r.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${pctColor(r.promPct)}`} style={{ width: `${r.promPct}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${pctTextColor(r.promPct)}`}>{r.promPct}%</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{r.count} rep.</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['#','Meta','Contratista','Descripción','Fecha','% Avance'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {filteredAvances.length === 0 ? <EmptyRow cols={6} /> : filteredAvances.map(a => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{a.numavance}</td>
              <td className="px-4 py-3 text-xs">
                {a.meta?.codigo && <span className="font-mono font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200 mr-1 text-xs">{a.meta.codigo}</span>}
                <span className="text-gray-700">{a.meta?.nombre || '—'}</span>
              </td>
              <td className="px-4 py-3 text-xs">
                {a.contratista?.codigo && <span className="font-mono font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 mr-1 text-xs">{a.contratista.codigo}</span>}
                <span className="text-gray-700">{a.contratista?.nombre || '—'}</span>
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs max-w-sm">{a.descripcion}</td>
              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(a.fecha_presentacion).toLocaleDateString('es-ES')}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${pctColor(a.porcentaje_avance)}`} style={{ width: `${a.porcentaje_avance}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${pctTextColor(a.porcentaje_avance)}`}>{a.porcentaje_avance}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const TableAlcances = () => (
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          {['Meta','Contratista','Descripción','Periodicidad','Inicio','Fin','% Asignado'].map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {filteredAlcances.length === 0 ? <EmptyRow cols={7} /> : filteredAlcances.map(a => (
          <tr key={a.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-xs">
              {a.meta?.codigo && <span className="font-mono font-bold text-primary-700 bg-primary-50 px-1 py-0.5 rounded mr-1">{a.meta.codigo}</span>}
              <span className="text-gray-700">{a.meta?.nombre || '—'}</span>
            </td>
            <td className="px-4 py-3 text-gray-700 text-xs">{a.contratista?.nombre || '—'}</td>
            <td className="px-4 py-3 text-gray-600 text-xs max-w-sm">{a.descripcion}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${periodicidadClass[a.periodicidad] || 'bg-gray-100 text-gray-700'}`}>{a.periodicidad}</span></td>
            <td className="px-4 py-3 text-gray-500 text-xs">{a.fecha_inicio}</td>
            <td className="px-4 py-3 text-gray-500 text-xs">{a.fecha_fin}</td>
            <td className="px-4 py-3 text-xs font-bold text-gray-700">{a.porcentaje_asignado}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #reporte-print, #reporte-print * { visibility: visible; }
          #reporte-print { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          table { font-size: 10px; }
          th, td { padding: 4px 6px !important; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary-600" />
              Reportes
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Genera e imprime reportes de todos los módulos del sistema</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="btn-outline flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm">
              <Printer className="h-4 w-4" />
              Imprimir reporte
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="card no-print">
          <div className="flex border-b border-gray-200">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Filtros */}
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9 py-1.5 text-sm" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
            </div>

            {(tab === 'metas' || tab === 'contratistas') && (
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input py-1.5 text-sm w-44">
                <option value="">Todos los estados</option>
                {tab === 'metas'
                  ? [['PENDIENTE','Pendiente'],['EN_PROGRESO','En Progreso'],['COMPLETADA','Completada'],['CANCELADA','Cancelada']].map(([v,l]) => <option key={v} value={v}>{l}</option>)
                  : [['activo','Activo'],['inactivo','Inactivo']].map(([v,l]) => <option key={v} value={v}>{l}</option>)
                }
              </select>
            )}

            {tab === 'avances' && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-0.5">
                <button onClick={prevMes} className="p-1 hover:bg-white rounded text-gray-500 hover:text-gray-700"><ChevronLeft className="h-4 w-4" /></button>
                <div className="flex items-center gap-1.5 px-2">
                  <CalendarDays className="h-4 w-4 text-primary-500" />
                  <input type="month" value={filterMes} onChange={e => setFilterMes(e.target.value)}
                    className="text-sm font-semibold text-gray-700 bg-transparent border-none outline-none cursor-pointer" />
                </div>
                <button onClick={nextMes} className="p-1 hover:bg-white rounded text-gray-500 hover:text-gray-700"><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}

            {(tab === 'avances' || tab === 'alcances') && (
              <>
                <select value={filterMeta} onChange={e => setFilterMeta(e.target.value)} className="input py-1.5 text-sm w-52">
                  <option value="">Todas las metas</option>
                  {metas.map(m => <option key={m.id} value={m.nombre}>{m.codigo ? `[${m.codigo}] ` : ''}{m.nombre}</option>)}
                </select>
                <select value={filterContratista} onChange={e => setFilterContratista(e.target.value)} className="input py-1.5 text-sm w-52">
                  <option value="">Todos los contratistas</option>
                  {contratistas.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </>
            )}

            {tab === 'alcances' && (
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input py-1.5 text-sm w-40">
                <option value="">Periodicidad</option>
                {['DIARIO','SEMANAL','QUINCENAL','MENSUAL'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}

            <span className="ml-auto text-xs text-gray-400">{currentCount} registro{currentCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Tabla imprimible */}
        <div id="reporte-print" ref={printRef}>
          {/* Encabezado de impresión */}
          <div className="hidden print:block mb-6 pb-4 border-b-2 border-gray-300">
            <h1 className="text-xl font-bold text-gray-900">Sistema de Gestión de Metas</h1>
            <h2 className="text-lg font-semibold text-gray-700 mt-1">
              {tab === 'avances'
                ? `Reporte Mensual de Avances — ${mesLabel(filterMes)}`
                : `Reporte: ${TABS.find(t => t.key === tab)?.label}`}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Generado el {new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              {tab === 'avances' && filterMes && ` · Período: ${mesLabel(filterMes)}`}
              {' '}— Total: {currentCount} registro{currentCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-3 text-gray-600">Cargando datos…</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {tab === 'metas'        && <TableMetas />}
                {tab === 'contratistas' && <TableContratistas />}
                {tab === 'avances'      && <TableAvances />}
                {tab === 'alcances'     && <TableAlcances />}
              </div>
            )}
          </div>

          {/* Footer de impresión */}
          <div className="hidden print:block mt-6 pt-3 border-t border-gray-200 text-xs text-gray-400 text-center">
            Sistema de Gestión de Metas — Documento generado automáticamente
          </div>
        </div>
      </div>
    </>
  );
};

export default Reportes;
