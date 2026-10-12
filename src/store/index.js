import { reactive, computed, inject } from 'vue';
import { firstName, isoNow, normStatus, rid, toDate } from '../utils/format.js';
import { lsGet, lsSet, lsDel } from '../utils/storage.js';
import { createSocket } from '../adapters/socket.js';

const UI_KEY = 'parley-ui', ST_KEY = 'parley-state', VID_KEY = 'parley-visitor';
const DETAIL = { chat: 1, article: 1, ticket: 1, newTicket: 1, ticketDone: 1 };
export const StoreKey = Symbol('parley-store');
export const useStore = () => inject(StoreKey);

/**
 * Central widget store. Views read `state`/getters and call actions; the adapter (API or local)
 * does I/O; every server-side change — poll result or pushed event — goes through `applyEvent`.
 */
export function createStore(cfg, adapter) {
  const savedUi = lsGet(UI_KEY) || {};
  const state = reactive({
    cfg,
    ready: false,
    error: null,
    connected: false,    // true while the WebSocket is up (polling paused)
    open: false,
    view: savedUi.view || 'home',
    param: savedUi.param ?? null,
    from: savedUi.from || null,

    session: { visitorId: null, conversationId: null, name: null, email: null, status: 'open', assignee: null },
    messages: [],        // live conversation
    history: [],         // past conversations (list items)
    viewing: null,       // past conversation opened from Messages: { id, title, agent, messages }
    tickets: [],
    articles: [],
    articleQuery: '',

    typingAgent: null,
    local: freshLocal(null), // widget-only state: read marker, system lines, csat, votes…
    pendingFiles: [],
    pop: null,
    toast: null,
    composerPrefill: null
  });

  function freshLocal(convId) {
    return { convId, readAgent: null, extras: [], csat: null, lastStatus: 'open', proactiveSeen: {}, votes: {} };
  }
  const saveUi = () => lsSet(UI_KEY, { open: state.open, view: state.view, param: state.param, from: state.from });
  const saveLocal = () => lsSet(ST_KEY, state.local);

  /* ------------------------------------------------------------ getters */
  const agentCount = computed(() => state.messages.filter((m) => m.from === 'agent').length);
  const visitorCount = computed(() => state.messages.filter((m) => m.from === 'visitor').length);
  const unread = computed(() => Math.max(0, agentCount.value - (state.local.readAgent || 0)));
  const assignee = computed(() => {
    if (state.session.assignee) return state.session.assignee;
    const a = state.messages.filter((m) => m.from === 'agent' && m.agent).pop();
    return a ? a.agent : null;
  });
  /** Live messages + widget-local lines (joined, resolved, csat, proactive), in time order. */
  const timeline = computed(() => {
    const items = state.messages.map((m, i) => ({ ...m, _i: i }))
      .concat(state.local.extras.map((e, i) => ({ ...e, from: e.kind, _i: 1000 + i })));
    items.sort((a, b) => ((toDate(a.at) || 0) - (toDate(b.at) || 0)) || a._i - b._i);
    return items;
  });
  const lastMessage = computed(() => {
    const all = timeline.value.filter((m) => m.from === 'visitor' || m.from === 'agent' || m.from === 'bot');
    return all[all.length - 1] || null;
  });
  const ticketList = computed(() => state.tickets.slice().sort((a, b) => (toDate(b.at) || 0) - (toDate(a.at) || 0)));
  const openTickets = computed(() => state.tickets.filter((t) => normStatus(t.status).step < 3).length);

  /* ------------------------------------------------------------ navigation */
  function go(view, param = null) {
    if (DETAIL[view] && !DETAIL[state.view] && state.view !== view) state.from = state.view;
    state.view = view; state.param = param;
    if (view === 'chat' && param && param !== 'live') loadPast(param);
    if (view === 'chat' && param === 'live' && state.open) markRead();
    if (view === 'messages') refreshHistory();
    if (view === 'tickets' || view === 'home') refreshTickets();
    saveUi();
  }
  function back() {
    const v = state.view;
    if (v === 'chat') return go(state.from === 'home' ? 'home' : 'messages');
    if (v === 'article') return go('help');
    if (v === 'ticket' || v === 'ticketDone') return go('tickets');
    if (v === 'newTicket') return go(state.from && !DETAIL[state.from] ? state.from : 'home');
    go('home');
  }
  function openPanel(view, param) {
    state.open = true; state.pop = null;
    if (view) go(view, param ?? null);
    else if (state.view === 'chat' && state.param === 'live') markRead();
    saveUi();
  }
  function closePanel() { state.open = false; saveUi(); }
  function toggle() { state.open ? closePanel() : openPanel(); }

  function markRead() {
    if (state.local.readAgent !== agentCount.value) { state.local.readAgent = agentCount.value; saveLocal(); }
  }
  function isReadingLive() {
    return state.open && state.view === 'chat' && state.param === 'live' && !document.hidden;
  }

  /* ------------------------------------------------------------ feedback */
  let toastTimer = null;
  function toast(text) {
    clearTimeout(toastTimer);
    state.toast = { id: rid('t'), text };
    toastTimer = setTimeout(() => { state.toast = null; }, 3800);
  }
  function showPop(pop) { if (!state.open) state.pop = pop; }
  function fail(e, msg) { console.warn('[Parley]', e); toast(msg || 'Something went wrong — please try again.'); }

  /* ------------------------------------------------------------ boot */
  async function boot() {
    try {
      const page = { url: cfg.page.path || location.pathname, title: cfg.page.title || document.title, type: cfg.page.type || null, referrer: document.referrer || null };
      const s = await adapter.start({
        visitorId: lsGet(VID_KEY), conversationId: (lsGet(ST_KEY) || {}).convId || null, page,
        device: { ua: navigator.userAgent, lang: navigator.language, tz: tz(), mobile: /Mobile/.test(navigator.userAgent) }
      });
      hydrate(s);
      if (cfg.mode === 'api') adapter.pageview(page);
      if (cfg.user && (cfg.user.name || cfg.user.email)) identify(cfg.user);
      state.ready = true;
      refreshTickets();
    } catch (e) {
      state.error = 'We couldn\'t connect to chat right now.';
      console.warn('[Parley] boot failed', e);
    }
  }
  function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return null; } }

  function hydrate(s) {
    s = s || {};
    state.session = {
      visitorId: s.visitorId || s.visitor_id || null,
      conversationId: s.conversationId || s.conversation_id || null,
      name: s.name || null, email: s.email || null,
      status: s.status || 'open', assignee: s.assignee || null
    };
    lsSet(VID_KEY, state.session.visitorId);
    state.messages = (s.messages || []).map(normMessage);
    if (s.tickets) state.tickets = s.tickets.map(normTicket);
    if (s.history) state.history = s.history;
    if (s.articles) state.articles = s.articles;
    cursor = s.cursor || null;

    const saved = lsGet(ST_KEY);
    state.local = saved && saved.convId === state.session.conversationId ? { ...freshLocal(null), ...saved } : freshLocal(state.session.conversationId);
    if (state.local.readAgent == null) state.local.readAgent = agentCount.value;
    state.local.lastStatus = state.session.status;
    saveLocal();
  }
  function normMessage(m) {
    return { id: m.id || rid('m_'), from: m.from || m.sender || 'agent', agent: m.agent || m.agent_name || null, body: m.body || '', at: m.at || m.created_at || isoNow(),
      attachments: m.attachments || [], action: m.action || null };
  }
  function normTicket(t) {
    return { ...t, id: t.id || t.ticketId, at: t.at || t.created_at, updatedAt: t.updatedAt || t.updated_at || t.at || t.created_at, replies: t.replies || [] };
  }

  /* ------------------------------------------------------------ event reducer */
  /**
   * Apply a server event. Types:
   *   message.created      { conversationId, message }
   *   typing               { conversationId, agent }
   *   conversation.updated { conversationId, status?, assignee? }
   *   ticket.created       { ticket }
   *   ticket.updated       { id, status?, assignee?, replies? }
   *   visitor.updated      { name?, email? }
   */
  let typingTimer = null;
  function applyEvent(type, p = {}) {
    if (p.conversationId && state.session.conversationId && p.conversationId !== state.session.conversationId && type.indexOf('ticket') !== 0) return;
    if (type === 'message.created' && p.message) {
      const m = normMessage(p.message);
      if (state.messages.some((x) => x.id === m.id)) return;
      state.messages.push(m);
      if (m.from === 'agent') {
        state.typingAgent = null;
        if (isReadingLive()) markRead();
        else if (m.body) showPop({ agent: m.agent || 'Agent', title: firstName(m.agent || 'Agent') + ' from ' + cfg.businessName, body: m.body, withReply: true, view: 'chat', param: 'live' });
      } else if (m.from === 'bot' && !state.open) {
        showPop({ agent: null, title: cfg.businessName, body: m.body, view: 'chat', param: 'live' });
      }
    } else if (type === 'typing') {
      state.typingAgent = p.agent || assignee.value || 'Agent';
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => { state.typingAgent = null; }, 3000);
    } else if (type === 'conversation.updated') {
      if (p.assignee && p.assignee !== state.session.assignee) {
        state.session.assignee = p.assignee;
        state.local.extras.push({ kind: 'system', body: p.assignee + ' joined the conversation', at: p.at || isoNow() });
      }
      if (p.status && p.status !== state.local.lastStatus) {
        if (p.status === 'resolved') {
          state.local.extras.push({ kind: 'system', body: 'Conversation marked as resolved', at: p.at || isoNow() });
          state.local.extras.push({ kind: 'csat', at: p.at || isoNow() }); state.local.csat = null;
        } else if (state.local.lastStatus === 'resolved') {
          state.local.extras.push({ kind: 'system', body: 'Conversation reopened', at: p.at || isoNow() });
        }
        state.session.status = p.status; state.local.lastStatus = p.status;
      }
      saveLocal();
    } else if (type === 'ticket.created' && p.ticket) {
      const t = normTicket(p.ticket);
      if (!state.tickets.some((x) => x.id === t.id)) state.tickets.push(t);
    } else if (type === 'ticket.updated') {
      const t = state.tickets.find((x) => x.id === p.id);
      if (!t) return;
      const before = normStatus(t.status).label;
      Object.assign(t, normTicket({ ...t, ...p }));
      const after = normStatus(t.status).label;
      if (before !== after) {
        const label = (t.key || 'Your ticket') + ' is now ' + after;
        if (state.open) toast(label);
        else showPop({ agent: t.assignee || null, title: cfg.businessName + ' support', body: label + (t.assignee ? ' — ' + t.assignee + ' is on it.' : ''), view: 'ticket', param: t.id });
      }
    } else if (type === 'visitor.updated') {
      if (p.name) state.session.name = p.name;
      if (p.email) state.session.email = p.email;
    }
  }

  function upsertTicket(raw) {
    const t = normTicket(raw);
    if (state.tickets.some((x) => x.id === t.id)) applyEvent('ticket.updated', t);
    else applyEvent('ticket.created', { ticket: t });
  }

  /* ------------------------------------------------------------ polling (API mode) */
  let cursor = null, pollTimer = null, polls = 0;
  async function poll() {
    if (!state.session.conversationId) return;
    try {
      const r = await adapter.sync(state.session.conversationId, cursor);
      if (!r) return;
      if (r.cursor) cursor = r.cursor;
      (r.messages || []).forEach((m) => applyEvent('message.created', { message: m }));
      if (r.typing) applyEvent('typing', { agent: r.typing.agent || r.typing });
      if (r.status || r.assignee) applyEvent('conversation.updated', { status: r.status, assignee: r.assignee });
      (r.tickets || []).forEach(upsertTicket);
      state.error = null;
    } catch (e) {
      if (++polls % 5 === 0) console.warn('[Parley] sync failed', e);
    }
  }
  let socket = null;
  function startRealtime() {
    adapter.subscribe(applyEvent);
    if (adapter.pushesEvents) return;
    if (cfg.socketUrl) {
      socket = createSocket(cfg, {
        getSession: () => state.session,
        onEvent: applyEvent,
        onStatus: (up) => { const was = state.connected; state.connected = up; if (up && !was) poll(); } // catch up after (re)connect
      });
    }
    const tick = () => {
      // Socket up → only a slow safety-net poll. Otherwise poll faster while the visitor watches the live chat.
      const base = isReadingLive() ? cfg.pollInterval : cfg.pollInterval * (document.hidden ? 6 : 2);
      const ms = state.connected ? Math.max(base, 60000) : base;
      pollTimer = setTimeout(async () => { await poll(); tick(); }, ms);
    };
    tick();
    window.addEventListener('focus', poll);
  }
  function stopRealtime() {
    clearTimeout(pollTimer); window.removeEventListener('focus', poll);
    if (socket) { socket.close(); socket = null; state.connected = false; }
  }

  /* ------------------------------------------------------------ actions: chat */
  async function sendMessage(text) {
    text = String(text || '').trim();
    const files = state.pendingFiles.map((p) => p.file);
    if (!text && !files.length) return false;
    if (cfg.offline && !state.session.email) return 'need-email';
    const temp = { id: rid('tmp_'), from: 'visitor', body: text, at: isoNow(), attachments: state.pendingFiles.map((p) => ({ name: p.name, size: p.size })), pending: true };
    state.messages.push(temp);
    state.pendingFiles = [];
    try {
      const saved = await adapter.sendMessage(state.session.conversationId, { body: text, files });
      const i = state.messages.indexOf(temp);
      const real = normMessage(saved || temp);
      if (state.messages.some((m) => m !== temp && m.id === real.id)) state.messages.splice(i, 1);
      else if (i > -1) state.messages.splice(i, 1, real);
      return true;
    } catch (e) {
      temp.pending = false; temp.failed = true;
      fail(e, 'Message not sent — check your connection.');
      return false;
    }
  }
  async function retryMessage(m) {
    const i = state.messages.indexOf(m);
    if (i > -1) state.messages.splice(i, 1);
    return sendMessage(m.body);
  }
  let lastTyping = 0, typingTrail = null;
  function visitorTyping(text) {
    const send = () => {
      lastTyping = Date.now();
      // Prefer the socket for typing pings; REST otherwise.
      if (!(socket && socket.send('visitor.typing', { conversationId: state.session.conversationId, text }))) adapter.typing(state.session.conversationId, text);
    };
    clearTimeout(typingTrail);
    if (Date.now() - lastTyping > 1500) send(); else typingTrail = setTimeout(send, 1500);
  }
  function addFile(file) {
    if (!file) return;
    const kb = Math.max(1, Math.round(file.size / 1024));
    state.pendingFiles.push({ file, name: file.name, size: kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB' });
  }
  function removeFile(i) { state.pendingFiles.splice(i, 1); }
  async function rate(face) {
    state.local.csat = face; saveLocal();
    try { await adapter.rate(state.session.conversationId, face); } catch (e) { console.warn('[Parley] rating failed', e); }
  }
  async function identify({ name, email } = {}) {
    const p = {};
    if (name && name !== state.session.name) p.name = name;
    if (email && email !== state.session.email) p.email = email;
    if (!p.name && !p.email) return;
    Object.assign(state.session, p);
    try { await adapter.identify({ name: state.session.name, email: state.session.email }); } catch (e) { fail(e); }
  }
  async function refreshHistory() {
    try { const list = await adapter.listConversations(); if (Array.isArray(list)) state.history = list.filter((c) => c.id !== state.session.conversationId); } catch (e) { /* keep cached */ }
  }
  async function loadPast(id) {
    const cached = state.history.find((c) => c.id === id);
    state.viewing = cached ? { ...cached, messages: cached.messages || null } : { id, messages: null };
    try {
      const c = await adapter.getConversation(id);
      if (c && state.param === id) state.viewing = { ...state.viewing, ...c, messages: (c.messages || []).map(normMessage) };
    } catch (e) { fail(e); }
  }
  function proactive(text, delayMs = 0, agent = null) {
    if (!text) return;
    setTimeout(() => {
      if (state.open || state.local.proactiveSeen[text]) return;
      const who = agent || cfg.proactiveAgent || (cfg.team[1] || cfg.team[0] || {}).name || cfg.businessName;
      state.pop = { agent: who, title: firstName(who) + ' from ' + cfg.businessName, body: text, withReply: true, view: 'chat', param: 'live', proactive: text };
    }, Math.max(0, +delayMs || 0));
  }
  /** Proactive card was opened → turn it into a real line in the chat. */
  function acceptPop(pop) {
    state.pop = null;
    if (pop.proactive) {
      state.local.proactiveSeen[pop.proactive] = true;
      state.local.extras.push({ kind: 'agent', agent: pop.agent, body: pop.body, at: isoNow() });
      saveLocal();
    }
    openPanel(pop.view, pop.param);
  }
  function dismissPop(pop) {
    state.pop = null;
    if (pop && pop.proactive) { state.local.proactiveSeen[pop.proactive] = true; saveLocal(); }
  }

  /* ------------------------------------------------------------ actions: tickets & help */
  async function refreshTickets() {
    if (!state.ready && cfg.mode === 'api') return;
    try { const list = await adapter.listTickets(); if (Array.isArray(list)) state.tickets = list.map(normTicket); } catch (e) { /* keep cached */ }
  }
  async function loadTicket(id) {
    try { const t = await adapter.getTicket(id); if (t) upsertTicket(t); } catch (e) { /* keep cached */ }
  }
  async function createTicket(fields, file) {
    await identify({ name: fields.name, email: fields.email });
    const t = normTicket(await adapter.createTicket({ ...fields, conversation_id: state.session.conversationId }, file));
    if (!state.tickets.some((x) => x.id === t.id)) state.tickets.push(t);
    return t;
  }
  async function replyTicket(id, body) {
    const r = await adapter.replyTicket(id, body);
    const t = state.tickets.find((x) => x.id === id);
    if (t) { t.replies = (t.replies || []).concat(r || { body, at: isoNow(), from: 'visitor' }); t.updatedAt = isoNow(); }
    toast('Reply added to ' + (t && t.key ? t.key : 'your ticket'));
  }
  let searchSeq = 0;
  async function searchArticles(q) {
    state.articleQuery = q || '';
    const seq = ++searchSeq;
    try { const list = await adapter.listArticles(q); if (seq === searchSeq && Array.isArray(list)) state.articles = list; } catch (e) { /* keep cached */ }
  }
  function vote(id, v) { state.local.votes[id] = v; saveLocal(); adapter.voteArticle(id, v); }

  /** "Raise a ticket" from chat: prefill from what the visitor already wrote. */
  function ticketPrefillFromChat() {
    const msgs = state.messages.filter((m) => m.from === 'visitor').map((m) => m.body);
    const joined = msgs.join('\n');
    const order = (joined.match(/[A-Z]{2,4}-?\d{3,}/i) || [])[0];
    const t = joined.toLowerCase();
    const category = /return|exchange|refund|size|fit/.test(t) ? 'Returns & exchanges'
      : /order|deliver|track|ship|parcel|where is/.test(t) ? 'Order issue'
      : /pay|charge|bill|invoice|card/.test(t) ? 'Billing & payments'
      : /site|page|error|checkout|login/.test(t) ? 'Website problem' : 'Product question';
    return { category, orderId: order ? order.toUpperCase() : '', subject: (msgs[0] || '').slice(0, 70), body: joined };
  }

  function reset() {
    stopRealtime();
    if (adapter.reset) adapter.reset();
    [UI_KEY, ST_KEY, VID_KEY].forEach(lsDel);
    state.open = false; state.view = 'home'; state.param = null; state.messages = []; state.tickets = []; state.history = [];
    boot().then(startRealtime);
  }

  return {
    state,
    agentCount, visitorCount, unread, assignee, timeline, lastMessage, ticketList, openTickets,
    go, back, openPanel, closePanel, toggle, markRead, toast, acceptPop, dismissPop, proactive,
    boot, startRealtime, applyEvent,
    sendMessage, retryMessage, visitorTyping, addFile, removeFile, rate, identify,
    loadTicket, createTicket, replyTicket, searchArticles, vote, ticketPrefillFromChat, reset
  };
}
