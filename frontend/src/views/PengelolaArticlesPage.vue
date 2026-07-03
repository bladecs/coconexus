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

onMounted(() => fetchArticles());
</script>

<template>
  <SiteNavbar variant="pengelola" />
  <main class="inner-page pengelola-workspace min-h-screen px-5 pb-16 pt-32 sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1680px]">

      <!-- ── Page Header ── -->
      <header class="mb-8 flex flex-col gap-5 border-b border-outline-variant/30 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary" style="font-size:15px">edit_document</span>
            <p class="text-xs font-bold uppercase tracking-widest text-primary/80">Coconexus / Pengelola Artikel</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Dashboard Pengelola</h1>
          <p class="mt-1 text-sm text-on-surface-variant">Kelola dan pantau semua konten artikel KMS</p>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <div class="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2">
            <span class="material-symbols-outlined text-primary" style="font-size:17px;font-variation-settings:'FILL' 1">account_circle</span>
            <span class="text-sm font-medium text-on-surface">{{ authStore.user?.profile?.full_name || authStore.user?.email }}</span>
          </div>
          <RouterLink
            to="/pengelola/articles/new"
            class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90"
          >
            <span class="material-symbols-outlined" style="font-size:16px">add</span>
            Buat Artikel
          </RouterLink>
        </div>
      </header>

      <!-- ── Stat Cards ── -->
      <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="stat-card group">
          <div class="stat-card__icon-wrap bg-primary/10">
            <span class="material-symbols-outlined text-primary" style="font-size:20px">article</span>
          </div>
          <p class="stat-card__label">Total Artikel</p>
          <strong class="stat-card__value text-on-surface">{{ stats.total }}</strong>
          <p class="stat-card__sub">{{ stats.revision }} sedang revisi</p>
        </div>
        <div class="stat-card group">
          <div class="stat-card__icon-wrap bg-emerald-500/10">
            <span class="material-symbols-outlined text-emerald-500" style="font-size:20px">verified</span>
          </div>
          <p class="stat-card__label">Dipublikasi</p>
          <strong class="stat-card__value text-emerald-400 dark:text-emerald-400">{{ stats.published }}</strong>
          <p class="stat-card__sub">{{ stats.total ? Math.round(stats.published / stats.total * 100) : 0 }}% dari total</p>
        </div>
        <div class="stat-card group">
          <div class="stat-card__icon-wrap bg-amber-500/10">
            <span class="material-symbols-outlined text-amber-500" style="font-size:20px">draft</span>
          </div>
          <p class="stat-card__label">Draft</p>
          <strong class="stat-card__value text-amber-400 dark:text-amber-400">{{ stats.draft }}</strong>
          <p class="stat-card__sub">Belum dipublikasi</p>
        </div>
        <div class="stat-card group">
          <div class="stat-card__icon-wrap bg-blue-500/10">
            <span class="material-symbols-outlined text-blue-400" style="font-size:20px">visibility</span>
          </div>
          <p class="stat-card__label">Total Tayangan</p>
          <strong class="stat-card__value text-blue-400 dark:text-blue-400">{{ stats.views.toLocaleString('id-ID') }}</strong>
          <p class="stat-card__sub">Semua artikel</p>
        </div>
      </section>

      <!-- ── Filter Bar ── -->
      <section class="mb-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 sm:w-48">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">filter_list</span>
            <select
              v-model="filters.status"
              class="flex-1 bg-transparent text-sm text-on-surface outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="revision">Revision</option>
            </select>
          </div>
          <div class="flex flex-1 items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">search</span>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari judul artikel..."
              class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
            />
          </div>
          <p class="shrink-0 text-xs text-on-surface-variant">
            <span class="font-bold text-on-surface">{{ filteredArticles.length }}</span> artikel
          </p>
        </div>
      </section>

      <!-- ── Article Table ── -->
      <section class="overflow-hidden rounded-2xl border border-outline-variant/30">
        <!-- Table header bar -->
        <div class="flex items-center justify-between border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary" style="font-size:16px">table_chart</span>
            <h2 class="text-sm font-bold text-on-surface">Daftar Artikel</h2>
          </div>
          <button @click="fetchArticles" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
            <span class="material-symbols-outlined" style="font-size:14px">refresh</span>
            Refresh
          </button>
        </div>

        <div class="overflow-x-auto">
          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
            <span class="material-symbols-outlined animate-spin" style="font-size:20px">progress_activity</span>
            <span class="text-sm">Memuat data artikel...</span>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="flex items-center justify-center gap-2 py-12 text-red-400">
            <span class="material-symbols-outlined" style="font-size:18px">error</span>
            <span class="text-sm">{{ error }}</span>
          </div>

          <table v-else class="w-full text-left text-sm">
            <thead class="border-b border-outline-variant/20 bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th class="px-5 py-3.5 font-semibold">Judul</th>
                <th class="px-5 py-3.5 font-semibold">Status</th>
                <th class="px-5 py-3.5 font-semibold">Kategori</th>
                <th class="px-5 py-3.5 text-right font-semibold">
                  <span class="inline-flex items-center justify-end gap-1">
                    <span class="material-symbols-outlined" style="font-size:13px">visibility</span>
                    Views
                  </span>
                </th>
                <th class="px-5 py-3.5 text-right font-semibold">Dibuat</th>
                <th class="px-5 py-3.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="article in filteredArticles"
                :key="article.id"
                class="group border-b border-outline-variant/10 transition-colors last:border-0 hover:bg-primary/3"
              >
                <td class="px-5 py-3.5">
                  <p class="font-semibold text-on-surface line-clamp-1 max-w-xs">{{ article.title }}</p>
                  <p class="mt-0.5 text-xs text-on-surface-variant">v{{ article.version }}</p>
                </td>
                <td class="px-5 py-3.5">
                  <span class="status-badge" :class="{
                    'status-badge--published': article.status === 'published',
                    'status-badge--draft': article.status === 'draft',
                    'status-badge--revision': article.status === 'revision',
                  }">
                    <span class="material-symbols-outlined" style="font-size:11px;font-variation-settings:'FILL' 1">
                      {{ article.status === 'published' ? 'check_circle' : article.status === 'draft' ? 'edit_note' : 'rate_review' }}
                    </span>
                    {{ article.status === 'published' ? 'Published' : article.status === 'draft' ? 'Draft' : 'Revisi' }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-sm text-on-surface-variant">{{ article.category?.name || '—' }}</td>
                <td class="px-5 py-3.5 text-right">
                  <span class="inline-flex items-center justify-end gap-1 text-sm font-medium text-on-surface">
                    {{ (article.view_count || 0).toLocaleString('id-ID') }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-right text-xs text-on-surface-variant">
                  {{ new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center justify-end gap-1.5">
                    <button @click="viewArticle(article.id)" class="action-btn action-btn--view" title="Lihat">
                      <span class="material-symbols-outlined" style="font-size:14px">open_in_new</span>
                    </button>
                    <button v-if="article.status !== 'published'" @click="editArticle(article.id)" class="action-btn action-btn--edit" title="Edit">
                      <span class="material-symbols-outlined" style="font-size:14px">edit</span>
                    </button>
                    <button v-if="article.status !== 'published'" @click="updateArticleStatus(article.id, 'published')" class="action-btn action-btn--publish" title="Publish">
                      <span class="material-symbols-outlined" style="font-size:14px">publish</span>
                    </button>
                    <button v-if="article.status === 'published'" @click="updateArticleStatus(article.id, 'revision')" class="action-btn action-btn--revision" title="Ke Revisi">
                      <span class="material-symbols-outlined" style="font-size:14px">rate_review</span>
                    </button>
                    <button @click="deleteArticle(article.id)" class="action-btn action-btn--delete" title="Hapus">
                      <span class="material-symbols-outlined" style="font-size:14px">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty state -->
              <tr v-if="filteredArticles.length === 0 && !isLoading">
                <td colspan="6" class="py-20 text-center">
                  <span class="material-symbols-outlined mb-3 block text-5xl text-outline-variant">article</span>
                  <p class="font-semibold text-on-surface-variant">Tidak ada artikel ditemukan</p>
                  <p class="mt-1 text-sm text-on-surface-variant/60">Coba sesuaikan filter atau buat artikel baru</p>
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
/* ── Stat card ── */
.stat-card {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-lowest));
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  border-color: rgb(var(--color-primary) / 0.25);
  box-shadow: 0 4px 20px rgb(var(--color-primary) / 0.06);
}
.stat-card__icon-wrap {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}
.stat-card__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--inner-muted);
}
.stat-card__value {
  font-size: 2.25rem;
  font-weight: 900;
  line-height: 1;
  display: block;
}
.stat-card__sub {
  font-size: 0.7rem;
  color: var(--inner-faint);
}

