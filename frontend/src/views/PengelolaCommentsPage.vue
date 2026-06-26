<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const comments = ref([]);
const discussionForums = ref([]);
const selectedCommentIds = ref([]);
const isLoading = ref(false);
const isForumLoading = ref(false);
const error = ref(null);
const feedback = ref('');
const forumFeedback = ref('');
const meta = ref({
  page: 1,
  limit: 10,
  total_items: 0,
  total_pages: 1,
});
const filters = reactive({
  status: 'pending',
  search: '',
});
const forumForm = reactive({
  title: '',
  summary: '',
  notes: '',
});

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const summary = computed(() => ({
  total: comments.value.length,
  pending: comments.value.filter((comment) => comment.status === 'pending').length,
  approved: comments.value.filter((comment) => comment.status === 'approved').length,
  rejected: comments.value.filter((comment) => comment.status === 'rejected').length,
}));

const filteredComments = computed(() => {
  const keyword = filters.search.trim().toLowerCase();

  return comments.value.filter((comment) => {
    if (!keyword) return true;

    const content = (comment.content || '').toLowerCase();
    const articleTitle = (comment.article?.title || '').toLowerCase();
    const commenter = (comment.user?.profile?.full_name || comment.user?.email || '').toLowerCase();

    return content.includes(keyword) || articleTitle.includes(keyword) || commenter.includes(keyword);
  });
});

const selectedComments = computed(() =>
  comments.value.filter((comment) => selectedCommentIds.value.includes(comment.id))
);

const selectedForumArticle = computed(() => {
  if (selectedComments.value.length === 0) {
    return null;
  }

  return selectedComments.value[0].article || null;
});

const selectedForumCommentCount = computed(() => selectedComments.value.length);

// Helper untuk warna badge status
const getStatusTheme = (status) => {
  const themes = {
    pending: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    approved: 'bg-primary/10 border-emerald-500/30 text-emerald-400',
    rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
  };
  return themes[status] || 'bg-stone-500/10 border-stone-500/30 text-on-surface-variant';
};

