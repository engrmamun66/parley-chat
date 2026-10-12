<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';
import { useStore } from '../store/index.js';

const store = useStore();
const groups = computed(() => {
  const out = [], idx = {};
  store.state.articles.forEach((a) => {
    const g = a.group || 'General';
    if (!(g in idx)) { idx[g] = out.length; out.push({ name: g, items: [] }); }
    out[idx[g]].items.push(a);
  });
  return out;
});
</script>

<template>
  <div v-if="!groups.length" class="empty">
    <h3>No results{{ store.state.articleQuery ? ' for "' + store.state.articleQuery + '"' : '' }}</h3>
    <p>Try another word, or ask the team directly.</p>
    <button class="btn ghost sm" type="button" @click="store.go('chat', 'live')">Chat with us</button>
  </div>
  <template v-for="g in groups" :key="g.name">
    <div class="group-h">{{ g.name }} <span style="text-transform:none;font-weight:400">· {{ g.items.length }}</span></div>
    <button v-for="a in g.items" :key="a.id" class="item" type="button" @click="store.go('article', a.id)">
      <span class="cta-ic" style="width:32px;height:32px;border-radius:8px"><Icon name="book" :size="16" /></span>
      <div class="grow"><div class="item-t" style="font-weight:500"><span>{{ a.title }}</span></div><div v-if="a.read" class="item-s">{{ a.read }} min read</div></div>
      <span class="chev" style="color:var(--mute)"><Icon name="right" :size="16" /></span>
    </button>
  </template>
</template>
