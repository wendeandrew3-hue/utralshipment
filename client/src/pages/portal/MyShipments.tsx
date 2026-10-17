import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { StatusBadge } from '../../components/TrackingTimeline';

export default function MyShipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<any>('/api/portal/shipments').then((r) => setShipments(r.shipments)).finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <h1 className="section-title">My shipments</h1>
      <div className="card mt-6 divide-y divide-slate-100">
        {!loaded && <p className="p-5 text-sm text-slate-500">Loading…</p>}
        {loaded && shipments.length === 0 && (
          <p className="p-5 text-sm text-slate-500">No shipments registered to your account yet.</p>
        )}
        {shipments.map((s) => (
          <Link key={s.id} to={`/portal/shipments/${s.id}`} className="flex flex-col gap-3 p-5 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-navy-900">{s.tracking_number}</p>
              <p className="text-sm text-slate-600">{s.origin} → {s.destination}</p>
              <p className="text-xs text-slate-400">
                Registered {new Date(s.created_at).toLocaleDateString()}
                {s.estimated_delivery ? ` · Est. delivery ${new Date(s.estimated_delivery).toLocaleDateString()}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {s.pending_charges > 0 && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{s.pending_charges} pending charge{s.pending_charges > 1 ? 's' : ''}</span>
              )}
              <StatusBadge status={s.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
