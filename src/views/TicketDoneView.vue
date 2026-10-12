<script setup>
import { computed } from 'vue';
import Icon from '../components/Icon.vue';
import TopBar from '../components/TopBar.vue';
import TabNav from '../components/TabNav.vue';
import { useStore } from '../store/index.js';
const store = useStore();
const t = computed(() => store.state.tickets.find((x) => x.id === store.state.param) || {});
</script>

<template>
  <div class="view">
    <TopBar><h2 /></TopBar>
    <div class="scroll">
      <div class="success">
        <div class="big"><Icon name="check" :size="30" /></div>
        <h2>Ticket {{ t.key }} created</h2>
        <p>We emailed a copy to <b style="color:var(--ink)">{{ t.email || 'you' }}</b>. Track it any time in Tickets.</p>
        <button class="btn block" type="button" @click="store.go('ticket', t.id)">View ticket</button>
        <button class="btn ghost block" type="button" style="margin-top:8px" @click="store.go('home')">Back to home</button>
      </div>
    </div>
    <TabNav active="tickets" />
  </div>
</template>
