import { DEFAULT_TEAM } from './constants/content.js';

/**
 * Resolve widget config from (lowest → highest priority):
 *   build-time .env (VITE_API_BASE_URL, VITE_SOCKET_URL)  →  data-* attributes on the <script> tag  →  window.ParleySettings
 * window.LLChatSettings is accepted as a legacy alias.
 */
export function resolveConfig() {
  const script = document.currentScript || document.querySelector('script[src*="parley-live-chat"]');
  const ds = (script && script.dataset) || {};
  const win = window.ParleySettings || window.LLChatSettings || {};

  const apiBaseUrl = String(win.apiBaseUrl || ds.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const socketUrl = String(win.socketUrl || ds.socketUrl || import.meta.env.VITE_SOCKET_URL || '').trim();
  const brand = win.brandColor || ds.brandColor;
  const businessName = win.businessName || ds.businessName || 'Parley';

  return {
    apiBaseUrl,
    socketUrl: apiBaseUrl ? socketUrl : '',  // sockets only make sense against a real backend
    mode: apiBaseUrl ? 'api' : 'local',
    publicKey: win.publicKey || ds.publicKey || '',
    pollInterval: Math.max(1500, +(win.pollInterval || 4000)),
    brandColor: /^#[0-9a-f]{3,8}$/i.test(brand || '') ? brand : '#1F5C45',
    businessName,
    logoText: win.logoText || businessName.split(/\s*&\s*|\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join('&').slice(0, 3) || 'P',
    offline: win.offline === true,
    launcherLabel: win.launcherLabel || null,
    replyTimeText: win.replyTimeText || 'We typically reply in under 5 minutes',
    team: Array.isArray(win.team) && win.team.length ? win.team : DEFAULT_TEAM,
    proactiveAgent: win.proactiveAgent || null,
    page: win.page || {},
    user: win.user || null,               // { name, email } — identify on boot
    poweredBy: win.poweredBy !== false,
    zIndex: win.zIndex || 2147483647
  };
}
