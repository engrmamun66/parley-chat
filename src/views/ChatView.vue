<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import Avatar from '../components/Avatar.vue';
import TeamStack from '../components/TeamStack.vue';
import TopBar from '../components/TopBar.vue';
import Composer from '../components/Composer.vue';
import MessageList from '../components/MessageList.vue';
import { firstName } from '../utils/format.js';
import { useStore } from '../store/index.js';

const store = useStore();
const s = store.state;
const live = computed(() => s.param === 'live' || !s.param);
const past = computed(() => (live.value ? null : s.viewing));
const items = computed(() => (live.value ? store.timeline.value : (past.value && past.value.messages) || []));
const agent = computed(() => (live.value ? store.assignee.value : past.value && past.value.agent));
const scroller = ref(null), list = ref(null);

function scrollBottom(force) {
  const el = scroller.value; if (!el) return;
  if (force || el.scrollHeight - el.scrollTop - el.clientHeight < 140) el.scrollTop = el.scrollHeight;
}
// Follow new messages only if the visitor is already near the bottom.
watch(() => [items.value.length, s.typingAgent], () => { const el = scroller.value; const near = el && el.scrollHeight - el.scrollTop - el.clientHeight < 140; nextTick(() => scrollBottom(near)); });
watch(() => store.agentCount.value, () => { if (live.value && s.open) store.markRead(); });
onMounted(() => nextTick(() => scrollBottom(true)));

async function quick(q) { const r = await store.sendMessage(q); if (r === 'need-email') list.value.shake(); nextTick(() => scrollBottom(true)); }
</script>

<template>
  <div class="view chat">
    <TopBar back>
      <div class="who">
        <template v-if="agent">
          <Avatar :name="agent" size="lg" />
          <div class="who-t"><b>{{ firstName(agent) }} from {{ s.cfg.businessName }}</b>
            <span v-if="!live">Conversation ended</span>
            <span v-else-if="s.cfg.offline"><span class="dot away" />Away</span>
            <span v-else><span class="dot" />Online</span></div>
        </template>
        <template v-else>
          <TeamStack />
          <div class="who-t"><b>{{ s.cfg.businessName }}</b>
            <span v-if="s.cfg.offline"><span class="dot away" />Away · we'll reply by email</span>
            <span v-else><span class="dot" />Online · replies in under 5 min</span></div>
        </template>
      </div>
    </TopBar>
    <div v-if="s.error && live" class="errbar">{{ s.error }}</div>
    <div ref="scroller" class="scroll">
      <MessageList ref="list" :items="items" :live="live" @quick="quick" />
      <div v-if="!live && !past?.messages" class="loading">Loading…</div>
    </div>
    <Composer v-if="live" @need-email="list.shake()" @sent="nextTick(() => scrollBottom(true))" />
    <div v-else class="ended">This conversation has ended<br>
      <button class="btn sm" type="button" @click="store.go('chat', 'live')">Send us a message</button></div>
  </div>
</template>
