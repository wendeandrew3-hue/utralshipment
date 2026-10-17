import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.get<any>('/api/admin/me')
      .then((r) => setAdmin(r.admin))
      .catch(() => navigate('/admin/login'))
      .finally(() => setChecked(true));
  }, [navigate]);

  if (!checked) return <div className="p-12 text-center text-sm text-slate-500">Loading…</div>;
  if (!admin) return null;

  const link = ({ isActive }: any) =>
    `block rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10'}`;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 flex-col bg-navy-900 p-4 md:flex">
        <p className="mb-6 px-2 font-display text-lg font-extrabold text-white">
          Utral<span className="text-accent">shipment</span>
        </p>
        <nav className="space-y-1">
          <NavLink to="/admin" end className={link}>Dashboard</NavLink>
          <NavLink to="/admin/shipments" className={link}>Shipments</NavLink>
          <NavLink to="/admin/customers" className={link}>Customers</NavLink>
          <NavLink to="/admin/chat" className={link}>Support Inbox</NavLink>
          <NavLink to="/admin/analytics" className={link}>Tracking Analytics</NavLink>
          <NavLink to="/admin/audit" className={link}>Audit Log</NavLink>
        </nav>
        <div className="mt-auto space-y-1">
          <p className="px-2 text-xs text-slate-400">{admin.full_name} ({admin.role})</p>
          <button
            className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-red-300 hover:bg-white/10"
            onClick={async () => {
              await api.post('/api/admin/logout');
              navigate('/admin/login');
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 md:hidden">
          <p className="font-display font-extrabold text-navy-900">Utralshipment Admin</p>
          <select
            className="input !w-auto !py-1.5 text-xs"
            onChange={(e) => navigate(e.target.value)}
            defaultValue={location.pathname}
          >
            <option value="/admin">Dashboard</option>
            <option value="/admin/shipments">Shipments</option>
            <option value="/admin/customers">Customers</option>
            <option value="/admin/chat">Support Inbox</option>
            <option value="/admin/analytics">Analytics</option>
            <option value="/admin/audit">Audit Log</option>
          </select>
        </div>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
