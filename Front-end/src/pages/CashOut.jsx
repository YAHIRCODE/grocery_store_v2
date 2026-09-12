import { useState, useEffect } from 'react';
import { Banknote, CreditCard, Clock, DollarSign } from 'lucide-react';
import api from '../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function CashOut() {
  const [register, setRegister] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counted, setCounted] = useState('');
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState('');
  const [noActiveMsg, setNoActiveMsg] = useState('');

  useEffect(() => {
    api.get('/cash-registers/active')
      .then((res) => {
        const data = res.data;
        const reg = data?.data;
        if (reg && reg.id) {
          setRegister(reg);
          setCounted('');
        } else {
          setRegister(null);
          setNoActiveMsg(data?.message || 'No hay turno activo');
        }
      })
      .catch(() => {
        setRegister(null);
        setNoActiveMsg('No se pudo verificar el turno');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando turno activo...</div>
      </div>
    );
  }

  if (!register) {
    return <OpenTurn initialMessage={noActiveMsg} />;
  }

  const openingCash = register.opening_cash || 0;
  const cashSales = register.total_efectivo_ventas || 0;
  const cardSales = register.total_tarjeta_ventas || 0;
  const expectedCash = openingCash + cashSales;
  const countedNum = parseFloat(counted) || 0;
  const difference = countedNum - expectedCash;

  const handleClose = async () => {
    setClosing(true);
    setMessage('');
    try {
      const res = await api.post(`/cash-registers/${register.id}/close`, {
        closed_cash: countedNum,
      });
      const data = res.data;
      setMessage(`Turno cerrado. Diferencia: ${fmt(data.diferencia)}`);
      setRegister({ ...register, closed_at: new Date().toISOString() });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error al cerrar el turno');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b border-border pb-3">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Corte de Caja</h2>
          <p className="text-sm text-text-secondary mt-1">Gestión de flujo de efectivo y cierre de turno.</p>
        </div>
        <div className="flex items-center space-x-3">
          {!register.closed_at ? (
            <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[12px] leading-[16px] tracking-widest uppercase font-bold flex items-center">
              <span className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" /> Turno Abierto
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-error/10 border border-error/20 text-error text-[12px] leading-[16px] tracking-widest uppercase font-bold">
              Turno Cerrado
            </span>
          )}
          <span className="font-mono text-text-secondary">ID: #{register.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Monto Inicial</span>
            <Banknote size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{fmt(openingCash)}</div>
          <div className="text-sm text-text-secondary mt-1">Fondo de caja establecido.</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Ventas en Efectivo</span>
            <DollarSign size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{fmt(cashSales)}</div>
          <div className="text-sm text-text-secondary mt-1">Registrado en sistema.</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Ventas en Tarjeta</span>
            <CreditCard size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{fmt(cardSales)}</div>
          <div className="text-sm text-text-secondary mt-1">Terminales bancarias.</div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border bg-border/30">
          <h3 className="text-[24px] leading-[32px] font-semibold text-white">Proceso de Cierre</h3>
          <p className="text-sm text-text-secondary mt-1">Ingrese los montos contados físicamente en caja para validar el corte.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 border-b border-border pb-3 mb-3 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">
            <div>Concepto</div>
            <div className="text-right">Esperado (Sistema)</div>
            <div className="text-right">Contado (Físico)</div>
            <div className="text-right">Diferencia</div>
          </div>

          <div className="grid grid-cols-4 gap-4 items-center py-3 border-b border-border/50">
            <div className="text-white font-semibold flex items-center">
              <DollarSign size={16} className="mr-2 text-text-secondary" />
              Efectivo Contado
            </div>
            <div className="text-right font-mono text-text-secondary">{fmt(expectedCash)}</div>
            <div className="text-right">
              <div className="inline-flex items-center bg-bg border border-border rounded px-3 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                <span className="text-text-secondary mr-1">$</span>
                <input
                  className="bg-transparent border-none text-white text-right p-0 focus:ring-0 font-mono w-24"
                  type="number"
                  value={counted}
                  onChange={(e) => setCounted(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className={`text-right font-mono ${difference === 0 ? 'text-accent' : difference > 0 ? 'text-accent' : 'text-error'}`}>
              {difference === 0 ? '$0.00' : `${difference > 0 ? '+' : ''}$${Math.abs(difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </div>
          </div>

          {message && (
            <div className={`text-sm text-center py-2 mt-4 rounded ${message.includes('Error') ? 'text-error' : 'text-accent'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-end mt-8 pt-6 border-t border-border">
            <button
              onClick={handleClose}
              disabled={closing || !!register.closed_at}
              className="bg-accent text-bg text-[24px] leading-[32px] font-semibold py-3 px-8 rounded-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-[0_0_15px_rgba(139,242,230,0.15)] flex items-center space-x-3 disabled:opacity-50"
            >
              <Clock size={22} />
              <span>{closing ? 'Cerrando...' : register.closed_at ? 'Turno Cerrado' : 'Cerrar Turno'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpenTurn({ initialMessage }) {
  const [openingCash, setOpeningCash] = useState('');
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleOpen = async (e) => {
    e.preventDefault();
    const amount = parseFloat(openingCash);
    if (!amount || amount <= 0) {
      setError('Ingrese un monto válido');
      return;
    }
    setOpening(true);
    setError('');
    setMessage('');
    try {
      await api.post('/cash-registers/open', { opening_cash: amount });
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al abrir el turno');
      setOpening(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b border-border pb-3">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Corte de Caja</h2>
          <p className="text-sm text-text-secondary mt-1">Gestión de flujo de efectivo y cierre de turno.</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-error/10 border border-error/20 text-error text-[12px] leading-[16px] tracking-widest uppercase font-bold">
          Sin Turno Activo
        </span>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border bg-border/30">
          <h3 className="text-[24px] leading-[32px] font-semibold text-white">Abrir Nuevo Turno</h3>
          <p className="text-sm text-text-secondary mt-1">Establece el fondo inicial de efectivo para comenzar a operar.</p>
        </div>
        <form onSubmit={handleOpen} className="p-6 flex flex-col gap-6">
          <div className="max-w-md">
            <label className="block text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-2">
              Monto Inicial (Efectivo)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono text-lg">$</span>
              <input
                className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-4 text-2xl font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-secondary/50"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-sm text-text-secondary mt-2">Efectivo físico con el que inicia el cajón.</p>
          </div>

          {initialMessage && (
            <div className="text-sm text-text-secondary bg-surface border border-border rounded-lg px-4 py-3">{initialMessage}</div>
          )}

          {error && (
            <div className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-3">{error}</div>
          )}

          {message && (
            <div className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-lg px-4 py-3">{message}</div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={opening}
              className="bg-accent text-bg text-[20px] leading-[28px] font-semibold py-3 px-8 rounded-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-[0_0_15px_rgba(139,242,230,0.15)] flex items-center gap-3 disabled:opacity-50"
            >
              <Clock size={22} />
              <span>{opening ? 'Abriendo...' : 'Abrir Turno'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
