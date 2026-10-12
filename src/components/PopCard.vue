<script setup>
import Icon from './Icon.vue';
import Avatar from './Avatar.vue';
import RichText from './RichText.vue';
import { firstName } from '../utils/format.js';
import { useStore } from '../store/index.js';
const store = useStore();
</script>

<template>
  <div class="pop" aria-live="polite">
    <template v-if="store.state.pop && !store.state.open">
      <div class="pop-card" role="button" tabindex="0" :aria-label="'Open message from ' + (store.state.pop.agent || store.state.cfg.businessName)"
        @click="store.acceptPop(store.state.pop)" @keydown.enter.space.prevent="store.acceptPop(store.state.pop)">
        <button class="pop-x" type="button" aria-label="Dismiss" @click.stop="store.dismissPop(store.state.pop)"><Icon name="x" :size="14" /></button>
        <div class="pop-head">
          <Avatar :name="store.state.pop.agent" :bot="!store.state.pop.agent" size="sm" />
          <span><b>{{ store.state.pop.title }}</b> · just now</span>
        </div>
        <div class="pop-body"><RichText :text="store.state.pop.body" /></div>
      </div>
      <button v-if="store.state.pop.withReply" class="pop-reply" type="button" @click="store.acceptPop(store.state.pop)">
        Reply to {{ firstName(store.state.pop.agent) }}…
      </button>
    </template>
  </div>
</template>
