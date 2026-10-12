<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import Launcher from './components/Launcher.vue';
import PopCard from './components/PopCard.vue';
import Toast from './components/Toast.vue';
import HomeView from './views/HomeView.vue';
import MessagesView from './views/MessagesView.vue';
import HelpView from './views/HelpView.vue';
import ArticleView from './views/ArticleView.vue';
import TicketsView from './views/TicketsView.vue';
import TicketView from './views/TicketView.vue';
import NewTicketView from './views/NewTicketView.vue';
import TicketDoneView from './views/TicketDoneView.vue';
import ChatView from './views/ChatView.vue';
import { useStore } from './store/index.js';

const VIEWS = { home: HomeView, messages: MessagesView, help: HelpView, article: ArticleView, tickets: TicketsView,
  ticket: TicketView, newTicket: NewTicketView, ticketDone: TicketDoneView, chat: ChatView };

const store = useStore();
const s = store.state;
const panel = ref(null);
const current = computed(() => VIEWS[s.view] || HomeView);
// Re-mount (and replay the slide-in) whenever the screen changes; typing in Help search keeps the same view.
const viewKey = computed(() => s.view + ':' + (s.view === 'help' ? '' : typeof s.param === 'object' ? 'obj' : s.param));

function onKey(e) { if (e.key === 'Escape' && s.open) store.closePanel(); }
watch(() => s.open, (o) => { if (o) nextTick(() => { if (!panel.value.contains(panel.value.getRootNode().activeElement)) panel.value.focus({ preventScroll: true }); }); });
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="root" part="root" :class="{ open: s.open, 'has-pop': !!s.pop }" :style="{ '--b': s.cfg.brandColor }">
    <PopCard />
    <section ref="panel" class="panel" tabindex="-1" role="dialog" aria-modal="false" :aria-label="s.cfg.businessName + ' messenger'">
      <component :is="current" :key="viewKey" />
      <Toast />
    </section>
    <Launcher />
  </div>
</template>
