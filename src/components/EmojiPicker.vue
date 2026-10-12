<script setup>
import { EMOJI } from '../constants/content.js';
const emit = defineEmits(['pick']);
</script>

<template>
  <div class="emoji" role="menu">
    <button v-for="e in EMOJI" :key="e" type="button" role="menuitem" :aria-label="e" @click="emit('pick', e)">{{ e }}</button>
  </div>
</template>
