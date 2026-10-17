import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function Login() {
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
      await api.post('/api/auth/login', { email, password });
      navigate('/portal');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title">Sign in</h1>
      <form className="card mt-8 space-y-4 p-6" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="l-email">Email</label>
          <input id="l-email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="l-pass">Password</label>
          <input id="l-pass" type="password" className="input" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        <p className="text-center text-sm text-slate-500">
          No account? <Link to="/register" className="font-semibold text-navy-800">Register</Link>
        </p>
      </form>
    </div>
  );
}
