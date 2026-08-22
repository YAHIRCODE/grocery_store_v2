import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/reports', label: 'General', end: true },
  { to: '/reports/sales', label: 'Ventas' },
  { to: '/reports/products', label: 'Productos' },
  { to: '/reports/clients', label: 'Clientes' },
  { to: '/reports/debts', label: 'Deudas' },
];

export default function ReportsLayout() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Reportes</h1>
      <nav className="flex gap-1 border-b border-border mb-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `px-4 py-2.5 text-[13px] leading-[18px] font-medium rounded-t-lg transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20 border-b-transparent -mb-px'
                  : 'text-text-secondary hover:text-white border border-transparent'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
