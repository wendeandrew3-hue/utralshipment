import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { ChatMessage } from '../types';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{ online: boolean; agentName: string; email: string; phone: string } | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [body, setBody] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);

  useEffect(() => {
    api.get<any>('/api/chat/status').then(setStatus).catch(() => setStatus(null));
  }, [open]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      try {
        const r = await api.get<any>(
          `/api/chat/conversations/${conversationId}/messages?after=${lastIdRef.current}`
        );
        if (r.messages.length) {
          setMessages((prev) => [...prev, ...r.messages]);
          lastIdRef.current = r.messages[r.messages.length - 1].id;
        }
      } catch {
        /* transient network error; next poll will retry */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function startConversation() {
    setBusy(true);
    setError('');
    try {
      const r = await api.post<any>('/api/chat/conversations', { name, email, phone });
      setConversationId(r.conversation.id);
      setStarted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!body.trim() || !conversationId) return;
    setBusy(true);
    setError('');
    const text = body.trim();
    setBody('');
    try {
      const r = await api.post<any>(`/api/chat/conversations/${conversationId}/messages`, { body: text });
      setMessages((prev) => [...prev, r.message]);
      lastIdRef.current = r.message.id;
    } catch (e: any) {
      setBody(text);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const fmt = (t: string) =>
    new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-navy-800 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-navy-700"
        aria-label="Open live chat"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 01-4.255-.949L3 20l1.395-3.972C3.512 14.782 3 13.468 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Chat with us
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-navy-800 px-4 py-3 text-white">
        <div>
          <p className="text-sm font-bold">
            {status?.agentName || 'Abigail'} · Customer Support
          </p>
          <p className="text-xs text-slate-200">
            {status?.online ? 'Online' : 'Offline'}
          </p>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-slate-200 hover:text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {status && !status.online && !started && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Live support is currently offline. Leave a message and we'll reply by email, or call{' '}
          <a className="font-semibold underline" href="tel:+12016032142">{status.phone}</a> / email{' '}
          <a className="font-semibold underline" href="mailto:Utralshipment@gmail.com">{status.email}</a>.
        </div>
      )}

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {messages.map((m) => (
          <div key={m.id} className={m.sender === 'customer' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.sender === 'customer'
                  ? 'max-w-[80%] rounded-lg bg-navy-800 px-3.5 py-2 text-sm text-white'
                  : 'max-w-[80%] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm'
              }
            >
              {m.sender === 'agent' && <p className="mb-0.5 text-xs font-semibold text-navy-800">{m.sender_name}</p>}
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className="mt-1 text-right text-[10px] opacity-60">{fmt(m.created_at)}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && started && (
          <p className="text-center text-xs text-slate-500">
            You're connected. Abigail or another agent will respond as soon as possible.
          </p>
        )}
      </div>

      {!started ? (
        <div className="space-y-2 border-t border-slate-200 p-4">
          <input className="input" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button
            className="btn-primary w-full"
            disabled={busy}
            onClick={startConversation}
          >
            {busy ? 'Starting…' : 'Start Chat — no account needed'}
          </button>
        </div>
      ) : (
        <div className="border-t border-slate-200 p-3">
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Type your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              disabled={busy}
            />
            <button className="btn-primary !px-4" onClick={send} disabled={busy || !body.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
