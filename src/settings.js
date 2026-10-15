/**
 * Display settings for the chat icon (launcher) and chat box, from window.LLChatSettings.settings
 * (or window.ParleySettings.settings). Every key is optional; bad values fall back to the default
 * with a console warning. Full reference: README.md → "Display settings".
 */
export const POSITIONS = ['bottom_right', 'bottom_left', 'top_right', 'top_left'];
export const ANIMATIONS = ['default', 'fade', 'zoom', 'pop', 'slide_up', 'slide_down', 'slide_left', 'slide_right'];
export const SECTIONS = ['messages', 'help', 'tickets'];
const START_VIEWS = ['home', 'chat', 'messages', 'help', 'tickets'];

export const DEFAULT_SETTINGS = {
  display_in: 'body',            // 'body' | '#element_id' | HTMLElement — where the widget is mounted
  chat_icon: true,               // show the round chat icon (launcher)
  chat_icon_size: 56,            // px
  chat_icon_label: null,         // small text bubble next to the icon, e.g. 'Chat with us'
  unread_badge: true,            // red unread counter on the icon
  fullscreen_icon: true,         // expand/collapse button before the chat box close button
  chatbox_position: {
    position: 'bottom_right',    // bottom_right | bottom_left | top_right | top_left
    adjust_x: 0,                 // px; + moves right, − moves left
    adjust_y: 0                  // px; + moves down,  − moves up
  },
  width: 380,                    // chat box size in px (capped to the screen/container)
  height: 640,
  border_radius: 16,             // px
  mobile_fullscreen: true,       // chat box fills the screen at ≤ 480px wide
  opening_animation: 'default',  // see ANIMATIONS; closing always plays the reverse
  animation_duration: 280,       // ms
  colors: {
    primary: null,               // any CSS color — buttons, icon, header, own bubbles (default: brandColor)
    primary_bg: '#ffffff',       // chat box background
    on_primary: 'auto',          // text/icon color on primary; 'auto' picks black or white for contrast
    text: '#071437'              // main text color
  },
  font_family: null,             // e.g. 'Poppins, sans-serif' (font must already be loaded by the page)
  z_index: 2147483647,
  start_view: 'home',            // first screen: home | chat | messages | help | tickets
  sections: { messages: true, help: true, tickets: true }, // hide whole tabs
  open_on_load: false,           // false | true | delay in ms
  remember_state: true,          // reopen on the same screen after a page reload
  close_on_escape: true,
  hide_on_paths: [],             // e.g. ['/checkout', '/admin/*'] — widget not shown on these pages
  texts: {
    greeting: 'Hi there 👋',     // '{name}' is replaced with the visitor's first name when known
    greeting_named: 'Hi {name} 👋',
    tagline: 'How can we help?',
    reply_time: null              // default: replyTimeText
  },
  open_proxy: {
    element: null,               // '#element_id' | any CSS selector | HTMLElement — clicking it opens the chat
    mode: 'open',                // open | toggle
    target: '_self',             // _self | _blank (only used with url)
    url: null                    // e.g. '/contact' — go there first (unless already on it), then open
  }
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v) && !(typeof HTMLElement !== 'undefined' && v instanceof HTMLElement);
const warn = (key, v, fallback) => console.warn('[Parley] settings.' + key + ': invalid value', v, '— using', fallback);

function color(key, v, fallback) {
  if (v == null || v === '') return fallback;
  try { if (CSS.supports('color', String(v))) return String(v); } catch (e) { return String(v); }
  warn(key, v, fallback);
  return fallback;
}
function oneOf(key, v, list, fallback) {
  if (v == null) return fallback;
  const x = String(v).toLowerCase().replace(/[-\s]/g, '_');
  if (list.includes(x)) return x;
  warn(key, v, fallback);
  return fallback;
}
function num(key, v, fallback, min = -Infinity, max = Infinity) {
  if (v == null || v === '') return fallback;
  const n = Number(String(v).replace(/px$/, ''));
  if (Number.isFinite(n)) return Math.min(max, Math.max(min, n));
  warn(key, v, fallback);
  return fallback;
}
const bool = (v, fallback) => (v == null ? fallback : v === true || v === 'true' || v === 1);

