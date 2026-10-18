import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { StatusBadge } from '../../components/TrackingTimeline';
import { STATUSES } from '../../types';

export default function Shipments() {
  const [params, setParams] = useSearchParams();
  const [shipments, setShipments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState(params.get('q') || '');
  const [status, setStatus] = useState(params.get('status') || '');
  const [from, setFrom] = useState(params.get('from') || '');
  const [to, setTo] = useState(params.get('to') || '');
  const [page, setPage] = useState(Number(params.get('page')) || 1);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState('');

  async function load(nextPage = page, nextStatus = status, nextQ = q, nextFrom = from, nextTo = to) {
    setLoaded(false);
    const p = new URLSearchParams();
    if (nextStatus) p.set('status', nextStatus);
    if (nextQ) p.set('q', nextQ);
    if (nextFrom) p.set('from', nextFrom);
    if (nextTo) p.set('to', nextTo);
    p.set('page', String(nextPage));
    setParams(p, { replace: true });
    try {
      const r = await api.get<any>(`/api/admin/shipments?${p.toString()}`);
      setShipments(r.shipments);
      setTotal(r.total);
      setLimit(r.limit);
      setPage(r.page);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load(1, status, q, from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = Math.max(1, Math.ceil(total / limit));

  function copy(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(''), 1500);
    });
  }

  const reset = () => { setQ(''); setStatus(''); setFrom(''); setTo(''); load(1, '', '', '', ''); };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{total} shipment{total === 1 ? '' : 's'} in the system</p>
        <Link to="/admin/shipments/new" className="adm-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Shipment
        </Link>
      </div>

      {/* Filters */}
      <div className="adm-card mt-5 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            className="adm-input xl:col-span-2"
            placeholder="Search tracking #, name, phone, destination…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(1, status, q, from, to)}
          />
          <select className="adm-select" value={status} onChange={(e) => { setStatus(e.target.value); load(1, e.target.value, q, from, to); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" className="adm-input" title="Created from" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-xs text-slate-400">→</span>
            <input type="date" className="adm-input" title="Created to" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="adm-btn flex-1" onClick={() => load(1, status, q, from, to)}>Apply</button>
            <button className="adm-btn-outline" onClick={reset} title="Clear filters">✕</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="adm-card mt-5 overflow-x-auto">
        <table className="adm-table min-w-[900px]">
          <thead>
            <tr>
              <th>Tracking #</th><th>Route</th><th>Recipient</th><th>Status</th><th>Est. Delivery</th><th>Created</th><th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loaded && shipments.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No shipments match your filters.</td></tr>
            )}
            {shipments.map((s) => (
              <tr key={s.id}>
                <td>
                  <button
                    className="group inline-flex items-center gap-2 font-mono text-sm font-bold text-navy-900 hover:text-royal-700"
                    title="Copy tracking code"
                    onClick={() => copy(s.tracking_number)}
                  >
                    {s.tracking_number}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 transition group-hover:opacity-100"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  {copied === s.tracking_number && <span className="ml-2 text-[10px] font-bold text-emerald-600">COPIED</span>}
                </td>
                <td className="text-slate-600">{s.origin} → <b className="text-navy-900">{s.destination}</b></td>
                <td>
                  <p className="font-semibold text-navy-900">{s.recipient_name}</p>
                  <p className="text-xs text-slate-400">{s.recipient_contact || 'no contact on file'}</p>
                </td>
                <td><StatusBadge status={s.status} /></td>
                <td className="text-slate-600">{s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : '—'}</td>
                <td className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/track?number=${s.tracking_number}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-navy-700 transition hover:border-royal-600 hover:text-royal-700"
                      title="Open public tracking page"
                    >
                      Track ↗
                    </a>
                    <Link
                      to={`/admin/shipments/${s.id}`}
                      className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-navy-800"
                    >
                      Manage
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button className="adm-btn-outline !py-2" disabled={page <= 1} onClick={() => load(page - 1, status, q, from, to)}>← Prev</button>
          <span className="text-sm text-slate-500">Page {page} of {pages}</span>
          <button className="adm-btn-outline !py-2" disabled={page >= pages} onClick={() => load(page + 1, status, q, from, to)}>Next →</button>
        </div>
      )}
    </div>
  );
}
