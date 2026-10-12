<script setup>
import { useStore } from '../store/index.js';
const store = useStore();
</script>

<template>
  <template v-if="store.state.cfg.offline"><span class="dot away" />We're away — leave a message and we'll email you</template>
  <template v-else><span class="dot" />{{ store.state.cfg.replyTimeText }}</template>
</template>
