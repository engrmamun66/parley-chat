<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';
import { useStore } from '../store/index.js';
defineProps({ active: String });
const store = useStore();
const ALL = [['home', 'Home', 'home'], ['messages', 'Messages', 'msgs'], ['help', 'Help', 'help'], ['tickets', 'Tickets', 'ticket']];
const TABS = computed(() => ALL.filter(([id]) => store.allowed(id)));
</script>

<template>
  <nav v-if="TABS.length > 1" class="tabs" aria-label="Messenger sections" :style="{ gridTemplateColumns: 'repeat(' + TABS.length + ', 1fr)' }">
    <button v-for="[id, label, icon] in TABS" :key="id" class="tab" type="button"
      :aria-current="active === id ? 'page' : null" @click="store.go(id)">
      <Icon :name="icon" :size="22" />
      <span>{{ label }}</span>
      <i v-if="id === 'messages' && store.unread.value">{{ store.unread.value }}</i>
      <i v-if="id === 'tickets' && store.openTickets.value && active !== 'tickets'" style="background:var(--b)">{{ store.openTickets.value }}</i>
    </button>
  </nav>
</template>
