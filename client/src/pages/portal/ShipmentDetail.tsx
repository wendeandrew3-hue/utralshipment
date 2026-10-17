import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import TrackingTimeline, { StatusBadge } from '../../components/TrackingTimeline';

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<any>(`/api/portal/shipments/${id}`)
      .then((r) => setShipment(r.shipment))
      .catch((e: any) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!shipment) return <p className="text-sm text-slate-500">Loading…</p>;

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/portal/shipments" className="text-sm font-semibold text-accent-dark hover:underline">← My shipments</Link>
          <h1 className="section-title mt-1">{shipment.tracking_number}</h1>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      {shipment.status === 'On Hold' && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-5">
          <p className="font-bold text-amber-900">On hold: {shipment.hold_reason}</p>
          {shipment.hold_notes && <p className="mt-1 text-sm text-amber-800">{shipment.hold_notes}</p>}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <p className="mb-3 font-bold text-navy-900">Details</p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">From</dt><dd className="font-medium">{shipment.origin}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">To</dt><dd className="font-medium">{shipment.destination}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Sender</dt><dd className="font-medium">{shipment.sender_name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Recipient</dt><dd className="font-medium">{shipment.recipient_name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Contact</dt><dd className="font-medium">{shipment.recipient_contact}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Weight</dt><dd className="font-medium">{shipment.weight_kg ? `${shipment.weight_kg} kg` : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Est. delivery</dt><dd className="font-medium">{fmt(shipment.estimated_delivery)}</dd></div>
            </dl>
          </div>
          <div className="card p-6">
            <p className="mb-3 font-bold text-navy-900">Charges</p>
            {(shipment.charges || []).length === 0 ? (
              <p className="text-sm text-slate-500">No documented charges on this shipment.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {shipment.charges.map((c: any, i: number) => (
                  <li key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                    <span className="text-slate-600">{c.description}</span>
                    <span className="font-semibold">
                      {Number(c.amount).toFixed(2)} {c.currency}
                      <span className={`ml-2 text-xs font-bold ${c.status === 'paid' ? 'text-emerald-600' : c.status === 'pending' ? 'text-amber-600' : 'text-slate-400'}`}>{c.status.toUpperCase()}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="card p-6 lg:p-8">
          <p className="mb-6 font-bold text-navy-900">Progress timeline</p>
          <TrackingTimeline events={shipment.events || []} />
        </div>
      </div>
    </div>
  );
}
