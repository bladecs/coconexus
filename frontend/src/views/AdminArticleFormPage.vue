<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import AdminArticleEditor from '@/components/admin/AdminArticleEditor.vue';
import { useAdminStore } from '@/stores/admin';
import { useArticleStore } from '@/stores/articles';

const route = useRoute();
const router = useRouter();
const articleStore = useArticleStore();
const adminStore = useAdminStore();
const feedback = ref('');

const articleId = computed(() => Number(route.params.id || 0));
const isEditing = computed(() => Boolean(articleId.value));
const editorArticle = computed(() => {
  if (isEditing.value && articleStore.currentArticle?.id === articleId.value) {
    return articleStore.currentArticle;
  }

  return null;
});

async function loadArticle() {
  feedback.value = '';

  if (!isEditing.value) {
    articleStore.clearCurrentArticle();
    return;
  }

  try {
    await articleStore.fetchAdminArticleDetail(articleId.value);
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleCreate(payload) {
  feedback.value = '';

  try {
    const article = await articleStore.createArticle(payload);
    await adminStore.fetchDashboardStats();
    await router.push(`/admin/articles/${article.id}/edit`);
    feedback.value = 'Draft artikel berhasil dibuat.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleUpdate({ id, payload }) {
  feedback.value = '';

  try {
    await articleStore.updateArticle(id, payload);
    await articleStore.fetchAdminArticleDetail(id);
    await adminStore.fetchDashboardStats();
    feedback.value = 'Artikel berhasil diperbarui.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handlePublish(id) {
  feedback.value = '';

  try {
    await articleStore.updateArticleStatus(id, 'published');
    await articleStore.fetchAdminArticleDetail(id);
    await adminStore.fetchDashboardStats();
    feedback.value = 'Artikel berhasil dipublish.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleRevision(id) {
  feedback.value = '';

  try {
    await articleStore.updateArticleStatus(id, 'revision');
    await articleStore.fetchAdminArticleDetail(id);
    await adminStore.fetchDashboardStats();
    feedback.value = 'Artikel berhasil dikembalikan ke revision.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleDelete(id) {
  feedback.value = '';

  try {
    await articleStore.deleteArticle(id);
    await adminStore.fetchDashboardStats();
    await router.push('/admin/articles');
  } catch (error) {
    feedback.value = error.message;
  }
}

onMounted(loadArticle);

watch(
  () => route.params.id,
  async () => {
    await loadArticle();
  }
);
</script>

<template>
  <main class="inner-page px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="admin" />

    <section class="mx-auto max-w-[1400px]">
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="premium-kicker">Form Artikel</p>
          <h1 class="mt-3 text-4xl font-black text-stone-50">
            {{ isEditing ? 'Edit Artikel' : 'Tambah Artikel Baru' }}
          </h1>
          <p class="premium-copy mt-3 max-w-3xl">
            Form artikel dipisah dari dashboard supaya proses penulisan lebih fokus dan rapi.
          </p>
        </div>

        <RouterLink to="/admin/articles" class="admin-secondary-action">
          Kembali ke Daftar
        </RouterLink>
      </div>

      <p v-if="feedback" class="mb-6 rounded-lg border border-[#ff7c35]/20 bg-[#ff7c35]/10 px-5 py-4 text-sm font-medium text-[#ffd1b8]">
        {{ feedback }}
      </p>

      <AdminArticleEditor
        :selected-article="editorArticle"
        :loading="articleStore.isSubmitting"
        @create="handleCreate"
        @update="handleUpdate"
        @publish="handlePublish"
        @request-revision="handleRevision"
        @delete="handleDelete"
      />
    </section>
  </main>
</template>
