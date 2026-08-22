import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-bg text-white min-h-screen flex items-center justify-center antialiased overflow-hidden relative">
      {/* Background Texture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #222C3A 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Login Card */}
      <main className="relative z-10 w-full max-w-[440px] px-4 md:px-0">
        <div className="bg-surface border border-border rounded-xl p-8 shadow-2xl flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-structural/20 border border-border mb-3">
              <Store size={32} className="text-accent" />
            </div>
            <h1 className="text-[32px] leading-[40px] font-bold text-accent tracking-tight">Abarrotes Katy</h1>
            <div className="flex flex-col gap-1 mt-2">
              <h2 className="text-[20px] leading-[28px] font-semibold text-white">Bienvenido</h2>
              <p className="text-[14px] leading-[20px] text-text-secondary">Inicia sesión para gestionar tu tienda</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">
                Usuario / Correo
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary group-focus-within:text-accent transition-colors">
                  <User size={20} />
                </span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-bg border border-border text-white rounded-lg pl-[40px] pr-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-secondary/50"
                  placeholder="manager@abarroteskaty.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">
                  Contraseña
                </label>
                <a href="#" className="text-sm text-accent hover:opacity-80 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary group-focus-within:text-accent transition-colors">
                  <Lock size={20} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-bg border border-border text-white rounded-lg pl-[40px] pr-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-secondary/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error */}
            {error && <p className="text-error text-sm">{error}</p>}

            {/* Submit */}
            <div className="mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:opacity-90 text-bg font-semibold text-[20px] leading-[28px] py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                <ArrowRight size={20} />
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-4 text-center border-t border-border pt-4">
            <p className="text-sm text-text-secondary">
              ¿Problemas para iniciar sesión?{' '}
              <a href="#" className="text-text-secondary hover:text-white transition-colors underline underline-offset-2">
                Contacta al administrador.
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Atmospheric glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />
    </div>
  );
}
