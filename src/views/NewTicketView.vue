<script setup>
import { reactive, ref } from 'vue';
import Icon from '../components/Icon.vue';
import TopBar from '../components/TopBar.vue';
import { CATEGORIES } from '../constants/content.js';
import { fileMeta, validEmail } from '../utils/format.js';
import { useStore } from '../store/index.js';

const store = useStore();
const pre = store.state.param && typeof store.state.param === 'object' ? store.state.param : {};
const f = reactive({
  category: pre.category && !CATEGORIES.includes(pre.category) ? 'Other' : (pre.category || ''),
  orderId: pre.orderId || '', subject: pre.subject || '', body: pre.body || '',
  name: store.state.session.name || '', email: store.state.session.email || ''
});
const errors = reactive({}), file = ref(null), fileEl = ref(null), busy = ref(false), form = ref(null);

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k]);
  ['category', 'subject', 'body', 'name', 'email'].forEach((k) => {
    const v = String(f[k] || '').trim();
    if (!v) errors[k] = k === 'category' ? 'Choose a category' : 'This field is required';
    else if (k === 'email' && !validEmail(v)) errors[k] = 'Enter a valid email address';
  });
  const first = Object.keys(errors)[0];
  if (first) { const el = form.value.querySelector('[data-f="' + first + '"]'); if (el) el.focus(); }
  return !first;
}
async function submit() {
  if (busy.value || !validate()) return;
  busy.value = true;
  try {
    const fields = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, String(v).trim() || null]));
    const t = await store.createTicket(fields, file.value);
    store.go('ticketDone', t.id);
  } catch (e) {
    const srv = e && e.body && e.body.errors;
    if (srv) Object.entries(srv).forEach(([k, v]) => { errors[k] = Array.isArray(v) ? v[0] : String(v); });
    else store.toast('Couldn\'t submit the ticket — please try again.');
  } finally { busy.value = false; }
}
function onFile() { const x = fileEl.value.files && fileEl.value.files[0]; if (x) file.value = x; fileEl.value.value = ''; }
const clear = (k) => { if (errors[k]) delete errors[k]; };
</script>

<template>
  <div class="view">
    <TopBar title="New ticket" back center />
    <div class="scroll">
      <form ref="form" class="form" novalidate @submit.prevent="submit">
        <div class="note"><span class="ic"><Icon name="clock" :size="16" /></span>
          <span>Tickets get a reference number and are tracked until they're resolved. For a quick question,
            <button type="button" style="color:var(--b);font-weight:600" @click="store.go('chat', 'live')">chat with us</button> instead.</span></div>

        <div class="field"><label for="pf-cat">Category</label>
          <select id="pf-cat" v-model="f.category" class="inp" :class="{ err: errors.category }" data-f="category" required @change="clear('category')">
            <option value="">Choose a category…</option><option v-for="c in CATEGORIES" :key="c">{{ c }}</option>
          </select><div v-if="errors.category" class="errmsg">{{ errors.category }}</div></div>

        <div class="field"><label for="pf-order">Order number <em>(optional)</em></label>
          <input id="pf-order" v-model="f.orderId" class="inp" data-f="orderId" placeholder="e.g. HP-10482"></div>

        <div class="field"><label for="pf-subj">Subject</label>
          <input id="pf-subj" v-model="f.subject" class="inp" :class="{ err: errors.subject }" data-f="subject" required maxlength="120" placeholder="A short summary" @input="clear('subject')">
          <div v-if="errors.subject" class="errmsg">{{ errors.subject }}</div></div>

        <div class="field"><label for="pf-body">Description</label>
          <textarea id="pf-body" v-model="f.body" class="inp" :class="{ err: errors.body }" data-f="body" required rows="4" placeholder="What happened? Include sizes, colours or error messages if relevant." @input="clear('body')" />
          <div v-if="errors.body" class="errmsg">{{ errors.body }}</div>
          <div class="hint">Priority is set by our team — order and billing issues are handled first.</div></div>

        <div class="field"><label>Attachment <em>(optional)</em></label>
          <span v-if="file" class="chip"><Icon name="file" :size="14" /><span>{{ fileMeta(file).name }} · {{ fileMeta(file).size }}</span>
            <button type="button" aria-label="Remove attachment" @click="file = null"><Icon name="x" :size="12" /></button></span>
          <button v-else type="button" class="dropzone" @click="fileEl.click()"><Icon name="clip" :size="18" /><span>Add a photo or screenshot</span></button>
          <input ref="fileEl" type="file" hidden aria-hidden="true" @change="onFile"></div>

        <div class="two">
          <div class="field"><label for="pf-name">Name</label>
            <input id="pf-name" v-model="f.name" class="inp" :class="{ err: errors.name }" data-f="name" required autocomplete="name" @input="clear('name')">
            <div v-if="errors.name" class="errmsg">{{ errors.name }}</div></div>
          <div class="field"><label for="pf-email">Email</label>
            <input id="pf-email" v-model="f.email" class="inp" :class="{ err: errors.email }" type="email" data-f="email" required autocomplete="email" @input="clear('email')">
            <div v-if="errors.email" class="errmsg">{{ errors.email }}</div></div>
        </div>
        <button class="btn block" type="submit" :disabled="busy">{{ busy ? 'Submitting…' : 'Submit ticket' }}</button>
      </form>
    </div>
  </div>
</template>
