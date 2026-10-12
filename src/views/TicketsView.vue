<script setup>
import Icon from '../components/Icon.vue';
import TopBar from '../components/TopBar.vue';
import TabNav from '../components/TabNav.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { ago } from '../utils/format.js';
import { useStore } from '../store/index.js';
const store = useStore();
</script>

<template>
  <div class="view">
    <TopBar title="Tickets" center />
    <div class="scroll">
      <div v-if="!store.ticketList.value.length" class="empty">
        <div class="cta-ic"><Icon name="ticket" :size="24" /></div>
        <h3>No tickets yet</h3>
        <p style="margin:0 0 16px">Raise a ticket for an order problem, return or billing question and track its progress here.</p>
      </div>
      <div v-else class="list">
        <button v-for="t in store.ticketList.value" :key="t.id" class="item" type="button" @click="store.go('ticket', t.id)">
          <span class="cta-ic"><Icon name="ticket" :size="18" /></span>
          <div class="grow">
            <div class="item-t"><span class="ellip">{{ t.subject || '(no subject)' }}</span></div>
            <div class="item-s ellip">{{ t.key }} · {{ t.project || 'Customer Support' }} · {{ ago(t.updatedAt || t.at) }}</div>
          </div>
          <StatusBadge :status="t.status" />
        </button>
      </div>
    </div>
    <div class="foot"><button class="btn" type="button" @click="store.go('newTicket')"><Icon name="plus" :size="16" /> New ticket</button></div>
    <TabNav active="tickets" />
  </div>
</template>
