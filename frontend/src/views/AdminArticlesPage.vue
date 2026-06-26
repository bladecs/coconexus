<script setup>
import { onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { useAdminStore } from '@/stores/admin';
import { useArticleStore } from '@/stores/articles';

const articleStore = useArticleStore();
const adminStore = useAdminStore();
const feedback = ref('');
const filters = reactive({
  search: '',
  status: '',
  category: '',
  page: 1,
  limit: 10,
});

async function refreshAdminArticles() {
  await articleStore.fetchAdminArticles(filters);
}

async function applyAdminFilters() {
  filters.page = 1;
  await refreshAdminArticles();
}

async function goToAdminPage(page) {
  filters.page = page;
  await refreshAdminArticles();
}

async function handlePublish(articleId) {
  feedback.value = '';

  try {
    await articleStore.updateArticleStatus(articleId, 'published');
    await adminStore.fetchDashboardStats();
    feedback.value = 'Artikel berhasil dipublish.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleRevision(articleId) {
  feedback.value = '';

  try {
    await articleStore.updateArticleStatus(articleId, 'revision');
    await adminStore.fetchDashboardStats();
    feedback.value = 'Artikel berhasil dikembalikan ke revision.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleDelete(articleId) {
  feedback.value = '';

  try {
    await articleStore.deleteArticle(articleId);
    await refreshAdminArticles();
    await adminStore.fetchDashboardStats();
    feedback.value = 'Artikel berhasil dihapus.';
  } catch (error) {
    feedback.value = error.message;
  }
}

onMounted(async () => {
  await refreshAdminArticles();
});
</script>

<template>
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1600px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">CMS / ARTICLE DESK</p>
          <h1>Meja Editorial</h1>
        </div>
        <RouterLink to="/admin/articles/new" class="admin-primary-action">
          Tambah Artikel
        </RouterLink>
      </header>

      <p v-if="feedback" class="admin-feedback-alert mt-6">
        {{ feedback }}
      </p>

      <section class="admin-list-shell mt-6">
        <aside class="admin-filter-rail">
          <p class="admin-section-label">FILTER</p>
          <div class="mt-5 space-y-4">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari judul, isi, atau penulis..."
              class="w-full px-4 py-3"
              @keyup.enter="applyAdminFilters"
            />
            <select v-model="filters.status" class="w-full px-4 py-3">
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="revision">Revision</option>
              <option value="published">Published</option>
            </select>
            <input
              v-model="filters.category"
              type="text"
              placeholder="Kategori"
              class="w-full px-4 py-3"
              @keyup.enter="applyAdminFilters"
            />
            <button type="button" class="admin-primary-action w-full transition-all duration-150" @click="applyAdminFilters">
              Terapkan Filter
            </button>
          </div>
          <div class="mt-6 border-t border-outline-variant/30 pt-5 text-sm leading-7 text-on-surface-variant">
            {{ articleStore.adminMeta.total_items || articleStore.adminArticles.length }} artikel ditemukan.
          </div>
        </aside>

        <section class="admin-article-table">
          <article
            v-for="article in articleStore.adminArticles"
            :key="article.id"
            class="admin-article-row group hover:bg-surface-container-high transition-colors"
          >
            <div>
              <p class="text-on-surface-variant">{{ article.category?.name || 'Tanpa Kategori' }}</p>
              <h2 class="mt-2">{{ article.title }}</h2>
            </div>
            <StatusBadge :status="article.status" />
            <div>
              <p>Versi {{ article.version }}</p>
              <time>{{ new Date(article.updated_at).toLocaleDateString('id-ID') }}</time>
            </div>
            <div class="admin-article-actions">
              <RouterLink :to="`/admin/articles/${article.id}/edit`" class="admin-primary-action transition-all duration-150">
                Edit
              </RouterLink>
              <button
                v-if="article.status !== 'published'"
                type="button"
                class="admin-secondary-action transition-all duration-150"
                @click="handlePublish(article.id)"
              >
                Publish
              </button>
              <button
                v-if="article.status !== 'revision'"
                type="button"
                class="admin-secondary-action transition-all duration-150"
                @click="handleRevision(article.id)"
              >
                Revisi
              </button>
              <button
                type="button"
                class="admin-delete-btn"
                @click="handleDelete(article.id)"
              >
                Hapus
              </button>
            </div>
          </article>

          <div v-if="!articleStore.adminArticles.length" class="admin-empty-state m-4 text-outline border-outline-variant/40">
            Belum ada artikel yang cocok dengan filter.
          </div>
        </section>
      </section>

      <div v-if="articleStore.adminMeta.total_pages > 1" class="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          class="admin-secondary-action transition-all duration-150 disabled:opacity-40"
          :disabled="filters.page <= 1"
          @click="goToAdminPage(filters.page - 1)"
        >
          Sebelumnya
        </button>
        <span class="text-sm font-medium text-on-surface-variant">
          Halaman {{ articleStore.adminMeta.page }} dari {{ articleStore.adminMeta.total_pages }}
        </span>
        <button
          type="button"
          class="admin-secondary-action transition-all duration-150 disabled:opacity-40"
          :disabled="filters.page >= articleStore.adminMeta.total_pages"
          @click="goToAdminPage(filters.page + 1)"
        >
          Berikutnya
        </button>
      </div>
    </section>
  </main>
</template>
