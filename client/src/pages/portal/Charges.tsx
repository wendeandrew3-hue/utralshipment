import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Charges() {
  const [charges, setCharges] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<any>('/api/portal/charges').then((r) => setCharges(r.charges)).finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <h1 className="section-title">Charges</h1>
      <p className="mt-3 max-w-2xl text-sm text-slate-600">
        Every charge below was recorded by Utralshipment staff against one of your shipments. To settle a pending charge,
        contact support at +1 201-603-2142 or Utralshipment@gmail.com. Payment status is only marked paid after we verify the payment.
      </p>
      <div className="card mt-6 divide-y divide-slate-100">
        {!loaded && <p className="p-5 text-sm text-slate-500">Loading…</p>}
        {loaded && charges.length === 0 && <p className="p-5 text-sm text-slate-500">No charges recorded.</p>}
        {charges.map((c) => (
          <div key={c.id} className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-navy-900">{c.description}</p>
              <p className="text-xs text-slate-500">
                {c.tracking_number} · recorded {new Date(c.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{Number(c.amount).toFixed(2)} {c.currency}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : c.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                {c.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
