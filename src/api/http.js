/** Tiny fetch wrapper: base URL, public-key auth, JSON in/out, FormData passthrough. */
class HttpError extends Error {
  constructor(status, body) { super((body && body.message) || 'Request failed (' + status + ')'); this.status = status; this.body = body; }
}

export function createHttp({ baseUrl, publicKey }) {
  async function request(method, path, data, opts = {}) {
    const headers = { Accept: 'application/json', 'X-Public-Key': publicKey };
    let body;
    if (data instanceof FormData) body = data;
    else if (data !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(data); }

    let url = baseUrl + path;
    if (opts.query) {
      const q = new URLSearchParams(Object.entries(opts.query).filter(([, v]) => v != null && v !== ''));
      if ([...q].length) url += (url.includes('?') ? '&' : '?') + q;
    }
    let res;
    try { res = await fetch(url, { method, headers, body, credentials: 'omit', keepalive: !!opts.keepalive }); }
    catch (e) { throw new HttpError(0, { message: 'Can\'t reach the server — check your connection.' }); }
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = { message: text }; }
    if (!res.ok || (json && json.success === false)) {
      if (res.status === 429) json = { ...json, message: 'Too many requests — please wait a minute and try again.' };
      throw new HttpError(res.status, json);
    }
    // Backend envelope: { success, message, data } → data. Bare payloads pass through.
    return json && Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json;
  }
  return {
    get: (p, query) => request('GET', p, undefined, { query }),
    post: (p, d, o) => request('POST', p, d, o)
  };
}
