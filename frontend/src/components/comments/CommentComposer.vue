<script setup>
import { reactive, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  articleId: {
    type: Number,
    required: true,
  },
  parentId: {
    type: Number,
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Tulis komentar Anda...',
  },
  submitLabel: {
    type: String,
    default: 'Kirim Komentar',
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'cancel']);
const authStore = useAuthStore();

const form = reactive({ body: '' });
const feedback = ref('');

watch(
  () => props.parentId,
  () => {
    form.body = '';
    feedback.value = '';
  }
);

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

  await emit('submit', {
    body: form.body.trim(),
    parent_id: props.parentId,
  });

  form.body = '';
}
</script>

<template>
  <div>
    <textarea
      v-model="form.body"
      rows="4"
      class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm leading-7 text-on-surface outline-none transition resize-none
             placeholder:text-on-surface-variant/60
             focus:border-primary focus:ring-2 focus:ring-primary/10
             disabled:opacity-50"
      :placeholder="placeholder"
      :disabled="!authStore.isAuthenticated"
    />

    <p
      v-if="feedback"
      class="mt-2 flex items-center gap-2 rounded-lg border border-error/20 bg-error/5 px-4 py-2.5 text-sm text-error"
    >
      <span class="material-symbols-outlined flex-shrink-0" style="font-size:16px;font-variation-settings:'FILL' 1">info</span>
      {{ feedback }}
    </p>

    <div class="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        :disabled="loading || !authStore.isAuthenticated"
        class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-sm
               transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleSubmit"
      >
        <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">send</span>
        {{ loading ? 'Memproses...' : submitLabel }}
      </button>

      <button
        v-if="parentId"
        type="button"
        class="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container"
        @click="$emit('cancel')"
      >
        Batal
      </button>
    </div>
  </div>
</template>
