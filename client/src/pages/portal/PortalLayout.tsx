import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function PortalLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.get<any>('/api/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => navigate('/login'))
      .finally(() => setChecked(true));
  }, [navigate]);

  if (!checked) return <div className="p-12 text-center text-sm text-slate-500">Loading your portal…</div>;
  if (!user) return null;

  const link = ({ isActive }: any) =>
    `block rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-navy-800 text-white' : 'text-slate-700 hover:bg-navy-100'}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[15rem_1fr]">
      <aside>
        <div className="card p-4">
          <p className="font-bold text-navy-900">{user.full_name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
        <nav className="mt-3 space-y-1">
          <NavLink to="/portal" end className={link} onClick={() => 0}>Overview</NavLink>
          <NavLink to="/portal/shipments" className={link}>My Shipments</NavLink>
          <NavLink to="/portal/charges" className={link}>Charges</NavLink>
          <NavLink to="/portal/activity" className={link}>Tracking Activity</NavLink>
          <NavLink to="/portal/profile" className={link}>Profile</NavLink>
          <button
            className="mt-2 block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
            onClick={async () => {
              await api.post('/api/auth/logout');
              navigate('/');
            }}
          >
            Sign Out
          </button>
        </nav>
      </aside>
      <Outlet />
    </div>
  );
}
