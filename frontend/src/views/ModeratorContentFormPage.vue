<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import AdminArticleEditor from '@/components/admin/AdminArticleEditor.vue';
import api from '@/lib/api';

const route = useRoute();
const router = useRouter();

const feedback = ref('');
const isLoading = ref(false);
const isSubmitting = ref(false);
const currentArticle = ref(null);

const articleId = computed(() => Number(route.params.id || 0));
const isEditing = computed(() => Boolean(articleId.value));

async function loadArticle() {
  feedback.value = '';

  if (!isEditing.value) {
    currentArticle.value = null;
    return;
  }

  isLoading.value = true;
  try {
    const { data } = await api.get(`/moderator/content/articles/${articleId.value}`);
    currentArticle.value = data.data.article;
  } catch (err) {
    feedback.value = err.response?.data?.message || err.message;
  } finally {
    isLoading.value = false;
  }
}

async function handleCreate(payload) {
  feedback.value = '';
  isSubmitting.value = true;
  try {
    const { data } = await api.post('/moderator/content/articles', payload);
    await router.push(`/moderator/content/articles/${data.data.article.id}/edit`);
    feedback.value = 'Draft artikel berhasil dibuat.';
  } catch (err) {
    feedback.value = err.response?.data?.message || err.message;
  } finally {
    isSubmitting.value = false;
  }
}

async function handleUpdate({ id, payload }) {
  feedback.value = '';
  isSubmitting.value = true;
  try {
    const { data } = await api.put(`/moderator/content/articles/${id}`, payload);
    currentArticle.value = data.data.article;
    feedback.value = 'Artikel berhasil diperbarui.';
  } catch (err) {
    feedback.value = err.response?.data?.message || err.message;
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete(id) {
  if (!confirm('Hapus artikel ini? Tindakan tidak dapat diurungkan.')) return;
  feedback.value = '';
  try {
    await api.delete(`/moderator/content/articles/${id}`);
    await router.push('/moderator/content/articles');
  } catch (err) {
    feedback.value = err.response?.data?.message || err.message;
  }
}

onMounted(loadArticle);
watch(() => route.params.id, loadArticle);
</script>

<template>
  <SiteNavbar variant="moderator" />
  <main class="inner-page min-h-screen px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">
    <section class="mx-auto max-w-[1400px]">

      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-orange-400" style="font-size:15px">edit_document</span>
            <p class="text-xs font-bold uppercase tracking-widest text-orange-400/80">Coconexus / Kurator Konten</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">
            {{ isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru' }}
          </h1>
          <p class="mt-1 text-sm text-on-surface-variant">
            Setelah draft siap, artikel akan ditinjau dan dipublikasikan oleh Redaktur Publikasi.
          </p>
        </div>
        <RouterLink to="/moderator/content/articles" class="admin-secondary-action shrink-0">
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
          :selected-article="currentArticle"
          :loading="isSubmitting"
          :can-publish="false"
          @create="handleCreate"
          @update="handleUpdate"
          @delete="handleDelete"
        />
      </template>

    </section>
  </main>
</template>
