<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import AdminArticleEditor from '@/components/admin/AdminArticleEditor.vue';
import { useArticleStore } from '@/stores/articles';
import api from '@/lib/api';

const route = useRoute();
const router = useRouter();
const articleStore = useArticleStore();

const feedback = ref('');
const isLoading = ref(false);

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
  isLoading.value = true;
  try {
    const { data } = await api.get(`/articles/my/articles/${articleId.value}`);
    articleStore.currentArticle = data.data.article;
    articleStore.comments = data.data.article.comments || [];
  } catch (err) {
    feedback.value = err.response?.data?.message || err.message;
  } finally {
    isLoading.value = false;
  }
}

async function handleCreate(payload) {
  feedback.value = '';
  try {
    await api.post('/articles/my/articles', payload);
    await router.push('/kontributor/artikel');
  } catch (err) {
    feedback.value = err.response?.data?.message || err.message;
  }
}

async function handleUpdate({ id, payload }) {
  feedback.value = '';
  try {
    const { data } = await api.put(`/articles/my/articles/${id}`, payload);
    articleStore.currentArticle = data.data.article;
    feedback.value = 'Artikel berhasil diperbarui.';
  } catch (err) {
    feedback.value = err.response?.data?.message || err.message;
  }
}

async function handleDelete(id) {
  if (!confirm('Hapus artikel ini? Tindakan tidak dapat diurungkan.')) return;
  feedback.value = '';
  try {
    await api.delete(`/articles/my/articles/${id}`);
    await router.push('/kontributor/artikel');
  } catch (err) {
    feedback.value = err.response?.data?.message || err.message;
  }
}

onMounted(loadArticle);

watch(() => route.params.id, loadArticle);
</script>

<template>
  <SiteNavbar variant="contributor" />
  <main class="inner-page min-h-screen px-5 pb-12 sm:px-8 lg:px-10">
    <section class="mx-auto max-w-[1400px]">

      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-primary" style="font-size:15px">edit_document</span>
            <p class="text-xs font-bold uppercase tracking-widest text-primary/80">Coconexus / Kontributor</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">
            {{ isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru' }}
          </h1>
          <p class="mt-1 text-sm text-on-surface-variant">
            Draft tersimpan otomatis. Setelah selesai, submit untuk ditinjau pengelola.
          </p>
        </div>
        <RouterLink to="/kontributor/artikel" class="admin-secondary-action shrink-0">
          <span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>
          Kembali ke Daftar
        </RouterLink>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center gap-3 py-20 text-on-surface-variant">
        <span class="material-symbols-outlined animate-spin" style="font-size:20px">progress_activity</span>
        <span class="text-sm">Memuat artikel...</span>
      </div>

      <template v-else>
        <p v-if="feedback" class="admin-feedback-alert mb-6">{{ feedback }}</p>

        <AdminArticleEditor
          :selected-article="editorArticle"
          :loading="false"
          @create="handleCreate"
          @update="handleUpdate"
          @delete="handleDelete"
        />
      </template>

    </section>
  </main>
</template>
