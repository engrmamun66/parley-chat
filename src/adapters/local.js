import { DEFAULT_ARTICLES } from '../constants/content.js';
import { isoNow, rid } from '../utils/format.js';
import { lsGet, lsSet, lsDel } from '../utils/storage.js';

/**
 * Local demo adapter — used when VITE_API_BASE_URL is empty.
 * Keeps the visitor session in localStorage, syncs tabs over BroadcastChannel and
 * sends one canned bot reply so the UI can be exercised without a backend.
 * `simulate(type, payload)` lets a console/test play the agent side.
 */
const KEY = 'parley-local-session', CH = 'parley-local';

export function createLocalAdapter(cfg) {
  let bc = null;
  try { bc = new BroadcastChannel(CH); } catch (e) { /* unsupported */ }
  const listeners = new Set();
  const emit = (type, payload, broadcast = true) => {
    listeners.forEach((fn) => { try { fn(type, payload); } catch (e) { console.error(e); } });
    if (broadcast && bc) bc.postMessage({ type, payload });
  };
  if (bc) bc.onmessage = (e) => e.data && emit(e.data.type, e.data.payload, false);

  function read() {
    let s = lsGet(KEY);
    if (!s) { s = { visitorId: rid('v_'), conversationId: rid('c_'), name: null, email: null, status: 'open', assignee: null, messages: [], tickets: [], history: [] }; lsSet(KEY, s); }
    return s;
  }
  const write = (s) => lsSet(KEY, s);
  const mutate = (fn) => { const s = read(); const r = fn(s); write(s); return r; };
  const delay = (v) => new Promise((r) => setTimeout(() => r(v), 120));
  let botTimer = null;

  function scheduleBot() {
    clearTimeout(botTimer);
    botTimer = setTimeout(() => {
      const s = read();
      if (s.messages.some((m) => m.from === 'agent' || m.from === 'bot')) return;
      const msg = mutate((x) => {
        const m = { id: rid('m_'), from: 'bot', body: 'Thanks! You\'re #1 in the queue — someone from the team will reply shortly. Meanwhile, you can raise a ticket so nothing gets lost.', action: 'ticket', at: isoNow() };
        x.messages.push(m); return m;
      });
      emit('message.created', { conversationId: s.conversationId, message: msg });
    }, 6000);
  }

  return {
    mode: 'local',
    pushesEvents: true,

    async start() {
      const s = read();
      if (!s.history.length) {
        const t0 = Date.now() - 86400000 * 19;
        s.history.push({ id: 'seed', title: 'Battery question', agent: cfg.team[2] ? cfg.team[2].name : 'Agent', status: 'resolved', at: new Date(t0).toISOString(),
          messages: [
            { id: 's1', from: 'visitor', body: 'Hi, does the headlamp take AAA batteries or is it rechargeable only?', at: new Date(t0 - 600000).toISOString() },
            { id: 's2', from: 'agent', agent: cfg.team[2] ? cfg.team[2].name : 'Agent', body: 'Hi! It does both — it ships with a rechargeable cell, and there\'s an adapter in the box for 3 × AAA.', at: new Date(t0 - 420000).toISOString() },
            { id: 's3', from: 'visitor', body: 'Perfect, thank you!', at: new Date(t0 - 300000).toISOString() },
            { id: 's4', from: 'system', body: 'Conversation marked as resolved', at: new Date(t0).toISOString() }
          ] });
        write(s);
      }
      return delay(JSON.parse(JSON.stringify(s)));
    },
    async identify({ name, email }) {
      const s = mutate((x) => { if (name) x.name = name; if (email) x.email = email; return x; });
      emit('visitor.updated', { name: s.name, email: s.email });
      return { name: s.name, email: s.email };
    },
    pageview: async () => {},
    trackEvent: async (name, meta) => console.debug('[Parley] event', name, meta || {}),
    sync: async () => null,

    listConversations: async () => read().history.map(({ messages, ...c }) => ({ ...c, lastMessage: messages.filter((m) => m.from !== 'system').pop() || null })),
    getConversation: async (id) => {
      const s = read();
      if (id === s.conversationId) return { id, status: s.status, assignee: s.assignee, messages: s.messages };
      return read().history.find((c) => c.id === id) || null;
    },
    async sendMessage(conversationId, { body, files }) {
      const attachments = (files || []).map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) }));
      const msg = mutate((s) => {
        const m = { id: rid('m_'), from: 'visitor', body, attachments, at: isoNow() };
        s.messages.push(m); if (s.status === 'resolved') s.status = 'open'; return m;
      });
      emit('message.created', { conversationId, message: msg });
      scheduleBot();
      return delay(msg);
    },
    typing: async () => {},
    rate: async (conversationId, rating) => { mutate((s) => { s.rating = rating; }); },

    listTickets: async () => read().tickets.slice(),
    getTicket: async (id) => read().tickets.find((t) => t.id === id) || null,
    async createTicket(fields, file) {
      const t = mutate((s) => {
        const tk = { id: rid('t_'), key: 'CS-' + (522 + s.tickets.length), status: 'Open', project: 'Customer Support', assignee: null,
          ...fields, attachments: file ? [{ name: file.name, size: file.size }] : [], replies: [], at: isoNow(), updatedAt: isoNow() };
        s.tickets.push(tk); if (fields.name) s.name = fields.name; if (fields.email) s.email = fields.email; return tk;
      });
      emit('ticket.created', { ticket: t });
      return delay(t);
    },
    async replyTicket(id, body) {
      const r = { id: rid('r_'), from: 'visitor', body, at: isoNow() };
      mutate((s) => { const t = s.tickets.find((x) => x.id === id); if (t) { t.replies.push(r); t.updatedAt = r.at; } });
      return delay(r);
    },

    listArticles: async (q) => {
      q = String(q || '').trim().toLowerCase();
      return DEFAULT_ARTICLES.filter((a) => !q || (a.title + ' ' + a.body + ' ' + a.group).toLowerCase().includes(q));
    },
    voteArticle: async () => {},

    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** Dev helper: play the agent side, e.g. simulate('message.created', { message: { from:'agent', agent:'Imran Hossain', body:'Hi!' } }) */
    simulate(type, payload = {}) {
      const s = read();
      if (payload.id === 'latest' && s.tickets.length) payload = { ...payload, id: s.tickets[s.tickets.length - 1].id };
      if (type === 'message.created' && payload.message) {
        const m = { id: rid('m_'), at: isoNow(), ...payload.message };
        mutate((x) => { x.messages.push(m); if (m.agent) x.assignee = m.agent; });
        payload = { ...payload, message: m };
      }
      if (type === 'conversation.updated') mutate((x) => Object.assign(x, payload));
      if (type === 'ticket.updated') mutate((x) => { const t = x.tickets.find((k) => k.id === payload.id); if (t) Object.assign(t, payload, { updatedAt: isoNow() }); });
      emit(type, { conversationId: s.conversationId, ...payload });
    },
    reset() { lsDel(KEY); }
  };
}
