/**
 * Real-time WebSocket transport (VITE_SOCKET_URL).
 *
 * Connects to  <socketUrl>?key=<publicKey>&visitor=<visitorId>&conversation=<conversationId>
 * Server → widget frames are JSON, either { type, payload } or { event, data }, where type is one of
 * the store events (message.created, typing, conversation.updated, ticket.created, ticket.updated,
 * visitor.updated). Widget → server frames use the same { type, payload } shape (visitor.typing, ping).
 * Reconnects with exponential backoff; while disconnected the store falls back to REST polling.
 */
export function createSocket(cfg, { getSession, onEvent, onStatus }) {
  let ws = null, retry = 0, retryTimer = null, pingTimer = null, closed = false;

  function url() {
    const s = getSession();
    const q = new URLSearchParams({ key: cfg.publicKey || '', visitor: s.visitorId || '', conversation: s.conversationId || '' });
    return cfg.socketUrl + (cfg.socketUrl.includes('?') ? '&' : '?') + q;
  }
  function connect() {
    if (closed || typeof WebSocket === 'undefined') return;
    try { ws = new WebSocket(url()); } catch (e) { return schedule(); }
    ws.onopen = () => {
      retry = 0; onStatus(true);
      clearInterval(pingTimer);
      pingTimer = setInterval(() => send('ping', {}), 25000);
    };
    ws.onmessage = (e) => {
      let msg; try { msg = JSON.parse(e.data); } catch (err) { return; }
      const type = msg.type || msg.event, payload = msg.payload || msg.data || {};
      if (type && type !== 'pong') onEvent(type, typeof payload === 'string' ? safeJson(payload) : payload);
    };
    ws.onclose = () => { clearInterval(pingTimer); onStatus(false); schedule(); };
    ws.onerror = () => { try { ws.close(); } catch (e) { /* ignore */ } };
  }
  function schedule() {
    if (closed) return;
    clearTimeout(retryTimer);
    const ms = Math.min(30000, 1000 * 2 ** retry++) + Math.random() * 500;
    retryTimer = setTimeout(connect, ms);
  }
  function send(type, payload) {
    if (ws && ws.readyState === 1) { ws.send(JSON.stringify({ type, payload })); return true; }
    return false;
  }
  const safeJson = (s) => { try { return JSON.parse(s); } catch (e) { return {}; } };

  connect();
  return {
    send,
    isOpen: () => !!ws && ws.readyState === 1,
    close() { closed = true; clearTimeout(retryTimer); clearInterval(pingTimer); if (ws) try { ws.close(); } catch (e) { /* ignore */ } }
  };
}
