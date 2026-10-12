<script setup>
import { computed } from 'vue';
import Icon from '../components/Icon.vue';
import Avatar from '../components/Avatar.vue';
import TopBar from '../components/TopBar.vue';
import TabNav from '../components/TabNav.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { ago, firstName } from '../utils/format.js';
import { useStore } from '../store/index.js';

const store = useStore();
const s = store.state;
const last = computed(() => store.lastMessage.value);
const a = computed(() => store.assignee.value);
</script>

<template>
  <div class="view">
    <TopBar title="Messages" center />
    <div class="scroll">
      <div class="list">
        <button v-if="last" class="item" :class="{ unread: store.unread.value }" type="button" @click="store.go('chat', 'live')">
          <Avatar :name="a" :bot="!a" size="lg" />
          <div class="grow">
            <div class="item-t"><span class="ellip">{{ a ? firstName(a) + ' from ' + s.cfg.businessName : s.cfg.businessName }}</span><small>{{ ago(last.at) }}</small></div>
            <div class="item-s ellip">{{ last.from === 'visitor' ? 'You: ' : '' }}{{ last.body }}</div>
          </div>
          <span v-if="store.unread.value" class="badge" style="position:static;border:0">{{ store.unread.value }}</span>
          <StatusBadge v-else-if="s.session.status === 'resolved'" status="resolved" />
        </button>
        <button v-for="c in s.history" :key="c.id" class="item" type="button" @click="store.go('chat', c.id)">
          <Avatar :name="c.agent" :bot="!c.agent" size="lg" />
          <div class="grow">
            <div class="item-t"><span class="ellip">{{ c.title || s.cfg.businessName }}</span><small>{{ ago(c.at) }}</small></div>
            <div v-if="c.lastMessage" class="item-s ellip">{{ c.lastMessage.from === 'visitor' ? 'You' : firstName(c.lastMessage.agent || c.agent) }}: {{ c.lastMessage.body }}</div>
          </div>
          <StatusBadge :status="c.status" />
        </button>
        <div v-if="!last && !s.history.length" class="empty">
          <div class="cta-ic"><Icon name="msgs" :size="24" /></div>
          <h3>No messages yet</h3><p style="margin:0">Questions about an order or product? We're here.</p>
        </div>
      </div>
    </div>
    <div class="foot"><button class="btn" type="button" @click="store.go('chat', 'live')">Send us a message <Icon name="send" :size="16" /></button></div>
    <TabNav active="messages" />
  </div>
</template>
