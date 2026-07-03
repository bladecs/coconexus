<script setup>
import { reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  forumId:     { type: Number, required: true },
  parentId:    { type: Number, default: null },
  placeholder: { type: String, default: 'Tulis komentar forum Anda…' },
  submitLabel: { type: String, default: 'Kirim Komentar' },
  loading:     { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'cancel']);
const authStore = useAuthStore();

const form = reactive({ body: '', attachment: null });
const feedback = ref('');
const fileName = ref('');

watch(() => props.parentId, () => {
  form.body = '';
  form.attachment = null;
  feedback.value = '';
  fileName.value = '';
});

function handleAttachmentChange(event) {
  const [file] = event.target.files || [];
  form.attachment = file || null;
  fileName.value = file?.name || '';
}

async function handleSubmit() {
  feedback.value = '';
  if (!authStore.isAuthenticated) {
    feedback.value = 'Anda harus login terlebih dahulu untuk menulis komentar.';
    return;
  }
  if (!form.body.trim()) {
    feedback.value = 'Isi komentar tidak boleh kosong.';
    return;
  }
  emit('submit', { body: form.body.trim(), parent_id: props.parentId, attachment: form.attachment });
  form.body = '';
  form.attachment = null;
  fileName.value = '';
}
</script>

<template>
  <div class="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">

    <!-- Not logged in -->
    <div v-if="!authStore.isAuthenticated" class="flex flex-col items-center gap-3 py-4 text-center">
      <span class="material-symbols-outlined text-outline-variant" style="font-size:36px">lock</span>
      <p class="text-sm text-on-surface-variant">Login untuk ikut berdiskusi di forum ini.</p>
      <RouterLink
        to="/login"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <span class="material-symbols-outlined" style="font-size:16px">login</span>
        Login
      </RouterLink>
    </div>

    <template v-else>
      <!-- Textarea -->
      <textarea
        v-model="form.body"
        rows="4"
        class="w-full rounded-xl border border-outline-variant/50 bg-background px-4 py-3 text-sm leading-7 text-on-surface outline-none transition resize-none
               placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
        :placeholder="placeholder"
      />

      <!-- Attachment -->
      <label class="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-primary/5">
        <span class="material-symbols-outlined text-on-surface-variant flex-shrink-0" style="font-size:20px">attach_file</span>
        <span class="flex-1 min-w-0">
          <span v-if="fileName" class="block font-medium text-on-surface truncate">{{ fileName }}</span>
          <template v-else>
            <span class="block font-semibold text-on-surface-variant">Lampirkan dokumen</span>
            <span class="text-xs text-on-surface-variant/70">PDF, DOC, DOCX, XLS, XLSX, atau TXT. Opsional.</span>
          </template>
        </span>
        <input
          type="file"
          class="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          @change="handleAttachmentChange"
        />
      </label>

      <!-- Feedback -->
      <p
        v-if="feedback"
        class="mt-3 rounded-xl border border-secondary/20 bg-secondary/8 px-4 py-2.5 text-sm text-secondary"
      >{{ feedback }}</p>

      <!-- Actions -->
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleSubmit"
        >
          <span v-if="loading" class="material-symbols-outlined animate-spin" style="font-size:16px">progress_activity</span>
          <span class="material-symbols-outlined" v-else style="font-size:16px">send</span>
          {{ loading ? 'Memproses…' : submitLabel }}
        </button>
        <button
          v-if="parentId"
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
          @click="$emit('cancel')"
        >
          Batal
        </button>
      </div>
    </template>
  </div>
</template>
