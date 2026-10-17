import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Activity() {
  const [activity, setActivity] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<any>('/api/portal/activity').then((r) => setActivity(r.activity)).finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <h1 className="section-title">Tracking activity</h1>
      <p className="mt-3 text-sm text-slate-600">Your 50 most recent shipment lookups on this account.</p>
      <div className="card mt-6 divide-y divide-slate-100">
        {!loaded && <p className="p-5 text-sm text-slate-500">Loading…</p>}
        {loaded && activity.length === 0 && <p className="p-5 text-sm text-slate-500">No tracking lookups yet.</p>}
        {activity.map((a, i) => (
          <div key={i} className="flex items-center justify-between p-4 text-sm">
            <span className="font-medium text-navy-900">{a.tracking_number}</span>
            <span className="flex items-center gap-4">
              <span className={a.found ? 'text-emerald-600' : 'text-red-500'}>{a.found ? 'Found' : 'Not found'}</span>
              <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
