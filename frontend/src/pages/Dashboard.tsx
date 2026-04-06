import React, { useEffect, useState } from 'react';
import { Target, Users, TrendingUp, CheckCircle, RefreshCw, BarChart2, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Stats {
  totalMetas: number;
  metasCompletadas: number;
  totalContratistas: number;
  totalAvances: number;
  metasEnProgreso: number;
  promedioCompletacion?: number;
  totalAlcances?: number;
}

interface Meta {
  id: number;
  codigo: string;
  nombre: string;
  estado: string;
  fecha_limite: string;
  porcentaje_completacion?: number;
}

interface Avance {
  id: number;
  descripcion: string;
  numavance: number;
  porcentaje_avance?: number;
  meta?: { nombre: string };
  contratista?: { nombre: string };
  reportadoPor?: { nombre: string };
}

/* ── Bar chart SVG ── */
const MetaBarChart: React.FC<{ metas: Meta[] }> = ({ metas }) => {
  if (!metas.length) return <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>;
  const barH = 28;
  const gap  = 10;
  const labelW = 120;
  const chartW = 420;
  const totalH = metas.length * (barH + gap) + 20;
  const color = (p: number) =>
    p >= 100 ? '#22c55e' : p >= 60 ? '#3b82f6' : p >= 30 ? '#f59e0b' : '#ef4444';
  return (
    <svg viewBox={`0 0 ${labelW + chartW + 60} ${totalH}`} className="w-full" style={{ maxHeight: 320 }}>
      {metas.map((m, i) => {
        const pct  = Math.min(100, Math.max(0, m.porcentaje_completacion ?? 0));
        const barW = (pct / 100) * chartW;
        const y    = i * (barH + gap) + 10;
        const label = (m.codigo ? `[${m.codigo}] ` : '') + m.nombre;
        return (
          <g key={m.id}>
            <text x={0} y={y + barH / 2 + 5} fontSize={10} fill="#6b7280"
              className="font-mono">
              {label.length > 18 ? label.slice(0, 17) + '…' : label}
            </text>
            <rect x={labelW} y={y} width={chartW} height={barH} rx={4} fill="#f3f4f6" />
            {barW > 0 && <rect x={labelW} y={y} width={barW} height={barH} rx={4} fill={color(pct)} opacity={0.85} />}
            <text x={labelW + barW + 6} y={y + barH / 2 + 5} fontSize={11} fontWeight="bold"
              fill={color(pct)}>{pct}%</text>
          </g>
        );
      })}
    </svg>
  );
};

const Dashboard: React.FC = () => {
  const { usuario } = useAuthStore();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [metas, setMetas]   = useState<Meta[]>([]);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, metasRes, avancesRes] = await Promise.all([
        fetch('http://localhost:3001/api/dashboard/stats'),
        fetch('http://localhost:3001/api/metas'),
        fetch('http://localhost:3001/api/avances'),
      ]);
      const [statsData, metasData, avancesData] = await Promise.all([
        statsRes.json(), metasRes.json(), avancesRes.json(),
      ]);
      if (statsData.success)  setStats(statsData.data);
      if (metasData.success)  setMetas(metasData.data);
      if (avancesData.success) setAvances(avancesData.data.slice(0, 5));
    } catch (e) {
      console.error('Error cargando datos del dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const statCards = [
    { title: 'Total Metas',    value: stats?.totalMetas ?? '-',           icon: Target,       color: 'text-blue-600',   bg: 'bg-blue-100' },
    { title: 'En Progreso',    value: stats?.metasEnProgreso ?? '-',       icon: TrendingUp,   color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'Contratistas',   value: stats?.totalContratistas ?? '-',     icon: Users,        color: 'text-green-600',  bg: 'bg-green-100' },
    { title: 'Avances',        value: stats?.totalAvances ?? '-',          icon: CheckCircle,  color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Alcances',       value: stats?.totalAlcances ?? '-',         icon: ClipboardList,color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: '% Promedio',     value: stats ? `${stats.promedioCompletacion ?? 0}%` : '-', icon: BarChart2, color: 'text-teal-600', bg: 'bg-teal-100' },
  ];

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      EN_PROGRESO: 'bg-yellow-100 text-yellow-800',
      PENDIENTE: 'bg-gray-100 text-gray-700',
      COMPLETADA: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      EN_PROGRESO: 'En Progreso',
      PENDIENTE: 'Pendiente',
      COMPLETADA: 'Completada',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${map[estado] || 'bg-gray-100 text-gray-700'}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {usuario?.nombre}</h1>
          <p className="text-gray-600">Resumen general del sistema</p>
        </div>
        <button onClick={fetchData} className="btn-outline flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? <RefreshCw className="h-6 w-6 animate-spin text-gray-400" /> : stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Avance por Meta</h2>
          <span className="ml-auto text-xs text-gray-400">% de completación acumulada</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <MetaBarChart metas={metas} />
        )}
        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
          {[['bg-green-500','Completado (100%)'],['bg-blue-500','Avanzado (60-99%)'],['bg-yellow-500','En curso (30-59%)'],['bg-red-400','Inicial (0-29%)']].map(([cls,lbl])=>(
            <div key={lbl} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`inline-block w-3 h-3 rounded-sm ${cls}`} />{lbl}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Metas</h2>
          {loading ? (
            <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : metas.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay metas registradas</p>
          ) : (
            <div className="space-y-2">
              {metas.map((meta) => (
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
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos Avances</h2>
          {loading ? (
            <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : avances.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay avances registrados</p>
          ) : (
            <div className="space-y-2">
              {avances.map((avance) => (
                <div key={avance.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 text-sm">Avance #{avance.numavance} — {avance.contratista?.nombre || '-'}</p>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      (avance.porcentaje_avance ?? 0) >= 100 ? 'bg-green-100 text-green-700' :
                      (avance.porcentaje_avance ?? 0) >= 60  ? 'bg-blue-100 text-blue-700'  :
                      (avance.porcentaje_avance ?? 0) >= 30  ? 'bg-yellow-100 text-yellow-700': 'bg-red-100 text-red-600'
                    }`}>{avance.porcentaje_avance ?? 0}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{avance.meta?.nombre || '-'}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{avance.descripcion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
