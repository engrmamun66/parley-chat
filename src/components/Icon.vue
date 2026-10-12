<script setup>
import ICONS from '../constants/icons.js';
defineProps({ name: { type: String, required: true }, size: { type: [Number, String], default: 20 } });
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="ICONS[name]" />
</template>
