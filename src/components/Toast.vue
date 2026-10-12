<script setup>
import Icon from './Icon.vue';
import { useStore } from '../store/index.js';
const store = useStore();
</script>

<template>
  <div v-if="store.state.toast" :key="store.state.toast.id" class="toast" role="status">
    <span class="ic"><Icon name="check" :size="14" /></span><span>{{ store.state.toast.text }}</span>
  </div>
</template>
