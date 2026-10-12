<script setup>
import { computed } from 'vue';
import Icon from '../components/Icon.vue';
import Avatar from '../components/Avatar.vue';
import TeamStack from '../components/TeamStack.vue';
import TabNav from '../components/TabNav.vue';
import StatusBadge from '../components/StatusBadge.vue';
import StatusLine from '../components/StatusLine.vue';
import { ago, firstName } from '../utils/format.js';
import { useStore } from '../store/index.js';

const store = useStore();
const s = store.state;
const name = computed(() => firstName(s.session.name));
const last = computed(() => store.lastMessage.value);
const lastWho = computed(() => !last.value ? '' : last.value.from === 'visitor' ? 'You' : (last.value.agent || store.assignee.value || s.cfg.businessName));
const featured = computed(() => s.articles.slice(0, 3));
const latestTicket = computed(() => store.ticketList.value[0]);

function search(e) { const q = e.target.value; if (q.trim()) { store.go('help', q); store.searchArticles(q); } }
</script>

<template>
  <div class="view home">
    <div class="scroll">
      <div class="hero">
        <div class="hero-top">
          <span class="logo" aria-hidden="true">{{ s.cfg.logoText }}</span>
          <span style="display:flex;align-items:center;gap:6px">
            <TeamStack on-brand />
            <button class="iconbtn" type="button" aria-label="Close messenger" @click="store.closePanel()"><Icon name="x" /></button>
          </span>
        </div>
        <h1>{{ name ? 'Hi ' + name + ' 👋' : 'Hi there 👋' }}<span>How can we help?</span></h1>
      </div>

      <div class="cards">
        <button v-if="last" class="card" type="button" @click="store.go('chat', 'live')">
          <p class="eyebrow">Recent message</p>
          <div class="row">
            <template v-if="last.from === 'visitor'">
              <Avatar v-if="store.assignee.value" :name="store.assignee.value" size="lg" /><TeamStack v-else />
            </template>
            <Avatar v-else :name="last.agent" :bot="!last.agent" size="lg" />
            <div class="grow">
              <div class="card-s ellip" :style="{ color: 'var(--ink)', fontWeight: store.unread.value ? 600 : null }">{{ last.body }}</div>
              <div class="card-s" style="font-size:12px">{{ lastWho }} · {{ ago(last.at) }}</div>
            </div>
            <span v-if="store.unread.value" class="badge" style="position:static;border:0">{{ store.unread.value }}</span>
            <span v-else class="chev"><Icon name="right" :size="18" /></span>
          </div>
        </button>

        <button class="card" type="button" @click="store.go('chat', 'live')">
          <div class="row">
            <div class="grow"><p class="card-t">Send us a message</p><div class="status-line" style="margin-top:2px"><StatusLine /></div></div>
            <span class="chev"><Icon name="send" :size="18" /></span>
          </div>
        </button>

        <div class="card">
          <label class="search"><span><Icon name="search" :size="17" /></span>
            <input type="search" placeholder="Search for help" aria-label="Search for help" @input="search"></label>
          <div class="links">
            <button v-for="a in featured" :key="a.id" class="link-row" type="button" @click="store.go('article', a.id)">
              <span class="grow ellip">{{ a.title }}</span><span class="chev"><Icon name="right" :size="16" /></span>
            </button>
          </div>
        </div>

        <button class="card" type="button" @click="store.go('newTicket')">
          <div class="row"><span class="cta-ic"><Icon name="ticket" /></span>
            <div class="grow"><p class="card-t">Raise a ticket</p><p class="card-s">Order problem, return or billing question? We'll track it for you.</p></div>
            <span class="chev"><Icon name="right" :size="18" /></span></div>
        </button>

        <button class="card" type="button" @click="latestTicket ? store.go('ticket', latestTicket.id) : store.go('tickets')">
          <div class="row"><span class="cta-ic"><Icon name="box" /></span>
            <div class="grow"><p class="card-t">Track your tickets</p>
              <p v-if="latestTicket" class="card-s ellip">{{ latestTicket.key }} · {{ latestTicket.subject }}</p>
              <p v-else class="card-s">No tickets yet — anything you raise shows up here.</p></div>
            <StatusBadge v-if="latestTicket" :status="latestTicket.status" />
            <span v-else class="chev"><Icon name="right" :size="18" /></span></div>
        </button>
      </div>
      <div v-if="s.cfg.poweredBy" class="powered">Powered by <b>Parley</b></div>
    </div>
    <TabNav active="home" />
  </div>
</template>