/* ── Status badges ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  border: 1px solid transparent;
}
.status-badge--published {
  background: rgb(16 185 129 / 0.12);
  color: rgb(52 211 153);
  border-color: rgb(16 185 129 / 0.25);
}
.status-badge--draft {
  background: rgb(245 158 11 / 0.12);
  color: rgb(251 191 36);
  border-color: rgb(245 158 11 / 0.25);
}
.status-badge--revision {
  background: rgb(249 115 22 / 0.12);
  color: rgb(251 146 60);
  border-color: rgb(249 115 22 / 0.25);
}

/* ── Action buttons ── */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.875rem;
  height: 1.875rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}
.action-btn--view {
  background: rgb(59 130 246 / 0.1);
  color: rgb(96 165 250);
  border-color: rgb(59 130 246 / 0.2);
}
.action-btn--view:hover { background: rgb(59 130 246 / 0.2); }
.action-btn--edit {
  background: rgb(245 158 11 / 0.1);
  color: rgb(251 191 36);
  border-color: rgb(245 158 11 / 0.2);
}
.action-btn--edit:hover { background: rgb(245 158 11 / 0.2); }
.action-btn--publish {
  background: rgb(var(--color-primary) / 0.1);
  color: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary) / 0.2);
}
.action-btn--publish:hover { background: rgb(var(--color-primary) / 0.2); }
.action-btn--revision {
  background: rgb(249 115 22 / 0.1);
  color: rgb(251 146 60);
  border-color: rgb(249 115 22 / 0.2);
}
.action-btn--revision:hover { background: rgb(249 115 22 / 0.2); }
.action-btn--delete {
  background: rgb(239 68 68 / 0.1);
  color: rgb(248 113 113);
  border-color: rgb(239 68 68 / 0.2);
}
.action-btn--delete:hover { background: rgb(239 68 68 / 0.2); }
</style>
