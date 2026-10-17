import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Profile() {
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<any>('/api/auth/me').then((r) => {
      setForm({ full_name: r.user.full_name || '', phone: r.user.phone || '' });
      setEmail(r.user.email);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const r = await api.put<any>('/api/auth/profile', form);
      setForm({ full_name: r.user.full_name || '', phone: r.user.phone || '' });
      setSaved(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="section-title">Profile</h1>
      <form className="card mt-6 max-w-lg space-y-4 p-6" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="p-name">Full name</label>
          <input id="p-name" className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="p-email">Email (sign-in address)</label>
          <input id="p-email" className="input" value={email} disabled />
        </div>
        <div>
          <label className="label" htmlFor="p-phone">Phone</label>
          <input id="p-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        {saved && <p className="text-sm text-emerald-600">Profile updated.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
      </form>
    </div>
  );
}
