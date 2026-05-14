import React, { useEffect, useState } from 'react';
import {
  Target, Users, TrendingUp, CheckCircle, RefreshCw, BarChart2,
  ClipboardList, Calendar, AlertCircle, FileText, Award, Activity,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { API_BASE } from '../config';
import { apiGet } from '../utils/apiFetch';

/* ─────────────────────── interfaces ─────────────────────── */
interface Stats {
  totalMetas: number; metasCompletadas: number; totalContratistas: number;
  totalAvances: number; metasEnProgreso: number; promedioCompletacion?: number; totalAlcances?: number;
}
interface Meta {
  id: number; codigo: string; nombre: string; estado: string;
  fecha_limite: string; porcentaje_completacion?: number;
}
interface Avance {
  id: number; descripcion: string; numavance: number;
  porcentaje_avance?: number; fecha_presentacion?: string;
  meta?: { nombre: string; codigo?: string };
  contratista?: { nombre: string };
  alcance?: { descripcion: string };
}
interface Alcance {
  id: number; descripcion: string; periodicidad: string;
  fecha_inicio: string; fecha_fin: string; porcentaje_asignado: number;
  meta?: { id: number; nombre: string; codigo?: string };
}

/* ─────────────────────── helpers ─────────────────────── */
const pctColor = (p: number) =>
  p >= 100 ? '#22c55e' : p >= 60 ? '#3b82f6' : p >= 30 ? '#f59e0b' : '#ef4444';

const pctBadge = (p: number) =>
  p >= 100 ? 'bg-green-100 text-green-700' : p >= 60 ? 'bg-blue-100 text-blue-700' :
  p >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600';

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    EN_PROGRESO: 'bg-yellow-100 text-yellow-800', PENDIENTE: 'bg-gray-100 text-gray-700', COMPLETADA: 'bg-green-100 text-green-800',
  };
  const labels: Record<string, string> = { EN_PROGRESO: 'En Progreso', PENDIENTE: 'Pendiente', COMPLETADA: 'Completada' };
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${map[estado] || 'bg-gray-100 text-gray-700'}`}>{labels[estado] || estado}</span>;
};

const PERIOD_COLOR: Record<string, string> = {
  DIARIO: 'bg-purple-100 text-purple-700', SEMANAL: 'bg-blue-100 text-blue-700',
  QUINCENAL: 'bg-yellow-100 text-yellow-700', MENSUAL: 'bg-green-100 text-green-700',
};

/* ─────────────────────── shared bar chart ─────────────────────── */
const HBarChart: React.FC<{ items: { label: string; pct: number }[] }> = ({ items }) => {
  if (!items.length) return <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>;
  const barH = 26; const gap = 8; const labelW = 130; const chartW = 380;
  const totalH = items.length * (barH + gap) + 20;
  return (
    <svg viewBox={`0 0 ${labelW + chartW + 60} ${totalH}`} className="w-full" style={{ maxHeight: 340 }}>
      {items.map((item, i) => {
        const pct = Math.min(100, Math.max(0, item.pct));
        const barW = (pct / 100) * chartW;
        const y = i * (barH + gap) + 10;
        return (
          <g key={i}>
            <text x={0} y={y + barH / 2 + 4} fontSize={10} fill="#6b7280">
              {item.label.length > 20 ? item.label.slice(0, 19) + '…' : item.label}
            </text>
            <rect x={labelW} y={y} width={chartW} height={barH} rx={4} fill="#f3f4f6" />
            {barW > 0 && <rect x={labelW} y={y} width={barW} height={barH} rx={4} fill={pctColor(pct)} opacity={0.85} />}
            <text x={labelW + barW + 6} y={y + barH / 2 + 5} fontSize={11} fontWeight="bold" fill={pctColor(pct)}>{pct}%</text>
          </g>
        );
      })}
    </svg>
  );
};

const ChartLegend = () => (
  <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
    {[['bg-green-500','Completado (100%)'],['bg-blue-500','Avanzado (60-99%)'],['bg-yellow-500','En curso (30-59%)'],['bg-red-400','Inicial (0-29%)']].map(([cls,lbl])=>(
      <div key={lbl} className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className={`inline-block w-3 h-3 rounded-sm ${cls}`} />{lbl}
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   VISTA ADMIN — estadísticas globales
═══════════════════════════════════════════════════════════════ */
const DashboardAdmin: React.FC = () => {
  const { usuario } = useAuthStore();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [metas, setMetas]   = useState<Meta[]>([]);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sR, mR, aR] = await Promise.all([
        apiGet(`${API_BASE}/dashboard/stats`),
        apiGet(`${API_BASE}/metas`),
        apiGet(`${API_BASE}/avances`),
      ]);
      const [s, m, a] = await Promise.all([sR.json(), mR.json(), aR.json()]);
      if (s.success) setStats(s.data);
      if (m.success) setMetas(m.data);
      if (a.success) setAvances(a.data.slice(0, 5));
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const statCards = [
    { title: 'Total Metas',  value: stats?.totalMetas ?? '-',         icon: Target,        color: 'text-blue-600',   bg: 'bg-blue-100' },
    { title: 'En Progreso',  value: stats?.metasEnProgreso ?? '-',    icon: TrendingUp,    color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'Contratistas', value: stats?.totalContratistas ?? '-',  icon: Users,         color: 'text-green-600',  bg: 'bg-green-100' },
    { title: 'Avances',      value: stats?.totalAvances ?? '-',       icon: CheckCircle,   color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Actividades',  value: stats?.totalAlcances ?? '-',      icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: '% Promedio',   value: stats ? `${stats.promedioCompletacion ?? 0}%` : '-', icon: BarChart2, color: 'text-teal-600', bg: 'bg-teal-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {usuario?.nombre}</h1>
          <p className="text-gray-600">Panel de administración — visión global del sistema</p>
        </div>
        <button onClick={fetchData} className="btn-outline flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{s.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? <RefreshCw className="h-6 w-6 animate-spin text-gray-400" /> : s.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${s.bg}`}><s.icon className={`h-6 w-6 ${s.color}`} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Avance por Meta</h2>
          <span className="ml-auto text-xs text-gray-400">% de completación acumulada</span>
        </div>
        {loading
          ? <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
          : <HBarChart items={metas.map(m => ({ label: (m.codigo ? `[${m.codigo}] ` : '') + m.nombre, pct: m.porcentaje_completacion ?? 0 }))} />}
        <ChartLegend />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Metas</h2>
          {loading ? <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
          : metas.length === 0 ? <p className="text-gray-500 text-sm">No hay metas registradas</p>
          : <div className="space-y-2">{metas.map(meta => (
              <div key={meta.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {meta.codigo && <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{meta.codigo}</span>}
                    <p className="font-medium text-gray-900 text-sm truncate">{meta.nombre}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Límite: {meta.fecha_limite}</p>
                </div>
                <div className="ml-3 flex-shrink-0">{estadoBadge(meta.estado)}</div>
              </div>
            ))}</div>}
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos Avances</h2>
          {loading ? <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
          : avances.length === 0 ? <p className="text-gray-500 text-sm">No hay avances registrados</p>
          : <div className="space-y-2">{avances.map(av => (
              <div key={av.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900 text-sm">Avance #{av.numavance} — {av.contratista?.nombre || '-'}</p>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${pctBadge(av.porcentaje_avance ?? 0)}`}>{av.porcentaje_avance ?? 0}%</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{av.meta?.nombre || '-'}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{av.descripcion}</p>
              </div>
            ))}</div>}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   VISTA CONTRATISTA — panel personal exclusivo
═══════════════════════════════════════════════════════════════ */
const DashboardContratista: React.FC = () => {
  const { usuario } = useAuthStore();
  const [alcances, setAlcances] = useState<Alcance[]>([]);
  const [avances, setAvances]   = useState<Avance[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alR, avR] = await Promise.all([
        apiGet(`${API_BASE}/alcances`),
        apiGet(`${API_BASE}/avances`),
      ]);
      const [al, av] = await Promise.all([alR.json(), avR.json()]);
      if (al.success) setAlcances(al.data);
      if (av.success) setAvances(av.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── estadísticas personales ── */
  const totalActividades  = alcances.length;
  const totalAvances      = avances.length;
  const metasUnicas       = new Set(alcances.map(a => a.meta?.id).filter(Boolean)).size;
  const promedio = avances.length
    ? Math.round(avances.reduce((s, a) => s + (a.porcentaje_avance ?? 0), 0) / avances.length)
    : 0;

  /* ── avance por actividad (promedio de sus avances) ── */
  const actividadPct = alcances.map(al => {
    const propios = avances.filter(av => (av as any).alcanceId === al.id);
    const avg = propios.length
      ? Math.round(propios.reduce((s, a) => s + (a.porcentaje_avance ?? 0), 0) / propios.length)
      : 0;
    const label = (al.meta?.codigo ? `[${al.meta.codigo}] ` : '') + al.descripcion;
    return { label, pct: avg };
  });

  /* ── dias restantes ── */
  const diasRestantes = (fechaFin: string) => {
    const d = Math.ceil((new Date(fechaFin).getTime() - Date.now()) / 86400000);
    return d;
  };

  const statCards = [
    { title: 'Mis Actividades', value: totalActividades, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Metas asignadas', value: metasUnicas,       icon: Target,        color: 'text-blue-600',   bg: 'bg-blue-100' },
    { title: 'Avances registrados', value: totalAvances,  icon: FileText,      color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: '% Promedio mis avances', value: `${promedio}%`, icon: Activity, color: 'text-teal-600',   bg: 'bg-teal-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header personal */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Panel — {usuario?.nombre}</h1>
          <p className="text-gray-600">Tu progreso personal · solo tú ves esta información</p>
        </div>
        <button onClick={fetchData} className="btn-outline flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Actualizar
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? <RefreshCw className="h-6 w-6 animate-spin text-gray-400" /> : s.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${s.bg}`}><s.icon className={`h-6 w-6 ${s.color}`} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de progreso por actividad */}
      {alcances.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Mi avance por actividad</h2>
            <span className="ml-auto text-xs text-gray-400">promedio de tus avances registrados</span>
          </div>
          {loading
            ? <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
            : <HBarChart items={actividadPct} />}
          <ChartLegend />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mis actividades asignadas */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900">Mis actividades asignadas</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : alcances.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aún no tienes actividades asignadas.</p>
              <p className="text-gray-400 text-xs mt-1">El administrador te asignará actividades próximamente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alcances.map(al => {
                const dias = diasRestantes(al.fecha_fin);
                const vencida = dias < 0;
                const proxima = dias >= 0 && dias <= 7;
                return (
                  <div key={al.id} className={`rounded-lg p-3 border ${vencida ? 'bg-red-50 border-red-200' : proxima ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium text-gray-800 flex-1">{al.descripcion}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PERIOD_COLOR[al.periodicidad] || 'bg-gray-100 text-gray-600'}`}>
                        {al.periodicidad.charAt(0) + al.periodicidad.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {al.meta && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Target className="h-3 w-3 text-blue-400 flex-shrink-0" />
                        {al.meta.codigo && <span className="text-xs font-mono font-bold text-blue-700">{al.meta.codigo}</span>}
                        <span className="text-xs text-gray-600 truncate">{al.meta.nombre}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{al.fecha_inicio} → {al.fecha_fin}
                      </span>
                      {vencida
                        ? <span className="text-red-600 font-semibold">Vencida</span>
                        : proxima
                        ? <span className="text-amber-600 font-semibold">Vence en {dias}d</span>
                        : <span className="text-green-600">{dias}d restantes</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mis últimos avances */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Mis últimos avances</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : avances.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aún no has registrado avances.</p>
              <p className="text-gray-400 text-xs mt-1">Ve a <strong>Avances</strong> para reportar tu progreso.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {avances.slice(0, 6).map(av => (
                <div key={av.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-mono text-gray-500 flex-shrink-0">#{av.numavance}</span>
                      {av.meta?.codigo && (
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-1 rounded flex-shrink-0">{av.meta.codigo}</span>
                      )}
                      <span className="text-xs text-gray-600 truncate">{av.meta?.nombre || '-'}</span>
                    </div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${pctBadge(av.porcentaje_avance ?? 0)}`}>
                      {av.porcentaje_avance ?? 0}%
                    </span>
                  </div>
                  {av.alcance && (
                    <p className="text-xs text-indigo-600 mb-1 truncate">{av.alcance.descripcion}</p>
                  )}
                  <p className="text-xs text-gray-600 line-clamp-2">{av.descripcion}</p>
                  {av.fecha_presentacion && (
                    <p className="text-xs text-gray-400 mt-1">{av.fecha_presentacion.substring(0, 10)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ENTRY POINT — delega según rol
═══════════════════════════════════════════════════════════════ */
const Dashboard: React.FC = () => {
  const { usuario } = useAuthStore();
  if (usuario?.rol === 'CONTRATISTA') return <DashboardContratista />;
  return <DashboardAdmin />;
};

export default Dashboard;
