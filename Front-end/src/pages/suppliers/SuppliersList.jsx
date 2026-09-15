import { useState, useEffect } from 'react';
import { TrendingUp, Plus, MoreVertical, X } from 'lucide-react';
import api from '../../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data?.data || []);
    } catch {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() { await fetchSuppliers(); }
    load();
  }, []);

  const filtered = suppliers.filter((s) =>
    s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebt = suppliers.reduce((s, sup) => s + (sup.debts_sum_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="col-span-12 lg:col-span-4 bg-surface border border-border rounded-lg p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div>
              <h3 className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-2">Total Deuda a Proveedores</h3>
              <p className="text-[32px] leading-[40px] tracking-tight font-bold font-mono text-white mt-1">{fmt(totalDebt)}</p>
            </div>
            {totalDebt > 0 && (
              <div className="bg-error/10 border border-error rounded px-2 py-1 flex items-center space-x-1">
                <TrendingUp size={14} className="text-error" />
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col justify-end items-end space-y-3">
          <div className="flex space-x-3 w-full lg:w-auto">
            <button
              onClick={() => { setEditingSupplier(null); setShowForm(true); }}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-accent text-bg text-[12px] leading-[16px] tracking-widest uppercase font-bold rounded transition-opacity hover:opacity-90"
            >
              <Plus size={18} />
              <span>Nuevo Proveedor</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary w-1/4">Nombre</th>
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary w-1/5">Contacto</th>
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary w-1/6">Teléfono</th>
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary w-1/6 text-right">Deuda Actual</th>
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary w-12 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((supplier) => {
                const debt = supplier.debts_sum_amount || 0;
                const initials = (supplier.company_name || '?').slice(0, 1).toUpperCase();
                return (
                  <tr key={supplier.id} className="border-b border-border bg-surface hover:bg-border/50 transition-colors cursor-pointer group">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-border flex items-center justify-center text-accent font-bold text-sm">{initials}</div>
                        <span className="text-[20px] leading-[28px] font-semibold text-white group-hover:text-accent transition-colors">{supplier.company_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{supplier.contact_name}</td>
                    <td className="py-3 px-4 font-mono text-[13px] text-text-secondary">{supplier.phone || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono text-[13px]">
                      {debt > 0 ? (
                        <span className="text-error">{fmt(debt)}</span>
                      ) : (
                        <span className="text-white">{fmt(0)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingSupplier(supplier); setShowForm(true); }}
                        className="text-text-secondary hover:text-accent transition-colors p-1 mr-1"
                      ><MoreVertical size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border bg-bg flex justify-between items-center text-text-secondary text-sm">
          <span>Mostrando {filtered.length} de {suppliers.length} registros</span>
        </div>
      </div>

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onClose={() => { setShowForm(false); setEditingSupplier(null); }}
          onSaved={() => { setShowForm(false); setEditingSupplier(null); fetchSuppliers(); }}
        />
      )}
    </div>
  );
}

function SupplierForm({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_name: supplier?.company_name || '',
    contact_name: supplier?.contact_name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form, email: form.email || null };
      if (supplier) {
        await api.put(`/suppliers/${supplier.id}`, body);
      } else {
        await api.post('/suppliers', body);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el proveedor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-xl flex flex-col">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-[24px] leading-[32px] font-semibold text-white">{supplier ? 'Editar' : 'Nuevo'} Proveedor</h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Nombre de Empresa</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.company_name} onChange={(e) => handleChange('company_name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Nombre de Contacto</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.contact_name} onChange={(e) => handleChange('contact_name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Teléfono</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Email</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
          </div>
          {error && <div className="text-sm text-error">{error}</div>}
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface border border-border text-white font-semibold rounded hover:bg-border/50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-accent text-bg font-semibold rounded hover:opacity-90 transition-colors disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
