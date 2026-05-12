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
</script>

<template>
  <div class="premium-panel space-y-4 p-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-semibold text-stone-100">
          {{ comment.user?.profile?.full_name || comment.user?.email || 'Pengguna' }}
        </p>
        <p class="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
          {{ new Date(comment.created_at).toLocaleString('id-ID') }}
        </p>
      </div>

      <button
        v-if="authStore.isAuthenticated"
        type="button"
        class="rounded-full border border-white/12 bg-[#383838] px-3 py-1.5 text-xs font-semibold text-stone-200 transition hover:bg-[#434343]"
        @click="showReplyForm = !showReplyForm"
      >
        {{ showReplyForm ? 'Tutup Balasan' : 'Balas' }}
      </button>
    </div>

    <p class="text-sm leading-7 text-stone-300">
      {{ comment.body }}
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <button
        v-if="authStore.isAdmin || authStore.user?.id === comment.user_id"
        type="button"
        class="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/15"
        @click="deleteComment"
      >
        Hapus
      </button>
    </div>

    <CommentComposer
      v-if="showReplyForm"
      :article-id="articleId"
      :parent-id="comment.id"
      :loading="loading"
      placeholder="Tulis balasan untuk komentar ini..."
      submit-label="Kirim Balasan"
      @submit="submitReply"
      @cancel="showReplyForm = false"
    />

    <div v-if="comment.replies?.length" class="space-y-4 border-l border-[#ff7c35]/25 pl-4 md:pl-6">
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
