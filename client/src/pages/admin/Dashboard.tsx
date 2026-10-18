import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { StatusBadge } from '../../components/TrackingTimeline';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<any>('/api/admin/overview').then(setData).catch((e: any) => setError(e.message));
  }, []);

  if (error) return <p className="adm-toast-err">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  const attention = data.on_hold + data.exceptions;
  const cards = [
    { label: 'Total Shipments', value: data.total, icon: '📦', cls: 'text-navy-900', ring: 'ring-navy-600/10' },
    { label: 'Pending', value: data.pending, icon: '🕐', cls: 'text-amber-600', ring: 'ring-amber-500/10' },
    { label: 'In Transit', value: data.in_transit, icon: '🚚', cls: 'text-royal-600', ring: 'ring-royal-600/10' },
    { label: 'Delivered', value: data.delivered, icon: '✅', cls: 'text-emerald-600', ring: 'ring-emerald-500/10' },
    { label: 'Need Attention', value: attention, icon: '⚠️', cls: attention > 0 ? 'text-red-600' : 'text-slate-400', ring: 'ring-red-500/10' },
    { label: 'Customers', value: data.customers, icon: '👥', cls: 'text-navy-900', ring: 'ring-navy-600/10' },
    { label: 'Searches Today', value: data.searchesToday?.total ?? 0, icon: '🔎', cls: 'text-navy-900', ring: 'ring-navy-600/10' },
    { label: 'Unread Chats', value: data.unreadChats, icon: '💬', cls: data.unreadChats > 0 ? 'text-gold' : 'text-slate-400', ring: 'ring-gold/20' },
  ];

  return (
    <div>
      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin/shipments/new" className="adm-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Shipment
        </Link>
        <Link to="/admin/chat" className="adm-btn-outline">Open Support Inbox</Link>
        <Link to="/admin/settings" className="adm-btn-outline">Settings</Link>
        <a href="/" target="_blank" rel="noreferrer" className="adm-btn-gold">View Public Site</a>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`adm-card p-5 ring-1 ${c.ring}`}>
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{c.label}</p>
              <span className="text-base leading-none opacity-80">{c.icon}</span>
            </div>
            <p className={`mt-2 font-display text-3xl font-extrabold ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="adm-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="adm-card-title">Recent Activity</p>
          <Link to="/admin/shipments" className="text-xs font-bold text-royal-700 hover:underline">View all shipments →</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {data.recentActivity.map((e: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <StatusBadge status={e.status} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900">{e.tracking_number}</p>
                  <p className="truncate text-xs text-slate-500">{e.description}</p>
                </div>
              </div>
              <span className="whitespace-nowrap text-xs text-slate-400">{new Date(e.created_at).toLocaleString()}</span>
            </div>
          ))}
          {data.recentActivity.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">No shipment events yet. Create your first shipment.</p>}
        </div>
      </div>
    </div>
  );
}
