import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Package,
  FileText,
  Users,
  Truck,
  Landmark,
  BarChart3,
  Settings,
  LogOut,
  Store,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Cajero', 'Almacenista'] },
  { to: '/pos', label: 'Punto de Venta', icon: ShoppingCart, roles: ['Administrador', 'Cajero'] },
  { to: '/cash-out', label: 'Corte de Caja', icon: Wallet, roles: ['Administrador', 'Cajero'] },
  { to: '/inventory', label: 'Inventario', icon: Package, roles: ['Administrador', 'Almacenista'] },
  { to: '/supplier-notes', label: 'Notas de Proveedor', icon: FileText, roles: ['Administrador', 'Almacenista'] },
  { to: '/clients', label: 'Clientes', icon: Users, roles: ['Administrador', 'Cajero'] },
  { to: '/suppliers', label: 'Proveedores', icon: Truck, roles: ['Administrador', 'Almacenista'] },
  { to: '/fund', label: 'Fondo', icon: Landmark, roles: ['Administrador'] },
  { to: '/reports', label: 'Reportes', icon: BarChart3, roles: ['Administrador'] },
  { to: '/admin', label: 'Administración', icon: Settings, roles: ['Administrador'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const roleName = user?.role?.name;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(roleName));

  return (
    <nav className="hidden md:flex flex-col h-screen w-60 bg-surface border-r border-border fixed left-0 top-0 z-20">
      {/* Header */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-structural/20 border border-border">
            <Store size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-[16px] leading-[20px] font-bold text-accent tracking-tight">
              Abarrotes Katy
            </h1>
            <p className="text-[11px] leading-[14px] text-text-secondary">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:bg-border/30 hover:text-white border border-transparent'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[13px] leading-[18px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* User Profile & Logout */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-bg border border-border mb-3">
          <div className="w-9 h-9 rounded-lg bg-structural/20 border border-border flex items-center justify-center">
            <span className="text-[12px] font-bold text-accent">
              {user?.employee?.first_name?.[0]}{user?.employee?.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] leading-[16px] font-medium text-white truncate">
              {user?.employee?.first_name} {user?.employee?.last_name}
            </p>
            <p className="text-[11px] leading-[14px] text-text-secondary">{roleName}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 text-left text-[13px] leading-[18px] text-text-secondary hover:text-white transition-colors px-3 py-2.5 rounded-lg hover:bg-white/5"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
