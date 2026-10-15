/*
 * Parley Chat — embeddable live chat + ticketing widget.
 *
 * Embed:
 *   <script>window.ParleySettings = { publicKey: 'pk_live_…', brandColor: '#1F5C45', businessName: 'Harbor & Pine' }</script>
 *   <script src="parley-live-chat.js" defer></script>
 *
 * API:  Parley('show' | 'hide' | 'toggle' | 'fullscreen' | 'showNewMessage' | 'showTicketForm' | 'identify' | 'trackEvent' |
 *              'proactive' | 'onUnreadCountChange' | 'reset', arg)
 *       window.ParleyChat.{ open, close, toggle, newMessage, newTicket, identify, proactive, push, … }
 */
import { createApp, watch } from 'vue';
import App from './App.vue';
import css from './styles/widget.css?inline';
import { resolveConfig } from './config.js';
import { createStore, StoreKey } from './store/index.js';
import { createApiAdapter } from './adapters/api.js';
import { createLocalAdapter } from './adapters/local.js';
import { pathMatches, resolveElement } from './settings.js';

(function () {
  if (window.ParleyChat && window.ParleyChat.__mounted) return;

  const cfg = resolveConfig();
  const adapter = cfg.mode === 'api' ? createApiAdapter(cfg) : createLocalAdapter(cfg);
  const store = createStore(cfg, adapter);

  /* ---- public API ---- */
  const unreadFns = [];
  const API = {
    __mounted: true,
    version: __PARLEY_VERSION__,
    mode: cfg.mode,
    open: (view, param) => store.openPanel(view || undefined, param),
    close: () => store.closePanel(),
    toggle: () => store.toggle(),
    fullscreen: (on) => store.toggleFullscreen(on),
    newMessage(prefill) { store.openPanel('chat', 'live'); if (prefill) store.state.composerPrefill = String(prefill); },
    newTicket: (prefill) => store.openPanel('newTicket', prefill || {}),
    identify: (o) => store.identify(o || {}),
    proactive: (text, delayMs, agent) => store.proactive(text, delayMs, agent),
    trackEvent: (name, meta) => adapter.trackEvent(name, meta),
    onUnreadCountChange(fn) { if (typeof fn === 'function') { unreadFns.push(fn); try { fn(store.unread.value); } catch (e) { /* ignore */ } } },
    unreadCount: () => store.unread.value,
    /** Feed a real-time event from your own socket (Reverb/Pusher/WS) — see README "Real-time". */
    push: (type, payload) => store.applyEvent(type, payload),
    reset: () => store.reset()
  };
  if (adapter.simulate) API.simulate = adapter.simulate; // local demo mode only

  function Parley(cmd, arg, arg2) {
    switch (cmd) {
      case 'show': return API.open(typeof arg === 'string' ? arg : undefined);
      case 'hide': return API.close();
      case 'toggle': return API.toggle();
      case 'fullscreen': return API.fullscreen(arg);
      case 'showNewMessage': return API.newMessage(arg);
      case 'showTicketForm': return API.newTicket(arg);
      case 'identify': return API.identify(arg);
      case 'trackEvent': return API.trackEvent(arg, arg2);
      case 'proactive': return arg && typeof arg === 'object' ? API.proactive(arg.text, arg.delayMs, arg.agent) : API.proactive(arg, arg2);
      case 'onUnreadCountChange': return API.onUnreadCountChange(arg);
      case 'reset': return API.reset();
      default: console.warn('[Parley] unknown command', cmd);
    }
  }

  // Calls made before the script loaded, via a queue stub named Parley or LLChat (embed snippet):
  //   window.LLChat = function () { LLChat.q.push(arguments) }; LLChat.q = [];
  const queued = [].concat((window.Parley && window.Parley.q) || [], (window.LLChat && window.LLChat.q) || []);
  window.Parley = window.LLChat = Parley;
  window.ParleyChat = API;

  watch(() => store.unread.value, (n) => unreadFns.forEach((fn) => { try { fn(n); } catch (e) { /* ignore */ } }));

  /* ---- open_proxy: page elements that open the chat ---- */
  const OPEN_PARAM = 'parley_open';
  const samePage = (url) => {
    const a = new URL(url, location.href), norm = (p) => p.replace(/\/+$/, '') || '/';
    return a.origin === location.origin && norm(a.pathname) === norm(location.pathname);
  };
  function wireOpenProxy() {
    const px = cfg.ui.open_proxy;
    if (!px.element) return;
    const matches = (el) => (px.element instanceof HTMLElement ? px.element.contains(el) : !!(el.closest && el.closest(px.element)));
    // Delegated, so the trigger may be added to the page later.
    document.addEventListener('click', (e) => {
      if (!matches(e.target)) return;
      e.preventDefault();
      if (px.url && !samePage(px.url)) {
        const u = new URL(px.url, location.href);
        u.searchParams.set(OPEN_PARAM, '1');           // the target page opens the chat on load
        if (px.target === '_blank') window.open(u.href, '_blank', 'noopener'); else location.href = u.href;
        return;
      }
      if (px.mode === 'toggle') store.toggle(); else store.openPanel();
    });
  }
  /** Came here from an open_proxy link → open, then drop the marker from the address bar. */
  function consumeOpenParam() {
    const u = new URL(location.href);
    if (!u.searchParams.has(OPEN_PARAM)) return false;
    u.searchParams.delete(OPEN_PARAM);
    try { history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch (e) { /* ignore */ }
    return true;
  }

  /* ---- mount into an isolated Shadow DOM ---- */
  function boot() {
    const ui = cfg.ui;
    if (ui.hide_on_paths.length && pathMatches(ui.hide_on_paths)) { store.state.hidden = true; return; }

    let container = ui.display_in === 'body' ? null : resolveElement(ui.display_in);
    if (ui.display_in !== 'body' && !container) console.warn('[Parley] settings.display_in: element not found', ui.display_in, '— using body');
    if (container === document.body) container = null;

    const host = document.createElement('div');
    host.id = 'parley-chat';
    host.setAttribute('data-public-key', cfg.publicKey);
    if (container) {
      // Inside a page element: the widget is positioned within it instead of the viewport.
      if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
      host.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:' + ui.z_index + ';';
      store.state.contained = true;
    } else {
      host.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:' + ui.z_index + ';';
    }
    (container || document.body || document.documentElement).appendChild(host);
    const shadow = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    const style = document.createElement('style');
    style.textContent = ':host { all: initial; }\n' + css + (container ? '\n.root > * { pointer-events: auto; }\n.panel { pointer-events: none; }\n.open .panel { pointer-events: auto; }' : '');
    const mountEl = document.createElement('div');
    shadow.append(style, mountEl);

    createApp(App).provide(StoreKey, store).mount(mountEl);
    wireOpenProxy();
    const openNow = consumeOpenParam();

    store.boot().then(() => {
      store.startRealtime();
      if (store.state.view === 'chat' && store.state.param && store.state.param !== 'live') store.go('chat', store.state.param);
      if (openNow) store.openPanel();
      else if (ui.open_on_load !== false && !store.state.open) setTimeout(() => store.openPanel(), ui.open_on_load);
      queued.forEach((args) => { try { Parley.apply(null, args); } catch (e) { /* ignore */ } });
    });
    store.searchArticles('');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
