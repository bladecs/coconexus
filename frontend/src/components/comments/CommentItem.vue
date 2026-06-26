<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import CommentComposer from '@/components/comments/CommentComposer.vue';

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  articleId: {
    type: Number,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['reply', 'delete']);
const authStore = useAuthStore();
const showReplyForm = ref(false);

function submitReply(payload) {
  emit('reply', payload);
  showReplyForm.value = false;
}

function deleteComment() {
  emit('delete', props.comment.id);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
</script>

<template>
  <div class="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 space-y-3">

    <!-- Header: avatar + name + date + reply button -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <!-- Avatar -->
        <div class="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
          {{ (comment.user?.profile?.full_name || comment.user?.email || 'U')[0].toUpperCase() }}
        </div>
        <div>
          <p class="text-sm font-semibold text-on-surface leading-tight">
            {{ comment.user?.profile?.full_name || comment.user?.email || 'Pengguna' }}
          </p>
          <p class="text-xs text-on-surface-variant mt-0.5">
            {{ formatDate(comment.created_at) }}
          </p>
        </div>
      </div>

      <button
        v-if="authStore.isAuthenticated"
        type="button"
        class="flex-shrink-0 rounded-lg border border-outline-variant px-3 py-1 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
        @click="showReplyForm = !showReplyForm"
      >
        {{ showReplyForm ? 'Tutup' : 'Balas' }}
      </button>
    </div>

    <!-- Comment body -->
    <p class="text-sm leading-relaxed text-on-surface pl-12">
      {{ comment.body }}
    </p>

    <!-- Attachment -->
    <a
      v-if="comment.attachment?.path"
      :href="comment.attachment.path"
      target="_blank"
      rel="noreferrer"
      class="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 ml-12"
    >
      <span class="material-symbols-outlined" style="font-size:14px">attach_file</span>
      Lampiran: {{ comment.attachment.name || 'Dokumen' }}
    </a>

    <!-- Delete -->
    <div v-if="authStore.isAdmin || authStore.user?.id === comment.user_id" class="pl-12">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-lg border border-error/20 bg-error/5 px-3 py-1 text-xs font-semibold text-error transition hover:bg-error/10"
        @click="deleteComment"
      >
        <span class="material-symbols-outlined" style="font-size:13px">delete</span>
        Hapus
      </button>
    </div>

    <!-- Reply form -->
    <div v-if="showReplyForm" class="pl-12 pt-2">
      <CommentComposer
        :article-id="articleId"
        :parent-id="comment.id"
        :loading="loading"
        placeholder="Tulis balasan untuk komentar ini..."
        submit-label="Kirim Balasan"
        @submit="submitReply"
        @cancel="showReplyForm = false"
      />
    </div>

    <!-- Nested replies -->
    <div
      v-if="comment.replies?.length"
      class="pl-12 space-y-3 border-l-2 border-outline-variant/30 ml-4"
    >
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :article-id="articleId"
        :loading="loading"
        @reply="$emit('reply', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>

  </div>
</template>
