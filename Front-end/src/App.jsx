import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PointOfSale from './pages/PointOfSale';
import CashOut from './pages/CashOut';
import Inventory from './pages/Inventory';
import SupplierNotes from './pages/SupplierNotes';
import Fund from './pages/Fund';

import ClientsLayout from './pages/clients/ClientsLayout';
import ClientsList from './pages/clients/ClientsList';
import ClientDebts from './pages/clients/ClientDebts';

import SuppliersLayout from './pages/suppliers/SuppliersLayout';
import SuppliersList from './pages/suppliers/SuppliersList';
import SupplierDebts from './pages/suppliers/SupplierDebts';

import ReportsLayout from './pages/reports/ReportsLayout';
import ReportsOverview from './pages/reports/ReportsOverview';
import SalesReport from './pages/reports/SalesReport';
import ProductsReport from './pages/reports/ProductsReport';
import ClientsReport from './pages/reports/ClientsReport';
import DebtsReport from './pages/reports/DebtsReport';

import AdminLayout from './pages/admin/AdminLayout';
import Employees from './pages/admin/Employees';
import Roles from './pages/admin/Roles';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pos" element={<PointOfSale />} />
            <Route path="/cash-out" element={<CashOut />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/supplier-notes" element={<SupplierNotes />} />
            <Route path="/fund" element={<Fund />} />

            <Route path="/clients" element={<ClientsLayout />}>
              <Route index element={<ClientsList />} />
              <Route path="debts" element={<ClientDebts />} />
            </Route>

            <Route path="/suppliers" element={<SuppliersLayout />}>
              <Route index element={<SuppliersList />} />
              <Route path="debts" element={<SupplierDebts />} />
            </Route>

            <Route path="/reports" element={<ReportsLayout />}>
              <Route index element={<ReportsOverview />} />
              <Route path="sales" element={<SalesReport />} />
              <Route path="products" element={<ProductsReport />} />
              <Route path="clients" element={<ClientsReport />} />
              <Route path="debts" element={<DebtsReport />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Employees />} />
              <Route path="roles" element={<Roles />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
