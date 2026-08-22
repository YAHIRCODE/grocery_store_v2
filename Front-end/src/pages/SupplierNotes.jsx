import { useState, useEffect } from 'react';
import { Printer, CheckCircle, Check, AlertTriangle, Upload, X, Plus, Trash2, Search } from 'lucide-react';
import api from '../services/api';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', className: 'bg-accent/10 border border-accent/30 text-accent' },
  confirmed: { label: 'Confirmado', className: 'bg-accent/10 border border-accent/30 text-accent' },
  paid: { label: 'Pagado', className: 'bg-text-secondary/10 border border-text-secondary/30 text-text-secondary' },
};

const TABS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'paid', label: 'Pagadas' },
];

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function SupplierNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedNote, setSelectedNote] = useState(null);
  const [receivedQtys, setReceivedQtys] = useState({});
  const [observations, setObservations] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchNotes = async (status) => {
    setLoading(true);
    try {
      const params = status && status !== 'all' ? `?status=${status}` : '';
      const res = await api.get(`/supplier-notes${params}`);
      const list = res.data?.data || [];
      setNotes(list);
      if (list.length > 0 && !selectedNote) {
        selectNote(list[0]);
      }
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(activeTab); }, [activeTab]);

  const selectNote = (note) => {
    setSelectedNote(note);
    const qtys = {};
    (note.details || []).forEach((d) => {
      qtys[d.product_id] = d.quantity_received ?? d.quantity_agreed ?? 0;
    });
    setReceivedQtys(qtys);
    setObservations(note.observations || '');
  };

  const handleQtyChange = (productId, value) => {
    setReceivedQtys((prev) => ({ ...prev, [productId]: parseInt(value) || 0 }));
  };

  const handleConfirm = async () => {
    if (!selectedNote) return;
    setConfirming(true);
    try {
      const products = (selectedNote.details || []).map((d) => ({
        product_id: d.product_id,
        quantity_received: receivedQtys[d.product_id] ?? 0,
      }));
      await api.put(`/supplier-notes/${selectedNote.id}/confirm`, {
        products,
        observations: observations || null,
      });
      fetchNotes(activeTab);
    } catch {
      // silently fail
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="w-1/3 min-w-[320px] max-w-[400px] flex flex-col gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-surface rounded-lg border border-border p-2 flex gap-2 flex-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSelectedNote(null); }}
                  className={`flex-1 py-1 px-2 rounded text-[12px] leading-[16px] tracking-widest uppercase font-bold transition-colors ${
                    activeTab === tab.key
                      ? 'bg-structural/30 text-accent border border-accent/30'
                      : 'text-text-secondary hover:bg-border/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-accent text-bg hover:opacity-90 text-[12px] leading-[16px] tracking-widest uppercase font-bold px-3 py-2 rounded transition-colors flex items-center gap-2 shrink-0"
            >
              <Plus size={16} /> Nueva
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {loading && <div className="text-center text-text-secondary text-sm py-8">Cargando notas...</div>}
            {!loading && notes.length === 0 && (
              <div className="text-center text-text-secondary text-sm py-8">No hay notas en esta categoría</div>
            )}
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`bg-surface rounded-lg border cursor-pointer relative overflow-hidden group transition-colors ${
                  selectedNote?.id === note.id
                    ? 'border-accent'
                    : 'border-border hover:border-text-secondary'
                }`}
              >
                {selectedNote?.id === note.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                )}
                <div className="p-4 pl-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[20px] leading-[28px] font-semibold text-white truncate pr-2">{note.supplier?.company_name || 'Proveedor'}</span>
                    <span className="font-mono text-text-secondary whitespace-nowrap">#{note.id}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-text-secondary">Entrega: {note.delivery_date}</p>
                      <p className="text-sm text-text-secondary">{note.details?.length || 0} artículos</p>
                    </div>
                    <span className={`${STATUS_CONFIG[note.status]?.className || ''} font-bold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded`}>
                      {STATUS_CONFIG[note.status]?.label || note.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 h-full overflow-hidden">
          {selectedNote ? (
            <>
              <div className="bg-surface rounded-lg border border-border p-4 shrink-0 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">{selectedNote.supplier?.company_name || 'Proveedor'}</h2>
                    <span className={`${STATUS_CONFIG[selectedNote.status]?.className || ''} font-bold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded h-fit`}>
                      {STATUS_CONFIG[selectedNote.status]?.label || selectedNote.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-text-secondary text-[13px]">
                    <span>ID: #{selectedNote.id}</span>
                    <span>Fecha: {selectedNote.delivery_date}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  {selectedNote.status === 'pending' && (
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="bg-accent text-bg hover:opacity-90 text-[12px] leading-[16px] tracking-widest uppercase font-bold px-4 py-2 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle size={18} /> {confirming ? 'Confirmando...' : 'Confirmar Recepción'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
                <div className="bg-surface rounded-lg border border-border overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-border bg-border/30">
                    <h3 className="text-[20px] leading-[28px] font-semibold text-white">Tabla de Verificación</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary border-b border-border bg-bg">
                        <tr>
                          <th className="py-2 px-4">Descripción</th>
                          <th className="py-2 px-4 text-right">Cant. Acordada</th>
                          <th className="py-2 px-4 text-right">Cant. Recibida</th>
                          <th className="py-2 px-4 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-[13px] text-white">
                        {(selectedNote.details || []).map((d) => {
                          const received = receivedQtys[d.product_id] ?? 0;
                          const matches = received === d.quantity_agreed;
                          return (
                            <tr key={d.product_id} className={`border-b border-border/50 hover:bg-border/30 transition-colors ${!matches ? 'bg-error/5' : ''}`}>
                              <td className="py-2 px-4 font-sans text-sm">{d.product?.name || `Producto #${d.product_id}`}</td>
                              <td className="py-2 px-4 text-right">{d.quantity_agreed}</td>
                              <td className="py-2 px-4 text-right">
                                <input
                                  className={`w-16 bg-bg border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 transition-all ${
                                    matches
                                      ? 'border-border focus:border-accent focus:ring-accent'
                                      : 'border-error text-error bg-error/20 focus:ring-error'
                                  }`}
                                  type="number"
                                  value={received}
                                  onChange={(e) => handleQtyChange(d.product_id, e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-4 text-center">
                                {matches ? (
                                  <Check size={20} className="text-accent mx-auto" />
                                ) : (
                                  <AlertTriangle size={20} className="text-error mx-auto" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="bg-surface rounded-lg border border-border p-4 flex flex-col">
                    <h3 className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-3">Ticket Físico</h3>
                    <div className="flex-1 border-2 border-dashed border-border rounded-lg bg-bg flex flex-col items-center justify-center p-4 hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer group">
                      <Upload size={32} className="text-text-secondary mb-2 group-hover:text-accent transition-colors" />
                      <p className="text-sm text-text-secondary text-center">Arrastra y suelta el ticket escaneado, o haz clic para subir</p>
                      <p className="font-mono text-[11px] text-text-secondary/50 mt-1">PDF, JPG, PNG (Máx 5MB)</p>
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg border border-border p-4 flex flex-col">
                    <h3 className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-3">Observaciones y Ajustes</h3>
                    <textarea
                      className="flex-1 bg-bg border border-border rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      placeholder="Anota artículos dañados, stock faltante, o comentarios del chofer..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary">Selecciona una nota para ver los detalles</div>
          )}
        </div>
      </div>

      {showForm && (
        <CreateNoteForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); fetchNotes(activeTab); }}
        />
      )}
    </div>
  );
}

