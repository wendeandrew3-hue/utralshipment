import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import TrackingTimeline, { StatusBadge } from '../../components/TrackingTimeline';
import type { Shipment } from '../../types';

export default function Track() {
  const [params] = useSearchParams();
  const [number, setNumber] = useState(params.get('number') || '');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function track(value: string) {
    const t = value.trim();
    if (!t) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const r = await api.post<any>('/api/track', { trackingNumber: t });
      setShipment(r.shipment);
    } catch (e: any) {
      setShipment(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = params.get('number');
    if (initial) track(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function fmtDate(d?: string | null) {
    return d ? new Date(d).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="section-title">Track your shipment</h1>
      <p className="mt-3 text-slate-600">Enter the tracking number we provided when your shipment was registered.</p>

      <form
        className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          track(number);
        }}
      >
        <input className="input sm:flex-1" placeholder="e.g. UTS1A2B3C4D5" value={number} onChange={(e) => setNumber(e.target.value)} />
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Searching…' : 'Track'}
        </button>
      </form>

      {loading && <p className="mt-6 text-sm text-slate-500">Looking up your shipment…</p>}
      {error && (
        <div className="mt-8 max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {shipment && (
        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_3fr]">
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-extrabold text-navy-900">{shipment.tracking_number}</p>
                <StatusBadge status={shipment.status} />
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-slate-500">From</dt><dd className="text-right font-medium">{shipment.origin}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">To</dt><dd className="text-right font-medium">{shipment.destination}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Service</dt><dd className="text-right font-medium capitalize">{shipment.service_type.replace('_', ' ')}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Package</dt><dd className="text-right font-medium">{shipment.package_description || '—'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Weight</dt><dd className="text-right font-medium">{shipment.weight_kg ? `${shipment.weight_kg} kg` : '—'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Registered</dt><dd className="text-right font-medium">{fmtDate(shipment.created_at)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Estimated delivery</dt><dd className="text-right font-medium">{shipment.delivered_at ? 'Delivered' : fmtDate(shipment.estimated_delivery)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Recipient</dt><dd className="text-right font-medium">{shipment.recipient_name} ({shipment.recipient_contact})</dd></div>
              </dl>
            </div>

            {shipment.status === 'On Hold' && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">
                <p className="font-bold text-amber-900">Shipment on hold</p>
                <p className="mt-1 text-sm text-amber-800">{shipment.hold_reason}</p>
                {shipment.hold_notes && <p className="mt-2 text-sm text-amber-700">{shipment.hold_notes}</p>}
              </div>
            )}

            {shipment.status === 'Delivery Exception' && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-5">
                <p className="font-bold text-red-800">Delivery exception</p>
                <p className="mt-1 text-sm text-red-700">Please contact support at +1 201-603-2142 for details about this shipment.</p>
              </div>
            )}

            {shipment.charges && shipment.charges.length > 0 && (
              <div className="card p-6">
                <p className="font-bold text-navy-900">Documented charges</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {shipment.charges.map((c: any, i: number) => (
                    <li key={i} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
                      <span className="text-slate-600">{c.description}</span>
                      <span className="whitespace-nowrap font-semibold">
                        {Number(c.amount).toFixed(2)} {c.currency}
                        <span className={`ml-2 text-xs font-bold ${c.status === 'paid' ? 'text-emerald-600' : c.status === 'pending' ? 'text-amber-600' : 'text-slate-400'}`}>
                          {c.status.toUpperCase()}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                {shipment.charges.some((c: any) => c.status === 'pending') && (
                  <p className="mt-3 text-xs text-slate-500">
                    To settle a pending charge, contact support at +1 201-603-2142 or Utralshipment@gmail.com. Payment status is only updated after we verify the payment on our side.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card p-6 lg:p-8">
            <p className="mb-6 font-bold text-navy-900">Progress timeline</p>
            <TrackingTimeline events={shipment.events || []} />
          </div>
        </div>
      )}

      {searched && !loading && !shipment && !error && null}
    </div>
  );
}
