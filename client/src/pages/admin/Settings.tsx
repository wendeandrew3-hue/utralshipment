import { useEffect, useState } from 'react';
import { api } from '../../api';
import { STATUSES } from '../../types';

interface SettingDef {
  key: string;
  type: 'string' | 'boolean' | 'integer';
  default: string;
  section: string;
  label: string;
  help?: string;
}

const SECTION_META: Record<string, { title: string; icon: string; blurb: string }> = {
  general: { title: 'General Settings', icon: '⚙️', blurb: 'Console defaults for day-to-day work.' },
  company: { title: 'Company Information', icon: '🏢', blurb: 'Used across the site and support channels.' },
  tracking: { title: 'Shipment & Tracking Settings', icon: '📦', blurb: 'How tracking codes are generated and what the public sees.' },
  support: { title: 'Customer Support & Live Chat', icon: '💬', blurb: 'Abigail, and how customers reach you.' },
  notifications: { title: 'Notifications', icon: '🔔', blurb: 'Controls the notification bell in the top bar.' },
  website: { title: 'Website Configuration', icon: '🌐', blurb: 'Public-facing site behaviour.' },
};

const SECTION_ORDER = ['general', 'company', 'tracking', 'support', 'notifications', 'website'];

export default function Settings() {
  const [defs, setDefs] = useState<SettingDef[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingSection, setSavingSection] = useState('');

  // Admin account form
  const [admin, setAdmin] = useState<any>(null);
  const [account, setAccount] = useState({ full_name: '', email: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });

  useEffect(() => {
    Promise.all([
      api.get<any>('/api/admin/settings'),
      api.get<any>('/api/admin/me'),
    ]).then(([s, m]) => {
      setDefs(s.settings);
      const v: Record<string, any> = {};
      for (const d of s.settings) v[d.key] = d.type === 'boolean' ? s.values[d.key] === 'true' : s.values[d.key];
      setValues(v);
      setAdmin(m.admin);
      setAccount({ full_name: m.admin.full_name, email: m.admin.email });
    }).catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  function flash(ok: boolean, text: string) {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 4000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveSection(section: string) {
    const keys = defs.filter((d) => d.section === section).map((d) => d.key);
    const payload: Record<string, any> = {};
    for (const k of keys) payload[k] = values[k];
    setSavingSection(section);
    try {
      const r = await api.put<any>('/api/admin/settings', payload);
      const v: Record<string, any> = { ...values };
      for (const k of Object.keys(r.values)) {
        const def = defs.find((d) => d.key === k);
        if (def) v[k] = def.type === 'boolean' ? r.values[k] === 'true' : r.values[k];
      }
      setValues(v);
      flash(true, 'Settings saved. They persist across refreshes.');
    } catch (e: any) {
      flash(false, e.message);
    } finally {
      setSavingSection('');
    }
  }

  async function saveAccount() {
    setSavingSection('account');
    try {
      const r = await api.put<any>('/api/admin/account', account);
      setAdmin(r.admin);
      flash(true, 'Administrator account updated.');
    } catch (e: any) {
      flash(false, e.message);
    } finally {
      setSavingSection('');
    }
  }

  async function savePassword() {
    setSavingSection('password');
    try {
      await api.put('/api/admin/account/password', pwForm);
      setPwForm({ current_password: '', new_password: '' });
      flash(true, 'Password changed.');
    } catch (e: any) {
      flash(false, e.message);
    } finally {
      setSavingSection('');
    }
  }

  if (!loaded) return <p className="text-sm text-slate-500">Loading…</p>;

  const setVal = (k: string) => (e: any) =>
    setValues((prev: any) => ({ ...prev, [k]: typeof e === 'boolean' ? e : e.target.value }));

  function renderField(d: SettingDef) {
    const v = values[d.key];
    if (d.type === 'boolean') {
      return (
        <button
          type="button"
          onClick={() => setValues((prev: any) => ({ ...prev, [d.key]: !prev[d.key] }))}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${v ? 'bg-royal-600' : 'bg-slate-300'}`}
          aria-label={d.label}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${v ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      );
    }
    if (d.key === 'default_new_status') {
      return (
        <select className="adm-select" value={v} onChange={setVal(d.key)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      );
    }
    if (d.key === 'site_announcement') {
      return <input className="adm-input" placeholder="Leave empty for no announcement" value={v} onChange={setVal(d.key)} />;
    }
    return <input className="adm-input" value={v} onChange={setVal(d.key)} />;
  }

  return (
    <div className="max-w-4xl">
      {toast && <p className={`mb-4 ${toast.ok ? 'adm-toast-ok' : 'adm-toast-err'}`}>{toast.text}</p>}
      <p className="text-sm text-slate-500">Every setting below is live and read by the system. Changes take effect immediately after saving.</p>

      <div className="mt-6 space-y-6">
        {SECTION_ORDER.map((section) => {
          const meta = SECTION_META[section];
          const fields = defs.filter((d) => d.section === section);
          if (!fields.length) return null;
          return (
            <div key={section} className="adm-card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                <span className="text-lg">{meta.icon}</span>
                <div>
                  <p className="adm-card-title">{meta.title}</p>
                  <p className="text-xs text-slate-500">{meta.blurb}</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {fields.map((d) => (
                  <div key={d.key} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy-900">{d.label}</p>
                      {d.help && <p className="mt-0.5 text-xs text-slate-500">{d.help}</p>}
                    </div>
                    <div className={d.type === 'boolean' ? '' : 'w-full max-w-xs'}>
                      {renderField(d)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 text-right">
                <button className="adm-btn !py-2" disabled={savingSection === section} onClick={() => saveSection(section)}>
                  {savingSection === section ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          );
        })}

        {/* Admin account & security */}
        <div className="adm-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <span className="text-lg">🔐</span>
            <div>
              <p className="adm-card-title">Admin Account & Security</p>
              <p className="text-xs text-slate-500">Your administrator login. Passwords are hashed and never stored in plain text.</p>
            </div>
          </div>
          <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile</p>
              <div>
                <label className="adm-label">Full name</label>
                <input className="adm-input" value={account.full_name} onChange={(e) => setAccount({ ...account, full_name: e.target.value })} />
              </div>
              <div>
                <label className="adm-label">Email (used to sign in)</label>
                <input className="adm-input" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
              </div>
              <button className="adm-btn w-full !py-2" disabled={savingSection === 'account'} onClick={saveAccount}>
                {savingSection === 'account' ? 'Saving…' : 'Save Account'}
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Change password</p>
              <div>
                <label className="adm-label">Current password</label>
                <input type="password" className="adm-input" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
              </div>
              <div>
                <label className="adm-label">New password (min 8 chars)</label>
                <input type="password" className="adm-input" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
              </div>
              <button
                className="adm-btn-outline w-full !py-2"
                disabled={savingSection === 'password' || !pwForm.current_password || pwForm.new_password.length < 8}
                onClick={savePassword}
              >
                {savingSection === 'password' ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
