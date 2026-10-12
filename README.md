# Parley Chat SDK

Embeddable live chat + ticketing widget. Built with **Vite + Vue 3** and shipped as **one file**: `dist/parley-live-chat.js`. Vue, the templates and the CSS are all inside that file.

The UI is a port of the reference widget in `roadmap-html/…/parley/ecomm/` (Home · Messages · Help · Tickets, chat, CSAT, proactive messages, ticket timeline). It renders inside a **Shadow DOM**, so host-page CSS can't break it and it can't break the host page.

## Quick start

```bash
npm install
cp .env.example .env     # set VITE_API_BASE_URL / VITE_SOCKET_URL (or leave empty for demo mode)
npm run dev              # Vite dev server on :5173 (serves src/ for live testing)
npm run build            # → dist/parley-live-chat.js
```

## Local test site (`local-dev-server/`)

A small Express website (Home, About us, Contact us; every page is at least 150vh tall) that loads the widget, so you can test it on real pages. It has its own `package.json` and `.env`.

```bash
cd local-dev-server
npm install
cp .env.example .env
npm run dev              # http://localhost:3000  (node --watch, restarts on server changes)
```

Which widget the pages load is set by `WIDGET_SOURCE` in `local-dev-server/.env`:

| Value | Loads | Use when |
|---|---|---|
| `auto` (default) | the Vite dev server if it's running, otherwise the built bundle | normal work |
| `dev` | `http://localhost:5173/src/main.js` (`VITE_DEV_URL`) | testing changes live: run `npm run dev` in the project root and edits to `.vue` files hot-reload in the page |
| `dist` | `dist/parley-live-chat.js` | checking the real build: run `npm run build` first |

The badge in the site header shows which one is active (`widget: dev` / `widget: dist`). Each page also has a small "Widget test" bar with buttons for the JS API.
You can start the site from the project root too: `npm run site` / `npm run site:dev`.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the widget REST API, e.g. `https://api.parley.chat/widget/v1`. **Empty → local demo mode**: no backend, data stays in `localStorage`, plus a canned bot reply. |
| `VITE_SOCKET_URL` | WebSocket URL for real-time events, e.g. `wss://ws.parley.chat/widget`. Empty → the widget polls the REST API instead (every 4 s while the chat is open, slower in the background). |

These are baked in at build time. A host page can override both at runtime (see below).

## Embedding

```html
<script>
  window.ParleySettings = {
    publicKey: 'pk_live_xxx',          // sent as X-Parley-Key
    businessName: 'Harbor & Pine',
    brandColor: '#1F5C45',
    // optional
    apiBaseUrl: 'https://…',            // overrides VITE_API_BASE_URL
    socketUrl: 'wss://…',               // overrides VITE_SOCKET_URL
    pollInterval: 4000,                 // ms, used when no socket is connected
    offline: false,                     // "we're away" mode: email is required before chatting
    launcherLabel: 'Chat with us',
    replyTimeText: 'We typically reply in under 5 minutes',
    team: [{ name: 'Imran Hossain', bg: '#CFFAFE', fg: '#0E7490', avatar: 'https://…' }],
    user: { name: 'Sofia', email: 'sofia@example.com' },   // identify on load
    page: { type: 'product', title: document.title, path: location.pathname },
    poweredBy: true,
    zIndex: 2147483647
  };
</script>
<script src="https://cdn.example.com/parley-live-chat.js" defer></script>
```

Settings can also be passed as `data-*` attributes on the script tag (`data-public-key`, `data-api-base-url`, `data-socket-url`, `data-business-name`, `data-brand-color`).

## JavaScript API

```js
Parley('show')                       // open (optionally Parley('show', 'tickets'))
Parley('hide')
Parley('toggle')
Parley('showNewMessage', 'Prefilled text')
Parley('showTicketForm', { category: 'Order issue', orderId: 'HP-10482', subject, body })
Parley('identify', { name, email })
Parley('proactive', { text: 'Need help choosing?', delayMs: 3000, agent: 'Imran Hossain' })
Parley('trackEvent', 'added_to_cart', { sku: 'X' })
Parley('onUnreadCountChange', (n) => …)
Parley('reset')                      // forget the visitor (logout)

window.ParleyChat                    // same, as methods: open, close, newMessage, newTicket, push, unreadCount, …
```

To queue calls before the script loads:

```js
window.Parley = window.Parley || function () { (Parley.q = Parley.q || []).push(arguments); };
```

## Project layout

