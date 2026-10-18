import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';

export default function ChatInbox() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [online, setOnline] = useState(false);
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function loadConversations(f = filter) {
    const r = await api.get<any>(`/api/admin/chat/conversations?status=${f}`);
    setConversations(r.conversations);
    setOnline(r.online);
  }

  useEffect(() => {
    loadConversations();
    const t = setInterval(() => loadConversations(), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Poll the open thread only. Keyed strictly by activeId so switching
  // customers can never leak one conversation's messages into another's panel.
  useEffect(() => {
    if (!activeId) { setMessages([]); setRelated([]); return; }
    let alive = true;
    const fetchThread = async () => {
      try {
        const r = await api.get<any>(`/api/admin/chat/conversations/${activeId}/messages`);
        if (alive) setMessages(r.messages);
      } catch { /* transient */ }
    };
    fetchThread();
    const t = setInterval(fetchThread, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [activeId]);

  // Load shipments mentioned in this conversation
  useEffect(() => {
    if (!activeId) { setRelated([]); return; }
    let alive = true;
    api.get<any>(`/api/admin/chat/conversations/${activeId}/shipments`)
      .then((r) => { if (alive) setRelated(r.shipments); })
      .catch(() => {});
    const t = setInterval(() => {
      api.get<any>(`/api/admin/chat/conversations/${activeId}/shipments`)
        .then((r) => { if (alive) setRelated(r.shipments); })
        .catch(() => {});
    }, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [activeId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function open(id: number) {
    if (id === activeId) return;
    setActiveId(id);
    setMessages([]);
    setRelated([]);
    setBody('');
  }

  async function send() {
    const text = body.trim();
    if (!text || !activeId || busy) return;
    setBusy(true);
    try {
      const r = await api.post<any>(`/api/admin/chat/conversations/${activeId}/messages`, { body: text });
      setMessages((prev) => [...prev, r.message]);
      setBody('');
      loadConversations();
    } catch (e: any) {
      alert(e.message || 'Could not send the message.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleOnline() {
    const r = await api.post<any>('/api/admin/chat/availability', { online: !online });
    setOnline(r.online);
  }

  async function setStatus(status: 'open' | 'closed') {
    if (!activeId) return;
    await api.post(`/api/admin/chat/conversations/${activeId}/${status === 'closed' ? 'close' : 'reopen'}`);
    loadConversations();
  }

  const active = conversations.find((c) => c.id === activeId) || null;
  const fmt = (t: string) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDay = (t: string) => new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {(['open', 'closed', 'all'] as const).map((f) => (
            <button
              key={f}
              className={`rounded-md px-4 py-1.5 text-xs font-bold capitalize transition ${filter === f ? 'bg-royal-600 text-white' : 'text-slate-500 hover:text-navy-900'}`}
              onClick={() => { setFilter(f); setActiveId(null); }}
            >
              {f} {f === 'open' && `(${conversations.length})`}
            </button>
          ))}
        </div>
        <button
          className={online ? 'adm-btn !bg-emerald-600 hover:!bg-emerald-700' : 'adm-btn-outline'}
          onClick={toggleOnline}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${online ? 'bg-white' : 'bg-slate-400'}`} />
          {online ? 'Abigail is ONLINE' : 'Abigail is OFFLINE'}
        </button>
      </div>

      <div className="adm-card mt-5 grid overflow-hidden lg:grid-cols-[21rem_1fr]" style={{ height: 'calc(100vh - 12rem)', minHeight: '30rem' }}>
        {/* Conversation list */}
        <div className="flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <p className="border-b border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Conversations</p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.length === 0 && <p className="p-4 text-sm text-slate-500">No {filter === 'all' ? '' : filter} conversations.</p>}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => open(c.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3.5 text-left transition last:border-0 ${
                  activeId === c.id ? 'bg-royal-50 shadow-[inset_3px_0_0_#2E5BEB]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${c.status === 'open' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="truncate text-sm font-bold text-navy-900">{c.customer_name || 'Guest visitor'}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] text-slate-400">{fmt(c.last_message_at)}</span>
                    {c.unread > 0 && (
                      <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-extrabold text-navy-950">{c.unread}</span>
                    )}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {c.last_message ? `“${c.last_message}”` : 'No messages yet'}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {c.customer_email || 'guest session'}{c.user_id ? ' · registered' : ''}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-0 flex-col">
          {!active ? (
            <div className="m-auto text-center">
              <p className="text-sm font-semibold text-slate-500">Select a customer to open their conversation.</p>
              <p className="mt-1 text-xs text-slate-400">Replies are always sent to the selected conversation only.</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
                <div>
                  <p className="font-display text-sm font-extrabold text-navy-900">
                    {active.customer_name || 'Guest visitor'}
                    <span className={`adm-pill ml-2 ${active.status === 'open' ? 'adm-pill-green' : 'adm-pill-navy'}`}>{active.status}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {active.customer_email || 'No email provided · guest session'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="adm-btn-outline !px-3 !py-1.5 !text-xs" onClick={() => setStatus(active.status === 'open' ? 'closed' : 'open')}>
                    {active.status === 'open' ? 'Resolve' : 'Reopen'}
                  </button>
                </div>
              </div>

              {/* Related shipments */}
              {related.length > 0 && (
                <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-gold-50/50 px-5 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-800">Mentioned shipments:</span>
                  {related.map((s) => (
                    <Link
                      key={s.id}
                      to={`/admin/shipments/${s.id}`}
                      className="rounded-full border border-gold/40 bg-white px-3 py-1 text-[11px] font-bold text-navy-900 shadow-sm transition hover:border-royal-600 hover:text-royal-700"
                      title={`${s.recipient_name || ''} → ${s.destination}: ${s.latest_event_description || s.status}`}
                    >
                      {s.tracking_number} · {s.status}
                    </Link>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
                {messages.map((m) => (
                  <div key={m.id} className={m.sender === 'agent' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={m.sender === 'agent' ? 'adm-msg-agent' : 'adm-msg-customer'}>
                      {m.sender === 'customer' && <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-royal-700">{m.sender_name || 'Customer'}</p>}
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 text-right text-[10px] ${m.sender === 'agent' ? 'text-white/60' : 'text-slate-400'}`}>{fmtDay(m.created_at)}</p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="pt-6 text-center text-sm text-slate-400">No messages in this conversation yet.</p>}
              </div>

              {/* Composer */}
              <div className="flex gap-2 border-t border-slate-200 p-3">
                <input
                  className="adm-input"
                  placeholder={`Reply to ${active.customer_name || 'this customer'} as Abigail…`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  disabled={busy}
                />
                <button className="adm-btn !px-5" onClick={send} disabled={busy || !body.trim()}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
