<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import Icon from './Icon.vue';
import EmojiPicker from './EmojiPicker.vue';
import { useStore } from '../store/index.js';

const emit = defineEmits(['need-email', 'sent']);
const store = useStore();
const text = ref(''), ta = ref(null), fileEl = ref(null), emojiOpen = ref(false);

function autosize() {
  const el = ta.value; if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(120, el.scrollHeight) + 'px';
  el.style.overflowY = el.scrollHeight > 120 ? 'auto' : 'hidden';
}
function onInput() { autosize(); store.visitorTyping(text.value); }
async function send() {
  const r = await store.sendMessage(text.value);
  if (r === 'need-email') return emit('need-email');
  if (r !== false) { text.value = ''; nextTick(autosize); emit('sent'); }
}
function onKey(e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } }
function pickEmoji(e) {
  const el = ta.value, a = el.selectionStart ?? text.value.length, b = el.selectionEnd ?? a;
  text.value = text.value.slice(0, a) + e + text.value.slice(b);
  emojiOpen.value = false;
  nextTick(() => { el.focus(); el.selectionStart = el.selectionEnd = a + e.length; autosize(); });
}
function onFile() { const f = fileEl.value.files && fileEl.value.files[0]; if (f) store.addFile(f); fileEl.value.value = ''; }
function onEsc(e) { if (e.key === 'Escape' && emojiOpen.value) { e.stopPropagation(); emojiOpen.value = false; } }

// API newMessage(prefill) drops text in here.
watch(() => store.state.composerPrefill, (v) => {
  if (v == null) return;
  text.value = String(v); store.state.composerPrefill = null;
  nextTick(() => { autosize(); ta.value.focus(); ta.value.setSelectionRange(text.value.length, text.value.length); });
}, { immediate: true });
onMounted(() => { autosize(); setTimeout(() => ta.value && ta.value.focus({ preventScroll: true }), 60); document.addEventListener('keydown', onEsc, true); });
onBeforeUnmount(() => document.removeEventListener('keydown', onEsc, true));
defineExpose({ focus: () => ta.value && ta.value.focus() });
</script>

<template>
  <div class="composer">
    <div v-if="store.state.pendingFiles.length" class="files">
      <span v-for="(f, i) in store.state.pendingFiles" :key="i" class="chip">
        <Icon name="file" :size="14" /><span>{{ f.name }} · {{ f.size }}</span>
        <button type="button" :aria-label="'Remove ' + f.name" @click="store.removeFile(i)"><Icon name="x" :size="12" /></button>
      </span>
    </div>
    <div class="cbox">
      <textarea ref="ta" v-model="text" rows="1" aria-label="Write a message"
        :placeholder="store.state.cfg.offline && !store.state.session.email ? 'Leave your email above, then type…' : 'Message…'"
        @input="onInput" @keydown="onKey" />
      <button class="iconbtn" type="button" aria-label="Insert emoji" :aria-expanded="String(emojiOpen)" @click="emojiOpen = !emojiOpen"><Icon name="smile" /></button>
      <button class="iconbtn" type="button" aria-label="Attach a file" @click="fileEl.click()"><Icon name="clip" /></button>
      <button class="sendbtn" type="button" aria-label="Send message" :disabled="!text.trim() && !store.state.pendingFiles.length" @click="send"><Icon name="send" :size="16" /></button>
    </div>
    <EmojiPicker v-if="emojiOpen" @pick="pickEmoji" />
    <input ref="fileEl" type="file" hidden aria-hidden="true" @change="onFile">
  </div>
</template>
