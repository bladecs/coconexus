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
const expandedVersions = ref({});
const versionsMap = ref({});
const loadingVersions = ref({});

const filteredArticles = computed(() => {
  return articles.value.filter((a) => {
    const matchesStatus = filters.status === 'all' || a.status === filters.status;
    const matchesSearch = (a.title || '').toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });
});

const stats = computed(() => ({
  total: articles.value.length,
  under_review: articles.value.filter((a) => a.status === 'under_review').length,
  published: articles.value.filter((a) => a.status === 'published').length,
  revision: articles.value.filter((a) => a.status === 'revision').length,
}));

async function fetchArticles() {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/moderator/publication/articles');
    articles.value = data.data.articles || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function toggleVersions(articleId) {
  if (expandedVersions.value[articleId]) {
    expandedVersions.value[articleId] = false;
    return;
  }
  loadingVersions.value[articleId] = true;
  try {
    const { data } = await api.get(`/moderator/publication/articles/${articleId}/versions`);
    versionsMap.value[articleId] = data.data.versions || [];
    expandedVersions.value[articleId] = true;
  } catch (err) {
    feedback.value = err.message;
  } finally {
    loadingVersions.value[articleId] = false;
  }
}

async function publishVersion(articleId, version) {
  feedback.value = '';
  try {
    await api.post(`/moderator/publication/articles/${articleId}/versions/${version}/publish`);
    feedback.value = `Versi ${version} artikel berhasil dipublikasikan.`;
    expandedVersions.value[articleId] = false;
    await fetchArticles();
  } catch (err) {
    feedback.value = err.message;
  }
}

async function updateStatus(id, status) {
  feedback.value = '';
  try {
    await api.patch(`/moderator/publication/articles/${id}/status`, { status });
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
            <span class="material-symbols-outlined text-emerald-400" style="font-size:15px">publish</span>
            <p class="text-xs font-bold uppercase tracking-widest text-emerald-400/80">Coconexus / Redaktur Publikasi</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Publikasi Artikel</h1>
          <p class="mt-1 text-sm text-on-surface-variant">Validasi versi artikel dan terbitkan ke publik</p>
        </div>
        <button @click="fetchArticles" class="inline-flex items-center gap-2 self-start rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:self-auto">
          <span class="material-symbols-outlined" style="font-size:16px">refresh</span>
          Refresh
        </button>
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
        <div class="pub-stat-card">
          <span class="material-symbols-outlined pub-stat-icon text-on-surface-variant">article</span>
          <p class="pub-stat-label">Total</p>
          <strong class="pub-stat-value text-on-surface">{{ stats.total }}</strong>
        </div>
        <div class="pub-stat-card">
          <span class="material-symbols-outlined pub-stat-icon text-sky-400">pending</span>
          <p class="pub-stat-label">Siap Publikasi</p>
          <strong class="pub-stat-value text-sky-400">{{ stats.under_review }}</strong>
        </div>
        <div class="pub-stat-card">
          <span class="material-symbols-outlined pub-stat-icon text-emerald-400">verified</span>
          <p class="pub-stat-label">Published</p>
          <strong class="pub-stat-value text-emerald-400">{{ stats.published }}</strong>
        </div>
        <div class="pub-stat-card">
          <span class="material-symbols-outlined pub-stat-icon text-orange-400">undo</span>
          <p class="pub-stat-label">Dikembalikan</p>
          <strong class="pub-stat-value text-orange-400">{{ stats.revision }}</strong>
        </div>
      </section>

      <!-- ── Filter ── -->
      <section class="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 sm:w-52">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">filter_list</span>
            <select v-model="filters.status" class="flex-1 bg-transparent text-sm text-on-surface outline-none">
              <option value="all">Semua Status</option>
              <option value="under_review">Siap Publikasi</option>
              <option value="published">Published</option>
              <option value="revision">Revision</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div class="flex flex-1 items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">search</span>
            <input v-model="filters.search" type="text" placeholder="Cari judul artikel..." class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" />
          </div>
          <p class="shrink-0 text-xs text-on-surface-variant"><span class="font-bold text-on-surface">{{ filteredArticles.length }}</span> artikel</p>
        </div>
      </section>

      <!-- ── Article Cards ── -->
      <section class="space-y-4">
        <div v-if="isLoading" class="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-outline-variant/30 py-16 text-on-surface-variant">
          <span class="material-symbols-outlined animate-spin" style="font-size:20px">progress_activity</span>
          <span class="text-sm">Memuat artikel...</span>
        </div>
        <div v-else-if="error" class="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-red-500/30 bg-red-500/5 py-12 text-red-400">
          <span class="material-symbols-outlined" style="font-size:18px">error</span>
          <span class="text-sm">{{ error }}</span>
        </div>
        <div v-else-if="filteredArticles.length === 0" class="rounded-2xl border border-dashed border-outline-variant/30 py-20 text-center">
          <span class="material-symbols-outlined mb-3 block text-5xl text-outline-variant">article</span>
          <p class="font-semibold text-on-surface-variant">Tidak ada artikel yang cocok dengan filter ini</p>
        </div>

        <article v-for="article in filteredArticles" :key="article.id" class="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest transition-colors hover:border-emerald-500/20">
          <div class="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span class="pub-status-badge" :class="{
                  'pub-status--published': article.status === 'published',
                  'pub-status--draft': article.status === 'draft',
                  'pub-status--revision': article.status === 'revision',
                  'pub-status--review': article.status === 'under_review',
                }">
                  <span class="material-symbols-outlined" style="font-size:10px;font-variation-settings:'FILL' 1">
                    {{ article.status === 'published' ? 'check_circle' : article.status === 'under_review' ? 'pending' : article.status === 'revision' ? 'undo' : 'edit_note' }}
                  </span>
                  {{ article.status === 'under_review' ? 'Siap Publikasi' : article.status === 'revision' ? 'Dikembalikan' : article.status === 'draft' ? 'Draft' : 'Published' }}
                </span>
              </div>
              <h2 class="text-lg font-bold text-on-surface">{{ article.title }}</h2>
              <p class="mt-1 text-xs text-on-surface-variant">
                Kategori: {{ article.category?.name || '—' }}
                &nbsp;·&nbsp;
                Dibuat: {{ new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
              </p>
            </div>

            <div class="flex shrink-0 flex-wrap gap-2">
              <button @click="router.push({ name: 'article-detail', params: { id: article.id } })" class="pub-action-btn pub-action--view">
                <span class="material-symbols-outlined" style="font-size:14px">open_in_new</span>
                Pratinjau
              </button>
              <button v-if="article.status === 'under_review'" @click="updateStatus(article.id, 'revision')" class="pub-action-btn pub-action--revision">
                <span class="material-symbols-outlined" style="font-size:14px">undo</span>
                Kembalikan
              </button>
              <button @click="toggleVersions(article.id)" class="pub-action-btn pub-action--versions">
                <span class="material-symbols-outlined" style="font-size:14px">{{ expandedVersions[article.id] ? 'expand_less' : 'history' }}</span>
                {{ loadingVersions[article.id] ? 'Memuat...' : expandedVersions[article.id] ? 'Tutup' : 'Versi' }}
              </button>
            </div>
          </div>

          <!-- Versions Panel -->
          <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="expandedVersions[article.id]" class="border-t border-outline-variant/20 bg-surface-container px-5 pb-4 pt-3">
              <p class="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Riwayat Versi</p>
              <div v-if="!versionsMap[article.id]?.length" class="rounded-xl border border-dashed border-outline-variant/30 py-6 text-center text-sm text-on-surface-variant">Belum ada versi tersimpan.</div>
              <ul v-else class="space-y-2">
                <li v-for="ver in versionsMap[article.id]" :key="ver.version_number" class="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
                  <div class="flex items-center gap-3 text-sm">
                    <span class="font-bold text-on-surface">Versi {{ ver.version_number }}</span>
                    <span class="text-xs text-on-surface-variant">{{ new Date(ver.created_at).toLocaleString('id-ID') }}</span>
                    <span v-if="ver.is_published" class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
                      <span class="material-symbols-outlined" style="font-size:10px;font-variation-settings:'FILL' 1">check_circle</span>
                      Published
                    </span>
                  </div>
                  <button v-if="!ver.is_published" @click="publishVersion(article.id, ver.version_number)" class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500">
                    <span class="material-symbols-outlined" style="font-size:13px">publish</span>
                    Publikasikan
                  </button>
                </li>
              </ul>
            </div>
          </Transition>
        </article>
      </section>

    </section>
  </main>
</template>

<style scoped>
.pub-stat-card {
  border-radius: 1rem;
  border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-lowest));
  padding: 1.1rem 1.25rem;
  display: flex; flex-direction: column; gap: 0.35rem;
  transition: border-color 0.2s;
}
.pub-stat-card:hover { border-color: rgb(16 185 129 / 0.25); }
.pub-stat-icon { font-size: 1.25rem; }
.pub-stat-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(var(--color-on-surface-variant)); }
.pub-stat-value { font-size: 2rem; font-weight: 900; line-height: 1; display: block; }

.pub-status-badge {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.2rem 0.6rem; border-radius: 9999px;
  font-size: 0.7rem; font-weight: 700; border: 1px solid transparent;
}
.pub-status--published { background: rgb(16 185 129 / 0.12); color: rgb(52 211 153); border-color: rgb(16 185 129 / 0.25); }
.pub-status--draft     { background: rgb(245 158 11 / 0.12); color: rgb(251 191 36); border-color: rgb(245 158 11 / 0.25); }
.pub-status--revision  { background: rgb(249 115 22 / 0.12); color: rgb(251 146 60); border-color: rgb(249 115 22 / 0.25); }
.pub-status--review    { background: rgb(14 165 233 / 0.12); color: rgb(56 189 248); border-color: rgb(14 165 233 / 0.25); }

.pub-action-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 0.9rem; border-radius: 0.6rem; border: 1px solid transparent;
  font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: background-color 0.15s;
}
.pub-action--view     { background: rgb(59 130 246 / 0.1); color: rgb(96 165 250); border-color: rgb(59 130 246 / 0.2); }
.pub-action--view:hover { background: rgb(59 130 246 / 0.2); }
.pub-action--revision { background: rgb(249 115 22 / 0.1); color: rgb(251 146 60); border-color: rgb(249 115 22 / 0.2); }
.pub-action--revision:hover { background: rgb(249 115 22 / 0.2); }
.pub-action--versions { background: rgb(16 185 129 / 0.1); color: rgb(52 211 153); border-color: rgb(16 185 129 / 0.2); }
.pub-action--versions:hover { background: rgb(16 185 129 / 0.2); }
</style>
