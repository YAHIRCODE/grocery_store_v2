import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, DollarSign } from 'lucide-react';
import api from '../../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STATUS_STYLE = {
  pending: { label: 'Pendiente', className: 'bg-structural text-text-secondary border border-border' },
  overdue: { label: 'Vencido', className: 'bg-error/10 text-error border border-error/30' },
};

export default function DebtsReport() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/dashboard/reportes/deudas')
      .then((res) => setDebts(res.data?.data || []))
      .catch(() => setDebts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = debts.filter((d) => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const totalPending = debts.filter((d) => d.status === 'pending').reduce((s, d) => s + Number(d.balance_due || 0), 0);
  const totalOverdue = debts.filter((d) => d.status === 'overdue').reduce((s, d) => s + Number(d.balance_due || 0), 0);
  const totalAll = totalPending + totalOverdue;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Reporte de Deudas</h2>
          <p className="text-sm text-text-secondary mt-1">{debts.length} deudas pendientes y vencidas de clientes.</p>
        </div>
        <div className="flex bg-surface p-1 rounded-lg border border-border w-fit">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'overdue', label: 'Vencidas' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded text-[12px] leading-[16px] tracking-widest uppercase font-bold transition-colors ${
                filter === f.key
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
        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Total Deudas</span>
            <DollarSign size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{fmt(totalAll)}</div>
          <div className="text-sm text-text-secondary mt-1">{debts.length} deudas registradas</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Pendientes</span>
            <Clock size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{fmt(totalPending)}</div>
          <div className="text-sm text-text-secondary mt-1">{debts.filter((d) => d.status === 'pending').length} deudas</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-error transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Vencidas</span>
            <AlertTriangle size={20} className="text-error group-hover:text-error transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-error">{fmt(totalOverdue)}</div>
          <div className="text-sm text-text-secondary mt-1">{debts.filter((d) => d.status === 'overdue').length} deudas</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-secondary text-sm">Cargando deudas...</div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="bg-border/30 px-6 py-3 grid grid-cols-12 gap-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">Venta</div>
            <div className="col-span-2">Inicio</div>
            <div className="col-span-2">Vencimiento</div>
            <div className="col-span-1 text-right">Saldo</div>
            <div className="col-span-2 text-center">Estado</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              {filter === 'all' ? 'No hay deudas registradas' : `No hay deudas ${filter === 'pending' ? 'pendientes' : 'vencidas'}`}
            </div>
          ) : (
            filtered.map((d) => {
              const style = STATUS_STYLE[d.status] || STATUS_STYLE.pending;
              const clientName = d.client
                ? `${d.client.first_name || ''} ${d.client.last_name || ''}`
                : `Cliente #${d.client_id}`;
              const today = new Date();
              const dueDate = new Date(d.due_date);
              const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              const isUrgent = d.status === 'overdue' || (d.status === 'pending' && daysUntilDue <= 7 && daysUntilDue >= 0);

              return (
                <div
                  key={d.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 hover:bg-border/20 transition-colors items-center ${isUrgent ? 'border-l-2 border-l-error' : ''}`}
                >
                  <div className="col-span-3">
                    <div className="text-sm text-white font-medium truncate">{clientName}</div>
                    <div className="text-xs text-text-secondary font-mono">Deuda #{d.id}</div>
                  </div>
                  <div className="col-span-2 font-mono text-xs text-text-secondary truncate" title={d.sale_group_id}>
                    {d.sale_group_id ? d.sale_group_id.slice(0, 8) + '…' : '—'}
                  </div>
                  <div className="col-span-2 font-mono text-sm text-text-secondary">{d.start_date}</div>
                  <div className="col-span-2 font-mono text-sm text-text-secondary">{d.due_date}</div>
                  <div className="col-span-1 text-right font-mono text-sm text-error font-bold">{fmt(d.balance_due)}</div>
                  <div className="col-span-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.className}`}>
                      {style.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
