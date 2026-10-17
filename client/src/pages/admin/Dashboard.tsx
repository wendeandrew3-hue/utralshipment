import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get<any>('/api/admin/overview').then(setData).catch(() => {});
  }, []);

  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  const tiles = [
    ['Total shipments', data.total, 'text-navy-900'],
    ['In transit', data.in_transit, 'text-blue-700'],
    ['Delivered', data.delivered, 'text-emerald-600'],
    ['On hold', data.on_hold, 'text-amber-600'],
    ['Exceptions', data.exceptions, 'text-red-600'],
    ['Customers', data.customers, 'text-navy-900'],
    ['Searches today', data.searchesToday?.total ?? 0, 'text-navy-900'],
    ['Unread chat msgs', data.unreadChats, 'text-accent-dark'],
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-navy-900">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(([label, value, color]) => (
          <div key={label as string} className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-1 font-display text-3xl font-extrabold ${color}`}>{value as any}</p>
          </div>
        ))}
      </div>
      <div className="card mt-8 p-6">
        <p className="mb-4 font-bold text-navy-900">Recent activity</p>
        <div className="space-y-3">
          {data.recentActivity.map((e: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 text-sm last:border-0">
              <div>
                <p className="font-semibold text-navy-900">{e.status}</p>
                <p className="text-xs text-slate-500">{e.tracking_number} · {e.description}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-slate-400">{new Date(e.created_at).toLocaleString()}</span>
            </div>
          ))}
          {data.recentActivity.length === 0 && <p className="text-sm text-slate-500">No shipment events yet.</p>}
        </div>
      </div>
    </div>
  );
}
