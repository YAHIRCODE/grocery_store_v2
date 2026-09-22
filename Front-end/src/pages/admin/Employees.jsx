import { useState, useEffect } from 'react';
import { UserPlus, Badge, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import api from '../../services/api';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [page, setPage] = useState(1);
  const [listError, setListError] = useState('');
  const perPage = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, roleRes] = await Promise.all([
        api.get('/employees'),
        api.get('/roles'),
      ]);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      setRoles(Array.isArray(roleRes.data) ? roleRes.data : []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() { await fetchData(); }
    load();
  }, []);

  const totalPages = Math.ceil(employees.length / perPage);
  const paged = employees.slice((page - 1) * perPage, page * perPage);

  const deleteEmployee = async (id) => {
    if (!confirm('¿Eliminar este empleado?')) return;
    setListError('');
    try {
      await api.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setListError(err.response?.data?.message || 'Error al eliminar el empleado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando empleados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Administración del Sistema</h2>
          <p className="text-base text-text-secondary mt-1">Gestiona accesos de empleados y permisos operativos.</p>
        </div>
        <button
          onClick={() => { setEditingEmp(null); setShowForm(true); }}
          className="bg-accent hover:opacity-90 text-bg text-[12px] leading-[16px] tracking-widest uppercase font-bold px-4 py-2 rounded flex items-center transition-colors"
        >
          <UserPlus size={16} className="mr-2" /> Nuevo Empleado
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border px-4 pt-4">
          <h3 className="text-[20px] leading-[28px] font-semibold text-white flex items-center">
            <Badge size={20} className="text-accent mr-3" /> Directorio Activo
          </h3>
        </div>

        {listError && (
          <div className="mx-4 mb-4 text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-3">{listError}</div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface z-10">
              <tr>
                <th className="py-3 px-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">Empleado</th>
                <th className="py-3 px-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">Rol</th>
                <th className="py-3 px-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">Estado</th>
                <th className="py-3 px-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[13px]">
              {paged.map((emp) => {
                const isActive = emp.is_active !== false;
                const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`;
                const initials = `${(emp.first_name || '')[0] || ''}${(emp.last_name || '')[0] || ''}`.toUpperCase();
                const roleName = emp.user?.role?.name || emp.role || '—';
                return (
                  <tr key={emp.id} className={`hover:bg-border/30 transition-colors border-b border-border ${!isActive ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-3 flex items-center">
                      <div className={`w-8 h-8 rounded flex items-center justify-center mr-3 font-bold text-sm ${isActive ? 'bg-structural/20 border border-structural/50 text-accent' : 'bg-border border border-border text-text-secondary'}`}>
                        {initials}
                      </div>
                      <div>
                        <div className="text-white text-sm">{fullName}</div>
                        <div className="text-text-secondary text-[11px]">ID: {emp.id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">{roleName}</td>
                    <td className="py-3 px-3">
                      {isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold bg-accent/10 text-accent border border-accent/30">Activo</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold bg-error/10 text-error border border-error/30">Inactivo</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => { setEditingEmp(emp); setShowForm(true); }}
                        className="text-white hover:text-accent transition-colors text-[10px] uppercase tracking-widest font-bold border border-accent/30 px-2 py-1 rounded bg-bg mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteEmployee(emp.id)}
                        className="text-text-secondary hover:text-error transition-colors p-1"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="py-3 mt-auto border-t border-border flex justify-between items-center text-text-secondary text-[12px] font-mono px-4">
          <span>Mostrando {paged.length} de {employees.length} empleados</span>
          <div className="flex space-x-2 items-center">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="hover:text-white disabled:opacity-50"><ChevronLeft size={14} /></button>
            <span className="text-white">{page}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="hover:text-white disabled:opacity-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {showForm && (
        <EmployeeForm
          employee={editingEmp}
          roles={roles}
          onClose={() => { setShowForm(false); setEditingEmp(null); }}
          onSaved={() => { setShowForm(false); setEditingEmp(null); fetchData(); }}
        />
      )}
    </div>
  );
}

function EmployeeForm({ employee, roles, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    email: employee?.email || employee?.user?.email || '',
    payroll_id: employee?.payroll_id || '',
    hourly_rate: employee?.hourly_rate || '',
    role_id: employee?.user?.role?.id || employee?.role_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        ...form,
        hourly_rate: parseFloat(form.hourly_rate) || 0,
        role_id: parseInt(form.role_id) || null,
      };
      if (employee) {
        await api.put(`/employees/${employee.id}`, body);
        onSaved();
      } else {
        const res = await api.post('/employees', body);
        if (res.data?.temporary_password) {
          setTempPassword(res.data.temporary_password);
        } else {
          onSaved();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el empleado');
    } finally {
      setSaving(false);
    }
  };

  const fullName = `${form.first_name} ${form.last_name}`.trim();

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
  };

  if (tempPassword) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-xl flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-[24px] leading-[32px] font-semibold text-white">Empleado Creado</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-4 font-bold text-2xl text-accent">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-white text-lg font-semibold">{fullName}</h3>
              <p className="text-text-secondary text-sm mt-1">Se ha generado una contraseña temporal</p>
            </div>
            <div className="bg-bg border border-border rounded p-4">
              <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-2">Contraseña Temporal</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none"
                  type="text"
                  value={tempPassword}
                  readOnly
                />
                <button
                  type="button"
                  onClick={copyPassword}
                  className="px-4 py-2.5 bg-accent text-bg font-semibold rounded hover:opacity-90 transition-colors whitespace-nowrap"
                >
                  Copiar
                </button>
              </div>
              <p className="text-text-secondary text-[11px] mt-2">Guarda esta contraseña. No se volverá a mostrar.</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { onSaved(); setTempPassword(''); }}
                className="flex-1 py-2.5 bg-accent text-bg font-semibold rounded hover:opacity-90 transition-colors"
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-xl flex flex-col">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-[24px] leading-[32px] font-semibold text-white">{employee ? 'Editar' : 'Nuevo'} Empleado</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">ID Nómina</label>
              <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none" value={form.payroll_id} onChange={(e) => handleChange('payroll_id', e.target.value)} required />
            </div>
            <div>
              <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Tarifa Horaria</label>
              <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none" type="number" step="0.01" value={form.hourly_rate} onChange={(e) => handleChange('hourly_rate', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Rol</label>
            <select className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.role_id} onChange={(e) => handleChange('role_id', e.target.value)} required>
              <option value="">Seleccionar rol...</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
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
