import React, { useEffect, useState, useRef } from 'react';
import { FileText, Printer, RefreshCw, Search, X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { API_BASE as API } from '../config';
import { apiGet } from '../utils/apiFetch';

/* ─── Interfaces ─── */
interface Meta     { id: number; codigo: string; nombre: string; descripcion: string; estado: string; fecha_limite: string; porcentaje_completacion?: number; creador?: { nombre: string }; }
interface Contratista { id: number; nombre: string; identificacion: string; contacto: string; telefono: string; estado: string; }
interface Avance   { id: number; numavance: number; porcentaje_avance: number; descripcion: string; fecha_presentacion: string; metaId?: number; contratistaId?: number; aporte_meta?: number | null; meta?: { nombre: string; codigo?: string }; contratista?: { nombre: string; codigo?: string }; alcanceId?: number; }
interface Alcance  { id: number; descripcion: string; periodicidad: string; fecha_inicio: string; fecha_fin: string; porcentaje_asignado: number; meta?: { nombre: string; codigo?: string }; contratista?: { nombre: string }; }

// Interfaces para reporte de actividades por usuario
interface UsuarioReporte {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  contratista?: { id: number; nombre: string; codigo: string };
}

interface MetaUsuario {
  id: number;
  codigo: string;
  nombre: string;
  estado: string;
  fecha_creacion: string;
  fecha_limite: string;
  unidades?: number;
  tieneAvances: boolean;
  ultimoAvance?: any;
  porcentaje_avance?: number;
}

interface AvanceUsuario {
  id: number;
  numavance: number;
  descripcion: string;
  fecha_presentacion: string;
  porcentaje_avance: number;
  aporte_meta?: number;
  meta: { id: number; codigo: string; nombre: string };
  contratista: { id: number; nombre: string; codigo: string };
}

interface ActividadUsuario {
  usuario: UsuarioReporte;
  estadisticas: {
    totalMetas: number;
    totalAvances: number;
    metasConAvances: number;
    avancePromedio: number;
  };
  metasCreadas: MetaUsuario[];
  avances: AvanceUsuario[];
}

type Tab = 'metas' | 'contratistas' | 'avances' | 'alcances' | 'consolidado' | 'actividades-usuario' | 'avances-usuario';

const TABS: { key: Tab; label: string }[] = [
  { key: 'metas',        label: 'Metas' },
  { key: 'contratistas', label: 'Contratistas' },
  { key: 'avances',      label: 'Avances' },
  { key: 'alcances',     label: 'Alcances' },
  { key: 'consolidado',  label: '📊 Consolidado por Período' },
  { key: 'actividades-usuario', label: '👤 Actividades por Usuario' },
  { key: 'avances-usuario', label: '📈 Avances por Usuario' },
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

type PeriodoTipo = 'mensual' | 'trimestral' | 'semestral';
const getPeriodRange = (tipo: PeriodoTipo, mes: string, trim: string, sem: string): { start: Date; end: Date; label: string } => {
  if (tipo === 'mensual') {
    const [y, m] = mes.split('-').map(Number);
    return { start: new Date(y, m-1, 1), end: new Date(y, m, 0, 23, 59, 59), label: new Date(y, m-1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase()) };
  }
  if (tipo === 'trimestral') {
    const [ys, qs] = trim.split('-Q'); const y = parseInt(ys), q = parseInt(qs), sm = (q-1)*3;
    return { start: new Date(y, sm, 1), end: new Date(y, sm+3, 0, 23, 59, 59), label: `T${q} ${y} · ${['Ene–Mar','Abr–Jun','Jul–Sep','Oct–Dic'][q-1]}` };
  }
  const [ys, hs] = sem.split('-H'); const y = parseInt(ys), h = parseInt(hs), sm = (h-1)*6;
  return { start: new Date(y, sm, 1), end: new Date(y, sm+6, 0, 23, 59, 59), label: `${h === 1 ? '1er Semestre' : '2do Semestre'} ${y}` };
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
  
  // Estados para reporte de actividades por usuario
  const [actividadesUsuario, setActividadesUsuario] = useState<ActividadUsuario[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioReporte[]>([]);
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [filterContratistaAct, setFilterContratistaAct] = useState('todos');
  const [filterUsuarioAct, setFilterUsuarioAct] = useState('todos');
  const printRef = useRef<HTMLDivElement>(null);
  const [periodoTipo, setPeriodoTipo] = useState<PeriodoTipo>('mensual');
  const [periodoMes, setPeriodoMes]   = useState(() => new Date().toISOString().slice(0, 7));
  const [periodoTrim, setPeriodoTrim] = useState(() => { const n = new Date(); return `${n.getFullYear()}-Q${Math.ceil((n.getMonth()+1)/3)}`; });
  const [periodoSem, setPeriodoSem]   = useState(() => { const n = new Date(); return `${n.getFullYear()}-H${n.getMonth() < 6 ? 1 : 2}`; });

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
  const prevPeriodo = () => {
    if (periodoTipo === 'mensual') { const d = new Date(periodoMes+'-01'); d.setMonth(d.getMonth()-1); setPeriodoMes(d.toISOString().slice(0,7)); return; }
    if (periodoTipo === 'trimestral') { const [y,q] = periodoTrim.split('-Q').map(Number); if (q===1) setPeriodoTrim(`${y-1}-Q4`); else setPeriodoTrim(`${y}-Q${q-1}`); return; }
    const [y,h] = periodoSem.split('-H').map(Number); if (h===1) setPeriodoSem(`${y-1}-H2`); else setPeriodoSem(`${y}-H1`);
  };
  const nextPeriodo = () => {
    if (periodoTipo === 'mensual') { const d = new Date(periodoMes+'-01'); d.setMonth(d.getMonth()+1); setPeriodoMes(d.toISOString().slice(0,7)); return; }
    if (periodoTipo === 'trimestral') { const [y,q] = periodoTrim.split('-Q').map(Number); if (q===4) setPeriodoTrim(`${y+1}-Q1`); else setPeriodoTrim(`${y}-Q${q+1}`); return; }
    const [y,h] = periodoSem.split('-H').map(Number); if (h===2) setPeriodoSem(`${y+1}-H1`); else setPeriodoSem(`${y}-H2`);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mr, cr, ar, alr] = await Promise.all([
        apiGet(`${API}/metas`), apiGet(`${API}/contratistas`),
        apiGet(`${API}/avances`), apiGet(`${API}/alcances`),
      ]);
      const [md, cd, ad, ald] = await Promise.all([mr.json(), cr.json(), ar.json(), alr.json()]);
      if (md.success)  setMetas(md.data);
      if (cd.success)  setContratistas(cd.data);
      if (ad.success)  setAvances(ad.data);
      if (ald.success) setAlcances(ald.data);
    } finally { setLoading(false); }
  };

  const fetchActividadesUsuario = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterFechaInicio) params.append('fechaInicio', filterFechaInicio);
      if (filterFechaFin) params.append('fechaFin', filterFechaFin);
      if (filterContratistaAct !== 'todos') params.append('contratistaId', filterContratistaAct);
      if (filterUsuarioAct !== 'todos') params.append('usuarioId', filterUsuarioAct);
      
      const response = await apiGet(`${API}/reportes/actividades-usuario?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setActividadesUsuario(data.data.usuarios);
        // Extraer usuarios únicos para el filtro
        const usuariosUnicos = data.data.usuarios.map((u: ActividadUsuario) => u.usuario);
        setUsuarios(usuariosUnicos);
      }
    } catch (error) {
      console.error('Error cargando actividades por usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
  if (tab === 'actividades-usuario' || tab === 'avances-usuario') {
    fetchActividadesUsuario();
  } else {
    fetchAll();
  }
}, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  /* reset filtros al cambiar tab */
  useEffect(() => {
    setSearch(''); setFilterEstado(''); setFilterMeta(''); setFilterContratista('');
    if (tab === 'avances') setFilterMes(new Date().toISOString().slice(0, 7));
  }, [tab]);

  // Recargar actividades por usuario cuando cambian los filtros
  useEffect(() => {
    if (tab === 'actividades-usuario' || tab === 'avances-usuario') {
      fetchActividadesUsuario();
    }
  }, [filterFechaInicio, filterFechaFin, filterContratistaAct, filterUsuarioAct]); // eslint-disable-line react-hooks/exhaustive-deps

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
        (a.meta?.codigo || '').toLowerCase().includes(search.toLowerCase()) ||
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
    (!search || a.descripcion.toLowerCase().includes(search.toLowerCase()) || (a.meta?.codigo || '').toLowerCase().includes(search.toLowerCase()) || (a.meta?.nombre || '').toLowerCase().includes(search.toLowerCase()) || (a.contratista?.nombre || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterMeta || (a.meta?.nombre || '') === filterMeta) &&
    (!filterContratista || (a.contratista?.nombre || '') === filterContratista) &&
    (!filterEstado || a.periodicidad === filterEstado)
  );

  const filteredActividadesUsuario = actividadesUsuario.map(userData => ({
    ...userData,
    metasCreadas: userData.metasCreadas.filter(meta =>
      !search ||
      (meta.codigo || '').toLowerCase().includes(search.toLowerCase()) ||
      meta.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (meta.ultimoAvance?.descripcion || '').toLowerCase().includes(search.toLowerCase()) ||
      (userData.usuario.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (userData.usuario.contratista?.nombre || '').toLowerCase().includes(search.toLowerCase())
    )
  })).filter(userData => userData.metasCreadas.length > 0 || !search);

  const consolidadoPeriodo = getPeriodRange(periodoTipo, periodoMes, periodoTrim, periodoSem);
  const avancesPeriodo = avances.filter(a => { const d = new Date(a.fecha_presentacion); return d >= consolidadoPeriodo.start && d <= consolidadoPeriodo.end; });
  const consolidadoData = (metas.filter(meta =>
    !search ||
    (meta.codigo || '').toLowerCase().includes(search.toLowerCase()) ||
    meta.nombre.toLowerCase().includes(search.toLowerCase()) ||
    meta.descripcion.toLowerCase().includes(search.toLowerCase())
  ).map(meta => {
    const avMeta = avancesPeriodo.filter(a => a.metaId === meta.id);
    if (!avMeta.length) return null;
    const byC: Record<string, { nombre: string; codigo: string; count: number; maxPct: number; aporte: number; ultFecha: string }> = {};
    avMeta.forEach(a => {
      const k = String(a.contratistaId);
      if (!byC[k]) byC[k] = { nombre: a.contratista?.nombre||'—', codigo: a.contratista?.codigo||'', count:0, maxPct:0, aporte:0, ultFecha:'' };
      byC[k].count++; byC[k].maxPct = Math.max(byC[k].maxPct, a.porcentaje_avance||0);
      byC[k].aporte = Math.round((byC[k].aporte+(a.aporte_meta||0))*100)/100;
      if (!byC[k].ultFecha || a.fecha_presentacion > byC[k].ultFecha) byC[k].ultFecha = a.fecha_presentacion;
    });
    return { meta, rows: Object.values(byC).sort((a,b) => b.maxPct - a.maxPct) };
  }).filter(Boolean)) as { meta: Meta; rows: { nombre: string; codigo: string; count: number; maxPct: number; aporte: number; ultFecha: string }[] }[];

  const currentCount = tab === 'metas' ? filteredMetas.length : tab === 'contratistas' ? filteredContratistas.length : tab === 'avances' ? filteredAvances.length : tab === 'consolidado' ? consolidadoData.length : (tab === 'actividades-usuario' || tab === 'avances-usuario') ? filteredActividadesUsuario.reduce((sum, u) => sum + u.metasCreadas.length, 0) : filteredAlcances.length;

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

  const SectionConsolidado = () => (
    consolidadoData.length === 0
      ? <div className="flex flex-col items-center gap-2 text-gray-400 py-16"><FileText className="h-10 w-10 opacity-40" /><p className="text-sm font-medium">Sin avances registrados en el período seleccionado</p><p className="text-xs">Cambia el período o registra avances en el sistema</p></div>
      : <div className="divide-y divide-gray-100">
          {consolidadoData.map(({ meta, rows }) => {
            const pct = meta.porcentaje_completacion ?? 0;
            const pBar = pct>=100?'bg-green-500':pct>=60?'bg-blue-500':pct>=30?'bg-yellow-500':'bg-red-400';
            const pTxt = pct>=100?'text-green-700':pct>=60?'text-blue-700':pct>=30?'text-yellow-700':'text-red-600';
            const totalAv = rows.reduce((s,r)=>s+r.count,0);
            return (
              <div key={meta.id} className="p-4 hover:bg-gray-50/40">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded border border-primary-200 flex-shrink-0">{meta.codigo||'—'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{meta.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-32 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${pBar}`} style={{width:`${pct}%`}}/></div>
                      <span className={`text-xs font-bold ${pTxt}`}>{pct}% completado</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${estadoClass[meta.estado]||'bg-gray-100 text-gray-700'}`}>{estadoLabel[meta.estado]||meta.estado}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5 flex-shrink-0">{totalAv} avance{totalAv!==1?'s':''} · {rows.length} contratista{rows.length!==1?'s':''}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>{['Contratista','Avances en período','Máx % reportado','Aporte acumulado','Último avance'].map(h=>(
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {rows.map((r,i)=>(
                        <tr key={i} className="hover:bg-primary-50/30">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              {r.codigo&&<span className="font-mono text-xs font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded border border-green-200">{r.codigo}</span>}
                              <span className="text-gray-800 font-medium">{r.nombre}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center"><span className="font-bold text-gray-700 bg-gray-100 rounded px-2 py-0.5">{r.count}</span></td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${pctColor(r.maxPct)}`} style={{width:`${r.maxPct}%`}}/></div>
                              <span className={`font-bold ${pctTextColor(r.maxPct)}`}>{r.maxPct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right"><span className="font-semibold text-indigo-700">{r.aporte>0?r.aporte.toFixed(2):'—'}</span></td>
                          <td className="px-3 py-2.5 text-gray-500">{r.ultFecha?new Date(r.ultFecha).toLocaleDateString('es-ES'):'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
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

  const SectionActividadesUsuario = () => (
    filteredActividadesUsuario.length === 0
      ? <div className="flex flex-col items-center gap-2 text-gray-400 py-16">
          <FileText className="h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">Sin actividades encontradas</p>
          <p className="text-xs">No hay actividades para los filtros seleccionados</p>
        </div>
      : <div className="space-y-6">
          {/* Resumen general */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Resumen del Reporte</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-blue-600 font-medium">Usuarios Activos</p>
                <p className="text-2xl font-bold text-blue-900">{filteredActividadesUsuario.length}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Total Metas Creadas</p>
                <p className="text-2xl font-bold text-blue-900">
                  {filteredActividadesUsuario.reduce((sum, u) => sum + u.metasCreadas.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Total Avances</p>
                <p className="text-2xl font-bold text-blue-900">
                  {filteredActividadesUsuario.reduce((sum, u) => sum + u.metasCreadas.filter(m => m.tieneAvances).length, 0)}
                </p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Avance Promedio</p>
                <p className="text-2xl font-bold text-blue-900">
                  {filteredActividadesUsuario.length > 0 
                    ? Math.round(
                        filteredActividadesUsuario.reduce((sum, u) => sum + u.estadisticas.avancePromedio, 0) / 
                        filteredActividadesUsuario.length * 100
                      ) / 100
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Lista de usuarios con sus actividades */}
          {filteredActividadesUsuario.map((userData) => (
            <div key={userData.usuario.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Encabezado del usuario */}
              <div className="bg-gray-50 border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {userData.usuario.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{userData.usuario.nombre}</h4>
                      <p className="text-xs text-gray-500">{userData.usuario.email} • {userData.usuario.rol}</p>
                      {userData.usuario.contratista && (
                        <p className="text-xs text-gray-500">Contratista: {userData.usuario.contratista.nombre}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">{userData.estadisticas.totalMetas}</p>
                      <p className="text-gray-500">Metas</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">{userData.estadisticas.totalAvances}</p>
                      <p className="text-gray-500">Avances</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">{userData.estadisticas.avancePromedio}%</p>
                      <p className="text-gray-500">Promedio</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido del usuario */}
              <div className="p-4 space-y-4">
                {/* Actividades relacionadas */}
                {userData.metasCreadas.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Actividades Relacionadas ({userData.metasCreadas.length})</h5>
                    <div className="space-y-2">
                      {userData.metasCreadas.map((meta) => (
                        <div key={meta.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-1 py-0.5 rounded">
                              {meta.codigo || '—'}
                            </span>
                            <span className="text-gray-700">{meta.nombre}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${(meta.porcentaje_avance ?? 0) > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                              {meta.porcentaje_avance ?? 0}%
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoClass[meta.estado] || 'bg-gray-100 text-gray-700'}`}>
                              {estadoLabel[meta.estado] || meta.estado}
                            </span>
                            <span className="text-gray-500">
                              {meta.tieneAvances ? '✓ Con avances' : '✗ Sin avances'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avances reportados */}
                {userData.avances.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Avances Reportados ({userData.avances.length})</h5>
                    <div className="space-y-2">
                      {userData.avances.map((avance) => (
                        <div key={avance.id} className="flex items-center justify-between p-2 bg-green-50 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded">
                              {avance.meta.codigo || '—'}
                            </span>
                            <span className="text-gray-700">{avance.meta.nombre}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-green-700">{avance.porcentaje_avance}%</span>
                            <span className="text-gray-500">{avance.fecha_presentacion}</span>
                            <span className="text-gray-500">{avance.contratista.nombre}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Si no hay actividades */}
                {userData.metasCreadas.length === 0 && userData.avances.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    <p>Este usuario no tiene actividades en el período seleccionado</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
  );

  const SectionAvancesUsuario = () => (
    filteredActividadesUsuario.length === 0
      ? <div className="flex flex-col items-center gap-2 text-gray-400 py-16">
          <FileText className="h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">Sin avances encontrados</p>
          <p className="text-xs">No hay actividades para los filtros seleccionados</p>
        </div>
      : <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-3">Resumen de Avances por Usuario</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-green-600 font-medium">Usuarios</p>
                <p className="text-2xl font-bold text-green-900">{filteredActividadesUsuario.length}</p>
              </div>
              <div>
                <p className="text-green-600 font-medium">Actividades</p>
                <p className="text-2xl font-bold text-green-900">
                  {filteredActividadesUsuario.reduce((sum, u) => sum + u.metasCreadas.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-green-600 font-medium">Avances Registrados</p>
                <p className="text-2xl font-bold text-green-900">
                  {filteredActividadesUsuario.reduce((sum, u) => sum + u.metasCreadas.filter(m => m.tieneAvances).length, 0)}
                </p>
              </div>
              <div>
                <p className="text-green-600 font-medium">Actividades sin avance</p>
                <p className="text-2xl font-bold text-green-900">
                  {filteredActividadesUsuario.reduce((sum, u) => sum + u.metasCreadas.filter(m => !m.tieneAvances).length, 0)}
                </p>
              </div>
            </div>
          </div>

          {filteredActividadesUsuario.map((userData) => (
            <div key={userData.usuario.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{userData.usuario.nombre}</h4>
                    <p className="text-xs text-gray-500">
                      {userData.usuario.email} • {userData.usuario.rol}
                      {userData.usuario.contratista ? ` • Contratista: ${userData.usuario.contratista.nombre}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">{userData.estadisticas.totalMetas}</p>
                      <p className="text-gray-500">Actividades</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">{userData.estadisticas.totalAvances}</p>
                      <p className="text-gray-500">Avances</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">{userData.estadisticas.avancePromedio}%</p>
                      <p className="text-gray-500">Promedio</p>
                    </div>
                  </div>
                </div>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actividad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último registro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userData.metasCreadas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">Sin actividades relacionadas</td>
                    </tr>
                  ) : userData.metasCreadas.map((meta) => (
                    <tr key={meta.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{meta.codigo ? `[${meta.codigo}] ` : ''}{meta.nombre}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${estadoClass[meta.estado] || 'bg-gray-100 text-gray-700'}`}>
                          {estadoLabel[meta.estado] || meta.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${(meta.porcentaje_avance ?? 0) > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                          {meta.porcentaje_avance ?? 0}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {meta.ultimoAvance?.fecha_presentacion || 'Sin registro'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {meta.ultimoAvance?.descripcion || 'Actividad sin avance registrado'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
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

            {(tab === 'actividades-usuario' || tab === 'avances-usuario') && (
              <>
                <input type="date" value={filterFechaInicio} onChange={e => setFilterFechaInicio(e.target.value)} 
                  placeholder="Fecha inicio" className="input py-1.5 text-sm w-40" />
                <input type="date" value={filterFechaFin} onChange={e => setFilterFechaFin(e.target.value)} 
                  placeholder="Fecha fin" className="input py-1.5 text-sm w-40" />
                <select value={filterContratistaAct} onChange={e => setFilterContratistaAct(e.target.value)} className="input py-1.5 text-sm w-52">
                  <option value="todos">Todos los contratistas</option>
                  {contratistas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <select value={filterUsuarioAct} onChange={e => setFilterUsuarioAct(e.target.value)} className="input py-1.5 text-sm w-52">
                  <option value="todos">Todos los usuarios</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </>
            )}

            {tab === 'consolidado' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                  {(['mensual','trimestral','semestral'] as PeriodoTipo[]).map(t => (
                    <button key={t} onClick={() => setPeriodoTipo(t)}
                      className={`px-3 py-1.5 capitalize transition-colors ${ periodoTipo === t ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50' }`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-0.5">
                  <button onClick={prevPeriodo} className="p-1 hover:bg-white rounded text-gray-500 hover:text-gray-700"><ChevronLeft className="h-4 w-4" /></button>
                  <div className="flex items-center gap-1.5 px-2">
                    <CalendarDays className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-semibold text-gray-700 min-w-max">{consolidadoPeriodo.label}</span>
                  </div>
                  <button onClick={nextPeriodo} className="p-1 hover:bg-white rounded text-gray-500 hover:text-gray-700"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}

            <span className="ml-auto text-xs text-gray-400">{currentCount} meta{tab==='consolidado'?'s con avances':` registro${currentCount !== 1 ? 's' : ''}`}</span>
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
                : tab === 'consolidado'
                ? `Reporte Consolidado — ${consolidadoPeriodo.label}`
                : `Reporte: ${TABS.find(t => t.key === tab)?.label}`}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Generado el {new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              {tab === 'avances' && filterMes && ` · Período: ${mesLabel(filterMes)}`}
              {tab === 'consolidado' && ` · Período: ${consolidadoPeriodo.label}`}
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
                {tab === 'consolidado'  && <SectionConsolidado />}
                {tab === 'actividades-usuario' && <SectionActividadesUsuario />}
                {tab === 'avances-usuario' && <SectionAvancesUsuario />}
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
