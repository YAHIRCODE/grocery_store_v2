import { useState, useEffect } from 'react';
import { Receipt, Banknote, AlertTriangle, TrendingUp, ArrowUp, AlertCircle, DollarSign } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import api from '../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Error al cargar el dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-error text-sm">{error}</div>
      </div>
    );
  }

  const revenueBars = (data.diasLabels || []).map((label, i) => ({
    label,
    value: data.gananciasData?.[i] || 0,
  }));
  const maxRevenue = Math.max(...revenueBars.map((b) => b.value), 1);

  const transactions = data.ultimasVentas || [];
  const totalRevenue = data.ventasHoyTotal || 0;
  const lowStock = data.productosConBajoStock || 0;
  const ticketsSold = data.ventasHoy || 0;
  const ganancias = data.gananciasData || [];
  const gastos = data.gastosData || [];
  const totalIngresosSemana = ganancias.reduce((s, v) => s + v, 0);
  const totalGasto = gastos.reduce((s, v) => s + v, 0);
  const totalGananciaSemana = totalIngresosSemana - totalGasto;
  const margin = totalIngresosSemana > 0 ? Math.round((totalGananciaSemana / totalIngresosSemana) * 100) : 0;
  
  const totalCost = data.costoVentasHoy || 0;
  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">
          Bienvenido, {user?.employee?.first_name || user?.name}
        </h2>
        <p className="text-sm text-text-secondary mt-1">Resumen general de Abarrotes Katy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between hover:border-accent transition-colors duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Tickets Hoy</span>
            <Receipt size={16} className="text-text-secondary" />
          </div>
          <div>
            <div className="font-mono text-[28px] font-bold text-white leading-tight mb-1">{ticketsSold.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-accent bg-accent/10 border border-accent px-1 rounded flex items-center font-mono">
                <ArrowUp size={12} className="mr-0.5" />Hoy
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between hover:border-accent transition-colors duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Ingresos Totales</span>
            <Banknote size={16} className="text-text-secondary" />
          </div>
          <div>
            <div className="font-mono text-[28px] font-bold text-white leading-tight mb-1">{fmt(totalRevenue)}</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between hover:border-accent transition-colors duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Ganancia Bruta (Ventas)</span>
            <DollarSign size={16} className="text-text-secondary" />
          </div>
          <div>
            <div className="font-mono text-[28px] font-bold text-white leading-tight mb-1">{fmt(grossProfit)}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-accent bg-accent/10 border border-accent px-1 rounded flex items-center font-mono">
                {grossMargin}%
              </span>
              <span className="text-text-secondary">margen bruto</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between hover:border-error transition-colors duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Stock Bajo</span>
            <AlertTriangle size={16} className="text-text-secondary" />
          </div>
          <div>
            <div className="font-mono text-[28px] font-bold text-white leading-tight mb-1">{lowStock}</div>
            {lowStock > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-error bg-error/20 border border-error px-1 rounded flex items-center font-mono">
                  <AlertCircle size={12} className="mr-0.5" />Acción Requerida
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between hover:border-accent transition-colors duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Ganancia Neta</span>
            <TrendingUp size={16} className="text-text-secondary" />
          </div>
          <div>
            <div className="font-mono text-[28px] font-bold text-white leading-tight mb-1">{fmt(totalGananciaSemana)}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-accent bg-accent/10 border border-accent px-1 rounded flex items-center font-mono">
                {margin}%
              </span>
              <span className="text-text-secondary">margen neto</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
            <h2 className="text-[20px] leading-[28px] font-semibold text-white">Tendencia de Ingresos (7 Días)</h2>
          </div>
          <div className="flex-1 relative min-h-[240px] flex items-end pt-4 pb-2 px-2 gap-2">
            {revenueBars.map((bar, i) => {
              const pct = maxRevenue > 0 ? (bar.value / maxRevenue) * 100 : 0;
              const isMax = bar.value === maxRevenue && bar.value > 0;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm group relative cursor-crosshair transition-colors ${
                    isMax
                      ? 'bg-accent shadow-[0_0_15px_rgba(139,242,230,0.2)]'
                      : 'bg-border hover:bg-accent/50'
                  }`}
                  style={{ height: `${pct}%` }}
                >
                  <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-bg border px-2 py-1 rounded text-xs font-mono whitespace-nowrap transition-opacity ${
                    isMax
                      ? 'border-accent text-accent opacity-100'
                      : 'border-border opacity-0 group-hover:opacity-100'
                  }`}>
                    {fmt(bar.value)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between px-2 pt-2 text-xs text-text-secondary font-mono border-t border-border/50">
            {revenueBars.map((bar, i) => {
              const isMax = bar.value === maxRevenue && bar.value > 0;
              return <span key={i} className={isMax ? 'text-accent' : ''}>{bar.label}</span>;
            })}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
            <h2 className="text-[20px] leading-[28px] font-semibold text-white">Desglose de Ganancias</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center relative">
            <div className="w-40 h-40 rounded-full border-[12px] border-border relative">
              <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-t-accent border-r-accent rotate-45" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-bold text-white">{grossMargin}%</span>
                <span className="text-xs text-text-secondary font-bold tracking-widest uppercase">Margen Bruto</span>
              </div>
            </div>
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-accent" />
                  <span className="text-white">Ingresos</span>
                </div>
                <span className="font-mono">{fmt(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-border" />
                  <span className="text-text-secondary">Costo Ventas</span>
                </div>
                <span className="font-mono text-text-secondary">{fmt(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-border/50 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-accent/50" />
                  <span className="text-white font-semibold">Ganancia Bruta</span>
                </div>
                <span className="font-mono text-accent">{fmt(grossProfit)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-error/50" />
                  <span className="text-text-secondary">Gastos Operativos</span>
                </div>
                <span className="font-mono text-text-secondary">{fmt(totalGasto)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-border/50 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-accent" />
                  <span className="text-white font-semibold">Ganancia Neta</span>
                </div>
                <span className="font-mono text-accent">{fmt(totalGananciaSemana)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-[20px] leading-[28px] font-semibold text-white">Transacciones Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Ticket</th>
                <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Fecha y Hora</th>
                <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Artículos</th>
                <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-right">Total</th>
                <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Estado</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono">
              {transactions.map((tx) => (
                <tr key={tx.sale_group_id} className="border-b border-border hover:bg-border/30 transition-colors">
                  <td className="p-3 text-white">#{tx.sale_group_id?.slice(0, 8)}</td>
                  <td className="p-3 text-text-secondary">{tx.fecha}</td>
                  <td className="p-3 text-text-secondary">{tx.items_count} artículos</td>
                  <td className="p-3 text-white text-right font-bold">{fmt(tx.total)}</td>
                  <td className="p-3">
                    <span className="text-accent bg-accent/10 border border-accent px-2 py-0.5 rounded text-xs">Completado</span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-text-secondary">No hay transacciones recientes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
