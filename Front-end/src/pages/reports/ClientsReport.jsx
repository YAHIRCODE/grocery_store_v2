import { useState, useEffect } from 'react';
import { Users, CreditCard, Search, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ClientsReport() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/dashboard/reportes/clientes')
      .then((res) => setClients(res.data?.data || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const totalCredit = clients.reduce((s, c) => s + Number(c.credit_limit || 0), 0);
  const totalDebt = clients.reduce((s, c) => {
    return s + (c.debts || []).reduce((ds, d) => ds + Number(d.balance_due || 0), 0);
  }, 0);
  const clientsWithDebt = clients.filter((c) => {
    return (c.debts || []).some((d) => d.status !== 'paid');
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Reporte de Clientes</h2>
          <p className="text-sm text-text-secondary mt-1">{clients.length} clientes registrados con historial de deudas.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            className="bg-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-secondary/50 w-64"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Total Clientes</span>
            <Users size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{clients.length}</div>
          <div className="text-sm text-text-secondary mt-1">Clientes registrados</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-error transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Con Deuda</span>
            <AlertTriangle size={20} className="text-error group-hover:text-error transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-error">{clientsWithDebt}</div>
          <div className="text-sm text-text-secondary mt-1">Con saldo pendiente</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Deuda Total</span>
            <CreditCard size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{fmt(totalDebt)}</div>
          <div className="text-sm text-text-secondary mt-1">Crédito otorgado: {fmt(totalCredit)}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-secondary text-sm">Cargando clientes...</div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="bg-border/30 px-6 py-3 grid grid-cols-12 gap-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">Teléfono</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-1 text-right">Crédito</div>
            <div className="col-span-1 text-right">Deudas</div>
            <div className="col-span-1 text-right">Deuda Act.</div>
            <div className="col-span-2 text-center">Estado</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">No hay clientes{search ? ' que coincidan con la búsqueda' : ''}</div>
          ) : (
            filtered.map((c) => {
              const unpaidDebts = (c.debts || []).filter((d) => d.status !== 'paid');
              const debtTotal = unpaidDebts.reduce((s, d) => s + Number(d.balance_due || 0), 0);
              const hasOverdue = unpaidDebts.some((d) => d.status === 'overdue');
              return (
                <div
                  key={c.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 hover:bg-border/20 transition-colors items-center"
                >
                  <div className="col-span-3">
                    <div className="text-sm text-white font-medium truncate">{c.first_name} {c.last_name}</div>
                    <div className="text-xs text-text-secondary">ID: {c.id}</div>
                  </div>
                  <div className="col-span-2 text-sm text-text-secondary font-mono">{c.phone || '—'}</div>
                  <div className="col-span-2 text-sm text-text-secondary truncate">{c.email || '—'}</div>
                  <div className="col-span-1 text-right font-mono text-sm text-text-secondary">{fmt(c.credit_limit)}</div>
                  <div className="col-span-1 text-right font-mono text-sm text-white">{c.debts_count || 0}</div>
                  <div className="col-span-1 text-right font-mono text-sm text-error font-bold">{fmt(debtTotal)}</div>
                  <div className="col-span-2 text-center">
                    {debtTotal === 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/30">Al Corriente</span>
                    ) : hasOverdue ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error border border-error/30">Vencido</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-structural text-text-secondary border border-border">Pendiente</span>
                    )}
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
