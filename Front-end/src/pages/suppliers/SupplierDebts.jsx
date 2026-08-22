import { useState, useEffect } from 'react';
import api from '../../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const STATUS_STYLE = {
  pending: { label: 'Pendiente', className: 'bg-accent/10 text-accent border border-accent/30' },
  overdue: { label: 'Vencido', className: 'bg-error/10 text-error border border-error/30' },
  paid: { label: 'Pagado', className: 'bg-text-secondary/10 text-text-secondary border border-text-secondary/30' },
};

export default function SupplierDebts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/supplier-debts')
      .then((res) => setDebts(res.data?.data || []))
      .catch(() => setDebts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-text-secondary text-sm">Cargando deudas...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] leading-[32px] font-semibold text-white">Deudas de Proveedores</h2>
        <p className="text-sm text-text-secondary mt-1">Historial de adeudos con proveedores.</p>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg/50">
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Proveedor</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-right">Monto</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Estado</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {debts.map((d) => {
              const style = STATUS_STYLE[d.status] || STATUS_STYLE.pending;
              return (
                <tr key={d.id} className="border-b border-border hover:bg-border/30 transition-colors">
                  <td className="py-4 px-4 font-semibold text-white">{d.supplier?.company_name || `Proveedor #${d.supplier_id}`}</td>
                  <td className="py-4 px-4 text-right font-mono text-error">{fmt(d.amount)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.className}`}>{style.label}</span>
                  </td>
                </tr>
              );
            })}
            {debts.length === 0 && (
              <tr><td colSpan={3} className="py-6 text-center text-text-secondary">No hay deudas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
