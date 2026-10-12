<script setup>
import { computed } from 'vue';
import Icon from '../components/Icon.vue';
import Avatar from '../components/Avatar.vue';
import TopBar from '../components/TopBar.vue';
import RichText from '../components/RichText.vue';
import { useStore } from '../store/index.js';

const store = useStore();
const a = computed(() => store.state.articles.find((x) => String(x.id) === String(store.state.param)) || store.state.articles[0] || null);
const paras = computed(() => (a.value ? String(a.value.body || '').split(/\n\n/) : []));
const vote = computed(() => a.value && store.state.local.votes[a.value.id]);
</script>

<template>
  <div class="view">
    <TopBar back><h2 /></TopBar>
    <div class="scroll">
      <article v-if="a" class="article">
        <div class="crumb">Help · {{ a.group }}</div>
        <h1>{{ a.title }}</h1>
        <div v-if="a.author" class="by"><Avatar :name="a.author" size="sm" />Written by {{ a.author }}<template v-if="a.read"> · {{ a.read }} min read</template></div>
        <p v-for="(p, i) in paras" :key="i"><RichText :text="p" /></p>
        <div class="feedback">
          <p v-if="vote">{{ vote === 'up' ? 'Great — thanks for letting us know! 🙌' : 'Thanks — we\'ll use that to improve this article.' }}</p>
          <template v-else>
            <p>Did this answer your question?</p>
            <div class="thumbs">
              <button type="button" aria-label="Yes, helpful" @click="store.vote(a.id, 'up')"><Icon name="up" :size="18" /></button>
              <button type="button" aria-label="No, not helpful" @click="store.vote(a.id, 'down')"><Icon name="dn" :size="18" /></button>
            </div>
          </template>
        </div>
        <div class="still"><b>Still need help?</b><button class="btn sm" type="button" @click="store.go('chat', 'live')"><Icon name="chat" :size="16" /> Chat with us</button></div>
      </article>
      <div v-else class="loading">Loading…</div>
    </div>
  </div>
</template>
