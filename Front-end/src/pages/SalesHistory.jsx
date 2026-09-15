import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, X, Check } from 'lucide-react';
import api from '../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  mixed: 'Mixto',
  credit: 'Crédito',
  transfer: 'Transferencia',
};

const perPage = 15;

export default function SalesHistory() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const [editingClientGroup, setEditingClientGroup] = useState(null);
  const [clientDraft, setClientDraft] = useState('');
  const [savingClient, setSavingClient] = useState(false);
  const [clientError, setClientError] = useState('');

  const [editingLineId, setEditingLineId] = useState(null);
  const [lineDraft, setLineDraft] = useState({ product_id: '', quantity: 1, weight_grams: 250 });
  const [extraPayment, setExtraPayment] = useState({ cash: '', card: '' });
  const [lineMessages, setLineMessages] = useState({});
  const [savingLine, setSavingLine] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [salesRes, clientsRes, productsRes] = await Promise.all([
        api.get('/sales'),
        api.get('/clients'),
        api.get('/products'),
      ]);
      setSales(salesRes.data?.data || []);
      setClients(clientsRes.data?.data || []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() { await fetchAll(); }
    load();
  }, []);

  const grouped = sales.reduce((acc, line) => {
    const key = line.sale_group_id;
    if (!acc[key]) {
      acc[key] = {
        sale_group_id: key,
        created_at: line.created_at,
        payment_method: line.payment_method,
        status: line.status,
        client_id: line.client_id,
        cliente: line.client
          ? `${line.client.first_name || ''} ${line.client.last_name || ''}`.trim()
          : 'Público en General',
        empleado: line.employee
          ? `${line.employee.first_name || ''} ${line.employee.last_name || ''}`.trim()
          : 'N/A',
        total: 0,
        lines: [],
      };
    }
    acc[key].total += Number(line.total_price || 0);
    acc[key].lines.push(line);
    return acc;
  }, {});

  const tickets = Object.values(grouped).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const totalPages = Math.max(1, Math.ceil(tickets.length / perPage));
  const paged = tickets.slice((page - 1) * perPage, page * perPage);

  const startEditClient = (ticket) => {
    setEditingClientGroup(ticket.sale_group_id);
    setClientDraft(ticket.client_id ? String(ticket.client_id) : '');
    setClientError('');
  };

  const saveClient = async (groupId) => {
    setSavingClient(true);
    setClientError('');
    try {
      await api.patch(`/sales/group/${groupId}/client`, {
        client_id: clientDraft || null,
      });
      setEditingClientGroup(null);
      await fetchAll();
    } catch (err) {
      setClientError(err.response?.data?.message || 'Error al actualizar el cliente');
    } finally {
      setSavingClient(false);
    }
  };

  const startEditLine = (line) => {
    const isWeightLine = line.unit_type === 'weight';
    setEditingLineId(line.id);
    setLineDraft({
      product_id: String(line.product_id),
      quantity: isWeightLine ? 1 : line.quantity,
      weight_grams: isWeightLine ? line.quantity : 250,
    });
    setExtraPayment({ cash: '', card: '' });
    setLineMessages((prev) => ({ ...prev, [line.id]: null }));
  };

  const cancelEditLine = (lineId) => {
    setEditingLineId(null);
    setLineMessages((prev) => ({ ...prev, [lineId]: null }));
  };

  const saveLine = async (line) => {
    setSavingLine(true);
    try {
      const selectedProduct = products.find((p) => String(p.id) === lineDraft.product_id);
      const weightUnit = selectedProduct?.saleUnits?.find((u) => u.unit_type === 'weight');
      const body = weightUnit
        ? {
            product_id: parseInt(lineDraft.product_id, 10),
            sale_unit_type: 'weight',
            weight_grams: parseInt(lineDraft.weight_grams, 10) || 1,
            additional_cash: parseFloat(extraPayment.cash) || 0,
            additional_card: parseFloat(extraPayment.card) || 0,
          }
        : {
            product_id: parseInt(lineDraft.product_id, 10),
            quantity: parseInt(lineDraft.quantity, 10) || 1,
            additional_cash: parseFloat(extraPayment.cash) || 0,
            additional_card: parseFloat(extraPayment.card) || 0,
          };
      const res = await api.put(`/sales/${line.id}`, body);
      const cambio = res.data?.cambio_a_entregar || 0;
      setLineMessages((prev) => ({
        ...prev,
        [line.id]: {
          type: 'success',
          text: cambio > 0
            ? `Producto cambiado. Entrega ${fmt(cambio)} de cambio al cliente.`
            : 'Producto cambiado exitosamente.',
        },
      }));
      setEditingLineId(null);
      await fetchAll();
    } catch (err) {
      const data = err.response?.data;
      if (data?.faltante) {
        setLineMessages((prev) => ({
          ...prev,
          [line.id]: {
            type: 'faltante',
            text: `El nuevo producto cuesta más. Faltan ${fmt(data.faltante)} por cobrar. Captura el pago adicional y confirma de nuevo.`,
            faltante: data.faltante,
          },
        }));
      } else {
        setLineMessages((prev) => ({
          ...prev,
          [line.id]: { type: 'error', text: data?.message || 'Error al cambiar el producto' },
        }));
      }
    } finally {
      setSavingLine(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando historial de ventas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pos')}
          className="p-2 rounded text-text-secondary hover:text-white hover:bg-border transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-[28px] leading-[36px] tracking-tight font-bold text-white">Historial de Ventas</h2>
          <p className="text-sm text-text-secondary mt-1">
            Consulta tickets pasados, cambia el cliente asignado o corrige el producto de una línea.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="bg-border/30 px-6 py-3 grid grid-cols-12 gap-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary border-b border-border">
          <div className="col-span-2">Fecha</div>
          <div className="col-span-1">Ticket</div>
          <div className="col-span-3">Cliente</div>
          <div className="col-span-2">Empleado</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-2 text-center">Pago</div>
        </div>

        {paged.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No hay ventas registradas</div>
        ) : (
          paged.map((ticket) => {
            const isExpanded = expanded === ticket.sale_group_id;
            const isEditingClient = editingClientGroup === ticket.sale_group_id;
            const isCancelled = ticket.status === 'cancelled';

            return (
              <div key={ticket.sale_group_id}>
                <div
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 hover:bg-border/20 transition-colors cursor-pointer items-center"
                  onClick={() => setExpanded(isExpanded ? null : ticket.sale_group_id)}
                >
                  <div className="col-span-2 font-mono text-sm text-text-secondary">
                    {new Date(ticket.created_at).toLocaleString('es-MX')}
                  </div>
                  <div className="col-span-1 font-mono text-xs text-text-secondary truncate" title={ticket.sale_group_id}>
                    {ticket.sale_group_id.slice(0, 8)}…
                  </div>
                  <div className="col-span-3 text-sm text-white truncate">
                    {ticket.cliente}
                    {isCancelled && <span className="ml-2 text-[10px] text-error font-bold uppercase">Cancelada</span>}
                  </div>
                  <div className="col-span-2 text-sm text-text-secondary truncate">{ticket.empleado}</div>
                  <div className="col-span-2 text-right font-mono text-sm text-accent font-bold">{fmt(ticket.total)}</div>
                  <div className="col-span-2 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/30">
                      {PAYMENT_LABELS[ticket.payment_method] || ticket.payment_method}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-bg/50 border-b border-border px-6 py-4 space-y-4">
                    {isCancelled && (
                      <div className="text-xs text-error font-medium">
                        Esta venta está cancelada y no se puede editar.
                      </div>
                    )}

                    {/* Cliente */}
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] tracking-widest uppercase font-bold text-text-secondary">Cliente:</span>
                      {isEditingClient ? (
                        <>
                          <select
                            className="bg-surface border border-border rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent"
                            value={clientDraft}
                            onChange={(e) => setClientDraft(e.target.value)}
                          >
                            <option value="">Público en General</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveClient(ticket.sale_group_id)}
                            disabled={savingClient}
                            className="p-1 text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-50"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingClientGroup(null)}
                            className="p-1 text-text-secondary hover:bg-border rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-white">{ticket.cliente}</span>
                          {!isCancelled && (
                            <button
                              onClick={() => startEditClient(ticket)}
                              className="p-1 text-text-secondary hover:text-accent transition-colors"
                              title="Cambiar cliente"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {isEditingClient && clientError && (
                      <div className="text-xs text-error">{clientError}</div>
                    )}

                    {/* Líneas */}
                    <div>
                      <div className="grid grid-cols-12 gap-2 text-[11px] leading-[14px] tracking-widest uppercase font-bold text-text-secondary mb-1 px-2">
                        <div className="col-span-4">Producto</div>
                        <div className="col-span-1 text-center">Cant.</div>
                        <div className="col-span-2 text-right">Precio Unit.</div>
                        <div className="col-span-2 text-right">Subtotal</div>
                        <div className="col-span-3 text-right">Acciones</div>
                      </div>
                      {ticket.lines.map((line) => {
                        const isEditingLine = editingLineId === line.id;
                        const message = lineMessages[line.id];
                        const isWeight = line.unit_type === 'weight';
                        const draftProduct = isEditingLine
                          ? products.find((p) => String(p.id) === lineDraft.product_id)
                          : null;
                        const isDraftWeight = !!draftProduct?.saleUnits?.find((u) => u.unit_type === 'weight');

                        return (
                          <div key={line.id} className="border-t border-border/30 py-2 px-2" onClick={(e) => e.stopPropagation()}>
                            {isEditingLine ? (
                              <div className="grid grid-cols-12 gap-2 items-center">
                                <select
                                  className="col-span-4 bg-surface border border-border rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent"
                                  value={lineDraft.product_id}
                                  onChange={(e) => setLineDraft((d) => ({ ...d, product_id: e.target.value }))}
                                >
                                  {products.map((p) => {
                                    const weightUnit = p.saleUnits?.find((u) => u.unit_type === 'weight');
                                    return (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({weightUnit ? `${fmt(weightUnit.unit_price)}/kg` : fmt(p.price)})
                                      </option>
                                    );
                                  })}
                                </select>
                                {isDraftWeight ? (
                                  <div className="col-span-2 flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="1"
                                      className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-white text-center font-mono focus:outline-none focus:border-accent"
                                      value={lineDraft.weight_grams}
                                      onChange={(e) => setLineDraft((d) => ({ ...d, weight_grams: e.target.value }))}
                                    />
                                    <span className="text-[10px] text-text-secondary">g</span>
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    min="1"
                                    className="col-span-2 bg-surface border border-border rounded px-2 py-1 text-sm text-white text-center font-mono focus:outline-none focus:border-accent"
                                    value={lineDraft.quantity}
                                    onChange={(e) => setLineDraft((d) => ({ ...d, quantity: e.target.value }))}
                                  />
                                )}
                                <div className="col-span-3" />
                                <div className="col-span-3 flex justify-end gap-2">
                                  <button
                                    onClick={() => saveLine(line)}
                                    disabled={savingLine}
                                    className="px-2 py-1 bg-accent text-bg text-xs font-bold rounded hover:opacity-90 disabled:opacity-50"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => cancelEditLine(line.id)}
                                    className="px-2 py-1 bg-surface border border-border text-white text-xs rounded hover:bg-border/50"
                                  >
                                    Cancelar
                                  </button>
                                </div>

                                {message?.type === 'faltante' && (
                                  <div className="col-span-12 flex items-center gap-2 mt-2 p-2 bg-error/10 border border-error/30 rounded">
                                    <span className="text-xs text-error flex-1">{message.text}</span>
                                    <input
                                      type="number"
                                      placeholder="Efectivo extra"
                                      className="w-28 bg-surface border border-border rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-accent"
                                      value={extraPayment.cash}
                                      onChange={(e) => setExtraPayment((p) => ({ ...p, cash: e.target.value }))}
                                    />
                                    <input
                                      type="number"
                                      placeholder="Tarjeta extra"
                                      className="w-28 bg-surface border border-border rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-accent"
                                      value={extraPayment.card}
                                      onChange={(e) => setExtraPayment((p) => ({ ...p, card: e.target.value }))}
                                    />
                                    <button
                                      onClick={() => saveLine(line)}
                                      disabled={savingLine}
                                      className="px-2 py-1 bg-accent text-bg text-xs font-bold rounded hover:opacity-90 disabled:opacity-50"
                                    >
                                      Cobrar y confirmar
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-12 gap-2 items-center text-sm">
                                <div className="col-span-4 text-white truncate">{line.product?.name || 'N/A'}</div>
                                <div className="col-span-1 text-center text-text-secondary font-mono">
                                  {line.quantity}{isWeight ? 'g' : ''}
                                </div>
                                <div className="col-span-2 text-right text-text-secondary font-mono">{fmt(line.unit_price)}</div>
                                <div className="col-span-2 text-right text-white font-mono">{fmt(line.total_price)}</div>
                                <div className="col-span-3 flex justify-end">
                                  {!isCancelled && (
                                    <button
                                      onClick={() => startEditLine(line)}
                                      className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-accent transition-colors"
                                    >
                                      <Pencil size={12} /> Cambiar producto
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                            {message && message.type !== 'faltante' && (
                              <div className={`text-xs mt-1 ${message.type === 'success' ? 'text-accent' : 'text-error'}`}>
                                {message.text}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded bg-surface border border-border text-text-secondary hover:text-white hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded bg-surface border border-border text-text-secondary hover:text-white hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
