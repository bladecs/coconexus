<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import api from '@/lib/api';

const route = useRoute();

const article = ref(null);
const versions = ref([]);
const isLoading = ref(false);
const isLoadingVersions = ref(false);
const error = ref(null);

const articleId = computed(() => Number(route.params.id || 0));

async function loadArticle() {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get(`/pengelola/articles/${articleId.value}`);
    article.value = data.data.article;
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    isLoading.value = false;
  }
}

async function loadVersions() {
  isLoadingVersions.value = true;
  try {
    const { data } = await api.get(`/pengelola/articles/${articleId.value}/versions`);
    versions.value = data.data.versions || [];
  } catch (err) {
    versions.value = [];
  } finally {
    isLoadingVersions.value = false;
  }
}

onMounted(() => {
  loadArticle();
  loadVersions();
});

watch(() => route.params.id, () => {
  loadArticle();
  loadVersions();
});
</script>

<template>
  <SiteNavbar variant="pengelola" />
  <main class="inner-page min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">
    <section class="mx-auto max-w-4xl">

      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary" style="font-size:15px">visibility</span>
            <p class="text-xs font-bold uppercase tracking-widest text-primary/80">Coconexus / Monitoring Konten</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Detail Artikel</h1>
        </div>
        <RouterLink to="/pengelola/articles" class="admin-secondary-action shrink-0">
          <span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>
          Kembali ke Daftar
        </RouterLink>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center gap-3 py-20 text-on-surface-variant">
        <span class="material-symbols-outlined animate-spin" style="font-size:20px">progress_activity</span>
        <span class="text-sm">Memuat artikel...</span>
      </div>

      <div v-else-if="error" class="flex items-center justify-center gap-2 py-12 text-red-400">
        <span class="material-symbols-outlined" style="font-size:18px">error</span>
        <span class="text-sm">{{ error }}</span>
      </div>

      <template v-else-if="article">
        <div class="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge :status="article.status" />
            <span class="rounded-full border border-outline-variant/30 bg-surface-container px-3 py-1 text-xs text-on-surface-variant">
              {{ article.category?.name || 'Tanpa kategori' }}
            </span>
            <span class="rounded-full border border-outline-variant/30 bg-surface-container px-3 py-1 text-xs text-on-surface-variant">
              Versi {{ article.version }}
            </span>
          </div>
          <h2 class="text-2xl font-bold text-on-surface">{{ article.title }}</h2>
          <p class="mt-1 text-sm text-on-surface-variant">
            Penulis: {{ article.author?.profile?.full_name || article.author?.email || '—' }}
            &nbsp;·&nbsp;
            Dibuat: {{ new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
          </p>
          <p v-if="article.detail?.meta_description" class="mt-3 text-sm italic text-on-surface-variant">{{ article.detail.meta_description }}</p>
          <div v-if="article.detail?.body_content" class="prose prose-invert mt-4 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">{{ article.detail.body_content }}</div>
        </div>

        <div class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h3 class="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">Riwayat Versi</h3>
          <div v-if="isLoadingVersions" class="text-sm text-on-surface-variant">Memuat riwayat versi...</div>
          <div v-else-if="versions.length === 0" class="text-sm text-on-surface-variant">Belum ada riwayat versi.</div>
          <ul v-else class="space-y-2">
            <li v-for="version in versions" :key="version.id" class="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container px-4 py-3 text-sm">
              <div>
                <span class="font-bold text-on-surface">Versi {{ version.version_number }}</span>
                <span class="ml-2 text-xs text-on-surface-variant">{{ version.action }}</span>
              </div>
              <div class="text-right text-xs text-on-surface-variant">
                <p>{{ version.actor?.profile?.full_name || version.actor?.email || '—' }}</p>
                <p>{{ new Date(version.created_at).toLocaleString('id-ID') }}</p>
              </div>
            </li>
          </ul>
        </div>
      </template>

    </section>
  </main>
</template>
