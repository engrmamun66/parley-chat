<script setup>
import { computed, ref, onMounted, nextTick } from 'vue';
import Icon from '../components/Icon.vue';
import TopBar from '../components/TopBar.vue';
import StatusBadge from '../components/StatusBadge.vue';
import RichText from '../components/RichText.vue';
import { clock, normStatus } from '../utils/format.js';
import { useStore } from '../store/index.js';

const store = useStore();
const t = computed(() => store.state.tickets.find((x) => x.id === store.state.param) || null);
const reply = ref(''), sending = ref(false), scroller = ref(null);

const cur = computed(() => { const n = normStatus(t.value && t.value.status); return n.step === 0 && t.value && t.value.assignee ? 1 : n.step; });
const steps = computed(() => !t.value ? [] : [
  ['Submitted', clock(t.value.at)],
  ['Assigned', t.value.assignee ? 'To ' + t.value.assignee : 'Waiting for an agent'],
  ['In progress', 'The team is working on it'],
  ['Resolved', 'We\'ll email you when it\'s sorted']
].map(([label, sub], i) => ({ label, sub, cls: i < cur.value || (i === cur.value && cur.value === 3) ? 'done' : i === cur.value ? 'cur' : '' })));

async function send() {
  const body = reply.value.trim(); if (!body || sending.value) return;
  sending.value = true;
  try { await store.replyTicket(t.value.id, body); reply.value = ''; await nextTick(); if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight; }
  catch (e) { store.toast('Reply not sent — please try again.'); }
  finally { sending.value = false; }
}
function onKey(e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } }
onMounted(() => store.loadTicket(store.state.param));
</script>

<template>
  <div class="view">
    <TopBar :title="t ? t.key || 'Ticket' : 'Ticket'" back center />
    <div ref="scroller" class="scroll">
      <template v-if="t">
        <div class="tk-head">
          <div class="key">{{ t.key }} · {{ t.project || 'Customer Support' }} <StatusBadge :status="t.status" /></div>
          <h1>{{ t.subject }}</h1>
        </div>
        <ol class="steps" aria-label="Ticket progress">
          <li v-for="(s, i) in steps" :key="s.label" :class="s.cls" :aria-current="i === cur ? 'step' : null">
            <span class="bullet"><Icon v-if="s.cls === 'done'" name="check" :size="12" /></span>
            <div><b>{{ s.label }}</b><span>{{ s.sub }}</span></div>
          </li>
        </ol>
        <div class="sect">
          <h5>Details</h5>
          <dl class="kv">
            <dt>Category</dt><dd>{{ t.category || '—' }}</dd>
            <dt>Order</dt><dd>{{ t.orderId || t.order_id || '—' }}</dd>
            <dt>Contact</dt><dd>{{ t.email || '—' }}</dd>
            <dt>Updated</dt><dd>{{ clock(t.updatedAt || t.at) }}</dd>
          </dl>
          <h5>Your request</h5>
          <div class="quote">{{ t.body }}</div>
          <div v-for="(r, i) in t.replies" :key="r.id || i" class="reply">
            <RichText :text="r.body" /><small>{{ r.from === 'agent' ? (r.agent || 'Support') : 'You' }} · {{ clock(r.at) }}</small>
          </div>
        </div>
      </template>
      <div v-else class="loading">Loading ticket…</div>
    </div>
    <div v-if="t" class="composer">
      <div class="cbox">
        <textarea v-model="reply" rows="1" placeholder="Add a reply…" aria-label="Add a reply" @keydown="onKey" />
        <button class="sendbtn" type="button" aria-label="Send reply" :disabled="!reply.trim() || sending" @click="send"><Icon name="send" :size="16" /></button>
      </div>
    </div>
  </div>
</template>
