<script setup>
import Avatar from './Avatar.vue';
import { useStore } from '../store/index.js';
defineProps({ onBrand: Boolean });
const store = useStore();
</script>

<template>
  <span class="stack" :class="{ 'on-brand': onBrand }">
    <Avatar v-for="t in store.state.cfg.team.slice(0, 3)" :key="t.name" :name="t.name" />
  </span>
</template>
