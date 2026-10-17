import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { StatusBadge } from '../../components/TrackingTimeline';

export default function PortalHome() {
  const [summary, setSummary] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);

  useEffect(() => {
    api.get<any>('/api/portal/summary').then(setSummary).catch(() => {});
    api.get<any>('/api/portal/shipments').then((r) => setShipments(r.shipments.slice(0, 5))).catch(() => {});
  }, []);

  const tiles = [
    ['Total shipments', summary?.total ?? '—'],
    ['In transit', summary?.in_transit ?? '—'],
    ['Delivered', summary?.delivered ?? '—'],
    ['On hold', summary?.on_hold ?? '—'],
  ];

  return (
    <div>
      <h1 className="section-title">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label as string} className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-navy-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-navy-900">Recent shipments</h2>
          <Link to="/portal/shipments" className="text-sm font-semibold text-accent-dark hover:underline">View all</Link>
        </div>
        <div className="card divide-y divide-slate-100">
          {shipments.length === 0 && <p className="p-5 text-sm text-slate-500">No shipments yet. Our team registers shipments into your account when you book.</p>}
          {shipments.map((s) => (
            <Link key={s.id} to={`/portal/shipments/${s.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
              <div>
                <p className="font-semibold text-navy-900">{s.tracking_number}</p>
                <p className="text-xs text-slate-500">{s.origin} → {s.destination}</p>
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
