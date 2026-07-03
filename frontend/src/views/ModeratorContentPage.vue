<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const router = useRouter();

const articles = ref([]);
const isLoading = ref(false);
const error = ref(null);
const feedback = ref('');
const filters = reactive({ status: 'all', search: '' });

const filteredArticles = computed(() => {
  return articles.value.filter((a) => {
    const matchesStatus = filters.status === 'all' || a.status === filters.status;
    const matchesSearch = (a.title || '').toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });
});

const stats = computed(() => ({
  total: articles.value.length,
  draft: articles.value.filter((a) => a.status === 'draft').length,
  revision: articles.value.filter((a) => a.status === 'revision').length,
  under_review: articles.value.filter((a) => a.status === 'under_review').length,
  published: articles.value.filter((a) => a.status === 'published').length,
}));

async function fetchArticles() {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/moderator/content/articles');
    articles.value = data.data.articles || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function updateStatus(id, status) {
  feedback.value = '';
  try {
    await api.patch(`/moderator/content/articles/${id}/status`, { status });
    feedback.value = `Status artikel berhasil diubah ke "${status}".`;
    await fetchArticles();
  } catch (err) {
    feedback.value = err.message;
  }
}

onMounted(() => fetchArticles());
</script>

<template>
  <SiteNavbar variant="moderator" />
  <main class="inner-page moderator-workspace min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">
    <section class="mx-auto max-w-7xl">

      <!-- ── Header ── -->
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/30 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-sky-400" style="font-size:15px">rate_review</span>
            <p class="text-xs font-bold uppercase tracking-widest text-sky-400/80">Coconexus / Moderator Konten</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Review Konten Artikel</h1>
          <p class="mt-1 text-sm text-on-surface-variant">Tinjau kualitas naskah sebelum lanjut ke tahap publikasi</p>
        </div>
        <button @click="fetchArticles" class="inline-flex items-center gap-2 self-start rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:self-auto">
          <span class="material-symbols-outlined" style="font-size:16px">refresh</span>
          Refresh
        </button>
      </header>

      <!-- ── Feedback ── -->
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="feedback" class="mb-6 flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-300">
          <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">info</span>
          {{ feedback }}
        </div>
      </Transition>

      <!-- ── Stats ── -->
      <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div class="mod-stat-card">
          <span class="material-symbols-outlined mod-stat-icon text-on-surface-variant">article</span>
          <p class="mod-stat-label">Total</p>
          <strong class="mod-stat-value text-on-surface">{{ stats.total }}</strong>
        </div>
        <div class="mod-stat-card">
          <span class="material-symbols-outlined mod-stat-icon text-amber-400">draft</span>
          <p class="mod-stat-label">Draft</p>
          <strong class="mod-stat-value text-amber-400">{{ stats.draft }}</strong>
        </div>
        <div class="mod-stat-card">
          <span class="material-symbols-outlined mod-stat-icon text-orange-400">rate_review</span>
          <p class="mod-stat-label">Revisi</p>
          <strong class="mod-stat-value text-orange-400">{{ stats.revision }}</strong>
        </div>
        <div class="mod-stat-card border-sky-500/20">
          <span class="material-symbols-outlined mod-stat-icon text-sky-400">pending</span>
          <p class="mod-stat-label">Dalam Review</p>
          <strong class="mod-stat-value text-sky-400">{{ stats.under_review }}</strong>
        </div>
        <div class="mod-stat-card">
          <span class="material-symbols-outlined mod-stat-icon text-emerald-400">verified</span>
          <p class="mod-stat-label">Published</p>
          <strong class="mod-stat-value text-emerald-400">{{ stats.published }}</strong>
        </div>
      </section>

      <!-- ── Filter ── -->
      <section class="mb-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 sm:w-52">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">filter_list</span>
            <select v-model="filters.status" class="flex-1 bg-transparent text-sm text-on-surface outline-none">
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="revision">Revision</option>
              <option value="under_review">Under Review</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div class="flex flex-1 items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">search</span>
            <input v-model="filters.search" type="text" placeholder="Cari judul artikel..." class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" />
          </div>
          <p class="shrink-0 text-xs text-on-surface-variant"><span class="font-bold text-on-surface">{{ filteredArticles.length }}</span> artikel</p>
        </div>
      </section>

      <!-- ── Table ── -->
      <section class="overflow-hidden rounded-2xl border border-outline-variant/30">
        <div class="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
          <span class="material-symbols-outlined text-sky-400" style="font-size:16px">manage_search</span>
          <h2 class="text-sm font-bold text-on-surface">Daftar Artikel</h2>
        </div>

        <div v-if="isLoading" class="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
          <span class="material-symbols-outlined animate-spin" style="font-size:20px">progress_activity</span>
          <span class="text-sm">Memuat artikel...</span>
        </div>
        <div v-else-if="error" class="flex items-center justify-center gap-2 py-12 text-red-400">
          <span class="material-symbols-outlined" style="font-size:18px">error</span>
          <span class="text-sm">{{ error }}</span>
        </div>
        <div v-else-if="filteredArticles.length === 0" class="py-20 text-center">
          <span class="material-symbols-outlined mb-3 block text-5xl text-outline-variant">article</span>
          <p class="font-semibold text-on-surface-variant">Tidak ada artikel yang cocok</p>
        </div>

        <table v-else class="w-full text-left text-sm">
          <thead class="border-b border-outline-variant/20 bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th class="px-5 py-3.5 font-semibold">Judul</th>
              <th class="px-5 py-3.5 font-semibold">Status</th>
              <th class="px-5 py-3.5 font-semibold">Kategori</th>
              <th class="px-5 py-3.5 text-right font-semibold">Tanggal</th>
              <th class="px-5 py-3.5 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in filteredArticles" :key="article.id" class="group border-b border-outline-variant/10 transition-colors last:border-0 hover:bg-sky-500/3">
              <td class="px-5 py-3.5">
                <p class="line-clamp-1 max-w-xs font-semibold text-on-surface">{{ article.title }}</p>
              </td>
              <td class="px-5 py-3.5">
                <span class="mod-status-badge" :class="{
                  'mod-status--published': article.status === 'published',
                  'mod-status--draft': article.status === 'draft',
                  'mod-status--revision': article.status === 'revision',
                  'mod-status--review': article.status === 'under_review',
                }">
                  <span class="material-symbols-outlined" style="font-size:11px;font-variation-settings:'FILL' 1">
                    {{ article.status === 'published' ? 'check_circle' : article.status === 'draft' ? 'edit_note' : article.status === 'under_review' ? 'pending' : 'rate_review' }}
                  </span>
                  {{ article.status === 'under_review' ? 'Dalam Review' : article.status === 'revision' ? 'Revisi' : article.status === 'draft' ? 'Draft' : 'Published' }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-sm text-on-surface-variant">{{ article.category?.name || '—' }}</td>
              <td class="px-5 py-3.5 text-right text-xs text-on-surface-variant">
                {{ new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-1.5">
                  <button @click="router.push({ name: 'article-detail', params: { id: article.id } })" class="mod-action-btn mod-action--view" title="Lihat">
                    <span class="material-symbols-outlined" style="font-size:14px">open_in_new</span>
                  </button>
                  <button v-if="article.status === 'draft' || article.status === 'revision'" @click="updateStatus(article.id, 'under_review')" class="mod-action-btn mod-action--review" title="Tandai Review">
                    <span class="material-symbols-outlined" style="font-size:14px">pending</span>
                  </button>
                  <button v-if="article.status === 'under_review'" @click="updateStatus(article.id, 'revision')" class="mod-action-btn mod-action--revision" title="Kembalikan">
                    <span class="material-symbols-outlined" style="font-size:14px">undo</span>
                  </button>
                  <button v-if="article.status === 'under_review'" @click="updateStatus(article.id, 'published')" class="mod-action-btn mod-action--approve" title="Setujui">
                    <span class="material-symbols-outlined" style="font-size:14px">check_circle</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

    </section>
  </main>
</template>

<style scoped>
.mod-stat-card {
  border-radius: 1rem;
  border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-lowest));
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: border-color 0.2s;
}
.mod-stat-card:hover { border-color: rgb(var(--color-primary) / 0.2); }
.mod-stat-icon { font-size: 1.25rem; }
.mod-stat-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--inner-muted); }
.mod-stat-value { font-size: 2rem; font-weight: 900; line-height: 1; display: block; }

