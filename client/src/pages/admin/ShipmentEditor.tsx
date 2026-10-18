import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import TrackingTimeline, { StatusBadge } from '../../components/TrackingTimeline';
import { STATUSES } from '../../types';

const emptyForm = {
  user_email: '', sender_name: '', sender_contact: '', recipient_name: '',
  recipient_contact: '', origin: '', destination: '', service_type: 'standard',
  package_description: '', weight_kg: '', estimated_delivery: '',
  initial_status: 'Shipment Registered', admin_notes: '',
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

  // Creation success panel
  const [created, setCreated] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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
        sender_name: r.shipment.sender_name === 'Not specified' ? '' : r.shipment.sender_name,
        sender_contact: r.shipment.sender_contact || '',
        recipient_name: r.shipment.recipient_name, recipient_contact: r.shipment.recipient_contact || '',
        origin: r.shipment.origin, destination: r.shipment.destination,
        service_type: r.shipment.service_type, package_description: r.shipment.package_description || '',
        weight_kg: r.shipment.weight_kg ?? '', estimated_delivery: r.shipment.estimated_delivery || '',
        initial_status: r.shipment.status, admin_notes: r.shipment.admin_notes || '',
      });
    }).catch((e: any) => setError(e.message));
  }, [id, isNew]);

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name);
    setError('');
    setMsg('');
    try {
      await fn();
      setMsg('Saved successfully.');
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

  function buildPayload() {
    const payload: any = { ...form };
    payload.weight_kg = payload.weight_kg !== '' ? Number(payload.weight_kg) : null;
    if (!payload.estimated_delivery) payload.estimated_delivery = null;
    if (!payload.sender_name) payload.sender_name = '';
    if (!payload.sender_contact) payload.sender_contact = '';
    if (!payload.recipient_contact) payload.recipient_contact = '';
    return payload;
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inputCls = 'adm-input';
  const labelCls = 'adm-label';

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/shipments" className="text-sm font-bold text-royal-700 hover:underline">← Back to shipments</Link>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-navy-900">
            {isNew ? 'Create New Shipment' : `Shipment ${shipment?.tracking_number || ''}`}
          </h1>
          {isNew && <p className="mt-1 text-sm text-slate-500">No customer account or email needed. The tracking code is generated automatically.</p>}
        </div>
        {!isNew && shipment && <StatusBadge status={shipment.status} />}
      </div>

      {msg && <p className="adm-toast-ok mt-4">{msg}</p>}
      {error && <p className="adm-toast-err mt-4">{error}</p>}

      {/* ============ SUCCESS PANEL (new shipment) ============ */}
      {created && (
        <div className="adm-card mt-6 overflow-hidden border-emerald-300 ring-2 ring-emerald-500/10">
          <div className="bg-emerald-600 px-6 py-3.5">
            <p className="flex items-center gap-2 font-display text-base font-extrabold text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              Shipment created successfully
            </p>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500">Share this tracking code with your customer. It works on the public tracking page right now.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border-2 border-navy-900 bg-navy-950 px-6 py-3.5 font-mono text-2xl font-bold tracking-wider text-gold-light">
                {created.tracking_number}
              </div>
              <button className="adm-btn" onClick={() => copyCode(created.tracking_number)}>
                {copied ? '✓ Copied' : 'Copy Tracking Code'}
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={`/track?number=${created.tracking_number}`} target="_blank" rel="noreferrer" className="adm-btn-gold">Open Public Tracking Page ↗</a>
              <button className="adm-btn-outline" onClick={() => navigate(`/admin/shipments/${created.id}`)}>Manage This Shipment</button>
              <button className="adm-btn-outline" onClick={() => { setCreated(null); setForm(emptyForm); }}>Create Another</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DETAILS FORM ============ */}
      <div className={`adm-card mt-6 p-6 ${created ? 'opacity-95' : ''}`}>
        <p className="adm-card-title mb-5">{isNew ? 'Shipment details' : 'Edit details'}</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelCls}>Recipient name *</label>
            <input className={inputCls} placeholder="Who is receiving it" value={form.recipient_name} onChange={set('recipient_name')} />
          </div>
          <div>
            <label className={labelCls}>Recipient phone or email <span className="normal-case text-slate-400">(optional)</span></label>
            <input className={inputCls} placeholder="Optional" value={form.recipient_contact} onChange={set('recipient_contact')} />
          </div>
          <div>
            <label className={labelCls}>Customer account email <span className="normal-case text-slate-400">(optional)</span></label>
            <input className={inputCls} placeholder="Only if they have a portal account" value={form.user_email} onChange={set('user_email')} />
          </div>
          <div>
            <label className={labelCls}>Sender name <span className="normal-case text-slate-400">(optional)</span></label>
            <input className={inputCls} value={form.sender_name} onChange={set('sender_name')} />
          </div>
          <div>
            <label className={labelCls}>Sender contact <span className="normal-case text-slate-400">(optional)</span></label>
            <input className={inputCls} value={form.sender_contact} onChange={set('sender_contact')} />
          </div>
          <div>
            <label className={labelCls}>Service</label>
            <select className="adm-select" value={form.service_type} onChange={set('service_type')}>
              <option value="standard">Standard</option><option value="air_freight">Air freight</option>
              <option value="sea_freight">Sea freight</option><option value="road_transport">Road transport</option>
              <option value="express">Express</option>
            </select>
          </div>
          <div><label className={labelCls}>Origin *</label><input className={inputCls} placeholder="e.g. Shenzhen, China" value={form.origin} onChange={set('origin')} /></div>
          <div><label className={labelCls}>Destination *</label><input className={inputCls} placeholder="e.g. Nairobi, Kenya" value={form.destination} onChange={set('destination')} /></div>
          <div><label className={labelCls}>Weight (kg) <span className="normal-case text-slate-400">(optional)</span></label><input type="number" step="0.01" min="0" className={inputCls} value={form.weight_kg} onChange={set('weight_kg')} /></div>
          <div className="md:col-span-2"><label className={labelCls}>Shipment description</label><input className={inputCls} placeholder="What is being shipped" value={form.package_description} onChange={set('package_description')} /></div>
          <div><label className={labelCls}>Estimated delivery <span className="normal-case text-slate-400">(optional)</span></label><input type="date" className={inputCls} value={form.estimated_delivery?.slice?.(0, 10) || form.estimated_delivery} onChange={set('estimated_delivery')} /></div>
          {isNew && (
            <div>
              <label className={labelCls}>Initial status</label>
              <select className="adm-select" value={form.initial_status} onChange={set('initial_status')}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className={labelCls}>Internal admin notes <span className="normal-case text-slate-400">(never shown to customers)</span></label>
            <textarea className={inputCls} rows={2} placeholder="Private notes for your team" value={form.admin_notes} onChange={set('admin_notes')} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isNew ? (
            <button
              className="adm-btn"
              disabled={!!busy}
              onClick={() => run('create', async () => {
                const payload = buildPayload();
                const r = await api.post<any>('/api/admin/shipments', payload);
                setCreated(r.shipment);
              })}
            >
              {busy === 'create' ? 'Creating…' : 'Create Shipment & Generate Tracking Code'}
            </button>
          ) : (
            <button
              className="adm-btn"
              disabled={!!busy}
              onClick={() => run('save', async () => {
                await api.put(`/api/admin/shipments/${id}`, buildPayload());
                await reload();
              })}
            >
              {busy === 'save' ? 'Saving…' : 'Save Changes'}
            </button>
          )}
          {!isNew && shipment && (
            <>
              <button className="adm-btn-outline" onClick={() => copyCode(shipment.tracking_number)}>Copy Tracking Code</button>
              <a href={`/track?number=${shipment.tracking_number}`} target="_blank" rel="noreferrer" className="adm-btn-outline">Open Tracking Page ↗</a>
            </>
          )}
        </div>
        {!isNew && owner && <p className="mt-3 text-xs text-slate-500">Linked customer account: {owner.full_name} ({owner.email})</p>}
        {!isNew && !owner && shipment && <p className="mt-3 text-xs text-slate-500">Guest shipment: not linked to any customer account.</p>}
      </div>

      {/* ============ EXISTING SHIPMENT MANAGEMENT ============ */}
      {!isNew && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Status update */}
          <div className="adm-card p-6">
            <p className="adm-card-title mb-5">Update status / add tracking event</p>
            <div className="space-y-3">
              <select className="adm-select" value={event.status} onChange={(e) => setEvent({ ...event, status: e.target.value })}>
                <option value="">Select status…</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className={inputCls} placeholder="Description (customers see this on the tracking page)" value={event.description} onChange={(e) => setEvent({ ...event, description: e.target.value })} />
              <input className={inputCls} placeholder="Location (optional)" value={event.location} onChange={(e) => setEvent({ ...event, location: e.target.value })} />
              <button
                className="adm-btn w-full"
                disabled={!!busy || !event.status || event.description.trim().length < 3}
                onClick={() => run('event', async () => {
                  if (!window.confirm(`Add status "${event.status}"? Customers will see this on the public tracking page.`)) throw new Error('Cancelled.');
                  await api.post(`/api/admin/shipments/${id}/events`, event);
                  setEvent({ status: '', description: '', location: '' });
                  await reload();
                })}
              >
                {busy === 'event' ? 'Adding…' : 'Add Tracking Event'}
              </button>
            </div>
          </div>

          {/* Hold / release */}
          <div className="adm-card p-6">
            <p className="adm-card-title mb-5">Hold / release</p>
            {shipment?.status === 'On Hold' ? (
              <div className="space-y-3">
                <p className="adm-pill adm-pill-amber !rounded-lg !px-3 !py-2 !text-xs !normal-case !tracking-normal">On hold: {shipment.hold_reason}</p>
                <input className={inputCls} placeholder="Release notes (optional)" value={hold.notes} onChange={(e) => setHold({ ...hold, notes: e.target.value })} />
                <button
                  className="adm-btn w-full"
                  disabled={!!busy}
                  onClick={() => run('release', async () => {
                    if (!window.confirm('Release this shipment back to In Transit? Pending charges must be settled or waived first.')) throw new Error('Cancelled.');
                    await api.post(`/api/admin/shipments/${id}/release`, { notes: hold.notes });
                    setHold({ reason: '', notes: '', charge_description: '', charge_amount: '' });
                    await reload();
                  })}
                >
                  {busy === 'release' ? 'Releasing…' : 'Release Shipment'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input className={inputCls} placeholder="Reason for hold *" value={hold.reason} onChange={(e) => setHold({ ...hold, reason: e.target.value })} />
                <input className={inputCls} placeholder="Notes shown to customer (optional)" value={hold.notes} onChange={(e) => setHold({ ...hold, notes: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} placeholder="Extra charge description (optional)" value={hold.charge_description} onChange={(e) => setHold({ ...hold, charge_description: e.target.value })} />
                  <input className={inputCls} type="number" placeholder="Amount (optional)" value={hold.charge_amount} onChange={(e) => setHold({ ...hold, charge_amount: e.target.value })} />
                </div>
                <button
                  className="adm-btn-danger w-full"
                  disabled={!!busy || hold.reason.trim().length < 3}
                  onClick={() => run('hold', async () => {
                    if (!window.confirm('Place this shipment on hold? The customer will see the hold reason on the tracking page.')) throw new Error('Cancelled.');
                    await api.post(`/api/admin/shipments/${id}/hold`, {
                      reason: hold.reason, notes: hold.notes,
                      charge_description: hold.charge_description || undefined,
                      charge_amount: hold.charge_amount ? Number(hold.charge_amount) : undefined,
                    });
                    setHold({ reason: '', notes: '', charge_description: '', charge_amount: '' });
                    await reload();
                  })}
                >
                  {busy === 'hold' ? 'Holding…' : 'Place On Hold'}
                </button>
              </div>
            )}
          </div>

          {/* Charges */}
          <div className="adm-card p-6">
            <p className="adm-card-title mb-5">Charges</p>
            <div className="space-y-3">
              <input className={inputCls} placeholder="Charge description *" value={charge.description} onChange={(e) => setCharge({ ...charge, description: e.target.value })} />
              <input className={inputCls} type="number" placeholder="Amount (USD) *" value={charge.amount} onChange={(e) => setCharge({ ...charge, amount: e.target.value })} />
              <button
                className="adm-btn-outline w-full"
                disabled={!!busy || !charge.description || !charge.amount}
                onClick={() => run('charge', async () => {
                  await api.post(`/api/admin/shipments/${id}/charges`, { description: charge.description, amount: Number(charge.amount) });
                  setCharge({ description: '', amount: '' });
                  await reload();
                })}
              >
                {busy === 'charge' ? 'Adding…' : 'Add Charge'}
              </button>
              {charges.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {charges.map((c: any) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <span className="text-slate-600">{c.description}</span>
                      <span className="flex items-center gap-2 font-semibold">
                        ${Number(c.amount).toFixed(2)}
                        <span className={`adm-pill ${c.status === 'paid' ? 'adm-pill-green' : c.status === 'pending' ? 'adm-pill-amber' : 'adm-pill-navy'}`}>{c.status}</span>
                        {c.status === 'pending' && (
                          <>
                            <button
                              className="text-xs font-bold text-emerald-700 hover:underline"
                              onClick={() => run(`pay${c.id}`, async () => {
                                const method = window.prompt('Payment method (e.g. M-Pesa, bank transfer)?');
                                if (!method) throw new Error('Cancelled.');
                                const reference = window.prompt('Payment reference / transaction ID?');
                                if (!reference) throw new Error('Cancelled.');
                                await api.post(`/api/admin/charges/${c.id}/pay`, { method, reference });
                                await reload();
                              })}
                            >
                              Record Payment
                            </button>
                            <button
                              className="text-xs font-bold text-slate-500 hover:underline"
                              onClick={() => run(`waive${c.id}`, async () => {
                                if (!window.confirm('Waive this charge?')) throw new Error('Cancelled.');
                                await api.post(`/api/admin/charges/${c.id}/waive`);
                                await reload();
                              })}
                            >
                              Waive
                            </button>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* History */}
          <div className="adm-card p-6">
            <p className="adm-card-title mb-5">Tracking history ({events.length})</p>
            <TrackingTimeline events={events} />
          </div>
        </div>
      )}
    </div>
  );
}