export function normalizeSettings(raw, { brandColor, replyTimeText, launcherLabel, zIndex } = {}) {
  const r = isObj(raw) ? raw : {};
  const D = DEFAULT_SETTINGS;
  const pos = isObj(r.chatbox_position) ? r.chatbox_position : {};
  const col = isObj(r.colors) ? r.colors : {};
  const sec = isObj(r.sections) ? r.sections : {};
  const txt = isObj(r.texts) ? r.texts : {};
  const proxy = isObj(r.open_proxy) ? r.open_proxy : {};

  let openOnLoad = D.open_on_load;
  if (r.open_on_load === true) openOnLoad = 0;
  else if (r.open_on_load != null && r.open_on_load !== false) openOnLoad = num('open_on_load', r.open_on_load, false, 0);

  return {
    display_in: r.display_in || D.display_in,
    chat_icon: bool(r.chat_icon, D.chat_icon),
    chat_icon_size: num('chat_icon_size', r.chat_icon_size, D.chat_icon_size, 32, 96),
    chat_icon_label: r.chat_icon_label != null ? String(r.chat_icon_label) : launcherLabel || null,
    unread_badge: bool(r.unread_badge, D.unread_badge),
    fullscreen_icon: bool(r.fullscreen_icon, D.fullscreen_icon),
    chatbox_position: {
      position: oneOf('chatbox_position.position', pos.position, POSITIONS, D.chatbox_position.position),
      adjust_x: num('chatbox_position.adjust_x', pos.adjust_x, 0),
      adjust_y: num('chatbox_position.adjust_y', pos.adjust_y, 0)
    },
    width: num('width', r.width, D.width, 280, 1200),
    height: num('height', r.height, D.height, 360, 1400),
    border_radius: num('border_radius', r.border_radius, D.border_radius, 0, 40),
    mobile_fullscreen: bool(r.mobile_fullscreen, D.mobile_fullscreen),
    opening_animation: oneOf('opening_animation', r.opening_animation, ANIMATIONS, D.opening_animation),
    animation_duration: num('animation_duration', r.animation_duration, D.animation_duration, 0, 2000),
    colors: {
      primary: color('colors.primary', col.primary, brandColor || '#1F5C45'),
      primary_bg: color('colors.primary_bg', col.primary_bg, D.colors.primary_bg),
      on_primary: col.on_primary == null || col.on_primary === 'auto' ? 'auto' : color('colors.on_primary', col.on_primary, 'auto'),
      text: color('colors.text', col.text, D.colors.text)
    },
    font_family: r.font_family ? String(r.font_family) : null,
    z_index: num('z_index', r.z_index, zIndex || D.z_index, 0),
    start_view: oneOf('start_view', r.start_view, START_VIEWS, D.start_view),
    sections: Object.fromEntries(SECTIONS.map((k) => [k, bool(sec[k], true)])),
    open_on_load: openOnLoad,
    remember_state: bool(r.remember_state, D.remember_state),
    close_on_escape: bool(r.close_on_escape, D.close_on_escape),
    hide_on_paths: Array.isArray(r.hide_on_paths) ? r.hide_on_paths.map(String) : [],
    texts: {
      greeting: txt.greeting != null ? String(txt.greeting) : D.texts.greeting,
      greeting_named: txt.greeting_named != null ? String(txt.greeting_named) : D.texts.greeting_named,
      tagline: txt.tagline != null ? String(txt.tagline) : D.texts.tagline,
      reply_time: txt.reply_time != null ? String(txt.reply_time) : replyTimeText
    },
    open_proxy: {
      element: proxy.element || null,
      mode: oneOf('open_proxy.mode', proxy.mode, ['open', 'toggle'], D.open_proxy.mode),
      target: oneOf('open_proxy.target', proxy.target, ['_self', '_blank'], D.open_proxy.target),
      url: proxy.url ? String(proxy.url) : null
    }
  };
}

/** '/admin/*' style matching against the current path. */
export function pathMatches(patterns, path = location.pathname) {
  const norm = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p);
  return patterns.some((p) => {
    const re = new RegExp('^' + norm(p).split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    return re.test(norm(path));
  });
}

/** Resolve '#id' / selector / HTMLElement → element (or null). */
export function resolveElement(target) {
  if (!target) return null;
  if (typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) return target;
  if (target === 'body') return document.body;
  try { return document.querySelector(String(target)); } catch (e) { return null; }
}

function luminance(color, probeParent) {
  const el = document.createElement('span');
  el.style.color = color;
  (probeParent || document.body).appendChild(el);
  const m = getComputedStyle(el).color.match(/[\d.]+/g) || [0, 0, 0];
  el.remove();
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(+m[0]) + 0.7152 * lin(+m[1]) + 0.0722 * lin(+m[2]);
}
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** 'auto' → readable text color (dark ink or white) on the primary color. */
export function contrastOn(primary) {
  const L = luminance(primary);
  return ratio(L, 1) >= ratio(L, 0.008) ? '#ffffff' : '#071437'; // 0.008 ≈ luminance of #071437
}

/** Primary used as text/icons on the chat box background: darkened toward `text` when too faint (< 3:1). */
export function inkOn(primary, bg, text) {
  return ratio(luminance(primary), luminance(bg)) >= 3 ? primary : `color-mix(in srgb, ${primary} 45%, ${text})`;
}