```
src/
  main.js              entry: config → adapter → store → Shadow DOM mount → public API
  config.js            merges .env, script data-attributes and window.ParleySettings
  App.vue              shell: launcher, pop card, panel, view switch
  store/index.js       reactive state, navigation, actions, event reducer (applyEvent), polling
  adapters/
    api.js             REST adapter (VITE_API_BASE_URL)
    socket.js          WebSocket transport (VITE_SOCKET_URL) with reconnect/backoff
    local.js           demo adapter (no backend) + simulate() for playing the agent side
  api/http.js          fetch wrapper (headers, JSON, FormData, { data } envelopes)
  views/               HomeView, MessagesView, HelpView, ArticleView, ChatView,
                       TicketsView, TicketView, NewTicketView, TicketDoneView
  components/          Launcher, PopCard, TopBar, TabNav, Composer, MessageList, Avatar, …
  constants/           icons, quick replies, categories, fallback articles/team
  styles/widget.css    all styles (injected into the shadow root only)
```

To add a screen: create `views/XView.vue`, register it in `App.vue` (the `VIEWS` map), and navigate with `store.go('x', param)`.

## Backend API (contract the widget expects)

Every request sends `X-Parley-Key: <publicKey>` and, after the session starts, `X-Parley-Visitor: <visitorId>`. Responses can be bare JSON or wrapped in `{ "data": … }`. Validation errors use `422 { "errors": { "field": ["message"] } }`; the ticket form shows them inline.

| Method & path | Body | Returns |
|---|---|---|
| `POST /sessions` | `{ visitor_id?, conversation_id?, page, device }` | `{ visitorId, conversationId, name, email, status, assignee, messages[], tickets?[], cursor? }` |
| `GET /conversations/{id}/sync?cursor=` | — | `{ messages[], status, assignee, typing?, tickets?[], cursor }` (only changes since the cursor) |
| `POST /conversations/{id}/messages` | `{ body }` or multipart `body` + `attachments[]` | message |
| `POST /conversations/{id}/typing` | `{ text }` | — |
| `POST /conversations/{id}/rating` | `{ rating }` | — |
| `GET /conversations` | — | past conversations `[{ id, title, agent, status, at, lastMessage }]` |
| `GET /conversations/{id}` | — | `{ id, agent, status, messages[] }` |
| `POST /visitors/identify` | `{ name, email }` | — |
| `POST /events/pageview` | `{ url, title, type, referrer }` | — |
| `POST /events` | `{ name, meta }` | — |
| `GET /tickets` · `GET /tickets/{id}` | — | `[ticket]` · ticket |
| `POST /tickets` | `{ category, orderId, subject, body, name, email, conversation_id }` (multipart if there's an attachment) | ticket `{ id, key, status, subject, … }` |
| `POST /tickets/{id}/replies` | `{ body }` | reply `{ id, body, at, from }` |
| `GET /articles?q=` | — | `[{ id, group, title, body, read, author }]` |
| `POST /articles/{id}/vote` | `{ vote: 'up' | 'down' }` | — |

Message shape: `{ id, from: 'visitor'|'agent'|'bot'|'system', agent?, body, at, attachments?: [{ name, size, url }], action?: 'ticket' }`.
Ticket status can be any string. The timeline maps it as: `open` → Submitted, `assigned` → Assigned, `in progress`/`pending`/`waiting` → In progress, `resolved`/`closed`/`done` → Resolved.

## Real-time

When `VITE_SOCKET_URL` is set, the widget connects to:

```
<VITE_SOCKET_URL>?key=<publicKey>&visitor=<visitorId>&conversation=<conversationId>
```

- **Server → widget frames:** JSON `{ "type": "...", "payload": {...} }`. `{ "event", "data" }` is also accepted, and `data` may be a JSON string, as Pusher/Reverb sends it.
- **Widget → server frames:** `visitor.typing` and a `ping` every 25 s.
- **Reconnects:** exponential backoff (1 s up to 30 s). While the socket is down the widget polls `/sync`. After each reconnect it runs one `/sync` to catch up.

Event types:

| type | payload |
|---|---|
| `message.created` | `{ conversationId, message }` |
| `typing` | `{ conversationId, agent }` |
| `conversation.updated` | `{ conversationId, status?, assignee? }` (`resolved` adds the CSAT card) |
| `ticket.created` | `{ ticket }` |
| `ticket.updated` | `{ id, status?, assignee?, replies? }` |
| `visitor.updated` | `{ name?, email? }` |

If you'd rather use your own client (Laravel Echo, Pusher JS…), leave `VITE_SOCKET_URL` empty and forward its events with `ParleyChat.push(type, payload)`.

## Demo mode helpers

With no `VITE_API_BASE_URL`, `ParleyChat.simulate(type, payload)` plays the agent side:

```js
ParleyChat.simulate('typing', { agent: 'Imran Hossain' });
ParleyChat.simulate('message.created', { message: { from: 'agent', agent: 'Imran Hossain', body: 'Hi!' } });
ParleyChat.simulate('conversation.updated', { status: 'resolved' });
ParleyChat.simulate('ticket.updated', { id: 'latest', status: 'In progress', assignee: 'Imran Hossain' });
```
