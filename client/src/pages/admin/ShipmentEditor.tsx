import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import TrackingTimeline, { StatusBadge } from '../../components/TrackingTimeline';
import { STATUSES } from '../../types';

const emptyForm = {
  user_email: '', sender_name: '', sender_contact: '', recipient_name: '',
  recipient_contact: '', origin: '', destination: '', service_type: 'standard',
  package_description: '', weight_kg: '', estimated_delivery: '',
};

export default function ShipmentEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState<any>(emptyForm);
  const [shipment, setShipment] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [owner, setOwner] = useState<any>(null);

  const [event, setEvent] = useState({ status: '', description: '', location: '' });
  const [hold, setHold] = useState({ reason: '', notes: '', charge_description: '', charge_amount: '' });
  const [charge, setCharge] = useState({ description: '', amount: '' });
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return;
    api.get<any>(`/api/admin/shipments/${id}`).then((r) => {
      setShipment(r.shipment);
      setEvents(r.events);
      setCharges(r.charges);
      setOwner(r.owner);
      setForm({
        user_email: r.owner?.email || '',
        sender_name: r.shipment.sender_name, sender_contact: r.shipment.sender_contact,
        recipient_name: r.shipment.recipient_name, recipient_contact: r.shipment.recipient_contact,
        origin: r.shipment.origin, destination: r.shipment.destination,
        service_type: r.shipment.service_type, package_description: r.shipment.package_description || '',
        weight_kg: r.shipment.weight_kg ?? '', estimated_delivery: r.shipment.estimated_delivery || '',
      });
    }).catch((e: any) => setError(e.message));
  }, [id, isNew]);

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name);
    setError('');
    setMsg('');
    try {
      await fn();
      setMsg('Done.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function reload() {
    const r = await api.get<any>(`/api/admin/shipments/${id}`);
    setShipment(r.shipment);
    setEvents(r.events);
    setCharges(r.charges);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/shipments" className="text-sm font-semibold text-accent-dark hover:underline">← Shipments</Link>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">
            {isNew ? 'New shipment' : shipment?.tracking_number}
          </h1>
        </div>
        {!isNew && shipment && <StatusBadge status={shipment.status} />}
      </div>
      {msg && <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      {/* Details form */}
      <div className="card mt-6 p-6">
        <p className="mb-4 font-bold text-navy-900">{isNew ? 'Shipment details' : 'Edit details'}</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div><label className="label">Customer account email (optional)</label><input className="input" placeholder="customer@example.com" value={form.user_email} onChange={set('user_email')} /></div>
          <div><label className="label">Sender name</label><input className="input" value={form.sender_name} onChange={set('sender_name')} /></div>
          <div><label className="label">Sender contact</label><input className="input" value={form.sender_contact} onChange={set('sender_contact')} /></div>
          <div><label className="label">Recipient name</label><input className="input" value={form.recipient_name} onChange={set('recipient_name')} /></div>
          <div><label className="label">Recipient contact</label><input className="input" value={form.recipient_contact} onChange={set('recipient_contact')} /></div>
          <div><label className="label">Service</label>
            <select className="input" value={form.service_type} onChange={set('service_type')}>
              <option value="standard">Standard</option><option value="air_freight">Air freight</option>
              <option value="sea_freight">Sea freight</option><option value="road_transport">Road transport</option>
              <option value="express">Express</option>
            </select>
          </div>
          <div><label className="label">Origin</label><input className="input" value={form.origin} onChange={set('origin')} /></div>
          <div><label className="label">Destination</label><input className="input" value={form.destination} onChange={set('destination')} /></div>
          <div><label className="label">Weight (kg)</label><input type="number" step="0.01" min="0" className="input" value={form.weight_kg} onChange={set('weight_kg')} /></div>
          <div className="md:col-span-2"><label className="label">Package description</label><input className="input" value={form.package_description} onChange={set('package_description')} /></div>
          <div><label className="label">Estimated delivery</label><input type="date" className="input" value={form.estimated_delivery?.slice?.(0, 10) || form.estimated_delivery} onChange={set('estimated_delivery')} /></div>
        </div>
        <div className="mt-5">
          {isNew ? (
            <button
              className="btn-primary"
              disabled={!!busy}
              onClick={() => run('create', async () => {
                const payload: any = { ...form };
                if (payload.weight_kg !== '') payload.weight_kg = Number(payload.weight_kg);
                else payload.weight_kg = null;
                if (!payload.estimated_delivery) payload.estimated_delivery = null;
                const r = await api.post<any>('/api/admin/shipments', payload);
                navigate(`/admin/shipments/${r.shipment.id}`);
              })}
            >
              {busy === 'create' ? 'Creating…' : 'Create shipment (tracking number auto-generated)'}
            </button>
          ) : (
            <button
              className="btn-primary"
              disabled={!!busy}
              onClick={() => run('save', async () => {
                const payload: any = { ...form };
                if (payload.weight_kg !== '') payload.weight_kg = Number(payload.weight_kg);
                else payload.weight_kg = null;
                await api.put(`/api/admin/shipments/${id}`, payload);
                await reload();
              })}
            >
              {busy === 'save' ? 'Saving…' : 'Save changes'}
            </button>
          )}
          {!isNew && owner && <p className="mt-3 text-xs text-slate-500">Linked customer: {owner.full_name} ({owner.email})</p>}
        </div>
      </div>

      {!isNew && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Status update */}
          <div className="card p-6">
            <p className="mb-4 font-bold text-navy-900">Add status event</p>
            <div className="space-y-3">
              <select className="input" value={event.status} onChange={(e) => setEvent({ ...event, status: e.target.value })}>
                <option value="">Select status…</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="input" placeholder="Description (shown to customer)" value={event.description} onChange={(e) => setEvent({ ...event, description: e.target.value })} />
              <input className="input" placeholder="Location (optional)" value={event.location} onChange={(e) => setEvent({ ...event, location: e.target.value })} />
              <button
                className="btn-primary"
                disabled={!!busy || !event.status || event.description.trim().length < 3}
                onClick={() => run('event', async () => {
                  if (!window.confirm(`Add status "${event.status}" to this shipment? Customers will see this on the tracking page.`)) throw new Error('Cancelled.');
                  await api.post(`/api/admin/shipments/${id}/events`, event);
                  setEvent({ status: '', description: '', location: '' });
                  await reload();
                })}
              >
                {busy === 'event' ? 'Adding…' : 'Add event'}
              </button>
            </div>
          </div>

          {/* Hold / release */}
          <div className="card p-6">
            <p className="mb-4 font-bold text-navy-900">Hold / release</p>
            {shipment?.status === 'On Hold' ? (
              <div className="space-y-3">
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">On hold: {shipment.hold_reason}</p>
                <input className="input" placeholder="Release notes (optional)" value={hold.notes} onChange={(e) => setHold({ ...hold, notes: e.target.value })} />
                <button
                  className="btn-primary"
                  disabled={!!busy}
                  onClick={() => run('release', async () => {
                    if (!window.confirm('Release this shipment back to In Transit? Pending charges must be settled or waived first.')) throw new Error('Cancelled.');
                    await api.post(`/api/admin/shipments/${id}/release`, { notes: hold.notes });
                    setHold({ reason: '', notes: '', charge_description: '', charge_amount: '' });
                    await reload();
                  })}
                >
                  {busy === 'release' ? 'Releasing…' : 'Release shipment'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input className="input" placeholder="Reason for hold (required, shown to customer)" value={hold.reason} onChange={(e) => setHold({ ...hold, reason: e.target.value })} />
                <input className="input" placeholder="Supporting notes (optional)" value={hold.notes} onChange={(e) => setHold({ ...hold, notes: e.target.value })} />
                <input className="input" placeholder="Charge description (optional, e.g. Customs duty)" value={hold.charge_description} onChange={(e) => setHold({ ...hold, charge_description: e.target.value })} />
                <input type="number" step="0.01" min="0" className="input" placeholder="Charge amount USD (optional)" value={hold.charge_amount} onChange={(e) => setHold({ ...hold, charge_amount: e.target.value })} />
                <button
                  className="btn-primary !bg-amber-600 hover:!bg-amber-700"
                  disabled={!!busy || hold.reason.trim().length < 3}
                  onClick={() => run('hold', async () => {
                    if (!window.confirm('Place this shipment on hold? The customer will see the reason on the tracking page.')) throw new Error('Cancelled.');
                    const payload: any = { reason: hold.reason, notes: hold.notes };
                    if (hold.charge_description && hold.charge_amount !== '') {
                      payload.charge_description = hold.charge_description;
                      payload.charge_amount = Number(hold.charge_amount);
                    }
                    await api.post(`/api/admin/shipments/${id}/hold`, payload);
                    setHold({ reason: '', notes: '', charge_description: '', charge_amount: '' });
                    await reload();
                  })}
                >
                  {busy === 'hold' ? 'Placing on hold…' : 'Place on hold'}
                </button>
              </div>
            )}
          </div>

          {/* Charges */}
          <div className="card p-6">
            <p className="mb-4 font-bold text-navy-900">Documented charges</p>
            <div className="space-y-2">
              {charges.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-700">{c.description}</span>
                    <span className="whitespace-nowrap font-semibold">{Number(c.amount).toFixed(2)} {c.currency}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : c.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>{c.status.toUpperCase()}</span>
                    {c.status === 'pending' && (
                      <>
                        <button
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
                          disabled={!!busy}
                          onClick={() => run(`pay-${c.id}`, async () => {
                            const method = window.prompt('Payment method (e.g. bank transfer):');
                            if (!method) throw new Error('Cancelled.');
                            const reference = window.prompt('Payment reference / transaction ID:');
                            if (!reference) throw new Error('Cancelled.');
                            await api.post(`/api/admin/charges/${c.id}/pay`, { method, reference });
                            await reload();
                          })}
                        >
                          Record payment
                        </button>
                        <button
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
                          disabled={!!busy}
                          onClick={() => run(`waive-${c.id}`, async () => {
                            if (!window.confirm('Waive this charge? This is logged in the audit trail.')) throw new Error('Cancelled.');
                            await api.post(`/api/admin/charges/${c.id}/waive`);
                            await reload();
                          })}
                        >
                          Waive
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {charges.length === 0 && <p className="text-sm text-slate-500">No charges recorded.</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <input className="input" placeholder="Charge description" value={charge.description} onChange={(e) => setCharge({ ...charge, description: e.target.value })} />
              <input type="number" step="0.01" min="0" className="input !w-32" placeholder="USD" value={charge.amount} onChange={(e) => setCharge({ ...charge, amount: e.target.value })} />
            </div>
            <button
              className="btn-outline mt-3 !py-2.5"
              disabled={!!busy || !charge.description || !charge.amount}
              onClick={() => run('charge', async () => {
                await api.post(`/api/admin/shipments/${id}/charges`, { description: charge.description, amount: Number(charge.amount) });
                setCharge({ description: '', amount: '' });
                await reload();
              })}
            >
              {busy === 'charge' ? 'Adding…' : 'Add charge'}
            </button>
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <p className="mb-4 font-bold text-navy-900">Event history</p>
            <TrackingTimeline events={events} />
          </div>
        </div>
      )}
    </div>
  );
}
