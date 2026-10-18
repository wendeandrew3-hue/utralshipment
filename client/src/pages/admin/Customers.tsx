import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    api.get<any>('/api/admin/customers').then((r) => setCustomers(r.customers)).catch(() => {});
  }, []);

  return (
    <div>
      <p className="text-sm text-slate-500">Registered portal customers. Guests who only track or chat appear in the Support Inbox instead.</p>
      <div className="adm-card mt-5 overflow-x-auto">
        <table className="adm-table min-w-[700px]">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Shipments</th><th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold text-navy-900">{c.full_name}</td>
                <td className="text-slate-600">{c.email}</td>
                <td className="text-slate-600">{c.phone || '—'}</td>
                <td><span className="adm-pill adm-pill-blue">{c.shipment_count}</span></td>
                <td className="text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td className="p-8 text-center text-slate-500" colSpan={5}>No registered customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
