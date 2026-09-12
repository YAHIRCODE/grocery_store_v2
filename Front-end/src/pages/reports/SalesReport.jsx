import { useState, useEffect } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight, DollarSign, Package } from 'lucide-react';
import api from '../../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  mixed: 'Mixto',
  credit: 'Crédito',
};

const PAYMENT_STYLE = {
  cash: 'bg-accent/10 text-accent border border-accent/30',
  card: 'bg-accent/10 text-accent border border-accent/30',
  mixed: 'bg-structural text-text-secondary border border-border',
  credit: 'bg-error/10 text-error border border-error/30',
};

export default function SalesReport() {
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchSales = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/reportes/ventas?page=${p}`);
      const paginated = res.data?.data;
      setSales(paginated?.data || []);
      setPage(paginated?.current_page || 1);
      setLastPage(paginated?.last_page || 1);
      setTotal(paginated?.total || 0);
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchSales(1);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const grouped = sales.reduce((acc, line) => {
    const key = line.sale_group_id;
    if (!acc[key]) {
      acc[key] = {
        sale_group_id: key,
        created_at: line.created_at,
        payment_method: line.payment_method,
        total: 0,
        items: 0,
        cliente: line.client
          ? `${line.client.first_name || ''} ${line.client.last_name || ''}`
          : 'Público General',
        empleado: line.employee
          ? `${line.employee.first_name || ''} ${line.employee.last_name || ''}`
          : 'N/A',
        lines: [],
      };
    }
    acc[key].total += Number(line.total_price || 0);
    acc[key].items += Number(line.quantity || 0);
    acc[key].lines.push(line);
    return acc;
  }, {});

  const tickets = Object.values(grouped);

  const totalRevenue = tickets.reduce((s, t) => s + t.total, 0);
  const totalItems = tickets.reduce((s, t) => s + t.items, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Reporte de Ventas</h2>
          <p className="text-sm text-text-secondary mt-1">Historial de ventas por ticket. {total} líneas registradas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Tickets (Página)</span>
            <ShoppingCart size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{tickets.length}</div>
          <div className="text-sm text-text-secondary mt-1">En esta página</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Ingreso Página</span>
            <DollarSign size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{fmt(totalRevenue)}</div>
          <div className="text-sm text-text-secondary mt-1">Suma de tickets</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Unidades</span>
            <Package size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{totalItems.toLocaleString()}</div>
          <div className="text-sm text-text-secondary mt-1">Artículos vendidos</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-secondary text-sm">Cargando ventas...</div>
        </div>
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="bg-border/30 px-6 py-3 grid grid-cols-12 gap-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">
              <div className="col-span-2">Fecha</div>
              <div className="col-span-1">Ticket</div>
              <div className="col-span-2">Cliente</div>
              <div className="col-span-2">Empleado</div>
              <div className="col-span-1 text-center">Items</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-2 text-center">Pago</div>
            </div>

            {tickets.length === 0 ? (
              <div className="py-12 text-center text-text-secondary">No hay ventas registradas</div>
            ) : (
              tickets.map((ticket) => {
                const isExpanded = expanded === ticket.sale_group_id;
                return (
                  <div key={ticket.sale_group_id}>
                    <div
                      className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 hover:bg-border/20 transition-colors cursor-pointer items-center"
                      onClick={() => setExpanded(isExpanded ? null : ticket.sale_group_id)}
                    >
                      <div className="col-span-2 font-mono text-sm text-text-secondary">
                        {new Date(ticket.created_at).toLocaleDateString('es-MX')}
                      </div>
                      <div className="col-span-1 font-mono text-xs text-text-secondary truncate" title={ticket.sale_group_id}>
                        {ticket.sale_group_id.slice(0, 8)}…
                      </div>
                      <div className="col-span-2 text-sm text-white truncate">{ticket.cliente}</div>
                      <div className="col-span-2 text-sm text-text-secondary truncate">{ticket.empleado}</div>
                      <div className="col-span-1 text-center font-mono text-sm text-white">{ticket.items}</div>
                      <div className="col-span-2 text-right font-mono text-sm text-accent font-bold">{fmt(ticket.total)}</div>
                      <div className="col-span-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PAYMENT_STYLE[ticket.payment_method] || ''}`}>
                          {PAYMENT_LABELS[ticket.payment_method] || ticket.payment_method}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-bg/50 border-b border-border px-6 py-3">
                        <div className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-2">Detalle del Ticket</div>
                        <div className="grid grid-cols-6 gap-2 text-[11px] leading-[14px] tracking-widest uppercase font-bold text-text-secondary mb-1 px-2">
                          <div className="col-span-3">Producto</div>
                          <div className="col-span-1 text-center">Cant.</div>
                          <div className="col-span-1 text-right">Precio Unit.</div>
                          <div className="col-span-1 text-right">Subtotal</div>
                        </div>
                        {ticket.lines.map((line) => (
                          <div key={line.id} className="grid grid-cols-6 gap-2 text-sm py-1 px-2 border-t border-border/30">
                            <div className="col-span-3 text-white truncate">{line.product?.name || 'N/A'}</div>
                            <div className="col-span-1 text-center text-text-secondary font-mono">{line.quantity}</div>
                            <div className="col-span-1 text-right text-text-secondary font-mono">{fmt(line.unit_price)}</div>
                            <div className="col-span-1 text-right text-white font-mono">{fmt(line.total_price)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                Página {page} de {lastPage}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchSales(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded bg-surface border border-border text-text-secondary hover:text-white hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => fetchSales(page + 1)}
                  disabled={page >= lastPage}
                  className="p-2 rounded bg-surface border border-border text-text-secondary hover:text-white hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
