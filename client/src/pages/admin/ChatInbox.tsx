import { useEffect, useRef, useState } from 'react';
import { api } from '../../api';

export default function ChatInbox() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [online, setOnline] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    const r = await api.get<any>('/api/admin/chat/conversations');
    setConversations(r.conversations);
    setOnline(r.online);
  }

  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(async () => {
      const r = await api.get<any>(`/api/admin/chat/conversations/${activeId}/messages`);
      setMessages(r.messages);
    }, 3000);
    return () => clearInterval(t);
  }, [activeId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function open(id: number) {
    setActiveId(id);
    const r = await api.get<any>(`/api/admin/chat/conversations/${id}/messages`);
    setMessages(r.messages);
    loadConversations();
  }

  async function send() {
    if (!body.trim() || !activeId) return;
    setBusy(true);
    try {
      await api.post(`/api/admin/chat/conversations/${activeId}/messages`, { body: body.trim() });
      setBody('');
      const r = await api.get<any>(`/api/admin/chat/conversations/${activeId}/messages`);
      setMessages(r.messages);
    } finally {
      setBusy(false);
    }
  }

  async function toggleOnline() {
    const r = await api.post<any>('/api/admin/chat/availability', { online: !online });
    setOnline(r.online);
  }

  const fmt = (t: string) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Support inbox</h1>
        <button
          className={online ? 'btn-primary !py-2.5 !bg-emerald-600 hover:!bg-emerald-700' : 'btn-outline !py-2.5'}
          onClick={toggleOnline}
        >
          {online ? 'Live chat: ONLINE' : 'Live chat: OFFLINE'}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="card divide-y divide-slate-100">
          {conversations.length === 0 && <p className="p-4 text-sm text-slate-500">No conversations yet.</p>}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c.id)}
              className={`block w-full p-4 text-left hover:bg-slate-50 ${activeId === c.id ? 'bg-navy-100' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-navy-900">{c.customer_name}</span>
                {c.unread > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-navy-900">{c.unread}</span>
                )}
              </div>
              <p className="text-xs text-slate-500">{c.customer_email || 'guest'} · {new Date(c.last_message_at).toLocaleString()}</p>
            </button>
          ))}
        </div>

        <div className="card flex h-[32rem] flex-col">
          {!activeId ? (
            <p className="m-auto text-sm text-slate-500">Select a conversation to reply as Abigail.</p>
          ) : (
            <>
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {messages.map((m) => (
                  <div key={m.id} className={m.sender === 'agent' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={
                      m.sender === 'agent'
                        ? 'max-w-[80%] rounded-lg bg-navy-800 px-3.5 py-2 text-sm text-white'
                        : 'max-w-[80%] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm'
                    }>
                      {m.sender === 'customer' && <p className="mb-0.5 text-xs font-semibold text-navy-800">{m.sender_name}</p>}
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="mt-1 text-right text-[10px] opacity-60">{fmt(m.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-slate-200 p-3">
                <input
                  className="input"
                  placeholder="Reply as Abigail…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  disabled={busy}
                />
                <button className="btn-primary !px-4" onClick={send} disabled={busy || !body.trim()}>Send</button>
                <button
                  className="btn-outline !px-4"
                  onClick={async () => {
                    if (window.confirm('Close this conversation?')) {
                      await api.post(`/api/admin/chat/conversations/${activeId}/close`);
                      loadConversations();
                      setActiveId(null);
                      setMessages([]);
                    }
                  }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
