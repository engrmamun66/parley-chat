<script setup>
import Icon from './Icon.vue';
import FullscreenButton from './FullscreenButton.vue';
import { useStore } from '../store/index.js';
defineProps({ title: { type: String, default: '' }, back: Boolean, center: Boolean });
const store = useStore();
</script>

<template>
  <header class="bar" :class="{ center }">
    <button v-if="back" class="iconbtn" type="button" aria-label="Back" @click="store.back()"><Icon name="back" /></button>
    <span v-else style="width:34px" />
    <slot><h2>{{ title }}</h2></slot>
    <FullscreenButton />
    <button class="iconbtn" type="button" aria-label="Close messenger" @click="store.closePanel()"><Icon name="x" /></button>
  </header>
</template>