function CreateNoteForm({ onClose, onCreated }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [reminders, setReminders] = useState('');
  const [productRows, setProductRows] = useState([{ product_id: '', quantity_agreed: 1, price_agreed: 0, discount: 0, is_gift: false }]);
  const [productSearch, setProductSearch] = useState('');
  const [activeRowIdx, setActiveRowIdx] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/suppliers').then((res) => setSuppliers(res.data?.data || [])).catch(() => {});
    api.get('/products').then((res) => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProducts(list);
    }).catch(() => {});
  }, []);

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return p.name?.toLowerCase().includes(q) || String(p.barcode).includes(q);
  });

  const updateRow = (idx, field, value) => {
    setProductRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const addRow = () => {
    setProductRows((prev) => [...prev, { product_id: '', quantity_agreed: 1, price_agreed: 0, discount: 0, is_gift: false }]);
  };

  const removeRow = (idx) => {
    setProductRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const selectProduct = (idx, product) => {
    updateRow(idx, 'product_id', product.id);
    updateRow(idx, 'price_agreed', Number(product.purchase_price || 0));
    setProductSearch('');
    setActiveRowIdx(null);
  };

  const totalAmount = productRows.reduce((s, r) => {
    const subtotal = (r.quantity_agreed || 0) * (r.price_agreed || 0);
    return s + subtotal - (r.discount || 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) { setError('Selecciona un proveedor'); return; }
    if (!deliveryDate) { setError('Selecciona una fecha de entrega'); return; }
    const validProducts = productRows.filter((r) => r.product_id && r.quantity_agreed > 0);
    if (validProducts.length === 0) { setError('Agrega al menos un producto'); return; }

    setError('');
    setSubmitting(true);
    try {
      await api.post('/supplier-notes', {
        supplier_id: Number(supplierId),
        total_amount: totalAmount,
        delivery_date: deliveryDate,
        reminders: reminders || null,
        products: validProducts.map((r) => ({
          product_id: Number(r.product_id),
          quantity_agreed: Number(r.quantity_agreed),
          price_agreed: Number(r.price_agreed),
          discount: Number(r.discount) || 0,
          is_gift: r.is_gift,
        })),
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear la nota');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-bg border-l border-border h-full overflow-y-auto shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="sticky top-0 z-10 bg-bg border-b border-border px-6 py-4 flex justify-between items-center">
            <h2 className="text-[24px] leading-[32px] font-semibold text-white">Nueva Nota de Proveedor</h2>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-2">Proveedor</label>
                <select
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-2">Fecha de Entrega</label>
                <input
                  type="date"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-2">Recordatorios</label>
              <textarea
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                rows={2}
                placeholder="Notas o instrucciones adicionales..."
                value={reminders}
                onChange={(e) => setReminders(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[20px] leading-[28px] font-semibold text-white">Productos</h3>
                <button
                  type="button"
                  onClick={addRow}
                  className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-accent hover:opacity-80 flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Agregar Línea
                </button>
              </div>

              <div className="space-y-3">
                {productRows.map((row, idx) => {
                  const selectedProduct = products.find((p) => p.id === Number(row.product_id));
                  const subtotal = (row.quantity_agreed || 0) * (row.price_agreed || 0) - (row.discount || 0);
                  return (
                    <div key={idx} className="bg-surface border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 relative">
                          <label className="block text-[11px] leading-[14px] tracking-widest uppercase font-bold text-text-secondary mb-1">Producto</label>
                          {activeRowIdx === idx ? (
                            <div className="bg-bg border border-accent rounded-lg p-2 max-h-48 overflow-y-auto">
                              <div className="relative mb-2">
                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                  autoFocus
                                  className="w-full bg-surface border border-border rounded pl-7 pr-3 py-1.5 text-sm text-white focus:outline-none"
                                  placeholder="Buscar..."
                                  value={productSearch}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                />
                              </div>
                              {filteredProducts.slice(0, 20).map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => selectProduct(idx, p)}
                                  className={`px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent/10 transition-colors ${p.id === Number(row.product_id) ? 'bg-accent/10 text-accent' : 'text-white'}`}
                                >
                                  {p.name}
                                  {p.barcode && <span className="text-text-secondary ml-2 font-mono text-xs">{p.barcode}</span>}
                                </div>
                              ))}
                              {filteredProducts.length === 0 && (
                                <div className="text-center text-text-secondary text-sm py-2">Sin resultados</div>
                              )}
                              <button
                                type="button"
                                onClick={() => { setActiveRowIdx(null); setProductSearch(''); }}
                                className="mt-2 w-full text-center text-xs text-text-secondary hover:text-white py-1"
                              >
                                Cerrar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setActiveRowIdx(idx); setProductSearch(''); }}
                              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-left text-white hover:border-accent transition-colors truncate"
                            >
                              {selectedProduct ? selectedProduct.name : 'Seleccionar producto...'}
                            </button>
                          )}
                        </div>

                        <div className="w-20">
                          <label className="block text-[11px] leading-[14px] tracking-widest uppercase font-bold text-text-secondary mb-1">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white text-right font-mono focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                            value={row.quantity_agreed}
                            onChange={(e) => updateRow(idx, 'quantity_agreed', parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <div className="w-28">
                          <label className="block text-[11px] leading-[14px] tracking-widest uppercase font-bold text-text-secondary mb-1">P. Unit.</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white text-right font-mono focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                            value={row.price_agreed}
                            onChange={(e) => updateRow(idx, 'price_agreed', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="w-24">
                          <label className="block text-[11px] leading-[14px] tracking-widest uppercase font-bold text-text-secondary mb-1">Desc.</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white text-right font-mono focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                            value={row.discount}
                            onChange={(e) => updateRow(idx, 'discount', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="w-20 text-right">
                          <label className="block text-[11px] leading-[14px] tracking-widest uppercase font-bold text-text-secondary mb-1">Subtotal</label>
                          <div className="font-mono text-sm text-accent py-2">{fmt(subtotal)}</div>
                        </div>

                        {productRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="mt-5 text-text-secondary hover:text-error transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.is_gift}
                          onChange={(e) => updateRow(idx, 'is_gift', e.target.checked)}
                          className="rounded border-border text-accent focus:ring-accent"
                        />
                        <span className="text-xs text-text-secondary">Es regalo (sin costo)</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-3">{error}</div>
            )}
          </div>

          <div className="sticky bottom-0 bg-bg border-t border-border px-6 py-4 flex justify-between items-center">
            <div className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">
              Total: <span className="font-mono text-[20px] leading-[28px] text-accent ml-2">{fmt(totalAmount)}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded border border-border text-text-secondary hover:text-white hover:border-text-secondary transition-colors text-[12px] leading-[16px] tracking-widest uppercase font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent text-bg hover:opacity-90 text-[12px] leading-[16px] tracking-widest uppercase font-bold px-6 py-2 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Creando...' : 'Crear Nota'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
