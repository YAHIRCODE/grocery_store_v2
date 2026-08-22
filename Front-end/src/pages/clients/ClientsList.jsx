import { useState, useEffect } from 'react';
import {
  Landmark, AlertTriangle, Users, TrendingUp, AlertCircle,
  Filter, Plus, MoreVertical, ChevronLeft, ChevronRight, CreditCard, Pencil,
  X,
} from 'lucide-react';
import api from '../../services/api';

const STATUS = {
  good: { label: 'Al Corriente', className: 'bg-accent/10 text-accent border border-accent/30' },
  overdue: { label: 'Vencido', className: 'bg-error/10 text-error border border-error/30' },
  review: { label: 'Revisión Pendiente', className: 'bg-border text-text-secondary border border-text-secondary/30' },
};

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const getClientStatus = (client) => {
  const outstanding = client.outstanding_debt || 0;
  if (outstanding > 0) return 'overdue';
  return 'good';
};

export default function ClientsList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients');
      const list = res.data?.data || [];
      setClients(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter((c) => {
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || c.email?.toLowerCase().includes(q) || String(c.id).includes(q);
  });

  const totalCredit = clients.reduce((s, c) => s + (c.credit_limit || 0), 0);
  const totalOutstanding = clients.reduce((s, c) => s + (c.outstanding_debt || 0), 0);
  const overdueCount = clients.filter((c) => getClientStatus(c) === 'overdue').length;

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Crédito Total Activo</span>
            <Landmark size={20} className="text-text-secondary" />
          </div>
          <div>
            <div className="text-[32px] leading-[40px] tracking-tight font-bold text-accent font-mono">{fmt(totalCredit)}</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-error">Saldo Vencido</span>
            <AlertTriangle size={20} className="text-error" />
          </div>
          <div>
            <div className="text-[32px] leading-[40px] tracking-tight font-bold text-error font-mono">{fmt(totalOutstanding)}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-error/10 border border-error/30 text-error px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                <AlertCircle size={12} /> {overdueCount} Cuentas
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Clientes Activos</span>
            <Users size={20} className="text-text-secondary" />
          </div>
          <div>
            <div className="text-[32px] leading-[40px] tracking-tight font-bold text-white font-mono">{clients.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-lg flex flex-col h-full min-h-[500px]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-bg rounded-t-lg">
              <h3 className="text-[20px] leading-[28px] font-semibold text-white">Directorio de Clientes</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => { setEditingClient(null); setShowForm(true); }}
                  className="bg-accent text-bg px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-colors"
                >
                  <Plus size={16} /> Nuevo Cliente
                </button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Cliente / ID</th>
                    <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Estado</th>
                    <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-right">Límite</th>
                    <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-right">Pendiente</th>
                    <th className="p-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border">
                  {filtered.map((c) => {
                    const status = getClientStatus(c);
                    const fullName = `${c.first_name || ''} ${c.last_name || ''}`;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className={`hover:bg-border/50 cursor-pointer transition-colors ${
                          selected?.id === c.id ? 'bg-border/50 border-l-2 border-accent' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className={`font-semibold ${selected?.id === c.id ? 'text-accent' : 'text-white'}`}>{fullName}</div>
                          <div className="text-xs text-text-secondary font-mono mt-0.5">ID: {c.id}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS[status]?.className || ''}`}>
                            {STATUS[status]?.label || status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">{fmt(c.credit_limit)}</td>
                        <td className={`p-3 text-right font-mono ${(c.outstanding_debt || 0) > 0 ? 'text-error' : 'text-white'}`}>{fmt(c.outstanding_debt)}</td>
                        <td className="p-3 text-center text-text-secondary">
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="hover:text-error transition-colors"><MoreVertical size={18} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-border flex justify-between items-center text-xs text-text-secondary">
              <span>Mostrando {filtered.length} de {clients.length} clientes</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {selected && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-[24px] leading-[32px] font-semibold text-accent">{selected.first_name} {selected.last_name}</h4>
                  <p className="text-sm text-text-secondary font-mono mt-1">ID: {selected.id} • {selected.email}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${STATUS[getClientStatus(selected)]?.className || ''}`}>
                  {STATUS[getClientStatus(selected)]?.label || ''}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-bg p-3 rounded border border-border">
                  <p className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-1">Límite de Crédito</p>
                  <p className="text-[20px] leading-[28px] font-semibold text-white font-mono">{fmt(selected.credit_limit)}</p>
                </div>
                <div className="bg-bg p-3 rounded border border-border">
                  <p className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-1">Saldo Pendiente</p>
                  <p className="text-[20px] leading-[28px] font-semibold text-accent font-mono">{fmt(selected.outstanding_debt)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingClient(selected); setShowForm(true); }}
                  className="flex-1 p-2 border border-border text-text-secondary rounded flex justify-center items-center hover:border-accent hover:text-accent transition-colors"
                >
                  <Pencil size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
          onSaved={() => { setShowForm(false); setEditingClient(null); fetchClients(); }}
        />
      )}
    </div>
  );
}

function ClientForm({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: client?.first_name || '',
    last_name: client?.last_name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    credit_limit: client?.credit_limit || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, credit_limit: parseFloat(form.credit_limit) || 0 };
      if (client) {
        await api.put(`/clients/${client.id}`, body);
      } else {
        await api.post('/clients', body);
      }
      onSaved();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-xl flex flex-col">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-[24px] leading-[32px] font-semibold text-white">{client ? 'Editar' : 'Nuevo'} Cliente</h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Nombre</label>
              <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Apellido</label>
              <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Email</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Teléfono</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required />
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Límite de Crédito</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none" type="number" step="0.01" value={form.credit_limit} onChange={(e) => handleChange('credit_limit', e.target.value)} />
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface border border-border text-white font-semibold rounded hover:bg-border/50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-accent text-bg font-semibold rounded hover:opacity-90 transition-colors disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
