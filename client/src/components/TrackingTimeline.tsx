import type { ShipmentEvent } from '../types';

export function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'Delivered'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'On Hold'
      ? 'bg-amber-100 text-amber-800'
      : status === 'Delivery Exception'
      ? 'bg-red-100 text-red-700'
      : status === 'Shipment Registered'
      ? 'bg-slate-100 text-slate-700'
      : 'bg-blue-100 text-navy-800';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{status}</span>;
}

export default function TrackingTimeline({ events }: { events: ShipmentEvent[] }) {
  const ordered = [...events].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return (
    <ol className="relative space-y-6 border-l-2 border-navy-100 pl-6">
      {ordered.map((e, i) => (
        <li key={e.id ?? i} className="relative">
          <span
            className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 ${
              i === 0 ? 'border-accent bg-accent' : 'border-navy-600 bg-white'
            }`}
          />
          <p className="text-sm font-bold text-navy-900">{e.status}</p>
          <p className="text-sm text-slate-600">{e.description}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {new Date(e.created_at).toLocaleString()}
            {e.location ? ` · ${e.location}` : ''}
          </p>
        </li>
      ))}
      {ordered.length === 0 && <li className="text-sm text-slate-500">No tracking events yet.</li>}
    </ol>
  );
}
