<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useAdminStore } from '@/stores/admin';

const adminStore = useAdminStore();
const feedback = ref('');
const filters = reactive({
  search: '',
  page: 1,
  limit: 10,
});

const visibleCommentCount = computed(() => adminStore.commentMeta.total_items || adminStore.comments.length);
const replyCount = computed(() => adminStore.comments.filter((comment) => comment.parent_id).length);

async function refreshComments(params = filters) {
  Object.assign(filters, {
    search: params.search ?? filters.search,
    page: params.page ?? filters.page,
    limit: params.limit ?? filters.limit,
  });
  await adminStore.fetchAdminComments(filters);
}

async function submitSearch() {
  filters.page = 1;
  await refreshComments();
}

async function goToPage(page) {
  filters.page = page;
  await refreshComments();
}

async function handleCommentDelete(commentId) {
  feedback.value = '';

  try {
    await adminStore.deleteComment(commentId);
    await refreshComments(adminStore.commentMeta);
    await adminStore.fetchDashboardStats();
    feedback.value = 'Komentar berhasil dihapus.';
  } catch (error) {
    feedback.value = error.message;
  }
}

onMounted(async () => {
  await refreshComments();
});
</script>

<template>
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1500px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COMMUNITY / MODERATION QUEUE</p>
          <h1>Ruang Moderasi</h1>
        </div>
      </header>

      <p v-if="feedback" class="admin-feedback-alert mt-6">
        {{ feedback }}
      </p>

      <section class="admin-list-shell mt-6">
        <aside class="admin-filter-rail">
          <p class="admin-section-label">COMMENT STREAM</p>
          <div class="admin-tally-stack mt-5">
            <div>
              <span>Komentar</span>
              <strong>{{ visibleCommentCount }}</strong>
            </div>
            <div>
              <span>Balasan</span>
              <strong>{{ replyCount }}</strong>
            </div>
          </div>

          <div class="mt-6 space-y-4">
            <input
              v-model="filters.search"
              type="text"
              class="w-full px-4 py-3"
              placeholder="Cari isi komentar..."
              @keyup.enter="submitSearch"
            />
            <button type="button" class="admin-primary-action w-full transition-all duration-150" @click="submitSearch">
              Cari Komentar
            </button>
          </div>
        </aside>

        <section class="admin-comment-stream">
          <article
            v-for="comment in adminStore.comments"
            :key="comment.id"
            class="admin-comment-item"
          >
            <div class="admin-comment-meta">
              <span>{{ comment.user?.profile?.full_name || comment.user?.email || 'User' }}</span>
              <strong>{{ comment.article?.title || 'Artikel tidak diketahui' }}</strong>
            </div>
            <p>{{ comment.body }}</p>
            <div class="admin-comment-actions">
              <small>{{ comment.created_at ? new Date(comment.created_at).toLocaleString('id-ID') : 'Tanpa waktu' }}</small>
              <button
                type="button"
                class="admin-delete-btn"
                @click="handleCommentDelete(comment.id)"
              >
                Hapus
              </button>
            </div>
          </article>

          <div v-if="!adminStore.comments.length && !adminStore.isLoading" class="admin-empty-state text-outline border-outline-variant/40">
            Tidak ada komentar yang cocok dengan filter.
          </div>
        </section>
      </section>

      <div v-if="adminStore.commentMeta.total_pages > 1" class="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          class="admin-secondary-action transition-all duration-150 disabled:opacity-40"
          :disabled="adminStore.commentMeta.page <= 1"
          @click="goToPage(adminStore.commentMeta.page - 1)"
        >
          Sebelumnya
        </button>
        <span class="text-sm font-medium text-on-surface-variant">
          Halaman {{ adminStore.commentMeta.page }} dari {{ adminStore.commentMeta.total_pages }}
        </span>
        <button
          type="button"
          class="admin-secondary-action transition-all duration-150 disabled:opacity-40"
          :disabled="adminStore.commentMeta.page >= adminStore.commentMeta.total_pages"
          @click="goToPage(adminStore.commentMeta.page + 1)"
        >
          Berikutnya
        </button>
      </div>
    </section>
  </main>
</template>
