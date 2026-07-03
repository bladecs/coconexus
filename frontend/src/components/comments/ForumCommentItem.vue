<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import ForumCommentComposer from '@/components/comments/ForumCommentComposer.vue';

const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const props = defineProps({
  comment: { type: Object, required: true },
  forumId: { type: Number, required: true },
  loading: { type: Boolean, default: false },
  depth:   { type: Number, default: 0 },
});

const emit = defineEmits(['reply', 'delete']);
const authStore = useAuthStore();
const showReplyForm = ref(false);

function submitReply(payload) {
  emit('reply', payload);
  showReplyForm.value = false;
}

function getPreviewUrl(path) {
  return `${backendUrl}/${path}`;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function authorInitial(comment) {
  const name = comment.user?.profile?.full_name || comment.user?.email || 'U';
  return name[0].toUpperCase();
}
</script>

<template>
  <div
    class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest transition-all"
    :class="depth > 0 ? 'ml-6 border-l-2 border-l-primary/20' : ''"
  >
    <div class="p-5">
      <!-- Header row -->
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-3">
          <!-- Avatar -->
          <div class="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-bold text-primary">{{ authorInitial(comment) }}</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-on-surface leading-tight">
              {{ comment.user?.profile?.full_name || comment.user?.email || 'Pengguna' }}
            </p>
            <p class="text-xs text-on-surface-variant mt-0.5">{{ formatDate(comment.created_at) }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            v-if="authStore.isAuthenticated"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            :class="showReplyForm
              ? 'bg-primary/10 text-primary'
              : 'bg-surface-container text-on-surface-variant hover:bg-primary/8 hover:text-primary border border-outline-variant/50'"
            @click="showReplyForm = !showReplyForm"
          >
            <span class="material-symbols-outlined" style="font-size:13px">{{ showReplyForm ? 'close' : 'reply' }}</span>
            {{ showReplyForm ? 'Tutup' : 'Balas' }}
          </button>
          <button
            v-if="authStore.isAdmin || authStore.user?.role === 'moderator' || authStore.user?.id === comment.user_id"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-900/40"
            @click="$emit('delete', comment.id)"
          >
            <span class="material-symbols-outlined" style="font-size:13px">delete</span>
            Hapus
          </button>
        </div>
      </div>

      <!-- Body -->
      <p class="text-sm text-on-surface leading-7 mb-3">{{ comment.body }}</p>

      <!-- Attachment -->
      <a
        v-if="comment.attachment?.path"
        :href="getPreviewUrl(comment.attachment.path)"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/6 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/12"
      >
        <span class="material-symbols-outlined" style="font-size:14px">attach_file</span>
        {{ comment.attachment.name || 'Lampiran Dokumen' }}
      </a>
    </div>

    <!-- Reply form -->
    <div v-if="showReplyForm" class="border-t border-outline-variant/30 p-4">
      <ForumCommentComposer
        :forum-id="forumId"
        :parent-id="comment.id"
        :loading="loading"
        placeholder="Tulis balasan untuk komentar ini…"
        submit-label="Kirim Balasan"
        @submit="submitReply"
        @cancel="showReplyForm = false"
      />
    </div>

    <!-- Nested replies -->
    <div v-if="comment.replies?.length" class="border-t border-outline-variant/20 p-4 space-y-3">
      <ForumCommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :forum-id="forumId"
        :loading="loading"
        :depth="depth + 1"
        @reply="$emit('reply', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>
