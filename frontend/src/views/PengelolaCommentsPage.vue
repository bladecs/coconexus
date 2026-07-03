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

const getStatusTheme = (status) => {
  const themes = {
    pending: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    approved: 'bg-primary/10 border-emerald-500/30 text-emerald-400',
    rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
  };
  return themes[status] || 'bg-stone-500/10 border-stone-500/30 text-on-surface-variant';
};

const getStatusIcon = (status) => {
  return status === 'approved' ? 'check_circle' : status === 'rejected' ? 'cancel' : 'pending';
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
  <main class="inner-page pengelola-workspace min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">
    <section class="mx-auto max-w-6xl">

      <!-- ── Header ── -->
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/30 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-orange-400" style="font-size:15px">comment</span>
            <p class="text-xs font-bold uppercase tracking-widest text-orange-400/80">Coconexus / Moderation Queue</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Kelola Komentar</h1>
          <p class="mt-1 text-sm text-on-surface-variant">Moderasi antrian komentar dan kurasi forum diskusi</p>
        </div>
      </header>

      <!-- ── Feedback ── -->
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="feedback" class="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
          <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">check_circle</span>
          {{ feedback }}
        </div>
      </Transition>

      <!-- ── Stats ── -->
      <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="cm-stat-card">
          <span class="material-symbols-outlined cm-stat-icon text-on-surface-variant">comment</span>
          <p class="cm-stat-label">Total</p>
          <strong class="cm-stat-value text-on-surface">{{ summary.total }}</strong>
        </div>
        <div class="cm-stat-card">
          <span class="material-symbols-outlined cm-stat-icon text-amber-400">pending</span>
          <p class="cm-stat-label">Pending</p>
          <strong class="cm-stat-value text-amber-400">{{ summary.pending }}</strong>
        </div>
        <div class="cm-stat-card">
          <span class="material-symbols-outlined cm-stat-icon text-emerald-400">check_circle</span>
          <p class="cm-stat-label">Approved</p>
          <strong class="cm-stat-value text-emerald-400">{{ summary.approved }}</strong>
        </div>
        <div class="cm-stat-card">
          <span class="material-symbols-outlined cm-stat-icon text-red-400">cancel</span>
          <p class="cm-stat-label">Rejected</p>
          <strong class="cm-stat-value text-red-400">{{ summary.rejected }}</strong>
        </div>
      </section>

      <!-- ── Filter ── -->
      <section class="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 sm:w-52">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">filter_list</span>
            <select v-model="filters.status" class="flex-1 bg-transparent text-sm text-on-surface outline-none">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">Semua Status</option>
            </select>
          </div>
          <div class="flex flex-1 items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">search</span>
            <input v-model="filters.search" type="text" placeholder="Cari isi komentar, judul artikel, atau nama user..." class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" @keyup.enter="searchComments" />
          </div>
          <button @click="searchComments" class="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-4 py-2 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface">
            <span class="material-symbols-outlined" style="font-size:14px">search</span>
            Cari
          </button>
        </div>
      </section>

      <!-- ── Forum Builder ── -->
      <section class="mb-8 overflow-hidden rounded-2xl border border-outline-variant/30">
        <div class="flex items-center justify-between border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-orange-400" style="font-size:16px">forum</span>
            <h2 class="text-sm font-bold text-on-surface">Kurasi Forum Diskusi</h2>
          </div>
          <span class="rounded-full border border-outline-variant/30 bg-surface-container-low px-3 py-1 text-xs text-on-surface-variant">
            <span class="font-bold text-on-surface">{{ selectedForumCommentCount }}</span> komentar dipilih
          </span>
        </div>

        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
          <div v-if="forumFeedback" class="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-300">
            <span class="material-symbols-outlined" style="font-size:15px;font-variation-settings:'FILL' 1">info</span>
            {{ forumFeedback }}
          </div>
        </Transition>

        <div class="grid gap-5 p-5 lg:grid-cols-2">
          <!-- Draft Form -->
          <div class="rounded-xl border border-outline-variant/30 bg-surface-container p-4">
            <p class="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Draft Forum Baru</p>
            <div class="space-y-2.5">
              <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2">
                <span class="material-symbols-outlined text-on-surface-variant shrink-0" style="font-size:15px">title</span>
                <input v-model="forumForm.title" type="text" class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" placeholder="Judul forum diskusi" />
              </div>
              <div class="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2">
                <textarea v-model="forumForm.summary" rows="3" class="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" placeholder="Ringkasan forum"></textarea>
              </div>
              <div class="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2">
                <textarea v-model="forumForm.notes" rows="2" class="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" placeholder="Catatan moderator"></textarea>
              </div>
              <button type="button" @click="createForumDraft" :disabled="selectedForumCommentCount === 0" class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40">
                <span class="material-symbols-outlined" style="font-size:16px">add_circle</span>
                Buat Draft Forum
              </button>
            </div>
          </div>

          <!-- Related Forums -->
          <div class="rounded-xl border border-outline-variant/30 bg-surface-container p-4">
            <p class="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Forum Terkait Artikel</p>
            <div v-if="selectedForumArticle" class="mb-3 rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              Artikel: <span class="font-semibold text-on-surface">{{ selectedForumArticle.title }}</span>
            </div>
            <div v-if="isForumLoading" class="flex items-center gap-2 text-sm text-on-surface-variant">
              <span class="material-symbols-outlined animate-spin" style="font-size:15px">progress_activity</span> Memuat...
            </div>
            <div v-else-if="discussionForums.length === 0" class="py-6 text-center text-sm text-on-surface-variant">
              <span class="material-symbols-outlined mb-1.5 block text-3xl text-outline-variant">forum</span>
              Belum ada forum untuk artikel ini
            </div>
            <div v-else class="space-y-2.5">
              <div v-for="forum in discussionForums" :key="forum.id" class="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="font-bold text-on-surface text-sm">{{ forum.title }}</p>
                    <p class="mt-0.5 text-xs text-on-surface-variant">{{ forum.status }} · {{ forum.source_comments?.length || 0 }} komentar</p>
                  </div>
                  <div class="flex gap-1.5">
                    <button v-if="forum.status === 'draft'" type="button" @click="validateForum(forum.id)" class="inline-flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20">
                      <span class="material-symbols-outlined" style="font-size:12px">verified</span>
                      Validasi
                    </button>
                    <button v-if="forum.status === 'validated'" type="button" @click="activateForum(forum.id)" class="inline-flex items-center gap-1 rounded-lg border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-400 transition hover:bg-sky-500/20">
                      <span class="material-symbols-outlined" style="font-size:12px">play_circle</span>
                      Aktifkan
                    </button>
                  </div>
                </div>
                <p v-if="forum.summary" class="mt-1.5 text-xs text-on-surface-variant">{{ forum.summary }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Comment List ── -->
      <section>
        <div class="mb-4 flex items-center gap-2">
          <span class="material-symbols-outlined text-orange-400" style="font-size:18px">queue</span>
          <h2 class="text-lg font-bold text-on-surface">Daftar Komentar</h2>
        </div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 py-16">
          <span class="material-symbols-outlined mb-3 animate-spin text-4xl text-on-surface-variant">progress_activity</span>
          <p class="text-sm text-on-surface-variant">Memuat antrian komentar...</p>
        </div>

        <div v-else-if="error" class="rounded-2xl border border-dashed border-red-500/30 bg-red-500/5 py-12 text-center text-red-400">
          <span class="material-symbols-outlined mb-2 block text-4xl">error</span>
          <p class="text-sm">{{ error }}</p>
        </div>

        <div v-else-if="filteredComments.length === 0" class="rounded-2xl border border-dashed border-outline-variant/30 py-20 text-center">
          <span class="material-symbols-outlined mb-3 block text-5xl text-outline-variant">comment</span>
          <p class="font-semibold text-on-surface-variant">Tidak ada komentar yang ditemukan</p>
          <p class="text-sm text-on-surface-variant">Coba ubah filter atau kata kunci pencarian</p>
        </div>

        <div v-else class="space-y-3">
          <article v-for="comment in filteredComments" :key="comment.id" class="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest transition-colors hover:border-orange-500/20">
            <!-- Comment header -->
            <div class="flex flex-col justify-between gap-3 border-b border-outline-variant/20 bg-surface-container px-5 py-3.5 sm:flex-row sm:items-center">
              <div class="flex items-center gap-3">
                <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-high">
                  <input type="checkbox" class="h-3.5 w-3.5 rounded border-outline-variant bg-surface-container text-sky-500 focus:ring-sky-500" :checked="selectedCommentIds.includes(comment.id)" @change="toggleCommentSelection(comment)" />
                  Forum
                </label>
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-sm font-bold text-on-surface">
                  {{ (comment.user?.profile?.full_name || comment.user?.email || 'U')[0].toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-bold text-on-surface">{{ comment.user?.profile?.full_name || comment.user?.email || 'Unknown User' }}</p>
                  <p class="text-xs text-on-surface-variant">{{ comment.created_at ? new Date(comment.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—' }}</p>
                </div>
              </div>
              <div class="text-left sm:text-right">
                <p class="text-xs text-on-surface-variant">Pada artikel</p>
                <p class="line-clamp-1 max-w-[260px] text-sm font-semibold text-on-surface">{{ comment.article?.title || 'Artikel Dihapus' }}</p>
              </div>
            </div>

            <!-- Comment body + actions -->
            <div class="px-5 py-4">
              <p class="mb-4 text-sm leading-relaxed text-on-surface-variant">"{{ comment.content }}"</p>
              <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider" :class="getStatusTheme(comment.status)">
                  <span class="material-symbols-outlined" style="font-size:11px;font-variation-settings:'FILL' 1">{{ getStatusIcon(comment.status) }}</span>
                  {{ statusLabels[comment.status] || comment.status }}
                </span>

                <div class="flex flex-wrap gap-1.5">
                  <button v-if="comment.status !== 'approved'" type="button" @click="updateCommentStatus(comment.id, 'approved')" class="cm-action-btn cm-action--approve">
                    <span class="material-symbols-outlined" style="font-size:13px">check_circle</span>
                    Setujui
                  </button>
                  <button v-if="comment.status !== 'rejected'" type="button" @click="updateCommentStatus(comment.id, 'rejected')" class="cm-action-btn cm-action--reject">
                    <span class="material-symbols-outlined" style="font-size:13px">cancel</span>
                    Tolak
                  </button>
                  <button type="button" @click="deleteComment(comment.id)" class="cm-action-btn cm-action--delete">
                    <span class="material-symbols-outlined" style="font-size:13px">delete</span>
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <div v-if="meta.total_pages > 1 && !isLoading" class="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:flex-row">
          <button type="button" @click="goToPage(meta.page - 1)" :disabled="meta.page <= 1" class="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-30">
            <span class="material-symbols-outlined" style="font-size:16px">chevron_left</span>
            Sebelumnya
          </button>
          <span class="text-sm font-medium text-on-surface-variant">
            Halaman <strong class="text-on-surface">{{ meta.page }}</strong> dari <strong class="text-on-surface">{{ meta.total_pages }}</strong>
            <span class="mx-2 opacity-40">|</span>
            Total <strong class="text-on-surface">{{ meta.total_items }}</strong> data
          </span>
          <button type="button" @click="goToPage(meta.page + 1)" :disabled="meta.page >= meta.total_pages" class="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-30">
            Berikutnya
            <span class="material-symbols-outlined" style="font-size:16px">chevron_right</span>
          </button>
        </div>
      </section>

    </section>
  </main>
</template>

<style scoped>
.cm-stat-card {
  border-radius: 1rem;
  border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-lowest));
  padding: 1.1rem 1.25rem;
  display: flex; flex-direction: column; gap: 0.35rem;
  transition: border-color 0.2s;
}
.cm-stat-card:hover { border-color: rgb(251 146 60 / 0.25); }
.cm-stat-icon { font-size: 1.25rem; }
.cm-stat-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(var(--color-on-surface-variant)); }
.cm-stat-value { font-size: 2rem; font-weight: 900; line-height: 1; display: block; }

.cm-action-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 0.8rem; border-radius: 0.6rem; border: 1px solid transparent;
  font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: background-color 0.15s;
}
.cm-action--approve { background: rgb(16 185 129 / 0.1); color: rgb(52 211 153); border-color: rgb(16 185 129 / 0.2); }
.cm-action--approve:hover { background: rgb(16 185 129 / 0.2); }
.cm-action--reject  { background: rgb(245 158 11 / 0.1); color: rgb(251 191 36); border-color: rgb(245 158 11 / 0.2); }
.cm-action--reject:hover { background: rgb(245 158 11 / 0.2); }
.cm-action--delete  { background: rgb(239 68 68 / 0.1); color: rgb(248 113 113); border-color: rgb(239 68 68 / 0.2); }
.cm-action--delete:hover { background: rgb(239 68 68 / 0.2); }
</style>
