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
    await router.push(`/pengelola/articles`);
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

async function handleToggleFeature({ id, isHomeFeatured }) {
  feedback.value = '';

  try {
    await articleStore.setArticleHomeFeature(id, isHomeFeatured);
    await articleStore.fetchAdminArticleDetail(id);
    feedback.value = isHomeFeatured
      ? 'Artikel ditandai sebagai artikel utama homepage.'
      : 'Artikel dilepas dari artikel utama homepage.';
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
    await router.push('/pengelola/articles');
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handlePublishVersion({ id, version }) {
  feedback.value = '';

  try {
    await articleStore.publishArticleVersion(id, version);
    await articleStore.fetchAdminArticleDetail(id);
    await adminStore.fetchDashboardStats();
    feedback.value = `Versi ${version} berhasil dipublish.`;
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
  <SiteNavbar variant="pengelola" />
  <main class="inner-page px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1400px]">
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="premium-kicker">Form Artikel</p>
          <h1 class="mt-3 text-4xl font-black text-on-surface">
            {{ isEditing ? 'Edit Artikel' : 'Tambah Artikel Baru' }}
          </h1>
          <p class="premium-copy mt-3 max-w-3xl">
            Form artikel dipisah dari dashboard supaya proses penulisan lebih fokus dan rapi.
          </p>
        </div>

        <RouterLink to="/pengelola/articles" class="admin-secondary-action">
          Kembali ke Daftar
        </RouterLink>
      </div>

      <p v-if="feedback" class="admin-feedback-alert mb-6">
        {{ feedback }}
      </p>

      <AdminArticleEditor
        :selected-article="editorArticle"
        :loading="articleStore.isSubmitting"
        :can-feature-on-home="true"
        @create="handleCreate"
        @update="handleUpdate"
      @publish="handlePublish"
      @request-revision="handleRevision"
      @publish-version="handlePublishVersion"
      @delete="handleDelete"
      @toggle-feature="handleToggleFeature"
    />
    </section>
  </main>
</template>
