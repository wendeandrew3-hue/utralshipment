import { useState } from 'react';
import { api } from '../../api';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const conv = await api.post<any>('/api/chat/conversations', { name, email });
      await api.post(`/api/chat/conversations/${conv.conversation.id}/messages`, { body: message });
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="section-title">Contact us</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-bold text-navy-900">Customer support</h2>
            <p className="mt-2 text-sm text-slate-600">Our team is here to help with tracking, bookings, holds and charges.</p>
            <div className="mt-4 space-y-2 text-sm font-medium">
              <p>Phone: <a className="text-navy-800 underline" href="tel:+12016032142">+1 201-603-2142</a></p>
              <p>Email: <a className="text-navy-800 underline" href="mailto:Utralshipment@gmail.com">Utralshipment@gmail.com</a></p>
              <p>Live chat: ask for Abigail using the chat button on any page.</p>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-bold text-navy-900">Hours</h2>
            <p className="mt-2 text-sm text-slate-600">Support is available around the clock for shipment emergencies; live chat hours vary. When chat is offline, leave a message and we reply by email.</p>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-navy-900">Send us a message</h2>
          {done ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Message received. We'll get back to you as soon as possible.
            </div>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={send}>
              <div>
                <label className="label" htmlFor="c-name">Name</label>
                <input id="c-name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="c-email">Email</label>
                <input id="c-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="c-msg">Message</label>
                <textarea id="c-msg" className="input min-h-32" required value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send Message'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
