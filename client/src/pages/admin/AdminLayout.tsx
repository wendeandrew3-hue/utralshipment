import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api';

interface Overview {
  unreadChats: number;
  on_hold: number;
  exceptions: number;
}

const ICONS: Record<string, JSX.Element> = {
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
  ),
  shipments: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  ),
  customers: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  chat: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  analytics: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  settings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  audit: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
};

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/shipments', label: 'Shipments', icon: 'shipments', end: false },
  { to: '/admin/customers', label: 'Customers', icon: 'customers', end: false },
  { to: '/admin/chat', label: 'Support Inbox', icon: 'chat', end: false },
  { to: '/admin/analytics', label: 'Analytics', icon: 'analytics', end: false },
  { to: '/admin/settings', label: 'Settings', icon: 'settings', end: false },
  { to: '/admin/audit', label: 'Audit Log', icon: 'audit', end: false },
];

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/shipments': 'Shipments',
  '/admin/customers': 'Customers',
  '/admin/chat': 'Support Inbox',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
  '/admin/audit': 'Audit Log',
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<any>('/api/admin/me')
      .then((r) => setAdmin(r.admin))
      .catch(() => navigate('/admin/login'))
      .finally(() => setChecked(true));
  }, [navigate]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get<any>('/api/admin/overview')
        .then((r) => alive && setOverview({ unreadChats: r.unreadChats, on_hold: r.on_hold, exceptions: r.exceptions }))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!checked) return <div className="flex min-h-screen items-center justify-center bg-navy-950"><p className="animate-pulse text-sm text-slate-300">Loading console…</p></div>;
  if (!admin) return null;

  const title = TITLES[location.pathname] || 'Admin';
  const unread = overview?.unreadChats ?? 0;
  const attention = (overview?.on_hold ?? 0) + (overview?.exceptions ?? 0);
  const notifCount = unread + attention;

  const link = (to: string, end: boolean, label: string, icon: string, badge?: number) => (
    <NavLink key={to} to={to} end={end}
      className={({ isActive }) =>
        `adm-navlink ${isActive ? 'adm-navlink-active' : ''}`
      }
    >
      {ICONS[icon]}
      <span className="flex-1">{label}</span>
      {!!badge && badge > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge > 0 ? 'bg-gold text-navy-950' : ''}`}>
          {badge}
        </span>
      )}
    </NavLink>
  );

  const sidebar = (
    <div className="adm-sidebar">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-royal-600 font-display text-sm font-extrabold text-white">U</div>
        <p className="font-display text-lg font-extrabold tracking-tight text-white">
          Utral<span className="text-gold-light">shipment</span>
        </p>
      </div>
      <p className="mx-5 mb-4 rounded-md bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Admin Console</p>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((n) => link(n.to, n.end, n.label, n.icon, n.to === '/admin/chat' ? unread : undefined))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 px-1 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-display text-sm font-extrabold text-navy-950">
            {(admin.full_name || 'A').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{admin.full_name}</p>
            <p className="truncate text-[11px] capitalize text-slate-400">{admin.role}</p>
          </div>
        </div>
        <button
          className="adm-navlink w-full !text-slate-400 hover:!bg-white/5 hover:!text-red-300"
          onClick={async () => {
            await api.post('/api/admin/logout');
            navigate('/admin/login');
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen md:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="adm-topbar">
          <button className="rounded-lg p-2 text-navy-800 hover:bg-slate-100 md:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h1 className="font-display text-lg font-extrabold text-navy-900">{title}</h1>
          <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-600/20 sm:inline-flex">
            System Operational
          </span>

          <div className="ml-auto flex items-center gap-2.5">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                className="relative rounded-full border border-slate-200 bg-white p-2.5 text-navy-800 shadow-sm transition hover:border-royal-600 hover:text-royal-700"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {notifCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {notifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="adm-card absolute right-0 top-12 z-50 w-72 p-2">
                  <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</p>
                  {notifCount === 0 && <p className="px-3 py-3 text-sm text-slate-500">All clear. Nothing needs attention.</p>}
                  {unread > 0 && (
                    <button className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50" onClick={() => { setNotifOpen(false); navigate('/admin/chat'); }}>
                      <span className="adm-pill adm-pill-gold mt-0.5">Chat</span>
                      <span className="text-sm text-slate-700"><b>{unread}</b> unread customer message{unread > 1 ? 's' : ''} waiting for Abigail.</span>
                    </button>
                  )}
                  {(overview?.on_hold ?? 0) > 0 && (
                    <button className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50" onClick={() => { setNotifOpen(false); navigate('/admin/shipments?status=On Hold'); }}>
                      <span className="adm-pill adm-pill-amber mt-0.5">Hold</span>
                      <span className="text-sm text-slate-700"><b>{overview!.on_hold}</b> shipment{overview!.on_hold > 1 ? 's' : ''} on hold.</span>
                    </button>
                  )}
                  {(overview?.exceptions ?? 0) > 0 && (
                    <button className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50" onClick={() => { setNotifOpen(false); navigate('/admin/shipments?status=Delivery Exception'); }}>
                      <span className="adm-pill adm-pill-red mt-0.5">Alert</span>
                      <span className="text-sm text-slate-700"><b>{overview!.exceptions}</b> delivery exception{overview!.exceptions > 1 ? 's' : ''} needing attention.</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profile chip */}
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-xs font-extrabold text-gold-light">
                {(admin.full_name || 'A').slice(0, 1).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold leading-tight text-navy-900">{admin.full_name}</p>
                <p className="text-[10px] font-medium capitalize leading-tight text-slate-400">{admin.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
