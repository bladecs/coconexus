<script setup>
import { reactive, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  forumId: {
    type: Number,
    required: true,
  },
  parentId: {
    type: Number,
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Tulis komentar forum Anda...',
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

const form = reactive({
  body: '',
  attachment: null,
});

const feedback = ref('');

watch(
  () => props.parentId,
  () => {
    form.body = '';
    form.attachment = null;
    feedback.value = '';
  }
);

function handleAttachmentChange(event) {
  const [file] = event.target.files || [];
  form.attachment = file || null;
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

  await emit('submit', {
    body: form.body.trim(),
    parent_id: props.parentId,
    attachment: form.attachment,
  });

  form.body = '';
  form.attachment = null;
}
</script>

<template>
  <div class="premium-panel p-5">
    <textarea
      v-model="form.body"
      rows="4"
      class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-sm leading-7 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
      :placeholder="placeholder"
    />

    <label class="mt-4 flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-white/10 bg-[#343434] px-4 py-3 text-sm text-stone-300 transition hover:border-[#ff7c35]/35 hover:bg-[#3a3a3a]">
      <span class="font-semibold text-stone-100">Lampiran dokumen</span>
      <span class="text-xs text-stone-500">PDF, DOC, DOCX, XLS, XLSX, atau TXT. Opsional.</span>
      <input
        type="file"
        class="text-sm text-stone-300 file:mr-4 file:rounded-full file:border-0 file:bg-[#ff7c35] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#e86f2f]"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
        @change="handleAttachmentChange"
      />
    </label>

    <p v-if="feedback" class="mt-3 rounded-2xl border border-[#ff7c35]/20 bg-[#ff7c35]/10 px-4 py-3 text-sm text-[#ffd0b6]">
      {{ feedback }}
    </p>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        :disabled="loading"
        class="rounded-full bg-[#ff7c35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e86f2f] disabled:cursor-not-allowed disabled:opacity-60"
        @click="handleSubmit"
      >
        {{ loading ? 'Memproses...' : submitLabel }}
      </button>

      <button
        v-if="parentId"
        type="button"
        class="rounded-full border border-white/12 bg-[#383838] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-[#424242]"
        @click="$emit('cancel')"
      >
        Batal
      </button>
    </div>
  </div>
</template>
