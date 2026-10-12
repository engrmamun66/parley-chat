/** Tiny fetch wrapper: base URL, auth headers, JSON in/out, FormData passthrough. */
class HttpError extends Error {
  constructor(status, body) { super((body && body.message) || 'Request failed (' + status + ')'); this.status = status; this.body = body; }
}

export function createHttp({ baseUrl, publicKey, getVisitorId }) {
  async function request(method, path, data, opts = {}) {
    const headers = { Accept: 'application/json', 'X-Parley-Key': publicKey };
    const vid = getVisitorId && getVisitorId();
    if (vid) headers['X-Parley-Visitor'] = vid;
    let body;
    if (data instanceof FormData) body = data;
    else if (data !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(data); }

    let url = baseUrl + path;
    if (opts.query) {
      const q = new URLSearchParams(Object.entries(opts.query).filter(([, v]) => v != null && v !== ''));
      if ([...q].length) url += (url.includes('?') ? '&' : '?') + q;
    }
    const res = await fetch(url, { method, headers, body, credentials: 'omit', keepalive: !!opts.keepalive });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = { message: text }; }
    if (!res.ok) throw new HttpError(res.status, json);
    // Accept both `{ data: … }` envelopes (Laravel resources) and bare payloads.
    return json && Object.prototype.hasOwnProperty.call(json, 'data') && Object.keys(json).length <= 3 ? json.data : json;
  }
  return {
    get: (p, query) => request('GET', p, undefined, { query }),
    post: (p, d, o) => request('POST', p, d, o)
  };
}
