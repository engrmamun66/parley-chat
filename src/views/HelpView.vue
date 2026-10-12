<script setup>
import { ref, onMounted } from 'vue';
import Icon from '../components/Icon.vue';
import TopBar from '../components/TopBar.vue';
import TabNav from '../components/TabNav.vue';
import ArticleRows from '../components/ArticleRows.vue';
import { useStore } from '../store/index.js';

const store = useStore();
const q = ref(typeof store.state.param === 'string' ? store.state.param : '');
const input = ref(null);
let t = null;
function onInput() { store.state.param = q.value; clearTimeout(t); t = setTimeout(() => store.searchArticles(q.value), 200); }
onMounted(() => {
  if (store.state.articleQuery !== q.value || !store.state.articles.length) store.searchArticles(q.value);
  setTimeout(() => { if (input.value) { input.value.focus(); input.value.setSelectionRange(q.value.length, q.value.length); } }, 30);
});
</script>

<template>
  <div class="view">
    <TopBar title="Help" center />
    <div style="padding:12px 16px;border-bottom:1px solid var(--line)">
      <label class="search"><span><Icon name="search" :size="17" /></span>
        <input ref="input" v-model="q" type="search" placeholder="Search for help" aria-label="Search articles" @input="onInput"></label>
    </div>
    <div class="scroll"><div class="results"><ArticleRows /></div></div>
    <TabNav active="help" />
  </div>
</template>
