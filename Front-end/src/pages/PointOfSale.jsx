import { useState, useEffect, useCallback } from 'react';
import {
  Search, Bell, Settings, Minus, Plus, Trash2, User,
  Banknote, CreditCard, Split, CheckCircle, ShoppingBasket, Calendar,
} from 'lucide-react';
import api from '../services/api';

const fmt = (n) => `$ ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function PointOfSale() {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [clientName, setClientName] = useState('Público en General');
  const [submitting, setSubmitting] = useState(false);
  const [saleMessage, setSaleMessage] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);

  useEffect(() => {
    api.get('/clients')
      .then((res) => setClients(res.data?.data || []))
      .catch(() => {});
  }, []);

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    const full = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    return full.includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  const selectClient = (c) => {
    setClientId(c.id);
    setClientName(`${c.first_name} ${c.last_name}`);
    setShowClientPicker(false);
    setClientSearch('');
  };

  const clearClient = () => {
    setClientId(null);
    setClientName('Público en General');
  };

  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/products');
      const all = Array.isArray(res.data) ? res.data : [];
      const q = query.toLowerCase();
      const filtered = all.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
      setSearchResults(filtered.slice(0, 8));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        barcode: product.barcode || '',
        price: product.price,
        qty: 1,
      }];
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultDue = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  useEffect(() => {
    if (paymentMethod === 'credit' && !dueDate) setDueDate(defaultDue);
  }, [paymentMethod]);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'credit' && !clientId) {
      setSaleMessage('Selecciona un cliente para venta a crédito');
      return;
    }
    setSubmitting(true);
    setSaleMessage('');
    try {
      const payload = {
        products: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.qty,
        })),
        payment_method: paymentMethod,
        cash_amount: paymentMethod === 'cash' || paymentMethod === 'mixed' ? parseFloat(cashAmount) || 0 : 0,
        card_amount: paymentMethod === 'card' || paymentMethod === 'mixed' ? parseFloat(cardAmount) || 0 : 0,
      };
      if (clientId) payload.client_id = clientId;
      const res = await api.post('/sales', payload);
      const saleGroupId = res.data.sale_group_id;

      if (paymentMethod === 'credit' && clientId) {
        await api.post('/client-debts', {
          client_id: clientId,
          sale_group_id: saleGroupId,
          start_date: todayStr,
          due_date: dueDate || defaultDue,
          balance_due: res.data.total,
          original_amount: res.data.total,
          status: 'pending',
        });
      }

      setSaleMessage(paymentMethod === 'credit'
        ? `Venta a crédito registrada. Deuda hasta: ${dueDate || defaultDue}`
        : `Venta registrada. Cambio: ${fmt(res.data.change_amount)}`);
      setCart([]);
      setCashAmount('');
      setCardAmount('');
      setCardRef('');
      setDueDate('');
      setTimeout(() => setSaleMessage(''), 5000);
    } catch (err) {
      setSaleMessage(err.response?.data?.message || 'Error al registrar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="w-full h-16 bg-surface border-b border-border flex justify-between items-center px-8 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-[24px] leading-[32px] font-bold text-accent">Abarrotes Katy</h2>
        </div>
        <div className="flex-1 max-w-xl mx-8 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            autoFocus
            className="w-full bg-bg border border-accent/50 rounded pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-secondary shadow-[0_0_10px_rgba(139,242,230,0.1)]"
            placeholder="Escanear Código de Barras o Buscar Producto..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-border/50 transition-colors text-left"
                >
                  <div>
                    <div className="text-sm text-white font-semibold">{p.name}</div>
                    <div className="text-[11px] text-text-secondary font-mono">{p.barcode || p.sku}</div>
                  </div>
                  <span className="font-mono text-accent text-sm">{fmt(p.price)}</span>
                </button>
              ))}
              {searching && <div className="px-4 py-2 text-text-secondary text-sm">Buscando...</div>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full text-text-secondary hover:bg-border hover:text-white transition-colors">
            <Bell size={20} />
          </button>
          <button className="p-2 rounded-full text-text-secondary hover:bg-border hover:text-white transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <div className="flex-1 bg-surface border border-border rounded-lg flex flex-col overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-3 border-b border-border bg-surface z-10">
            <div className="w-12" />
            <div className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Producto</div>
            <div className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary w-24 text-center">Cant.</div>
            <div className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary w-24 text-right">Precio</div>
            <div className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary w-24 text-right">Total</div>
          </div>

          <div className="flex-1 overflow-y-auto bg-bg z-10">
            {cart.map((item) => (
              <div key={item.product_id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-3 border-b border-border items-center hover:bg-surface transition-colors group relative">
                <div className="w-12 h-12 bg-border rounded flex items-center justify-center">
                  <ShoppingBasket size={20} className="text-accent" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-white font-semibold">{item.name}</span>
                  <span className="font-mono text-[11px] text-text-secondary">BAR: {item.barcode}</span>
                </div>
                <div className="w-24 flex items-center justify-center gap-2">
                  <button
                    onClick={() => updateQty(item.product_id, -1)}
                    className="w-6 h-6 rounded bg-border flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent border border-transparent transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-mono w-6 text-center text-white">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.product_id, 1)}
                    className="w-6 h-6 rounded bg-border flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent border border-transparent transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="w-24 text-right font-mono text-text-secondary">{fmt(item.price)}</div>
                <div className="w-24 text-right font-mono text-white">{fmt(item.price * item.qty)}</div>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="absolute right-4 opacity-0 group-hover:opacity-100 p-1 text-error hover:bg-error/10 rounded transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                El carrito está vacío
              </div>
            )}
          </div>
        </div>

        <div className="w-[360px] bg-surface border border-border rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface relative">
            <div className="flex items-center gap-3">
              <User size={20} className="text-accent" />
              <button
                onClick={() => setShowClientPicker(!showClientPicker)}
                className="text-sm text-white hover:text-accent transition-colors text-left"
              >
                {clientName}
              </button>
              {clientId && (
                <button onClick={clearClient} className="text-text-secondary hover:text-error transition-colors" title="Quitar cliente">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {showClientPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-hidden">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      autoFocus
                      className="w-full bg-bg border border-border rounded pl-7 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent"
                      placeholder="Buscar cliente..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <button
                    onClick={clearClient}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-border/50 transition-colors text-text-secondary"
                  >
                    Público en General
                  </button>
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectClient(c)}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-border/50 transition-colors ${c.id === clientId ? 'text-accent bg-accent/10' : 'text-white'}`}
                    >
                      <div>{c.first_name} {c.last_name}</div>
                      {c.phone && <div className="text-[11px] text-text-secondary font-mono">{c.phone}</div>}
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="px-3 py-2 text-sm text-text-secondary text-center">Sin resultados</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col gap-3 flex-1 bg-bg">
            <div className="flex justify-between items-center text-text-secondary">
              <span className="text-sm">Subtotal</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span className="text-sm">Descuento</span>
              <span className="font-mono text-accent">-$ 0.00</span>
            </div>
            <div className="mt-auto pt-4 border-t border-border">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Total a Pagar</span>
                <span className="text-[32px] leading-[40px] tracking-tight font-bold text-accent font-mono">{fmt(subtotal)}</span>
              </div>
              <div className="text-right font-mono text-[11px] text-text-secondary">{totalItems} Artículos</div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-surface flex flex-col gap-4">
            <div className="flex gap-2">
              {[
                { key: 'cash', label: 'Efectivo', icon: Banknote },
                { key: 'card', label: 'Tarjeta', icon: CreditCard },
                { key: 'mixed', label: 'Mixto', icon: Split },
                { key: 'credit', label: 'Crédito', icon: Calendar },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className={`flex-1 py-2 border rounded text-[12px] leading-[16px] tracking-widest uppercase font-bold transition-colors flex flex-col items-center gap-1 ${
                    paymentMethod === m.key
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-bg text-text-secondary hover:border-accent hover:text-accent'
                  }`}
                >
                  <m.icon size={20} /> {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'credit' && (
              <div className="flex flex-col gap-3 p-3 bg-bg border border-border rounded">
                {!clientId && (
                  <div className="text-xs text-error font-medium">Selecciona un cliente para venta a crédito</div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-text-secondary">Fecha de Pago</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="date"
                      className="w-full bg-surface border border-border rounded pl-7 pr-2 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-accent"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={todayStr}
                    />
                  </div>
                  <p className="text-[10px] text-text-secondary">Fecha límite para que el cliente liquide su deuda.</p>
                </div>
              </div>
            )}

            {paymentMethod === 'mixed' && (
              <div className="flex gap-3 p-3 bg-bg border border-border rounded">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-text-secondary">Monto Efectivo</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary font-mono">$</span>
                    <input
                      className="w-full bg-surface border border-border rounded pl-6 pr-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-accent"
                      placeholder="0.00"
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-text-secondary">Monto Tarjeta</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary font-mono">$</span>
                    <input
                      className="w-full bg-surface border border-border rounded pl-6 pr-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-accent"
                      placeholder="0.00"
                      type="number"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="p-3 bg-bg border border-border rounded">
                <label className="text-[10px] font-bold tracking-widest uppercase text-text-secondary">Monto Recibido</label>
                <div className="relative mt-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary font-mono">$</span>
                  <input
                    className="w-full bg-surface border border-border rounded pl-6 pr-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-accent"
                    placeholder="0.00"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-3 bg-bg border border-border rounded">
                <label className="text-[10px] font-bold tracking-widest uppercase text-text-secondary">Referencia / Folio</label>
                <input
                  className="w-full bg-surface border border-border rounded px-3 py-1 text-sm font-mono text-white focus:outline-none focus:border-accent mt-1"
                  placeholder="Ej: 123456"
                  type="text"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                />
              </div>
            )}

            {saleMessage && (
              <div className={`text-sm text-center py-1 rounded ${saleMessage.includes('Error') ? 'text-error' : 'text-accent'}`}>
                {saleMessage}
              </div>
            )}

            <button
              onClick={handleFinalizeSale}
              disabled={submitting || cart.length === 0 || (paymentMethod === 'credit' && !clientId)}
              className="w-full h-14 bg-accent text-bg rounded-lg text-[20px] leading-[28px] font-semibold hover:opacity-90 transition-colors shadow-[0_0_15px_rgba(139,242,230,0.1)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle size={22} /> {submitting ? 'Procesando...' : paymentMethod === 'credit' ? 'Registrar Crédito' : 'Finalizar Venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
