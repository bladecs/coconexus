<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/lib/api';

const router = useRouter();
const authStore = useAuthStore();
const jobTitle = computed(() => authStore.user?.profile?.job_title || '');
const canWriteArticle = computed(() => ['Penulis Artikel', 'Editor Konten'].includes(jobTitle.value));
const canValidateArticle = computed(() => jobTitle.value === 'Validator Artikel');
const canPublishArticle = computed(() => jobTitle.value === 'Publisher Artikel');

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
    const params = canWriteArticle.value ? { author_only: true } : {};
    const { data } = await api.get('/articles', { params });
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
    await api.delete(`/articles/${id}`);
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
    await api.patch(`/articles/${id}/status`, { status });
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
  <main class="inner-page pengelola-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="pengelola" />

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / PENGELOLA ARTIKEL</p>
          <h1>Dashboard Pengelola</h1>
        </div>
        <div class="admin-header-actions">
          <span>{{ authStore.user?.profile?.full_name || authStore.user?.email }}</span>
          <div>
            <RouterLink v-if="canWriteArticle" to="/pengelola/articles/new" class="admin-primary-action">
              Buat Artikel Baru
            </RouterLink>
          </div>
        </div>
      </header>

      <!-- Stats Cards -->
      <section class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6 mb-8">
        <div class="admin-signal-board">
          <p class="admin-section-label">TOTAL</p>
          <strong class="text-3xl">{{ stats.total }}</strong>
          <span class="text-sm">Total Artikel</span>
        </div>
        <div class="admin-signal-board">
          <p class="admin-section-label">PUBLISHED</p>
          <strong class="text-3xl text-green-400">{{ stats.published }}</strong>
          <span class="text-sm">Artikel Dipublikasi</span>
        </div>
        <div class="admin-signal-board">
          <p class="admin-section-label">DRAFT</p>
          <strong class="text-3xl text-yellow-400">{{ stats.draft }}</strong>
          <span class="text-sm">Artikel Draft</span>
        </div>
        <div class="admin-signal-board">
          <p class="admin-section-label">VIEWS</p>
          <strong class="text-3xl text-blue-400">{{ stats.views }}</strong>
          <span class="text-sm">Total Views</span>
        </div>
      </section>

      <!-- Filters -->
      <section class="admin-signal-board mb-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm mb-2">Status</label>
            <select
              v-model="filters.status"
              class="w-full rounded bg-stone-800 px-3 py-2 text-stone-100 border border-stone-600"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="revision">Revision</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-2">Cari Artikel</label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari judul artikel..."
              class="w-full rounded bg-stone-800 px-3 py-2 text-stone-100 border border-stone-600"
            />
          </div>
        </div>
      </section>

      <!-- Articles Table -->
      <section class="admin-signal-board overflow-x-auto">
        <p class="admin-section-label mb-4">DAFTAR ARTIKEL</p>
        
        <div v-if="isLoading" class="text-center py-8">
          <p>Memuat artikel...</p>
        </div>
        
        <div v-else-if="error" class="text-red-400 text-center py-8">
          {{ error }}
        </div>
        
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-stone-600">
              <th class="text-left px-4 py-3">Judul</th>
              <th class="text-left px-4 py-3">Status</th>
              <th class="text-left px-4 py-3">Kategori</th>
              <th class="text-right px-4 py-3">Views</th>
              <th class="text-right px-4 py-3">Dibuat</th>
              <th class="text-right px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in filteredArticles" :key="article.id" class="border-b border-stone-700 hover:bg-stone-800">
              <td class="px-4 py-3">{{ article.title }}</td>
              <td class="px-4 py-3">
                <span
                  :class="{
                    'px-2 py-1 rounded text-xs font-semibold': true,
                    'bg-green-900 text-green-200': article.status === 'published',
                    'bg-yellow-900 text-yellow-200': article.status === 'draft',
                    'bg-orange-900 text-orange-200': article.status === 'revision',
                  }"
                >
                  {{ article.status }}
                </span>
              </td>
              <td class="px-4 py-3">{{ article.category?.name || '-' }}</td>
              <td class="px-4 py-3 text-right">{{ article.view_count || 0 }}</td>
              <td class="px-4 py-3 text-right text-xs text-stone-400">
                {{ new Date(article.created_at).toLocaleDateString('id-ID') }}
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex gap-2 justify-end">
                  <button
                    @click="viewArticle(article.id)"
                    class="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Lihat
                  </button>
                  <button
                    v-if="canWriteArticle && article.author_id === authStore.user?.id"
                    @click="editArticle(article.id)"
                    class="text-yellow-400 hover:text-yellow-300 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    v-if="canWriteArticle && article.author_id === authStore.user?.id"
                    @click="deleteArticle(article.id)"
                    class="text-red-400 hover:text-red-300 text-xs"
                  >
                    Hapus
                  </button>
                  <button
                    v-if="canValidateArticle && article.status !== 'revision'"
                    @click="updateArticleStatus(article.id, 'revision')"
                    class="text-orange-400 hover:text-orange-300 text-xs"
                  >
                    Revisi
                  </button>
                  <button
                    v-if="canPublishArticle && article.status !== 'published'"
                    @click="updateArticleStatus(article.id, 'published')"
                    class="text-green-400 hover:text-green-300 text-xs"
                  >
                    Publish
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredArticles.length === 0">
              <td colspan="6" class="text-center py-8 text-stone-400">
                Tidak ada artikel ditemukan
              </td>
            </tr>
          </tbody>
        </table>
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
