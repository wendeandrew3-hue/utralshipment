import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    api.get<any>('/api/admin/customers').then((r) => setCustomers(r.customers)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-navy-900">Customers</h1>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Phone</th><th className="p-4">Shipments</th><th className="p-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0">
                <td className="p-4 font-semibold text-navy-900">{c.full_name}</td>
                <td className="p-4">{c.email}</td>
                <td className="p-4">{c.phone || '—'}</td>
                <td className="p-4">{c.shipment_count}</td>
                <td className="p-4 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={5}>No registered customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
