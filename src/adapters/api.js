import { createHttp } from '../api/http.js';
import { createLocalAdapter } from './local.js';

/**
 * Backend adapter — used when VITE_API_BASE_URL is set (e.g. http://parley.test/api/v1).
 *
 * The backend (parley-backend, public/api-docs/API_DOCUMENTATION.md §8) currently exposes only
 *   POST /widget/tickets   — create a support ticket (auth: X-Public-Key: pk_live_…)
 * so ticket creation goes to the server, and everything else (chat, help articles, ticket list /
 * replies) keeps running on the local adapter until matching endpoints exist.
 */
export function createApiAdapter(cfg) {
  const local = createLocalAdapter(cfg);
  const http = createHttp({ baseUrl: cfg.apiBaseUrl, publicKey: cfg.publicKey });

  /** Widget form fields → backend request fields. */
  function toRequest(fields) {
    return {
      name: fields.name,
      email: fields.email,
      subject: fields.subject,
      message: fields.body,
      category: fields.category || null,
      order_id: fields.orderId || null,
      project_key: cfg.projectKey || null,
      metadata: {
        source: 'parley-widget',
        page_url: location.href,
        page_title: document.title,
        conversation_id: fields.conversation_id || null
      }
    };
  }
  function toForm(data, file) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v == null) return;
      if (typeof v === 'object') Object.entries(v).forEach(([mk, mv]) => { if (mv != null) fd.append(`${k}[${mk}]`, mv); });
      else fd.append(k, v);
    });
    if (file) fd.append('attachments[]', file, file.name);
    return fd;
  }
  /** Backend response (documented or actual controller shape) → widget ticket. */
  function fromResponse(d, fields, file) {
    d = d || {};
    const td = d.ticket_details || {};
    const status = d.status && typeof d.status === 'object' ? d.status.name : d.status;
    const project = d.project && typeof d.project === 'object' ? d.project.name : null;
    const customer = d.customer || d.requester || {};
    return {
      id: String(d.ticket_id ?? d.id),
      key: d.ticket_key || d.key || null,
      subject: d.subject || d.title || fields.subject,
      body: fields.body,
      status: status || 'Open',
      project: project || d.project_key || 'Customer Support',
      category: d.category ?? td.category ?? fields.category ?? null,
      orderId: d.order_id ?? td.order_id ?? fields.orderId ?? null,
      name: customer.name || fields.name,
      email: customer.email || fields.email,
      assignee: null,
      attachments: d.attachments || (file ? [{ name: file.name, size: file.size }] : []),
      replies: [],
      at: d.created_at || new Date().toISOString(),
      updatedAt: d.created_at || new Date().toISOString(),
      remote: true
    };
  }

  return {
    ...local,
    mode: 'api',

    async createTicket(fields, file) {
      const data = toRequest(fields);
      const res = await http.post('/widget/tickets', file ? toForm(data, file) : data);
      // No GET endpoint yet: keep a copy in the visitor's browser so Tickets / ticket detail can show it.
      return local.saveTicket(fromResponse(res, fields, file));
    }
  };
}
