import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/api/admin/login', { email, password });
      navigate('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4"
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(46,91,235,0.25), transparent), linear-gradient(180deg,#041226,#082347)' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-royal-600 font-display text-xl font-extrabold text-white shadow-lg">U</div>
          <p className="font-display text-2xl font-extrabold tracking-tight text-white">
            Utral<span className="text-gold-light">shipment</span>
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Admin Console</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white p-7 shadow-2xl">
          <p className="font-display text-lg font-extrabold text-navy-900">Sign in</p>
          <p className="mt-0.5 text-xs text-slate-500">Authorized administrators only.</p>
          {error && <p className="adm-toast-err mt-4">{error}</p>}
          <div className="mt-5 space-y-4">
            <div>
              <label className="adm-label">Email</label>
              <input className="adm-input" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
            </div>
            <div>
              <label className="adm-label">Password</label>
              <input className="adm-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <button className="adm-btn mt-6 w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
          <p className="mt-5 text-center text-xs text-slate-400">
            <Link to="/" className="font-semibold text-royal-700 hover:underline">← Back to public website</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
