import { DEFAULT_TEAM } from './constants/content.js';
import { normalizeSettings, DEFAULT_BRAND } from './settings.js';

/** One-level-deep merge, so settings.colors from both objects combine instead of replacing. */
function mergeSettings(a, b) {
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([k, v]) => {
    const plain = v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof HTMLElement);
    out[k] = plain && out[k] && typeof out[k] === 'object' ? { ...out[k], ...v } : v;
  });
  return out;
}

/**
 * Resolve widget config from (lowest → highest priority):
 *   build-time .env (VITE_API_BASE_URL, VITE_SOCKET_URL)  →  data-* attributes on the <script> tag  →
 *   window.ParleySettings  →  window.LLChatSettings (embed-snippet name; wins when both are set)
 */
export function resolveConfig() {
  const script = document.currentScript || document.querySelector('script[src*="parley-live-chat"]');
  const ds = (script && script.dataset) || {};
  const a = window.ParleySettings || {}, b = window.LLChatSettings || {};
  const win = { ...a, ...b };

  const apiBaseUrl = String(win.apiBaseUrl || ds.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const socketUrl = String(win.socketUrl || ds.socketUrl || import.meta.env.VITE_SOCKET_URL || '').trim();
  const brand = win.brandColor || ds.brandColor;
  const businessName = win.businessName || ds.businessName || 'Parley';

  const replyTimeText = win.replyTimeText || 'We typically reply in under 5 minutes';
  const ui = normalizeSettings(mergeSettings(a.settings, b.settings), {
    brandColor: /^#[0-9a-f]{3,8}$/i.test(brand || '') ? brand : DEFAULT_BRAND,
    replyTimeText, launcherLabel: win.launcherLabel, zIndex: win.zIndex
  });

  return {
    apiBaseUrl,
    socketUrl: apiBaseUrl ? socketUrl : '',  // sockets only make sense against a real backend
    mode: apiBaseUrl ? 'api' : 'local',
    publicKey: win.publicKey || ds.publicKey || '',
    pollInterval: Math.max(1500, +(win.pollInterval || 4000)),
    brandColor: ui.colors.brand,
    businessName,
    logoText: win.logoText || businessName.split(/\s*&\s*|\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join('&').slice(0, 3) || 'P',
    offline: win.offline === true,
    replyTimeText: ui.texts.reply_time,
    team: Array.isArray(win.team) && win.team.length ? win.team : DEFAULT_TEAM,
    proactiveAgent: win.proactiveAgent || null,
    page: win.page || {},
    user: win.user || null,               // { name, email } — identify on boot
    poweredBy: win.poweredBy !== false,
    ui                                    // display settings (settings.js)
  };
}
