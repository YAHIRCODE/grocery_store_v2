import { useState, useEffect } from 'react';
import { Calendar, FileText, Table, FileSpreadsheet, Download, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ReportsOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('week');

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando reportes...</div>
      </div>
    );
  }

  const barHeights = (data?.gananciasData || []).map((v) => v);
  const maxBar = Math.max(...barHeights, 1);
  const days = data?.diasLabels || [];
  const topProducts = data?.labelsCategorias?.map((name, i) => ({
    name,
    units: data.conteoProductos?.[i] || 0,
  })) || [];
  const criticalStock = data?.productosConBajoStock || 0;
  const totalRevenue = data?.ventasHoyTotal || 0;

  const downloadReport = (format) => {
    const url = `http://localhost:8000/api/reportes/dashboard/${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white mb-1">Generación de Reportes</h2>
          <p className="text-base text-text-secondary">Configura rangos de fecha y exporta métricas operativas vitales.</p>
        </div>
        <div className="flex bg-surface p-1 rounded-lg border border-border w-fit shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          {[
            { key: 'today', label: 'Hoy' },
            { key: 'week', label: 'Esta Semana' },
            { key: 'month', label: 'Este Mes' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1 rounded text-[12px] leading-[16px] tracking-widest uppercase font-bold transition-colors ${
                activeFilter === f.key
                  ? 'bg-structural/30 text-white shadow-sm'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => downloadReport('pdf')}
          className="group relative overflow-hidden bg-surface rounded-xl border border-border hover:border-accent transition-all duration-300 p-6 flex flex-col items-start justify-center h-32 hover:shadow-[0_0_15px_rgba(139,242,230,0.1)] focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-error/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <FileText size={36} className="text-error mb-2 relative z-10" />
          <h3 className="text-[20px] leading-[28px] font-semibold text-white relative z-10">Exportar a PDF</h3>
          <p className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary relative z-10">Listo para imprimir y compartir</p>
          <Download size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
        </button>

        <button
          onClick={() => downloadReport('csv')}
          className="group relative overflow-hidden bg-surface rounded-xl border border-border hover:border-accent transition-all duration-300 p-6 flex flex-col items-start justify-center h-32 hover:shadow-[0_0_15px_rgba(139,242,230,0.1)] focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#107c41]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Table size={36} className="text-[#21a366] mb-2 relative z-10" />
          <h3 className="text-[20px] leading-[28px] font-semibold text-white relative z-10">Exportar a Excel</h3>
          <p className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary relative z-10">Datos crudos con fórmulas intactas</p>
          <Download size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
        </button>

        <button
          onClick={() => downloadReport('csv')}
          className="group relative overflow-hidden bg-surface rounded-xl border border-border hover:border-accent transition-all duration-300 p-6 flex flex-col items-start justify-center h-32 hover:shadow-[0_0_15px_rgba(139,242,230,0.1)] focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <FileSpreadsheet size={36} className="text-accent mb-2 relative z-10" />
          <h3 className="text-[20px] leading-[28px] font-semibold text-white relative z-10">Exportar a CSV</h3>
          <p className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary relative z-10">Datos ligeros en texto plano</p>
          <Download size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
        </button>
      </div>

      <div className="mt-2 mb-1 flex items-center justify-between">
        <h3 className="text-[24px] leading-[32px] font-semibold text-white border-l-4 border-accent pl-3">Vista Previa en Vivo</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 bg-surface rounded-xl border border-border p-6 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
            <h4 className="text-[20px] leading-[28px] font-semibold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-accent" /> Rendimiento de Ventas
            </h4>
            <div className="flex flex-col items-end">
              <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Ingreso Bruto</span>
              <span className="font-mono text-xl text-accent">{fmt(totalRevenue)}</span>
            </div>
          </div>

          <div className="flex-1 relative min-h-[250px] w-full rounded border border-border/50 bg-bg overflow-hidden flex items-end justify-between px-4 pt-6 pb-0">
            <div className="absolute inset-0 w-full h-full pointer-events-none flex flex-col justify-between opacity-10">
              <div className="border-b border-white h-px w-full" />
              <div className="border-b border-white h-px w-full" />
              <div className="border-b border-white h-px w-full" />
              <div className="border-b border-white h-px w-full" />
              <div className="border-b border-white h-px w-full" />
            </div>
            {barHeights.map((val, i) => {
              const pct = maxBar > 0 ? (val / maxBar) * 100 : 0;
              const isMax = val === maxBar && val > 0;
              return (
                <div
                  key={i}
                  className={`w-[8%] border relative transition-colors ${
                    isMax
                      ? 'bg-accent/30 border-accent shadow-[0_0_10px_rgba(139,242,230,0.3)] hover:bg-accent/50'
                      : 'bg-structural border-structural hover:bg-structural/80'
                  }`}
                  style={{ height: `${pct}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between w-full px-4 mt-2 opacity-50">
            {days.map((d, i) => {
              const isMax = barHeights[i] === maxBar && barHeights[i] > 0;
              return <span key={i} className={`text-[10px] font-mono ${isMax ? 'text-accent' : ''}`}>{d}</span>;
            })}
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-surface rounded-xl border border-border p-4 flex-1 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col">
            <h4 className="text-[20px] leading-[28px] font-semibold text-white mb-3 flex items-center gap-2 border-b border-border pb-2">
              <Star size={20} className="text-text-secondary" /> Productos por Categoría
            </h4>
            <ul className="flex flex-col gap-2 flex-1">
              {topProducts.map((p, i) => (
                <li key={i} className="flex items-center justify-between p-2 rounded bg-bg border border-border hover:border-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-text-secondary w-4">{i + 1}.</span>
                    <span className="text-sm text-white">{p.name}</span>
                  </div>
                  <span className="font-mono text-accent">{p.units}u</span>
                </li>
              ))}
              {topProducts.length === 0 && (
                <li className="text-center text-text-secondary text-sm py-4">Sin datos</li>
              )}
            </ul>
          </div>

          <div className="bg-surface rounded-xl border border-border p-4 flex-1 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-bl-full pointer-events-none" />
            <h4 className="text-[20px] leading-[28px] font-semibold text-white mb-3 flex items-center gap-2 border-b border-border pb-2">
              <AlertTriangle size={20} className="text-error" /> Stock Bajo
            </h4>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-[48px] font-bold text-white">{criticalStock}</div>
                <div className="text-sm text-text-secondary">productos con stock bajo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
