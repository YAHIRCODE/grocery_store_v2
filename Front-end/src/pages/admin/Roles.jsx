import { useState, useEffect } from 'react';
import { Shield, Info, Plus, X, Save, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() { await fetchRoles(); }
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre del rol es obligatorio');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const body = { name: form.name.trim(), description: form.description.trim() || null };
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, body);
      } else {
        await api.post('/roles', body);
      }
      setShowForm(false);
      setEditingRole(null);
      setForm({ name: '', description: '' });
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este rol?')) return;
    try {
      await api.delete(`/roles/${id}`);
      fetchRoles();
    } catch {
      // silently fail
    }
  };

  const handleNewRole = () => {
    setEditingRole(null);
    setForm({ name: '', description: '' });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Matriz de Permisos</h2>
          <p className="text-base text-text-secondary mt-1">Configura los accesos de cada rol por módulo.</p>
        </div>
        <button onClick={handleNewRole} className="flex items-center space-x-2 px-4 py-2 bg-accent text-bg text-[12px] leading-[16px] tracking-widest uppercase font-bold rounded transition-opacity hover:opacity-90">
          <Plus size={18} /> <span>Nuevo Rol</span>
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border px-4 pt-4">
          <h3 className="text-[20px] leading-[28px] font-semibold text-white flex items-center">
            <Shield size={20} className="text-accent mr-3" /> Roles del Sistema
          </h3>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface z-10">
              <tr>
                <th className="py-3 px-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">ID</th>
                <th className="py-3 px-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">Nombre</th>
                <th className="py-3 px-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">Descripción</th>
                <th className="py-3 px-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b border-border hover:bg-border/20 transition-colors">
                  <td className="py-3 px-3 font-mono text-text-secondary">{role.id}</td>
                  <td className="py-3 px-3 text-sm text-white font-semibold">{role.name}</td>
                  <td className="py-3 px-3 text-sm text-text-secondary">{role.description || '—'}</td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(role)} className="p-1.5 text-text-secondary hover:text-accent transition-colors" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(role.id)} className="p-1.5 text-text-secondary hover:text-error transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-text-secondary">No hay roles configurados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="py-3 mt-auto border-t border-border text-[11px] text-text-secondary font-mono px-4">
          <Info size={12} className="inline align-middle mr-1" />
          Los permisos se asignan por defecto según el rol del empleado.
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowForm(false); setEditingRole(null); setForm({ name: '', description: '' }); }} />
          <div className="absolute inset-y-0 right-0 w-full max-w-4xl bg-surface border-l border-border shadow-xl flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-[24px] leading-[32px] font-semibold text-white">{editingRole ? 'Editar' : 'Nuevo'} Rol</h2>
              <button onClick={() => { setShowForm(false); setEditingRole(null); setForm({ name: '', description: '' }); }} className="p-2 text-text-secondary hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 flex flex-col gap-6">
              {error && <div className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-3">{error}</div>}
              <div className="grid gap-4">
                <div>
                  <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Nombre del Rol</label>
                  <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Descripción</label>
                  <textarea className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe el propósito de este rol..." />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingRole(null); setForm({ name: '', description: '' }); }} className="flex-1 py-2.5 bg-surface border border-border text-white font-semibold rounded hover:bg-border/50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-accent text-bg font-semibold rounded hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save size={16} /> {saving ? 'Guardando...' : (editingRole ? 'Actualizar Rol' : 'Crear Rol')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
