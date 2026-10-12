<script setup>
import { computed } from 'vue';
import { normStatus } from '../utils/format.js';
const props = defineProps({ status: String });
const n = computed(() => normStatus(props.status));
</script>

<template><span class="st" :class="n.cls">{{ n.label }}</span></template>
