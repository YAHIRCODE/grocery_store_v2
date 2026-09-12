import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-bg min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-accent animate-spin" style={{ fontSize: '40px' }}>
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-bg min-h-screen text-on-surface antialiased">
      <Sidebar />
      <main className="ml-0 md:ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
