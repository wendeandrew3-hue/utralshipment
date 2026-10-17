import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { StatusBadge } from '../../components/TrackingTimeline';
import { STATUSES } from '../../types';

export default function Shipments() {
  const [params, setParams] = useSearchParams();
  const [shipments, setShipments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState(params.get('q') || '');
  const [status, setStatus] = useState(params.get('status') || '');
  const [page, setPage] = useState(Number(params.get('page')) || 1);
  const [loaded, setLoaded] = useState(false);

  async function load(nextPage = page, nextStatus = status, nextQ = q) {
    setLoaded(false);
    const p = new URLSearchParams();
    if (nextStatus) p.set('status', nextStatus);
    if (nextQ) p.set('q', nextQ);
    p.set('page', String(nextPage));
    setParams(p, { replace: true });
    const r = await api.get<any>(`/api/admin/shipments?${p.toString()}`);
    setShipments(r.shipments);
    setTotal(r.total);
    setPage(r.page);
    setLoaded(true);
  }

  useEffect(() => {
    load(1, status, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Shipments ({total})</h1>
        <Link to="/admin/shipments/new" className="btn-primary !py-2.5">+ New Shipment</Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="input sm:w-64"
          placeholder="Search tracking number or name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1, status, q)}
        />
        <select
          className="input sm:w-60"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            load(1, e.target.value, q);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn-outline !py-2.5" onClick={() => load(1, status, q)}>Search</button>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="p-4">Tracking #</th><th className="p-4">Route</th><th className="p-4">Recipient</th><th className="p-4">Status</th><th className="p-4">Est. delivery</th><th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {loaded && shipments.length === 0 && (
              <tr><td colSpan={6} className="p-5 text-slate-500">No shipments match.</td></tr>
            )}
            {shipments.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4 font-semibold text-navy-900">{s.tracking_number}</td>
                <td className="p-4">{s.origin} → {s.destination}</td>
                <td className="p-4">{s.recipient_name}</td>
                <td className="p-4"><StatusBadge status={s.status} /></td>
                <td className="p-4">{s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : '—'}</td>
                <td className="p-4 text-right">
                  <Link to={`/admin/shipments/${s.id}`} className="text-sm font-semibold text-accent-dark hover:underline">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-outline !py-2" disabled={page <= 1} onClick={() => load(page - 1, status, q)}>Prev</button>
          <span className="text-sm text-slate-500">Page {page} of {pages}</span>
          <button className="btn-outline !py-2" disabled={page >= pages} onClick={() => load(page + 1, status, q)}>Next</button>
        </div>
      )}
    </div>
  );
}
