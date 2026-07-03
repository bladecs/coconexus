<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const articles = ref([]);
const isLoading = ref(false);
const error = ref(null);
const filters = reactive({ status: 'all' });
const submitting = ref(null);
const deleting = ref(null);

const STATUS_LABEL = { draft: 'Draft', revision: 'Menunggu Review', published: 'Dipublikasikan' };
const STATUS_COLOR = {
  draft:     'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  revision:  'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  published: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
};

const filteredArticles = computed(() => {
  if (filters.status === 'all') return articles.value;
  return articles.value.filter((a) => a.status === filters.status);
});

const stats = computed(() => ({
  total: articles.value.length,
  draft: articles.value.filter((a) => a.status === 'draft').length,
  revision: articles.value.filter((a) => a.status === 'revision').length,
  published: articles.value.filter((a) => a.status === 'published').length,
}));

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function fetchArticles() {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/articles/my/articles', { params: { limit: 50 } });
    articles.value = data.data.articles || [];
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    isLoading.value = false;
  }
}

async function submitArticle(article) {
  if (!confirm(`Submit artikel "${article.title}" untuk ditinjau pengelola?`)) return;
  submitting.value = article.id;
  try {
    await api.patch(`/articles/my/articles/${article.id}/submit`);
    await fetchArticles();
  } catch (err) {
    alert(err.response?.data?.message || err.message);
  } finally {
    submitting.value = null;
  }
}

async function deleteArticle(article) {
  if (!confirm(`Hapus artikel "${article.title}"? Tindakan ini tidak dapat diurungkan.`)) return;
  deleting.value = article.id;
  try {
    await api.delete(`/articles/my/articles/${article.id}`);
    await fetchArticles();
  } catch (err) {
    alert(err.response?.data?.message || err.message);
  } finally {
    deleting.value = null;
  }
}

onMounted(fetchArticles);
</script>

<template>
  <SiteNavbar variant="contributor" />
  <main class="inner-page min-h-screen px-5 pb-16 pt-32 sm:px-8 lg:px-10">
    <section class="mx-auto max-w-[1680px]">

      <header class="mb-8 border-b border-outline-variant/30 pb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-primary" style="font-size:15px">edit_document</span>
            <p class="text-xs font-bold uppercase tracking-widest text-primary/80">Coconexus / Kontributor</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Artikel Saya</h1>
          <p class="mt-1 text-sm text-on-surface-variant">Kelola dan submit artikel untuk ditinjau pengelola</p>
        </div>
        <RouterLink
          to="/kontributor/artikel/baru"
          class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90 shrink-0"
        >
          <span class="material-symbols-outlined" style="font-size:16px">add</span>
          Tulis Artikel
        </RouterLink>
      </header>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
        <div class="admin-ds-panel text-center">
          <p class="text-2xl font-black text-on-surface">{{ stats.total }}</p>
          <p class="text-xs text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">Total</p>
        </div>
        <div class="admin-ds-panel text-center">
          <p class="text-2xl font-black text-on-surface-variant">{{ stats.draft }}</p>
          <p class="text-xs text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">Draft</p>
        </div>
        <div class="admin-ds-panel text-center">
          <p class="text-2xl font-black text-amber-500">{{ stats.revision }}</p>
          <p class="text-xs text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">Menunggu Review</p>
        </div>
        <div class="admin-ds-panel text-center">
          <p class="text-2xl font-black text-primary">{{ stats.published }}</p>
          <p class="text-xs text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">Dipublikasikan</p>
        </div>
      </div>

      <!-- Filter -->
      <div class="flex gap-1 bg-surface-container-low rounded-lg p-1 w-fit mb-5">
        <button
          v-for="s in ['all', 'draft', 'revision', 'published']"
          :key="s"
          @click="filters.status = s"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            filters.status === s
              ? 'bg-surface text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface',
          ]"
        >
          {{ s === 'all' ? 'Semua' : STATUS_LABEL[s] }}
        </button>
      </div>

      <!-- Loading / Error -->
      <div v-if="isLoading" class="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
        <span class="material-symbols-outlined animate-spin" style="font-size:18px">progress_activity</span>
        <span class="text-sm">Memuat artikel...</span>
      </div>
      <div v-else-if="error" class="text-center py-12 text-error text-sm">{{ error }}</div>

      <!-- Empty -->
      <div
        v-else-if="filteredArticles.length === 0"
        class="text-center py-16 text-on-surface-variant"
      >
        <span class="material-symbols-outlined mb-2 block text-4xl text-outline-variant">article</span>
        <p class="text-sm">Belum ada artikel. Mulai tulis artikel pertama Anda!</p>
        <RouterLink
          to="/kontributor/artikel/baru"
          class="inline-flex items-center gap-1 mt-4 text-sm text-primary hover:underline font-medium"
        >
          <span class="material-symbols-outlined text-base">add</span>
          Tulis Artikel
        </RouterLink>
      </div>

      <!-- Article List -->
      <div v-else class="space-y-3">
        <div
          v-for="article in filteredArticles"
          :key="article.id"
          class="admin-ds-panel flex items-start justify-between gap-4"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span :class="[STATUS_COLOR[article.status], 'px-2 py-0.5 rounded-full text-xs font-medium']">
                {{ STATUS_LABEL[article.status] }}
              </span>
              <span class="text-xs text-on-surface-variant">{{ article.category?.name || '-' }}</span>
            </div>
            <p class="font-semibold text-on-surface truncate">{{ article.title }}</p>
            <p v-if="article.meta_description" class="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
              {{ article.meta_description }}
            </p>
            <p class="text-xs text-on-surface-variant mt-1">Diperbarui: {{ formatDate(article.updated_at) }}</p>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <RouterLink
              v-if="article.status === 'draft'"
              :to="`/kontributor/artikel/${article.id}/edit`"
              class="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface px-2.5 py-1.5 rounded-lg border border-outline-variant/40 transition-colors"
            >
              <span class="material-symbols-outlined text-sm">edit</span>
              Edit
            </RouterLink>
            <button
              v-if="article.status === 'draft'"
              @click="submitArticle(article)"
              :disabled="submitting === article.id"
              class="inline-flex items-center gap-1 text-xs bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary px-2.5 py-1.5 rounded-lg font-medium transition-opacity"
            >
              <span class="material-symbols-outlined text-sm">send</span>
              {{ submitting === article.id ? '...' : 'Submit' }}
            </button>
            <button
              v-if="['draft', 'revision'].includes(article.status)"
              @click="deleteArticle(article)"
              :disabled="deleting === article.id"
              class="admin-delete-btn inline-flex items-center gap-1 text-xs"
            >
              <span class="material-symbols-outlined text-sm">delete</span>
              {{ deleting === article.id ? '...' : 'Hapus' }}
            </button>
            <RouterLink
              v-if="article.status === 'published'"
              :to="`/articles/${article.id}`"
              class="inline-flex items-center gap-1 text-xs text-primary hover:underline px-2.5 py-1.5"
            >
              <span class="material-symbols-outlined text-sm">open_in_new</span>
              Lihat
            </RouterLink>
          </div>
        </div>
      </div>

    </section>
  </main>
</template>