.mod-status-badge {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.2rem 0.6rem; border-radius: 9999px;
  font-size: 0.7rem; font-weight: 700; border: 1px solid transparent;
}
.mod-status--published { background: rgb(16 185 129 / 0.12); color: rgb(52 211 153); border-color: rgb(16 185 129 / 0.25); }
.mod-status--draft     { background: rgb(245 158 11 / 0.12); color: rgb(251 191 36); border-color: rgb(245 158 11 / 0.25); }
.mod-status--revision  { background: rgb(249 115 22 / 0.12); color: rgb(251 146 60); border-color: rgb(249 115 22 / 0.25); }
.mod-status--review    { background: rgb(14 165 233 / 0.12); color: rgb(56 189 248); border-color: rgb(14 165 233 / 0.25); }

.mod-action-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.875rem; height: 1.875rem;
  border-radius: 0.5rem; border: 1px solid transparent;
  cursor: pointer; transition: background-color 0.15s;
}
.mod-action--view     { background: rgb(59 130 246 / 0.1); color: rgb(96 165 250); border-color: rgb(59 130 246 / 0.2); }
.mod-action--view:hover { background: rgb(59 130 246 / 0.2); }
.mod-action--review   { background: rgb(14 165 233 / 0.1); color: rgb(56 189 248); border-color: rgb(14 165 233 / 0.2); }
.mod-action--review:hover { background: rgb(14 165 233 / 0.2); }
.mod-action--revision { background: rgb(249 115 22 / 0.1); color: rgb(251 146 60); border-color: rgb(249 115 22 / 0.2); }
.mod-action--revision:hover { background: rgb(249 115 22 / 0.2); }
.mod-action--approve  { background: rgb(16 185 129 / 0.1); color: rgb(52 211 153); border-color: rgb(16 185 129 / 0.2); }
.mod-action--approve:hover { background: rgb(16 185 129 / 0.2); }
</style>