async function fetchComments() {
  isLoading.value = true;
  error.value = null;

  try {
    const params = {
      status: filters.status,
      page: meta.value.page,
      limit: meta.value.limit,
    };

    if (filters.search.trim()) {
      params.search = filters.search.trim();
    }

    const { data } = await api.get('/moderator/forum/comments', { params });
    comments.value = data.data.comments || [];
    meta.value = data.data.meta || meta.value;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function fetchDiscussionForums(articleId) {
  isForumLoading.value = true;
  forumFeedback.value = '';

  try {
    const params = {};

    if (articleId) {
      params.article_id = articleId;
    }

    const { data } = await api.get('/moderator/forum/discussion-forums', { params });
    discussionForums.value = data.data.forums || [];
  } catch (err) {
    forumFeedback.value = err.message;
  } finally {
    isForumLoading.value = false;
  }
}

async function searchComments() {
  meta.value.page = 1;
  await fetchComments();
}

async function updateCommentStatus(id, status) {
  feedback.value = '';

  try {
    await api.patch(`/moderator/forum/comments/${id}/status`, { status });
    feedback.value = status === 'approved' ? 'Komentar berhasil disetujui.' : 'Komentar berhasil ditolak.';
    await fetchComments();
    
    // Auto hilangkan notifikasi setelah 3 detik
    setTimeout(() => { feedback.value = ''; }, 3000);
  } catch (err) {
    feedback.value = err.message;
  }
}

function resetForumSelection() {
  selectedCommentIds.value = [];
  forumForm.title = '';
  forumForm.summary = '';
  forumForm.notes = '';
}

function toggleCommentSelection(comment) {
  if (selectedCommentIds.value.includes(comment.id)) {
    selectedCommentIds.value = selectedCommentIds.value.filter((id) => id !== comment.id);
    return;
  }

  if (selectedCommentIds.value.length > 0) {
    const firstArticleId = selectedComments.value[0]?.article_id;
    if (firstArticleId && comment.article_id !== firstArticleId) {
      forumFeedback.value = 'Pilih komentar dari artikel yang sama untuk membuat forum.';
      setTimeout(() => { forumFeedback.value = ''; }, 3000);
      return;
    }
  }

  selectedCommentIds.value = [...selectedCommentIds.value, comment.id];

  if (!forumForm.title && comment.article?.title) {
    forumForm.title = `Forum Diskusi: ${comment.article.title}`;
  }
}

async function createForumDraft() {
  forumFeedback.value = '';

  if (selectedCommentIds.value.length === 0) {
    forumFeedback.value = 'Pilih minimal satu komentar sebagai sumber forum.';
    return;
  }

  const articleId = selectedForumArticle.value?.id;
  if (!articleId) {
    forumFeedback.value = 'Komentar yang dipilih tidak memiliki artikel asal yang valid.';
    return;
  }

  try {
    const defaultTitle = selectedForumArticle.value?.title
      ? `Forum Diskusi: ${selectedForumArticle.value.title}`
      : 'Forum Diskusi';

    await api.post('/moderator/forum/discussion-forums', {
      article_id: articleId,
      title: forumForm.title.trim() || defaultTitle,
      summary: forumForm.summary.trim(),
      notes: forumForm.notes.trim(),
      comment_ids: selectedCommentIds.value,
    });

    forumFeedback.value = 'Draft forum diskusi berhasil dibuat.';
    resetForumSelection();
    await fetchDiscussionForums(articleId);
  } catch (err) {
    forumFeedback.value = err.message;
  }
}

async function validateForum(forumId) {
  forumFeedback.value = '';

  try {
    await api.patch(`/moderator/forum/discussion-forums/${forumId}/validate`, {
      notes: 'Divalidasi dari dashboard moderator komentar.',
    });
    forumFeedback.value = 'Forum berhasil divalidasi.';
    await fetchDiscussionForums(selectedForumArticle.value?.id);
  } catch (err) {
    forumFeedback.value = err.message;
  }
}

async function activateForum(forumId) {
  forumFeedback.value = '';

  try {
    await api.patch(`/moderator/forum/discussion-forums/${forumId}/activate`);
    forumFeedback.value = 'Forum berhasil diaktifkan.';
    await fetchDiscussionForums(selectedForumArticle.value?.id);
  } catch (err) {
    forumFeedback.value = err.message;
  }
}

async function deleteComment(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) return;

  feedback.value = '';

  try {
    await api.delete(`/comments/${id}`);
    feedback.value = 'Komentar berhasil dihapus.';
    await fetchComments();
    
    setTimeout(() => { feedback.value = ''; }, 3000);
  } catch (err) {
    feedback.value = err.message;
  }
}

async function goToPage(page) {
  if (page < 1 || page > meta.value.total_pages) return;
  meta.value.page = page;
  await fetchComments();
}

watch(
  () => filters.status,
  async () => {
    meta.value.page = 1;
    resetForumSelection();
    await fetchComments();
  }
);

watch(
  () => selectedForumArticle.value?.id,
  async (articleId) => {
    if (!articleId) {
      discussionForums.value = [];
      return;
    }

    await fetchDiscussionForums(articleId);
  },
  { immediate: true }
);

onMounted(() => {
  fetchComments();
});
</script>

<template>
  <SiteNavbar variant="moderator" />
  <main class="inner-page min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-6xl">
      <header class="mb-8 flex flex-col justify-between gap-4 border-b border-outline-variant/40 pb-6 md:flex-row md:items-end">
        <div>
          <p class="mb-1 text-xs font-bold tracking-widest text-on-surface-variant uppercase">
            Coconexus / Moderation Queue
          </p>
          <h1 class="text-3xl font-extrabold tracking-tight text-white">Kelola Komentar</h1>
        </div>
      </header>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div
          v-if="feedback"
          class="mb-6 flex items-center rounded-lg border border-emerald-500/20 bg-primary/10 px-5 py-3 text-sm font-medium text-emerald-300"
        >
          <svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ feedback }}
        </div>
      </Transition>

      <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5 shadow-sm transition hover:bg-stone-800">
          <span class="text-xs font-bold tracking-wider text-on-surface-variant uppercase">Total</span>
          <strong class="mt-2 block text-3xl font-black text-on-surface">{{ summary.total }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5 shadow-sm transition hover:bg-stone-800">
          <span class="text-xs font-bold tracking-wider text-on-surface-variant uppercase">Pending</span>
          <strong class="mt-2 block text-3xl font-black text-amber-400">{{ summary.pending }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5 shadow-sm transition hover:bg-stone-800">
          <span class="text-xs font-bold tracking-wider text-on-surface-variant uppercase">Approved</span>
          <strong class="mt-2 block text-3xl font-black text-emerald-400">{{ summary.approved }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5 shadow-sm transition hover:bg-stone-800">
          <span class="text-xs font-bold tracking-wider text-on-surface-variant uppercase">Rejected</span>
          <strong class="mt-2 block text-3xl font-black text-red-400">{{ summary.rejected }}</strong>
        </div>
      </section>

      <section class="mb-8 rounded-xl border border-outline-variant/40 bg-stone-800/30 p-5">
        <div class="grid gap-5 md:grid-cols-[250px_minmax(0,1fr)]">
          <div>
            <label class="mb-2 block text-sm font-medium text-on-surface-variant">Status Antrian</label>
            <select
              v-model="filters.status"
              class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">Semua Status</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-on-surface-variant">Cari Komentar</label>
            <div class="flex flex-col gap-3 sm:flex-row">
              <input
                v-model="filters.search"
                type="text"
                placeholder="Cari isi komentar, judul artikel, atau nama user..."
                class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
                @keyup.enter="searchComments"
              />
              <button
                type="button"
                class="whitespace-nowrap rounded-lg bg-stone-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-stone-600 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:ring-offset-stone-900"
                @click="searchComments"
              >
                Cari Data
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-8 rounded-xl border border-outline-variant/40 bg-stone-800/30 p-5">
        <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 class="text-lg font-bold text-stone-200">Forum Diskusi</h2>
            <p class="text-sm text-on-surface-variant">Pilih komentar yang relevan lalu buat draft forum diskusi dari hasil kurasi moderator.</p>
          </div>
          <div class="text-sm text-on-surface-variant">
            Terpilih: <strong class="text-stone-200">{{ selectedForumCommentCount }}</strong>
          </div>
        </div>

        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform -translate-y-4 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform -translate-y-4 opacity-0"
        >
          <div
            v-if="forumFeedback"
            class="mb-4 rounded-lg border border-sky-500/20 bg-sky-500/10 px-5 py-3 text-sm font-medium text-sky-300"
          >
            {{ forumFeedback }}
          </div>
        </Transition>

        <div class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="rounded-xl border border-outline-variant/40 bg-surface-container p-4">
            <h3 class="mb-3 text-sm font-bold uppercase tracking-widest text-on-surface-variant">Draft Forum Baru</h3>
            <div class="space-y-3">
              <input v-model="forumForm.title" type="text" class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400" placeholder="Judul forum diskusi" />
              <textarea v-model="forumForm.summary" rows="3" class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400" placeholder="Ringkasan forum"></textarea>
              <textarea v-model="forumForm.notes" rows="2" class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400" placeholder="Catatan moderator"></textarea>
              <button
                type="button"
                class="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="selectedForumCommentCount === 0"
                @click="createForumDraft"
              >
                Buat Draft Forum
              </button>
            </div>
          </div>

          <div class="rounded-xl border border-outline-variant/40 bg-surface-container p-4">
            <h3 class="mb-3 text-sm font-bold uppercase tracking-widest text-on-surface-variant">Forum Terkait Artikel</h3>
            <div v-if="selectedForumArticle" class="mb-4 rounded-lg border border-outline-variant/40 bg-stone-800/50 p-3 text-sm text-on-surface-variant">
              Artikel: <strong class="text-on-surface">{{ selectedForumArticle.title }}</strong>
            </div>
            <div v-if="isForumLoading" class="text-sm text-on-surface-variant">Memuat forum...</div>
            <div v-else-if="discussionForums.length === 0" class="text-sm text-stone-500">
              Belum ada forum diskusi untuk artikel ini.
            </div>
            <div v-else class="space-y-3">
              <article
                v-for="forum in discussionForums"
                :key="forum.id"
                class="rounded-lg border border-outline-variant/40 bg-stone-800/50 p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-bold text-on-surface">{{ forum.title }}</p>
                    <p class="mt-1 text-xs text-on-surface-variant">Status: {{ forum.status }}</p>
                  </div>
                  <span class="rounded-full border border-stone-600 px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                    {{ forum.source_comments?.length || 0 }} komentar
                  </span>
                </div>
                <p v-if="forum.summary" class="mt-2 text-sm text-on-surface-variant">{{ forum.summary }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    v-if="forum.status === 'draft'"
                    type="button"
                    class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary"
                    @click="validateForum(forum.id)"
                  >
                    Validasi
                  </button>
                  <button
                    v-if="forum.status === 'validated'"
                    type="button"
                    class="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-500"
                    @click="activateForum(forum.id)"
                  >
                    Aktifkan
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold text-stone-200">Daftar Komentar</h2>
        </div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 py-16">
          <div class="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-stone-600 border-t-stone-300"></div>
          <p class="text-sm text-on-surface-variant">Memuat antrian komentar...</p>
        </div>

        <div v-else-if="error" class="rounded-xl border border-dashed border-red-500/30 bg-red-500/5 py-12 text-center text-red-400">
          <p class="font-medium">Terjadi kesalahan</p>
          <p class="text-sm opacity-80">{{ error }}</p>
        </div>

        <div v-else-if="filteredComments.length === 0" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 py-16 text-center">
          <svg class="mb-3 h-10 w-10 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="font-medium text-on-surface-variant">Tidak ada komentar yang ditemukan.</p>
          <p class="text-sm text-stone-500">Coba ubah filter atau kata kunci pencarian Anda.</p>
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="comment in filteredComments"
            :key="comment.id"
            class="rounded-xl border border-outline-variant/40 bg-stone-800/30 p-5 transition hover:bg-stone-800"
          >
            <div class="mb-4 flex flex-col justify-between gap-3 border-b border-outline-variant/40/50 pb-4 sm:flex-row sm:items-start">
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface-variant">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-stone-500 bg-stone-800 text-sky-500 focus:ring-sky-500"
                    :checked="selectedCommentIds.includes(comment.id)"
                    @change="toggleCommentSelection(comment)"
                  />
                  Pilih forum
                </label>
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-700 text-sm font-bold text-on-surface-variant">
                  {{ (comment.user?.profile?.full_name || comment.user?.email || 'U')[0].toUpperCase() }}
                </div>
                <div>
                  <p class="font-bold text-stone-200">
                    {{ comment.user?.profile?.full_name || comment.user?.email || 'Unknown User' }}
                  </p>
                  <p class="text-xs text-on-surface-variant">
                    {{ comment.created_at ? new Date(comment.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tanpa waktu' }}
                  </p>
                </div>
              </div>
              <div class="text-left sm:text-right">
                <p class="text-xs font-medium text-on-surface-variant">Pada artikel:</p>
                <p class="text-sm font-semibold text-stone-200 line-clamp-1">{{ comment.article?.title || 'Artikel Dihapus' }}</p>
              </div>
            </div>

            <p class="mb-5 text-sm leading-relaxed text-on-surface-variant">
              "{{ comment.content }}"
            </p>

            <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <span 
                class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider"
                :class="getStatusTheme(comment.status)"
              >
                {{ statusLabels[comment.status] || comment.status }}
              </span>

              <div class="flex flex-wrap gap-2">
                <button
                  v-if="comment.status !== 'approved'"
                  type="button"
                  class="rounded-lg border border-emerald-500/30 bg-primary/10 px-4 py-2 text-xs font-bold text-emerald-400 transition hover:bg-primary hover:text-white"
                  @click="updateCommentStatus(comment.id, 'approved')"
                >
                  Setujui
                </button>
                <button
                  v-if="comment.status !== 'rejected'"
                  type="button"
                  class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 transition hover:bg-amber-500 hover:text-white"
                  @click="updateCommentStatus(comment.id, 'rejected')"
                >
                  Tolak
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                  @click="deleteComment(comment.id)"
                >
                  Hapus
                </button>
              </div>
            </div>
          </article>
        </div>

        <div
          v-if="meta.total_pages > 1 && !isLoading"
          class="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-outline-variant/40 bg-stone-800/30 p-4 sm:flex-row"
        >
          <button
            type="button"
            class="rounded-lg bg-stone-700 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-stone-600 disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="meta.page <= 1"
            @click="goToPage(meta.page - 1)"
          >
            &larr; Sebelumnya
          </button>
          <span class="text-sm font-medium text-on-surface-variant">
            Halaman <strong class="text-stone-200">{{ meta.page }}</strong> dari <strong class="text-stone-200">{{ meta.total_pages }}</strong> 
            <span class="mx-2 opacity-50">|</span> 
            Total {{ meta.total_items }} data
          </span>
          <button
            type="button"
            class="rounded-lg bg-stone-700 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-stone-600 disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="meta.page >= meta.total_pages"
            @click="goToPage(meta.page + 1)"
          >
            Berikutnya &rarr;
          </button>
        </div>
      </section>
    </section>
  </main>
</template>
