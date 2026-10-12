/*
 * Parley Chat — embeddable live chat + ticketing widget.
 *
 * Embed:
 *   <script>window.ParleySettings = { publicKey: 'pk_live_…', brandColor: '#1F5C45', businessName: 'Harbor & Pine' }</script>
 *   <script src="parley-live-chat.js" defer></script>
 *
 * API:  Parley('show' | 'hide' | 'toggle' | 'showNewMessage' | 'showTicketForm' | 'identify' | 'trackEvent' |
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

  // Calls made before the script loaded: window.Parley = window.Parley || function(){ (Parley.q = Parley.q || []).push(arguments) }
  const queued = [].concat((window.Parley && window.Parley.q) || [], (window.LLChat && window.LLChat.q) || []);
  window.Parley = Parley;
  window.ParleyChat = API;
  // Drop-in compatibility with pages written against the Leaping Logic demo widget.
  if (!window.LLChat || window.LLChat.q) window.LLChat = Parley;
  if (!window.LLWidget) window.LLWidget = API;

  watch(() => store.unread.value, (n) => unreadFns.forEach((fn) => { try { fn(n); } catch (e) { /* ignore */ } }));

  /* ---- mount into an isolated Shadow DOM ---- */
  function boot() {
    const host = document.createElement('div');
    host.id = 'parley-chat';
    host.setAttribute('data-public-key', cfg.publicKey);
    host.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;z-index:' + cfg.zIndex + ';';
    (document.body || document.documentElement).appendChild(host);
    const shadow = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    const style = document.createElement('style');
    style.textContent = ':host { all: initial; }\n' + css;
    const mountEl = document.createElement('div');
    shadow.append(style, mountEl);

    createApp(App).provide(StoreKey, store).mount(mountEl);

    store.boot().then(() => {
      store.startRealtime();
      if (store.state.view === 'chat' && store.state.param && store.state.param !== 'live') store.go('chat', store.state.param);
      queued.forEach((args) => { try { Parley.apply(null, args); } catch (e) { /* ignore */ } });
    });
    store.searchArticles('');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
