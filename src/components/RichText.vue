<script setup>
// Plain text with line breaks preserved — no v-html, so message bodies can't inject markup.
import { computed } from 'vue';
const props = defineProps({ text: { type: String, default: '' } });
const lines = computed(() => String(props.text || '').split('\n'));
</script>

<template><template v-for="(l, i) in lines" :key="i"><br v-if="i">{{ l }}</template></template>
