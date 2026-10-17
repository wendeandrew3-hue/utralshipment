import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.get<any>('/api/admin/audit').then((r) => setLogs(r.logs)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-navy-900">Audit log</h1>
      <p className="mt-1 text-sm text-slate-500">Every administrative change is recorded here. Latest 100 entries.</p>
      <div className="card mt-6 divide-y divide-slate-100">
        {logs.map((l) => (
          <div key={l.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-navy-900">
                {l.admin_name} · <span className="uppercase text-accent-dark">{l.action}</span> · {l.entity} {l.entity_id ?? ''}
              </p>
              {l.details && <p className="text-xs text-slate-500">{JSON.stringify(l.details)}</p>}
            </div>
            <span className="text-xs text-slate-400">{new Date(l.created_at).toLocaleString()}</span>
          </div>
        ))}
        {logs.length === 0 && <p className="p-5 text-sm text-slate-500">No admin actions logged yet.</p>}
      </div>
    </div>
  );
}
