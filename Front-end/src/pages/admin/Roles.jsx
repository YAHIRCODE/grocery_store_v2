import { useState, useEffect } from 'react';
import { Shield, Info } from 'lucide-react';
import api from '../../services/api';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/roles')
      .then((res) => setRoles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, []);

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
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b border-border hover:bg-border/20 transition-colors">
                  <td className="py-3 px-3 font-mono text-text-secondary">{role.id}</td>
                  <td className="py-3 px-3 text-sm text-white font-semibold">{role.name}</td>
                  <td className="py-3 px-3 text-sm text-text-secondary">{role.description || '—'}</td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-text-secondary">No hay roles configurados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="py-3 mt-auto border-t border-border text-[11px] text-text-secondary font-mono px-4">
          <Info size={12} className="inline align-middle mr-1" />
          Los permisos se asignan por defecto según el rol del empleado.
        </div>
      </div>
    </div>
  );
}
