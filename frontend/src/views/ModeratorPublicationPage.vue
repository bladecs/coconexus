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
  <main class="inner-page min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-7xl">
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/40 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Coconexus / Moderator Publikasi</p>
          <h1 class="text-3xl font-extrabold tracking-tight text-white">Publikasi Artikel</h1>
          <p class="mt-2 text-sm text-on-surface-variant">Validasi versi artikel dan terbitkan ke publik.</p>
        </div>
      </header>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="-translate-y-4 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-4 opacity-0"
      >
        <div v-if="feedback" class="mb-6 rounded-lg border border-emerald-500/20 bg-primary/10 px-5 py-3 text-sm font-medium text-emerald-300">
          {{ feedback }}
        </div>
      </Transition>

      <!-- Stats -->
      <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total</p>
          <strong class="mt-2 block text-3xl font-black text-on-surface">{{ stats.total }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Siap Publikasi</p>
          <strong class="mt-2 block text-3xl font-black text-sky-400">{{ stats.under_review }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Published</p>
          <strong class="mt-2 block text-3xl font-black text-emerald-400">{{ stats.published }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Dikembalikan</p>
          <strong class="mt-2 block text-3xl font-black text-orange-400">{{ stats.revision }}</strong>
        </div>
      </section>

      <!-- Filters -->
      <section class="mb-6 rounded-xl border border-outline-variant/40 bg-stone-800/30 p-5">
        <div class="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <label class="mb-2 block text-sm font-medium text-on-surface-variant">Status</label>
            <select v-model="filters.status" class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400">
              <option value="all">Semua Status</option>
              <option value="under_review">Siap Publikasi</option>
              <option value="published">Published</option>
              <option value="revision">Revision</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-on-surface-variant">Cari Artikel</label>
            <input v-model="filters.search" type="text" placeholder="Cari judul artikel..." class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400" />
          </div>
        </div>
      </section>

      <!-- Article List -->
      <section class="space-y-4">
        <div v-if="isLoading" class="rounded-xl border border-dashed border-outline-variant/40 py-16 text-center text-on-surface-variant">Memuat artikel...</div>
        <div v-else-if="error" class="rounded-xl border border-dashed border-red-500/30 bg-red-500/5 py-12 text-center text-red-400">{{ error }}</div>
        <div v-else-if="filteredArticles.length === 0" class="rounded-xl border border-dashed border-outline-variant/40 py-16 text-center text-stone-500">Tidak ada artikel yang cocok dengan filter ini.</div>

        <article v-for="article in filteredArticles" :key="article.id" class="rounded-xl border border-outline-variant/40 bg-stone-800/30 p-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-bold text-on-surface">{{ article.title }}</h2>
                <span :class="{
                  'rounded-md border px-2 py-0.5 text-xs font-medium': true,
                  'border-emerald-500/20 bg-primary/10 text-emerald-400': article.status === 'published',
                  'border-amber-500/20 bg-amber-500/10 text-amber-400': article.status === 'draft',
                  'border-orange-500/20 bg-orange-500/10 text-orange-400': article.status === 'revision',
                  'border-sky-500/20 bg-sky-500/10 text-sky-400': article.status === 'under_review',
                }">
                  {{ article.status }}
                </span>
              </div>
              <p class="mt-1 text-xs text-on-surface-variant">
                Kategori: {{ article.category?.name || '-' }} ·
                Dibuat: {{ new Date(article.created_at).toLocaleDateString('id-ID') }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button @click="router.push({ name: 'article-detail', params: { id: article.id } })" class="rounded-lg border border-stone-600 px-4 py-2 text-xs font-bold text-on-surface-variant transition hover:bg-stone-700">
                Pratinjau
              </button>
              <button v-if="article.status === 'under_review'" @click="updateStatus(article.id, 'revision')" class="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-300 transition hover:bg-orange-500 hover:text-white">
                Kembalikan
              </button>
              <button @click="toggleVersions(article.id)" class="rounded-lg border border-emerald-500/30 bg-primary/10 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:bg-primary hover:text-white">
                {{ loadingVersions[article.id] ? 'Memuat...' : expandedVersions[article.id] ? 'Tutup Versi' : 'Lihat Versi' }}
              </button>
            </div>
          </div>

          <!-- Versions Panel -->
          <div v-if="expandedVersions[article.id]" class="mt-4 rounded-lg border border-outline-variant/40 bg-surface-container p-4">
            <p class="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Riwayat Versi</p>
            <div v-if="!versionsMap[article.id]?.length" class="text-sm text-stone-500">Belum ada versi tersimpan.</div>
            <ul v-else class="space-y-2">
              <li v-for="ver in versionsMap[article.id]" :key="ver.version_number" class="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-800/60 px-4 py-3">
                <div class="text-sm">
                  <span class="font-semibold text-stone-200">Versi {{ ver.version_number }}</span>
                  <span class="ml-3 text-xs text-on-surface-variant">{{ new Date(ver.created_at).toLocaleString('id-ID') }}</span>
                  <span v-if="ver.is_published" class="ml-2 rounded bg-primary/20 px-2 py-0.5 text-xs text-emerald-400">Published</span>
                </div>
                <button v-if="!ver.is_published" @click="publishVersion(article.id, ver.version_number)" class="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600">
                  Publikasikan
                </button>
              </li>
            </ul>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
