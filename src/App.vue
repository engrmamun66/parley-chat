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
import { contrastOn, inkOn } from './settings.js';

const VIEWS = { home: HomeView, messages: MessagesView, help: HelpView, article: ArticleView, tickets: TicketsView,
  ticket: TicketView, newTicket: NewTicketView, ticketDone: TicketDoneView, chat: ChatView };

const store = useStore();
const s = store.state;
const panel = ref(null);
const current = computed(() => VIEWS[s.view] || HomeView);
// Re-mount (and replay the slide-in) whenever the screen changes; typing in Help search keeps the same view.
const viewKey = computed(() => s.view + ':' + (s.view === 'help' ? '' : typeof s.param === 'object' ? 'obj' : s.param));

const ui = s.cfg.ui;
const onPrimary = ui.colors.on_primary === 'auto' ? contrastOn(ui.colors.primary) : ui.colors.on_primary;
const [vert, horiz] = ui.chatbox_position.position.split('_'); // 'bottom', 'right'
const rootClass = computed(() => [
  'pos-' + vert, 'pos-' + horiz, 'anim-' + ui.opening_animation,
  { open: s.open, fs: s.fullscreen, mfs: ui.mobile_fullscreen, 'has-pop': !!s.pop }
]);
// adjust_x/adjust_y move the widget in screen coordinates (+x right, +y down) from the 20px edge gap.
const gx = 20 + (horiz === 'right' ? -ui.chatbox_position.adjust_x : ui.chatbox_position.adjust_x);
const gy = 20 + (vert === 'bottom' ? -ui.chatbox_position.adjust_y : ui.chatbox_position.adjust_y);
const rootStyle = {
  '--b': ui.colors.primary, '--b-ink': inkOn(ui.colors.primary, ui.colors.primary_bg, ui.colors.text), '--bg': ui.colors.primary_bg, '--on-b': onPrimary, '--text': ui.colors.text,
  '--pos': s.contained ? 'absolute' : 'fixed',
  '--gx': gx + 'px', '--gy': gy + 'px', '--ls': ui.chat_icon_size + 'px',
  '--lo': ui.chat_icon ? `calc(${gy}px + ${ui.chat_icon_size}px + 12px)` : gy + 'px',
  '--w': ui.width + 'px', '--h': ui.height + 'px', '--r': ui.border_radius + 'px', '--ad': ui.animation_duration + 'ms',
  ...(ui.font_family ? { fontFamily: ui.font_family } : {})
};

function onKey(e) {
  if (e.key !== 'Escape' || !s.open || !ui.close_on_escape) return;
  if (s.fullscreen) store.toggleFullscreen(false); else store.closePanel();
}
watch(() => s.open, (o) => { if (o) nextTick(() => { if (!panel.value.contains(panel.value.getRootNode().activeElement)) panel.value.focus({ preventScroll: true }); }); });
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <div v-if="!s.hidden" class="root" part="root" :class="rootClass" :style="rootStyle">
    <PopCard />
    <section ref="panel" class="panel" tabindex="-1" role="dialog" aria-modal="false" :aria-label="s.cfg.businessName + ' messenger'">
      <component :is="current" :key="viewKey" />
      <Toast />
    </section>
    <Launcher />
  </div>
</template>
