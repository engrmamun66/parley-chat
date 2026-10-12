export function toDate(at) {
  if (!at) return null;
  const d = new Date(at);
  return isNaN(d.getTime()) ? null : d;
}

const fmtTime = (() => {
  try { const f = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }); return (d) => f.format(d); }
  catch (e) { return (d) => d.toTimeString().slice(0, 5); }
})();
const fmtDay = (() => {
  try { const f = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }); return (d) => f.format(d); }
  catch (e) { return (d) => d.toDateString().slice(4, 10); }
})();

/** Clock time in the visitor's browser timezone (raw string if it isn't a date). */
export function clock(at) {
  const d = toDate(at);
  if (!d) return at ? String(at) : '';
  return new Date().toDateString() === d.toDateString() ? fmtTime(d) : fmtDay(d) + ', ' + fmtTime(d);
}

export function ago(at) {
  const d = toDate(at);
  if (!d) return at ? String(at) : '';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 45) return 'Just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  if (s < 86400 * 7) return Math.round(s / 86400) + 'd ago';
  return fmtDay(d);
}

export const isoNow = () => new Date().toISOString();
export const rid = (p) => p + Math.random().toString(36).slice(2, 10);
export const firstName = (n) => (n ? String(n).trim().split(/\s+/)[0] : '');
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());

export function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function fileMeta(f) {
  const kb = Math.max(1, Math.round(((f && f.size) || 0) / 1024));
  return { name: (f && f.name) || 'file', size: kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB' };
}

/** Map any backend status string onto the 4-step ticket timeline. */
export function normStatus(v) {
  const x = String(v || 'Open').toLowerCase().replace(/[_-]/g, ' ');
  if (/resolv|closed|done/.test(x)) return { label: 'Resolved', cls: 'resolved', step: 3 };
  if (/progress|pending|waiting/.test(x)) return { label: 'In progress', cls: 'progress', step: 2 };
  if (/assign/.test(x)) return { label: 'Assigned', cls: 'open', step: 1 };
  return { label: 'Open', cls: 'open', step: 0 };
}
