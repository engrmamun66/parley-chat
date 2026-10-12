import { createHttp } from '../api/http.js';

/**
 * REST adapter — talks to the Parley backend at VITE_API_BASE_URL.
 * Endpoint contract is documented in README.md ("Backend API").
 * Real-time is done by polling `sync()`; a push transport (Reverb/Pusher/WebSocket) can
 * call `ParleyChat.push(event)` instead, which feeds the same store reducer.
 */
export function createApiAdapter(cfg) {
  let visitorId = null;
  const http = createHttp({ baseUrl: cfg.apiBaseUrl, publicKey: cfg.publicKey, getVisitorId: () => visitorId });
  const enc = encodeURIComponent;

  function toForm(fields, files) {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => { if (v != null) fd.append(k, v); });
    (files || []).forEach((f) => fd.append('attachments[]', f, f.name));
    return fd;
  }

  return {
    mode: 'api',
    pushesEvents: false,

    /** → { visitorId, conversationId, name, email, status, assignee, messages[], tickets[], team?, articles? } */
    async start({ visitorId: vid, conversationId, page, device }) {
      visitorId = vid || null;
      const s = await http.post('/sessions', { visitor_id: vid, conversation_id: conversationId, page, device });
      visitorId = s.visitorId || s.visitor_id || visitorId;
      return s;
    },
    identify: (data) => http.post('/visitors/identify', data),
    pageview: (page) => http.post('/events/pageview', page, { keepalive: true }).catch(() => {}),
    trackEvent: (name, meta) => http.post('/events', { name, meta }, { keepalive: true }).catch(() => {}),

    /** Poll for changes after a cursor. → { messages[], status, assignee, typing, tickets?, cursor } */
    sync: (conversationId, cursor) => http.get('/conversations/' + enc(conversationId) + '/sync', { cursor }),

    listConversations: () => http.get('/conversations'),
    getConversation: (id) => http.get('/conversations/' + enc(id)),
    sendMessage(conversationId, { body, files }) {
      const p = '/conversations/' + enc(conversationId) + '/messages';
      return files && files.length ? http.post(p, toForm({ body }, files)) : http.post(p, { body });
    },
    typing: (conversationId, text) => http.post('/conversations/' + enc(conversationId) + '/typing', { text }).catch(() => {}),
    rate: (conversationId, rating) => http.post('/conversations/' + enc(conversationId) + '/rating', { rating }),

    listTickets: () => http.get('/tickets'),
    getTicket: (id) => http.get('/tickets/' + enc(id)),
    createTicket(fields, file) { return file ? http.post('/tickets', toForm(fields, [file])) : http.post('/tickets', fields); },
    replyTicket: (id, body) => http.post('/tickets/' + enc(id) + '/replies', { body }),

    listArticles: (q) => http.get('/articles', { q }),
    voteArticle: (id, vote) => http.post('/articles/' + enc(id) + '/vote', { vote }).catch(() => {}),

    subscribe() { return () => {}; }
  };
}
