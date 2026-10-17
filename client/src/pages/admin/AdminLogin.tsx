import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-display text-xl font-extrabold text-navy-900">Admin sign in</h1>
        <p className="mt-1 text-xs text-slate-500">Authorized staff only. All actions are logged.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input type="email" className="input" placeholder="Admin email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="input" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}
