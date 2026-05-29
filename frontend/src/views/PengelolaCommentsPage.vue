<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const comments = ref([]);
const isLoading = ref(false);
const error = ref(null);
const feedback = ref('');
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
    if (!keyword) {
      return true;
    }

    const content = (comment.content || '').toLowerCase();
    const articleTitle = (comment.article?.title || '').toLowerCase();
    const commenter = (comment.user?.profile?.full_name || comment.user?.email || '').toLowerCase();

    return content.includes(keyword) || articleTitle.includes(keyword) || commenter.includes(keyword);
  });
});

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

    const { data } = await api.get('/comments', { params });
    comments.value = data.data.comments || [];
    meta.value = data.data.meta || meta.value;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function searchComments() {
  meta.value.page = 1;
  await fetchComments();
}

async function updateCommentStatus(id, status) {
  feedback.value = '';

  try {
    await api.patch(`/comments/${id}/status`, { status });
    feedback.value =
      status === 'approved'
        ? 'Komentar berhasil disetujui.'
        : 'Komentar berhasil ditolak.';
    await fetchComments();
  } catch (err) {
    feedback.value = err.message;
  }
}

async function deleteComment(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) return;

  feedback.value = '';

  try {
    await api.delete(`/comments/${id}`);
    feedback.value = 'Komentar berhasil dihapus.';
    await fetchComments();
  } catch (err) {
    feedback.value = err.message;
  }
}

async function goToPage(page) {
  if (page < 1 || page > meta.value.total_pages) {
    return;
  }

  meta.value.page = page;
  await fetchComments();
}

watch(
  () => filters.status,
  async () => {
    meta.value.page = 1;
    await fetchComments();
  }
);

onMounted(() => {
  fetchComments();
});
</script>

<template>
  <main class="inner-page pengelola-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="pengelola" />

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / MODERATION QUEUE</p>
          <h1>Kelola Komentar</h1>
        </div>
      </header>

      <p
        v-if="feedback"
        class="mb-6 rounded-lg border border-[#ff7c35]/20 bg-[#ff7c35]/10 px-5 py-4 text-sm font-medium text-[#ffd1b8]"
      >
        {{ feedback }}
      </p>

      <section class="admin-signal-board mb-6">
        <div class="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <label class="mb-2 block text-sm">Status Antrian</label>
            <select
              v-model="filters.status"
              class="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-stone-100"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">Semua Status</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-sm">Cari Komentar</label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari isi komentar, artikel, atau nama..."
              class="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-stone-100"
              @keyup.enter="searchComments"
            />
            <button
              type="button"
              class="mt-3 rounded border border-stone-600 bg-stone-800 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-stone-700"
              @click="searchComments"
            >
              Cari
            </button>
          </div>
        </div>
      </section>

      <section class="admin-signal-board mb-6">
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div class="moderation-stat">
            <span>Total</span>
            <strong>{{ summary.total }}</strong>
          </div>
          <div class="moderation-stat">
            <span>Pending</span>
            <strong>{{ summary.pending }}</strong>
          </div>
          <div class="moderation-stat">
            <span>Approved</span>
            <strong>{{ summary.approved }}</strong>
          </div>
          <div class="moderation-stat">
            <span>Rejected</span>
            <strong>{{ summary.rejected }}</strong>
          </div>
        </div>
      </section>

      <section class="admin-signal-board">
        <p class="admin-section-label mb-4">DAFTAR KOMENTAR</p>

        <div v-if="isLoading" class="py-8 text-center">
          <p>Memuat antrian komentar...</p>
        </div>

        <div v-else-if="error" class="py-8 text-center text-red-400">
          {{ error }}
        </div>

        <div v-else-if="filteredComments.length === 0" class="py-8 text-center text-stone-400">
          Tidak ada komentar yang cocok dengan filter.
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="comment in filteredComments"
            :key="comment.id"
            class="rounded border border-stone-700 p-4 transition hover:bg-stone-800"
          >
            <div class="mb-2 flex items-start justify-between gap-4">
              <div>
                <p class="font-semibold">{{ comment.user?.profile?.full_name || comment.user?.email || 'User' }}</p>
                <p class="text-xs text-stone-400">
                  {{ comment.created_at ? new Date(comment.created_at).toLocaleString('id-ID') : 'Tanpa waktu' }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold">{{ comment.article?.title || 'Artikel Dihapus' }}</p>
                <span class="comment-status" :data-status="comment.status">
                  {{ statusLabels[comment.status] || comment.status }}
                </span>
              </div>
            </div>

            <p class="mb-4 text-stone-300">{{ comment.content }}</p>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/15"
                @click="updateCommentStatus(comment.id, 'approved')"
              >
                Setujui
              </button>
              <button
                type="button"
                class="rounded border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-500/15"
                @click="updateCommentStatus(comment.id, 'rejected')"
              >
                Tolak
              </button>
              <button
                type="button"
                class="rounded border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/15"
                @click="deleteComment(comment.id)"
              >
                Hapus
              </button>
            </div>
          </article>
        </div>

        <div
          v-if="meta.total_pages > 1"
          class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-700 pt-4"
        >
          <button
            type="button"
            class="rounded border border-stone-600 bg-stone-800 px-4 py-2 text-sm font-semibold text-stone-200 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="meta.page <= 1"
            @click="goToPage(meta.page - 1)"
          >
            Sebelumnya
          </button>
          <span class="text-sm text-stone-400">
            Halaman {{ meta.page }} dari {{ meta.total_pages }} · {{ meta.total_items }} komentar
          </span>
          <button
            type="button"
            class="rounded border border-stone-600 bg-stone-800 px-4 py-2 text-sm font-semibold text-stone-200 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="meta.page >= meta.total_pages"
            @click="goToPage(meta.page + 1)"
          >
            Berikutnya
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.admin-ops-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgb(120 113 108);
}

.admin-ops-header h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 0.25rem;
}

.admin-section-label {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: rgb(168 162 158);
  font-weight: 600;
  text-transform: uppercase;
}

.admin-signal-board {
  background-color: rgb(41 37 36);
  border: 1px solid rgb(120 113 108);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.moderation-stat {
  border: 1px solid rgb(68 64 60);
  border-radius: 0.5rem;
  background: rgb(28 25 23);
  padding: 1rem;
}

.moderation-stat span {
  display: block;
  color: rgb(168 162 158);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.moderation-stat strong {
  display: block;
  margin-top: 0.5rem;
  font-size: 1.5rem;
  font-weight: 800;
}

.comment-status {
  display: inline-flex;
  margin-top: 0.35rem;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0.35rem 0.7rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.comment-status[data-status='pending'] {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.12);
  color: rgb(252, 211, 77);
}

.comment-status[data-status='approved'] {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
  color: rgb(134, 239, 172);
}

.comment-status[data-status='rejected'] {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
  color: rgb(252, 165, 165);
}
</style>
