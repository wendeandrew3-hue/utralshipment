import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Analytics() {
  const [range, setRange] = useState<'day' | 'week' | 'month'>('week');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get<any>(`/api/admin/analytics?range=${range}`).then(setData).catch(() => {});
  }, [range]);

  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  const max = Math.max(1, ...data.overTime.map((b: any) => b.total));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Tracking analytics</h1>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map((r) => (
            <button
              key={r}
              className={range === r ? 'btn-primary !py-2' : 'btn-outline !py-2'}
              onClick={() => setRange(r)}
            >
              {r === 'day' ? 'Last 24h' : r === 'week' ? 'Last 7 days' : 'Last 30 days'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Searches in range', data.totals.total],
          ['Successful lookups', data.totals.found],
          ['Not found', data.totals.not_found],
          ['Today', data.summaries.daily],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-navy-900">{value as any}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">This week</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{data.summaries.weekly}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">This month</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{data.summaries.monthly}</p>
        </div>
      </div>

      <div className="card mt-8 p-6">
        <p className="mb-4 font-bold text-navy-900">Searches over time</p>
        <div className="flex h-48 items-end gap-1.5">
          {data.overTime.map((b: any, i: number) => {
            const h = Math.round((b.total / max) * 100);
            const label = range === 'day'
              ? new Date(b.bucket).toLocaleTimeString([], { hour: '2-digit' })
              : new Date(b.bucket).toLocaleDateString([], { month: 'short', day: 'numeric' });
            return (
              <div key={i} className="group relative flex-1">
                <div className="rounded-t bg-navy-800 group-hover:bg-accent" style={{ height: `${Math.max(h, 4)}%` }} />
                <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy-900 px-2 py-1 text-[10px] text-white group-hover:block">
                  {b.total} searches · {label}
                </div>
              </div>
            );
          })}
          {data.overTime.length === 0 && <p className="text-sm text-slate-500">No tracking searches recorded in this range yet.</p>}
        </div>
      </div>

      <div className="card mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="p-4">Most searched tracking numbers</th><th className="p-4">Searches</th><th className="p-4">Last searched</th>
            </tr>
          </thead>
          <tbody>
            {data.topNumbers.map((t: any, i: number) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="p-4 font-semibold text-navy-900">{t.tracking_number}</td>
                <td className="p-4">{t.searches}</td>
                <td className="p-4 text-slate-500">{new Date(t.last_searched).toLocaleString()}</td>
              </tr>
            ))}
            {data.topNumbers.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={3}>No searches yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
