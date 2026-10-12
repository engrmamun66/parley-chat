<script setup>
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import Avatar from './Avatar.vue';
import TeamStack from './TeamStack.vue';
import RichText from './RichText.vue';
import { CSAT_FACES, QUICK_REPLIES } from '../constants/content.js';
import { clock, firstName, validEmail } from '../utils/format.js';
import { useStore } from '../store/index.js';

/** items: chat timeline; live: true for the visitor's current conversation (composer, typing, email card…). */
const props = defineProps({ items: { type: Array, default: () => [] }, live: Boolean });
const emit = defineEmits(['quick']);
const store = useStore();
const s = store.state;
const email = ref(''), emailErr = ref(false), emailCard = ref(null);

const keyOf = (x) => (x ? (x.from === 'agent' ? 'agent:' + (x.agent || '') : x.from) : '');
const rows = computed(() => {
  const items = props.items.slice();
  if (props.live) items.unshift({ id: 'greet', from: 'bot', body: 'Hi! Ask us anything — we\'re here to help.', at: items[0] ? items[0].at : null });
  const hasAgent = items.some((m) => m.from === 'agent') || !!s.session.assignee || !!s.typingAgent;
  let lastV = -1, firstV = -1;
  items.forEach((m, i) => { if (m.from === 'visitor') { lastV = i; if (firstV < 0) firstV = i; } });
  return items.map((m, i) => {
    const prev = items[i - 1], next = items[i + 1];
    const bubble = m.from === 'visitor' || m.from === 'agent' || m.from === 'bot';
    const tail = keyOf(next) !== keyOf(m) || (next && !(next.from === 'visitor' || next.from === 'agent' || next.from === 'bot'));
    let meta = null, seen = false;
    if (bubble && tail) {
      if (m.from === 'visitor' && i === lastV && props.live) {
        seen = hasAgent && !m.pending;
        meta = m.failed ? 'Not sent' : m.pending ? 'Sending…' : (seen ? 'Seen · ' : 'Sent · ') + clock(m.at);
      } else if (m.at) meta = (m.from === 'visitor' ? '' : (m.from === 'agent' ? firstName(m.agent) : 'Bot') + ' · ') + clock(m.at);
    }
    return { m, me: m.from === 'visitor', bubble, gap: keyOf(prev) !== keyOf(m), tail, meta, seen, emailAfter: props.live && i === firstV && !s.cfg.offline };
  });
});

function saveEmail() {
  if (!validEmail(email.value)) { emailErr.value = true; return; }
  store.identify({ email: email.value.trim() });
}
function shake() {
  const el = emailCard.value && (emailCard.value.$el || emailCard.value);
  if (!el) return;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  const inp = el.querySelector('input'); if (inp) inp.focus();
}
defineExpose({ shake });
</script>

<template>
  <div class="msgs" aria-live="polite">
    <div class="intro">
      <TeamStack />
      <h3>{{ s.cfg.businessName }}</h3>
      <p>{{ s.cfg.offline ? 'We\'re away right now — leave a message and we\'ll email you.' : 'The team typically replies in under 5 minutes' }}</p>
    </div>

    <template v-for="r in rows" :key="r.m.id || r.m.at + r.m.from">
      <div v-if="r.m.from === 'system'" class="sys">{{ r.m.body }}</div>

      <template v-else-if="r.m.from === 'csat'">
        <div v-if="s.local.csat" class="inline done"><span class="ic"><Icon name="check" :size="16" /></span>Thanks for the feedback {{ s.local.csat }} — it helps the team a lot.</div>
        <div v-else class="inline"><h4>How would you rate the help you got?</h4>
          <div class="faces"><button v-for="(f, k) in CSAT_FACES" :key="f" type="button" :aria-label="'Rate ' + (k + 1) + ' of 5'" @click="store.rate(f)">{{ f }}</button></div>
        </div>
      </template>

      <div v-else-if="r.bubble" class="m" :class="[r.me ? 'me' : 'them', { gap: r.gap, tail: r.tail }]">
        <template v-if="!r.me"><Avatar v-if="r.m.from === 'agent'" :name="r.m.agent || store.assignee.value || 'Agent'" /><Avatar v-else bot /></template>
        <div class="m-col">
          <div class="bub">
            <RichText :text="r.m.body" />
            <template v-for="(a, k) in r.m.attachments || []" :key="k">
              <br v-if="r.m.body || k">📎 <a v-if="a.url" class="att-link" :href="a.url" target="_blank" rel="noopener noreferrer">{{ a.name }}</a><template v-else>{{ a.name }}</template>
            </template>
            <template v-if="r.m.action === 'ticket'"><br>
              <button class="btn sm" type="button" style="background:#fff;color:var(--b);border:1px solid var(--edge)" @click="store.go('newTicket', store.ticketPrefillFromChat())"><Icon name="ticket" :size="15" /> Raise a ticket</button>
            </template>
          </div>
          <div v-if="r.meta" class="meta" :class="{ seen: r.seen }">
            <Icon v-if="r.seen" name="checks" :size="13" />{{ r.meta }}
            <button v-if="r.m.failed" type="button" style="color:var(--danger);font-weight:600;margin-left:4px" @click="store.retryMessage(r.m)">Retry</button>
          </div>
        </div>
      </div>

      <template v-if="r.emailAfter">
        <div v-if="s.session.email" class="inline done"><span class="ic"><Icon name="mail" :size="16" /></span><span>You'll be notified at <b>{{ s.session.email }}</b></span></div>
        <div v-else ref="emailCard" class="inline">
          <h4><Icon name="mail" :size="16" /> Get notified by email when we reply</h4>
          <form class="inrow" novalidate @submit.prevent="saveEmail">
            <input v-model="email" class="inp" :class="{ err: emailErr }" type="email" placeholder="you@example.com" aria-label="Your email" autocomplete="email" @input="emailErr = false">
            <button class="btn" type="submit" aria-label="Save email"><Icon name="right" :size="16" /></button>
          </form>
        </div>
      </template>
    </template>

    <div v-if="live && s.cfg.offline && !s.session.email" ref="emailCard" class="inline" style="margin-left:0">
      <h4><Icon name="mail" :size="16" /> We're away — where should we reply?</h4>
      <p class="card-s" style="margin:-4px 0 10px">Leave your email and we'll get back to you as soon as we're in.</p>
      <form class="inrow" novalidate @submit.prevent="saveEmail">
        <input v-model="email" class="inp" :class="{ err: emailErr }" type="email" placeholder="you@example.com" aria-label="Your email" autocomplete="email" @input="emailErr = false">
        <button class="btn" type="submit">Save</button>
      </form>
    </div>

    <div v-if="live && s.typingAgent" class="m them gap tail">
      <Avatar :name="s.typingAgent" />
      <div class="m-col"><div class="bub typing" :aria-label="s.typingAgent + ' is typing'"><span /><span /><span /></div></div>
    </div>

    <div v-if="live && store.visitorCount.value === 0" class="quick">
      <button v-for="q in QUICK_REPLIES" :key="q" type="button" @click="emit('quick', q)">{{ q }}</button>
    </div>
  </div>
</template>
