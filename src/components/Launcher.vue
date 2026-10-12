<script setup>
import Icon from './Icon.vue';
import { useStore } from '../store/index.js';
const store = useStore();
</script>

<template>
  <div v-if="store.state.cfg.launcherLabel" class="label">{{ store.state.cfg.launcherLabel }}</div>
  <button class="launcher" type="button" :aria-label="store.state.open ? 'Close messenger' : 'Open messenger'"
    :aria-expanded="String(store.state.open)" @click="store.toggle()">
    <span class="ic ic-chat"><Icon name="chat" :size="26" /></span>
    <span class="ic ic-x"><Icon name="down" :size="26" /></span>
    <span v-if="store.unread.value && !store.state.open" class="badge">{{ store.unread.value > 9 ? '9+' : store.unread.value }}</span>
  </button>
</template>
