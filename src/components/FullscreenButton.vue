<script setup>
import Icon from './Icon.vue';
import { useStore } from '../store/index.js';
const store = useStore();
</script>

<template>
  <button v-if="store.state.cfg.ui.fullscreen_icon" class="iconbtn fs-btn" type="button"
    :aria-label="store.state.fullscreen ? 'Exit full screen' : 'Full screen'" :aria-pressed="String(store.state.fullscreen)"
    @click="store.toggleFullscreen()">
    <Icon :name="store.state.fullscreen ? 'shrink' : 'expand'" :size="18" />
  </button>
</template>
