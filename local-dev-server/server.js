import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(ROOT, '.env') });

const PORT = +process.env.PORT || 3000;
const SOURCE = (process.env.WIDGET_SOURCE || 'auto').toLowerCase();
const VITE_DEV_URL = (process.env.VITE_DEV_URL || 'http://localhost:5173').replace(/\/+$/, '');
const DIST = path.join(ROOT, '..', 'dist');

const parley = {
  publicKey: process.env.PARLEY_PUBLIC_KEY || 'pk_local_dev',
  businessName: process.env.PARLEY_BUSINESS_NAME || 'Harbor & Pine',
  brandColor: process.env.PARLEY_BRAND_COLOR || '#1F5C45'
};

/** Is the Vite dev server up? Cached for a few seconds so page loads stay fast. */
let viteCheck = { at: 0, up: false };
async function viteIsUp() {
  if (Date.now() - viteCheck.at < 3000) return viteCheck.up;
  let up = false;
  try { up = (await fetch(VITE_DEV_URL + '/@vite/client', { signal: AbortSignal.timeout(400) })).ok; } catch (e) { /* not running */ }
  viteCheck = { at: Date.now(), up };
  return up;
}

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(ROOT, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(ROOT, 'public')));
app.use('/widget', express.static(DIST, { etag: false, maxAge: 0 }));

// Decide per request where the widget script comes from.
app.use(async (req, res, next) => {
  const dev = SOURCE === 'dev' || (SOURCE === 'auto' && await viteIsUp());
  res.locals.parley = parley;
  res.locals.widget = dev
    ? { mode: 'dev', scripts: [VITE_DEV_URL + '/@vite/client', VITE_DEV_URL + '/src/main.js'], module: true }
    : { mode: 'dist', scripts: ['/widget/parley-live-chat.js'], module: false };
  res.locals.path = req.path;
  next();
});

app.get('/', (req, res) => res.render('home', { title: 'Home', pageType: 'home' }));
app.get('/about-us', (req, res) => res.render('about', { title: 'About us', pageType: 'about' }));
app.get('/contact-us', (req, res) => res.render('contact', { title: 'Contact us', pageType: 'contact', sent: false }));
app.post('/contact-us', (req, res) => res.render('contact', { title: 'Contact us', pageType: 'contact', sent: true, name: req.body.name }));
app.use((req, res) => res.status(404).render('home', { title: 'Not found', pageType: 'home' }));

app.listen(PORT, () => {
  console.log(`\n  Parley test site → http://localhost:${PORT}`);
  console.log(`  Widget source: ${SOURCE}${SOURCE !== 'dist' ? ` (Vite dev server: ${VITE_DEV_URL})` : ''}\n`);
});
