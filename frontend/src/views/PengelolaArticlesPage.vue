<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/lib/api';

const router = useRouter();
const authStore = useAuthStore();

const articles = ref([]);
const isLoading = ref(false);
const error = ref(null);
const filters = reactive({
  status: 'all',
  search: '',
});

const filteredArticles = computed(() => {
  return articles.value.filter((article) => {
    const matchesStatus = filters.status === 'all' || article.status === filters.status;
    const matchesSearch = article.title.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });
});

const stats = computed(() => ({
  total: articles.value.length,
  published: articles.value.filter((a) => a.status === 'published').length,
  draft: articles.value.filter((a) => a.status === 'draft').length,
  revision: articles.value.filter((a) => a.status === 'revision').length,
  views: articles.value.reduce((sum, a) => sum + (a.view_count || 0), 0),
}));

async function fetchArticles() {
  isLoading.value = true;
  error.value = null;
  
  try {
    const { data } = await api.get('/pengelola/articles');
    articles.value = data.data.articles || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function deleteArticle(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;
  
  try {
    await api.delete(`/pengelola/articles/${id}`);
    articles.value = articles.value.filter((a) => a.id !== id);
  } catch (err) {
    error.value = err.message;
  }
}

function viewArticle(id) {
  router.push({ name: 'article-detail', params: { id } });
}

function editArticle(id) {
  router.push({ name: 'pengelola-articles-edit', params: { id } });
}

async function updateArticleStatus(id, status) {
  if (!confirm(`Ubah status artikel menjadi ${status}?`)) return;

  try {
    await api.patch(`/pengelola/articles/${id}/status`, { status });
    await fetchArticles();
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(() => {
  fetchArticles();
});
</script>

<template>
  <SiteNavbar variant="pengelola" />
  <main class="inner-page pengelola-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10 min-h-screen">

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/40 pb-6">
        <div>
          <p class="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-1">Coconexus / Pengelola Artikel</p>
          <h1 class="text-3xl font-bold text-white">Dashboard Pengelola</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-on-surface-variant bg-stone-800 px-4 py-2 rounded-full">
            👋 {{ authStore.user?.profile?.full_name || authStore.user?.email }}
          </span>
          <RouterLink 
            to="/pengelola/articles/new" 
            class="bg-primary hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            + Buat Artikel
          </RouterLink>
        </div>
      </header>

      <section class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6 mb-8">
        <div class="bg-stone-800/50 border border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between">
          <p class="text-xs font-semibold tracking-wider text-on-surface-variant mb-2">TOTAL ARTIKEL</p>
          <strong class="text-4xl font-bold text-on-surface">{{ stats.total }}</strong>
        </div>
        <div class="bg-stone-800/50 border border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between">
          <p class="text-xs font-semibold tracking-wider text-on-surface-variant mb-2">DIPUBLIKASI</p>
          <strong class="text-4xl font-bold text-emerald-400">{{ stats.published }}</strong>
        </div>
        <div class="bg-stone-800/50 border border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between">
          <p class="text-xs font-semibold tracking-wider text-on-surface-variant mb-2">DRAFT</p>
          <strong class="text-4xl font-bold text-amber-400">{{ stats.draft }}</strong>
        </div>
        <div class="bg-stone-800/50 border border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between">
          <p class="text-xs font-semibold tracking-wider text-on-surface-variant mb-2">TOTAL VIEWS</p>
          <strong class="text-4xl font-bold text-blue-400">{{ stats.views }}</strong>
        </div>
      </section>

      <section class="bg-stone-800/30 border border-outline-variant/40 rounded-xl p-5 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div class="md:col-span-3">
            <label class="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wide">Status</label>
            <select
              v-model="filters.status"
              class="w-full rounded-lg bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="revision">Revision</option>
            </select>
          </div>
          <div class="md:col-span-9">
            <label class="block text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wide">Pencarian</label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari judul artikel..."
              class="w-full rounded-lg bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      <section class="bg-stone-800/30 border border-outline-variant/40 rounded-xl overflow-hidden">
        <div class="p-5 border-b border-outline-variant/40 bg-stone-800/50">
          <h2 class="text-base font-semibold text-stone-200">Daftar Artikel</h2>
        </div>
        
        <div class="overflow-x-auto">
          <div v-if="isLoading" class="text-center py-12 text-on-surface-variant">
            <span class="animate-pulse">Memuat data artikel...</span>
          </div>
          
          <div v-else-if="error" class="text-center py-12 text-red-400 bg-red-900/10">
            {{ error }}
          </div>
          
          <table v-else class="w-full text-sm text-left">
            <thead class="bg-surface-container text-on-surface-variant text-xs uppercase tracking-wider">
              <tr>
                <th class="px-6 py-4 font-medium">Judul</th>
                <th class="px-6 py-4 font-medium">Status</th>
                <th class="px-6 py-4 font-medium">Kategori</th>
                <th class="px-6 py-4 font-medium text-right">Views</th>
                <th class="px-6 py-4 font-medium text-right">Dibuat</th>
                <th class="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-700/50">
              <tr 
                v-for="article in filteredArticles" 
                :key="article.id" 
                class="hover:bg-stone-800/80 transition-colors group"
              >
                <td class="px-6 py-4 font-medium text-stone-200">{{ article.title }}</td>
                <td class="px-6 py-4">
                  <span
                    :class="{
                      'px-2.5 py-1 rounded-md text-xs font-medium border': true,
                      'bg-primary/10 text-emerald-400 border-emerald-500/20': article.status === 'published',
                      'bg-amber-500/10 text-amber-400 border-amber-500/20': article.status === 'draft',
                      'bg-orange-500/10 text-orange-400 border-orange-500/20': article.status === 'revision',
                    }"
                  >
                    {{ article.status.charAt(0).toUpperCase() + article.status.slice(1) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-on-surface-variant">{{ article.category?.name || '-' }}</td>
                <td class="px-6 py-4 text-right text-on-surface-variant">{{ article.view_count || 0 }}</td>
                <td class="px-6 py-4 text-right text-on-surface-variant text-xs">
                  {{ new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex gap-2 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      @click="viewArticle(article.id)"
                      class="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded text-xs font-medium transition-colors"
                    >
                      Lihat
                    </button>
                    <button
                      v-if="article.status !== 'published'"
                      @click="editArticle(article.id)"
                      class="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 rounded text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      v-if="article.status === 'published'"
                      @click="updateArticleStatus(article.id, 'revision')"
                      class="px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 rounded text-xs font-medium transition-colors"
                    >
                      Ke Revisi
                    </button>
                    <button
                      v-if="article.status !== 'published'"
                      @click="updateArticleStatus(article.id, 'published')"
                      class="px-3 py-1.5 bg-primary/10 text-emerald-400 hover:bg-primary/20 hover:text-emerald-300 rounded text-xs font-medium transition-colors"
                    >
                      Publish
                    </button>
                    <button
                      @click="deleteArticle(article.id)"
                      class="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded text-xs font-medium transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredArticles.length === 0 && !isLoading">
                <td colspan="6" class="text-center py-16">
                  <div class="flex flex-col items-center justify-center text-stone-500">
                    <span class="text-4xl mb-3">📄</span>
                    <p class="text-base font-medium text-on-surface-variant">Tidak ada artikel ditemukan</p>
                    <p class="text-sm mt-1">Coba sesuaikan filter pencarian atau status.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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

.admin-header-actions {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.admin-header-actions > div {
  display: flex;
  gap: 1rem;
}

.admin-primary-action,
.admin-secondary-action {
  padding: 0.5rem 1.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.admin-primary-action {
  background-color: #10b981;
  color: white;
}

.admin-primary-action:hover {
  background-color: #059669;
}

.admin-secondary-action {
  border: 1px solid rgb(120 113 108);
  color: inherit;
}

.admin-secondary-action:hover {
  background-color: rgb(41 37 36);
}

.admin-signal-board {
  background-color: rgb(41 37 36);
  border: 1px solid rgb(120 113 108);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.admin-command-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
</style>
