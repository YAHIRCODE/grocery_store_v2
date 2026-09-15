import { useState, useEffect } from 'react';
import { Download, Plus, CheckCircle, Shield, X } from 'lucide-react';
import api from '../services/api';

export default function Fund() {
  const [fund, setFund] = useState(null);
  const [suppliersPending, setSuppliersPending] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [securityAlert, setSecurityAlert] = useState(true);
  const [showExtract, setShowExtract] = useState(false);
  const [extractAmount, setExtractAmount] = useState('');
  const [extractReason, setExtractReason] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  const fetchFund = async () => {
    setLoading(true);
    try {
      const res = await api.get('/provider-funds');
      const data = res.data;
      const funds = data.data || [];
      setFund(funds[0] || null);
      setSuppliersPending(data.suppliers_pending || []);
      setMovements(data.movements || []);
    } catch {
      setFund(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() { await fetchFund(); }
    load();
  }, []);

  const handleExtract = async () => {
    if (!fund || !extractAmount) return;
    setExtracting(true);
    setExtractError('');
    try {
      await api.post(`/provider-funds/${fund.id}/extract`, {
        amount: parseFloat(extractAmount),
        reason: extractReason || null,
      });
      setShowExtract(false);
      setExtractAmount('');
      setExtractReason('');
      fetchFund();
    } catch (err) {
      setExtractError(err.response?.data?.message || 'Error al realizar la extracción');
    } finally {
      setExtracting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando fondo...</div>
      </div>
    );
  }

  const balance = fund?.available_balance || 0;
  const dailyLimit = fund?.extraction_limit || 0;
  const definedAmount = fund?.defined_amount || 0;
  const usagePct = definedAmount > 0 ? Math.min(100, ((definedAmount - balance) / definedAmount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Fondo de Pago a Proveedores</h2>
          <p className="text-base text-text-secondary mt-1">Gestiona asignaciones diarias y rastrea desembolsos.</p>
        </div>
        <div className="flex space-x-3">
          <a
            href="http://localhost:8000/api/reportes/dashboard/csv"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-border text-white text-[12px] leading-[16px] tracking-widest uppercase font-bold rounded hover:border-accent hover:text-accent transition-colors flex items-center"
          >
            <Download size={18} className="mr-2" /> Exportar Reporte
          </a>
          <button
            onClick={() => { setExtractError(''); setShowExtract(true); }}
            className="px-4 py-2 bg-accent text-bg text-[12px] leading-[16px] tracking-widest uppercase font-bold rounded hover:opacity-90 transition-colors flex items-center font-bold"
          >
            <Plus size={18} className="mr-2" /> Nueva Transferencia
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 bg-surface border border-border rounded-lg p-6 flex flex-col justify-between relative overflow-hidden group hover:border-accent transition-colors duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary flex items-center">
              <span className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" /> Saldo Disponible
            </span>
            <div className="px-3 py-1 border border-accent/30 bg-accent/10 rounded text-accent text-[12px] leading-[16px] tracking-widest uppercase font-bold flex items-center">
              <CheckCircle size={16} className="mr-1" /> Estado Normal
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-baseline space-x-1 mb-2">
              <span className="text-[48px] leading-tight font-bold text-white tracking-tight">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-lg p-4 flex-1 hover:border-text-secondary transition-colors">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Límite Diario de Retiro</span>
            </div>
            <div className="font-mono text-[24px] font-bold text-white mb-2">${dailyLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="w-full bg-border rounded-full h-1.5 mb-1 overflow-hidden">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: `${usagePct}%` }} />
            </div>
            <div className="flex justify-between font-mono text-[11px] text-text-secondary">
              <span>${(definedAmount - balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} Usado</span>
              <span>${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} Restante</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between hover:border-text-secondary transition-colors">
            <div>
              <div className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-1 flex items-center">
                <Shield size={16} className="mr-1" /> Alerta de Extracciones
              </div>
              <div className="text-[13px] text-text-secondary">Requiere 2FA para montos &gt;$10k</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securityAlert}
                onChange={(e) => setSecurityAlert(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-bg">
          <h3 className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Proveedores con Deuda Pendiente</h3>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-border/50">
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Proveedor</th>
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-right">Deuda Pendiente</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[13px] divide-y divide-border/50">
              {(suppliersPending || []).map((s, i) => (
                <tr key={s.id || i} className="hover:bg-border/30 transition-colors">
                  <td className="py-4 px-4 text-white">{s.company_name || s.name}</td>
                  <td className="py-4 px-4 text-right text-error">${(s.debts_sum_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {(!suppliersPending || suppliersPending.length === 0) && (
                <tr><td colSpan={2} className="py-6 text-center text-text-secondary">No hay proveedores con deuda pendiente</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-bg">
          <h3 className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Movimientos Recientes</h3>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-border/50">
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Fecha</th>
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Tipo</th>
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-right">Monto</th>
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Empleado</th>
                <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Motivo</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[13px] divide-y divide-border/50">
              {(movements || []).map((m, i) => (
                <tr key={m.id || i} className="hover:bg-border/30 transition-colors">
                  <td className="py-4 px-4 text-text-secondary">{m.created_at ? new Date(m.created_at).toLocaleString('es-MX') : '-'}</td>
                  <td className="py-4 px-4 text-white">{m.type}</td>
                  <td className="py-4 px-4 text-right text-white">${Number(m.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-4 text-white">{m.employee ? `${m.employee.first_name || ''} ${m.employee.last_name || ''}`.trim() : '-'}</td>
                  <td className="py-4 px-4 text-text-secondary">{m.reason || '-'}</td>
                </tr>
              ))}
              {(!movements || movements.length === 0) && (
                <tr><td colSpan={5} className="py-6 text-center text-text-secondary">No hay movimientos recientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showExtract && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExtract(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-surface border-l border-border shadow-xl flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-[24px] leading-[32px] font-semibold text-white">Nueva Extracción</h2>
              <button onClick={() => setShowExtract(false)} className="p-2 text-text-secondary hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Monto</label>
                <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none" type="number" step="0.01" value={extractAmount} onChange={(e) => setExtractAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Motivo</label>
                <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={extractReason} onChange={(e) => setExtractReason(e.target.value)} placeholder="Motivo de la extracción..." />
              </div>
              {extractError && <div className="text-sm text-error">{extractError}</div>}
            </div>
            <div className="p-6 border-t border-border bg-border/30 flex gap-3">
              <button onClick={() => setShowExtract(false)} className="flex-1 py-2.5 bg-surface border border-border text-white font-semibold rounded hover:bg-border/50 transition-colors">Cancelar</button>
              <button onClick={handleExtract} disabled={extracting || !extractAmount} className="flex-1 py-2.5 bg-accent text-bg font-semibold rounded hover:opacity-90 transition-colors disabled:opacity-50">{extracting ? 'Extrayendo...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
