import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/api/auth/register', form);
      navigate('/portal');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title">Create your account</h1>
      <form className="card mt-8 space-y-4 p-6" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="r-name">Full name</label>
          <input id="r-name" className="input" required value={form.full_name} onChange={set('full_name')} />
        </div>
        <div>
          <label className="label" htmlFor="r-email">Email</label>
          <input id="r-email" type="email" className="input" required value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label" htmlFor="r-phone">Phone (optional)</label>
          <input id="r-phone" className="input" value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="label" htmlFor="r-pass">Password (min 8 characters)</label>
          <input id="r-pass" type="password" className="input" required minLength={8} value={form.password} onChange={set('password')} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create Account'}</button>
        <p className="text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-semibold text-navy-800">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
