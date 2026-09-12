import { useState, useEffect } from 'react';
import { Plus, X, Calendar, DollarSign } from 'lucide-react';
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
  const [showForm, setShowForm] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ supplier_id: '', amount: '', due_date: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/supplier-debts')
      .then((res) => setDebts(res.data?.data || []))
      .catch(() => setDebts([]))
      .finally(() => setLoading(false));
    
    api.get('/suppliers')
      .then((res) => setSuppliers(res.data?.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id || !form.amount || !form.due_date) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.post('/supplier-debts', {
        supplier_id: Number(form.supplier_id),
        amount: Number(form.amount),
        due_date: form.due_date,
        description: form.description || null,
      });
      setForm({ supplier_id: '', amount: '', due_date: '', description: '' });
      setShowForm(false);
      const res = await api.get('/supplier-debts');
      setDebts(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar la deuda');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-text-secondary text-sm">Cargando deudas...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[24px] leading-[32px] font-semibold text-white">Deudas de Proveedores</h2>
          <p className="text-sm text-text-secondary mt-1">Historial de adeudos con proveedores.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-bg text-[12px] leading-[16px] tracking-widest uppercase font-bold rounded transition-opacity hover:opacity-90"
        >
          <Plus size={18} />
          <span>Nueva Deuda</span>
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg/50">
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Proveedor</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-right">Monto</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Estado</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Vencimiento</th>
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
                  <td className="py-4 px-4 text-text-secondary font-mono">{d.due_date}</td>
                </tr>
              );
            })}
            {debts.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-text-secondary">No hay deudas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-surface border-l border-border shadow-xl flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-[24px] leading-[32px] font-semibold text-white">Registrar Nueva Deuda</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-text-secondary hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {error && <div className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-3">{error}</div>}
              <div>
                <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Proveedor</label>
                <select className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.supplier_id} onChange={(e) => handleChange('supplier_id', e.target.value)} required>
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Monto</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input type="number" step="0.01" min="0" className="w-full bg-bg border border-border rounded px-10 py-2.5 text-sm text-white text-right focus:border-accent outline-none" value={form.amount} onChange={(e) => handleChange('amount', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Fecha de Vencimiento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input type="date" className="w-full bg-bg border border-border rounded px-10 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.due_date} onChange={(e) => handleChange('due_date', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Descripción (opcional)</label>
                <textarea className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none resize-none" rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Detalles de la deuda..." />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-surface border border-border text-white font-semibold rounded hover:bg-border/50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-accent text-bg font-semibold rounded hover:opacity-90 transition-colors disabled:opacity-50">{saving ? 'Guardando...' : 'Registrar Deuda'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
