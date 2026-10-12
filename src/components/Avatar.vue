<script setup>
import { computed } from 'vue';
import { useStore } from '../store/index.js';
import { member } from '../utils/team.js';

// name = agent name; bot = brand-coloured business logo instead.
const props = defineProps({ name: String, bot: Boolean, size: { type: String, default: '' } });
const store = useStore();
const m = computed(() => member(store.state.cfg.team, props.name));
</script>

<template>
  <span v-if="bot" class="av bot" :class="size" aria-hidden="true">{{ store.state.cfg.logoText }}</span>
  <img v-else-if="m.avatar" class="av" :class="size" :src="m.avatar" alt="" aria-hidden="true">
  <span v-else class="av" :class="size" :style="{ background: m.bg, color: m.fg }" aria-hidden="true">{{ m.initials }}</span>
</template>
