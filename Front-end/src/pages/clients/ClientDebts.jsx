import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, DollarSign, Search, X, CreditCard } from 'lucide-react';
import api from '../../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STATUS_STYLE = {
  pending: { label: 'Pendiente', className: 'bg-structural text-text-secondary border border-border', dot: 'bg-text-secondary' },
  overdue: { label: 'Vencido', className: 'bg-error/10 text-error border border-error/30', dot: 'bg-error' },
  paid: { label: 'Pagado', className: 'bg-accent/10 text-accent border border-accent/30', dot: 'bg-accent' },
};

export default function ClientDebts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/client-debts');
      setDebts(res.data?.data || []);
    } catch {
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() { await fetchDebts(); }
    load();
  }, []);

  const filtered = debts.filter((d) => {
    const matchFilter = filter === 'all' || d.status === filter;
    const q = search.toLowerCase();
    const clientName = d.client ? `${d.client.first_name || ''} ${d.client.last_name || ''}`.toLowerCase() : '';
    const matchSearch = !q || clientName.includes(q) || String(d.id).includes(q);
    return matchFilter && matchSearch;
  });

  const totalPending = debts.filter((d) => d.status === 'pending').reduce((s, d) => s + Number(d.balance_due || 0), 0);
  const totalOverdue = debts.filter((d) => d.status === 'overdue').reduce((s, d) => s + Number(d.balance_due || 0), 0);
  const totalPaid = debts.filter((d) => d.status === 'paid').reduce((s, d) => s + Number(d.original_amount || d.balance_due || 0), 0);
  const overdueCount = debts.filter((d) => d.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Deudas de Clientes</h2>
          <p className="text-sm text-text-secondary mt-1">Historial de créditos, pagos y seguimiento de saldos.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            className="bg-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-secondary/50 w-64"
            placeholder="Buscar cliente, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Pendiente</span>
            <Clock size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{fmt(totalPending)}</div>
          <div className="text-sm text-text-secondary mt-1">{debts.filter((d) => d.status === 'pending').length} deudas</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-error transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Vencido</span>
            <AlertTriangle size={20} className="text-error" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-error">{fmt(totalOverdue)}</div>
          <div className="text-sm text-text-secondary mt-1">{overdueCount} deudas vencidas</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Cobrado</span>
            <CheckCircle size={20} className="text-accent" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-accent">{fmt(totalPaid)}</div>
          <div className="text-sm text-text-secondary mt-1">{debts.filter((d) => d.status === 'paid').length} deudas saldadas</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Total Deudas</span>
            <DollarSign size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{debts.length}</div>
          <div className="text-sm text-text-secondary mt-1">Deudas registradas</div>
        </div>
      </div>

      <div className="flex bg-surface p-1 rounded-lg border border-border w-fit">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'overdue', label: 'Vencidas' },
          { key: 'paid', label: 'Pagadas' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded text-[12px] leading-[16px] tracking-widest uppercase font-bold transition-colors ${
              filter === f.key
                ? 'bg-structural/30 text-white shadow-sm'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-secondary text-sm">Cargando deudas...</div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="bg-border/30 px-6 py-3 grid grid-cols-12 gap-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">Vencimiento</div>
            <div className="col-span-3">Progreso de Pago</div>
            <div className="col-span-2 text-right">Saldo</div>
            <div className="col-span-1 text-center">Estado</div>
            <div className="col-span-1 text-center">Acción</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              {filter === 'all' ? 'No hay deudas registradas' : `No hay deudas ${filter === 'pending' ? 'pendientes' : filter === 'overdue' ? 'vencidas' : 'pagadas'}`}
            </div>
          ) : (
            filtered.map((d) => {
              const style = STATUS_STYLE[d.status] || STATUS_STYLE.pending;
              const clientName = d.client
                ? `${d.client.first_name || ''} ${d.client.last_name || ''}`
                : `Cliente #${d.client_id}`;
              const original = Number(d.original_amount || d.balance_due || 0);
              const remaining = Number(d.balance_due || 0);
              const paid = original - remaining;
              const pct = original > 0 ? Math.round(((original - remaining) / original) * 100) : (d.status === 'paid' ? 100 : 0);
              const today = new Date();
              const dueDate = new Date(d.due_date);
              const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              const isUrgent = d.status === 'overdue' || (d.status === 'pending' && daysUntilDue <= 7 && daysUntilDue >= 0);

              return (
                <div
                  key={d.id}
                  className={`px-6 py-4 border-b border-border/50 hover:bg-border/20 transition-colors items-center ${selected?.id === d.id ? 'bg-accent/5 border-l-2 border-l-accent' : ''} ${isUrgent && d.status !== 'paid' ? 'border-l-2 border-l-error' : ''}`}
                  onClick={() => setSelected(d)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="text-sm text-white font-medium truncate">{clientName}</div>
                      <div className="text-xs text-text-secondary font-mono">Deuda #{d.id}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="font-mono text-sm text-text-secondary">{d.due_date}</div>
                      {d.status !== 'paid' && (
                        <div className={`text-xs font-mono ${daysUntilDue < 0 ? 'text-error' : daysUntilDue <= 7 ? 'text-error' : 'text-text-secondary'}`}>
                          {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} días vencido` : `${daysUntilDue} días restantes`}
                        </div>
                      )}
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] text-text-secondary font-mono">{pct}% pagado</span>
                            <span className="text-[11px] text-text-secondary font-mono">{fmt(paid)} / {fmt(original)}</span>
                          </div>
                          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                d.status === 'paid' ? 'bg-accent' : pct >= 50 ? 'bg-accent' : pct > 0 ? 'bg-text-secondary' : 'bg-error'
                              }`}
                              style={{ width: `${d.status === 'paid' ? 100 : Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className={`font-mono text-sm font-bold ${d.status === 'paid' ? 'text-accent' : 'text-error'}`}>
                        {fmt(remaining)}
                      </div>
                      <div className="text-[11px] text-text-secondary">de {fmt(original)}</div>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.className}`}>
                        {style.label}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      {d.status !== 'paid' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(d); setShowPayModal(true); }}
                          className="p-2 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                          title="Registrar pago"
                        >
                          <CreditCard size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showPayModal && selected && (
        <PayModal
          debt={selected}
          onClose={() => { setShowPayModal(false); setSelected(null); }}
          onPaid={() => { setShowPayModal(false); setSelected(null); fetchDebts(); }}
        />
      )}
    </div>
  );
}

function PayModal({ debt, onClose, onPaid }) {
  const [amount, setAmount] = useState(String(Number(debt.balance_due || 0).toFixed(2)));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const original = Number(debt.original_amount || debt.balance_due || 0);
  const remaining = Number(debt.balance_due || 0);
  const paidPct = original > 0 ? Math.round(((original - remaining) / original) * 100) : 0;
  const amountNum = parseFloat(amount) || 0;
  const newBalance = remaining - amountNum;
  const newPct = original > 0 ? Math.round(((original - newBalance) / original) * 100) : 100;

  const clientName = debt.client
    ? `${debt.client.first_name || ''} ${debt.client.last_name || ''}`
    : `Cliente #${debt.client_id}`;

  const handlePay = async (e) => {
    e.preventDefault();
    if (amountNum <= 0) { setError('Ingresa un monto válido'); return; }
    if (amountNum > remaining) { setError('El monto excede el saldo pendiente'); return; }

    setError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/client-debts/${debt.id}/pay`, { amount: amountNum });
      setSuccess(res.data?.message || 'Pago registrado');
      setTimeout(() => onPaid(), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-[24px] leading-[32px] font-semibold text-white">Registrar Pago</h3>
            <p className="text-sm text-text-secondary mt-1">{clientName} — Deuda #{debt.id}</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handlePay} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-[11px] leading-[14px] tracking-widest uppercase font-bold text-text-secondary mb-1">Original</div>
              <div className="font-mono text-xl text-white">{fmt(original)}</div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-[11px] leading-[14px] tracking-widest uppercase font-bold text-text-secondary mb-1">Pendiente</div>
              <div className="font-mono text-xl text-error">{fmt(remaining)}</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] tracking-widest uppercase font-bold text-text-secondary">Progreso Actual</span>
              <span className="font-mono text-sm text-accent">{paidPct}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-3 overflow-hidden">
              <div className="bg-accent h-full rounded-full transition-all" style={{ width: `${paidPct}%` }} />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-4">
            <label className="block text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-2">Monto del Pago</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono text-lg">$</span>
              <input
                className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-4 text-2xl font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-secondary/50"
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setAmount(remaining.toFixed(2))} className="text-xs text-accent hover:underline">Total ({fmt(remaining)})</button>
              <span className="text-text-secondary">·</span>
              <button type="button" onClick={() => setAmount((remaining / 2).toFixed(2))} className="text-xs text-accent hover:underline">Mitad</button>
              <span className="text-text-secondary">·</span>
              <button type="button" onClick={() => setAmount((remaining * 0.25).toFixed(2))} className="text-xs text-accent hover:underline">25%</button>
            </div>
          </div>

          {amountNum > 0 && amountNum <= remaining && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="text-[11px] tracking-widest uppercase font-bold text-text-secondary mb-2">Vista Previa</div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Saldo después del pago:</span>
                <span className={`font-mono text-lg font-bold ${newBalance <= 0 ? 'text-accent' : 'text-white'}`}>
                  {fmt(Math.max(newBalance, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-text-secondary">Progreso:</span>
                <span className="font-mono text-sm text-accent">{newPct}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2 mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${newBalance <= 0 ? 'bg-accent' : newPct >= 50 ? 'bg-accent' : 'bg-text-secondary'}`} style={{ width: `${newPct}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-3">{error}</div>
          )}

          {success && (
            <div className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-lg px-4 py-3">{success}</div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-border text-text-secondary hover:text-white hover:border-text-secondary transition-colors text-[12px] leading-[16px] tracking-widest uppercase font-bold">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || amountNum <= 0 || amountNum > remaining}
              className="bg-accent text-bg hover:opacity-90 text-[12px] leading-[16px] tracking-widest uppercase font-bold px-6 py-2 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CreditCard size={16} /> {submitting ? 'Procesando...' : newBalance <= 0 ? 'Liquidar Deuda' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
