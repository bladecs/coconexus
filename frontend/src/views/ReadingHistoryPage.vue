<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import { useReadingHistoryStore } from '@/stores/readingHistory';
import { resolveAssetUrl } from '@/lib/assets';

const historyStore = useReadingHistoryStore();
const isLoading = ref(false);
const search = ref('');

const TYPE_LABEL = {
  main: 'Wawasan', detail: 'Wawasan', prosedur: 'Prosedur',
  panduan: 'Panduan', referensi: 'Referensi', studi_kasus: 'Studi Kasus',
  troubleshooting: 'Troubleshoot',
};
const TYPE_ICON = {
  main: 'auto_stories', detail: 'auto_stories', prosedur: 'checklist',
  panduan: 'menu_book', referensi: 'library_books', studi_kasus: 'science',
  troubleshooting: 'build_circle',
};
const DIFF_LABEL = { pemula: 'Pemula', menengah: 'Menengah', lanjutan: 'Lanjutan' };
const DIFF_COLOR = {
  pemula:   'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
  menengah: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
  lanjutan: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50',
};

const filteredHistory = computed(() => {
  if (!search.value.trim()) return historyStore.history;
  const q = search.value.toLowerCase();
  return historyStore.history.filter(h =>
    h.article?.title?.toLowerCase().includes(q) ||
    h.article?.category?.name?.toLowerCase().includes(q) ||
    h.article?.tags?.some(t => t.name.toLowerCase().includes(q))
  );
});

function formatReadAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHr < 24) return `${diffHr} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateFull(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getCoverImage(article) {
  const img = article?.media?.find(m => m.media_type === 'image');
  if (!img) return null;
  return resolveAssetUrl(img.file_path);
}

async function load(page = 1) {
  isLoading.value = true;
  try {
    await historyStore.fetchHistory({ page, limit: 12 });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => load(1));
</script>

<template>
  <div class="min-h-screen bg-background">
    <SiteNavbar />
    <div class="md:ml-64 pt-14 md:pt-0">

      <!-- Page Header -->
      <div class="border-b border-outline-variant/20 bg-surface-container-lowest">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary mb-3">
            <span class="material-symbols-outlined" style="font-size:14px">history</span>
            Aktivitas Saya
          </div>
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 class="font-display text-3xl sm:text-4xl font-black text-on-surface leading-tight">
                Riwayat Baca
              </h1>
              <p class="text-sm text-on-surface-variant mt-2 max-w-lg leading-relaxed">
                Artikel yang telah Anda buka dan pelajari, diurutkan dari yang paling baru.
              </p>
            </div>
            <div
              v-if="historyStore.historyMeta.total_items"
              class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/8 text-secondary text-sm font-bold border border-secondary/15"
            >
              <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">auto_stories</span>
              {{ historyStore.historyMeta.total_items }} artikel dibaca
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        <!-- Search -->
        <div class="mb-7">
          <div class="relative max-w-md">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style="font-size:18px">search</span>
            <input
              v-model="search"
              type="search"
              placeholder="Cari riwayat baca…"
              class="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading && !historyStore.history.length" class="flex flex-col items-center justify-center py-24 gap-3 text-on-surface-variant">
          <div class="w-10 h-10 rounded-full border-4 border-outline-variant border-t-secondary animate-spin"></div>
          <p class="text-sm">Memuat riwayat baca…</p>
        </div>

        <!-- Empty -->
        <div
          v-else-if="!filteredHistory.length"
          class="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant"
        >
          <span class="material-symbols-outlined text-6xl text-outline-variant">history_toggle_off</span>
          <div class="text-center">
            <p class="text-sm font-semibold">
              {{ search ? 'Tidak ada artikel yang cocok' : 'Belum ada riwayat baca' }}
            </p>
            <p class="text-xs mt-1 text-outline">
              {{ search ? 'Coba kata kunci lain.' : 'Mulai membaca artikel untuk membangun riwayat Anda.' }}
            </p>
          </div>
          <button v-if="search" class="text-sm text-primary font-semibold hover:underline" @click="search = ''">
            Hapus pencarian
          </button>
          <RouterLink
            v-else
            to="/articles"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-sm font-semibold transition hover:opacity-90"
          >
            <span class="material-symbols-outlined" style="font-size:16px">explore</span>
            Jelajahi Artikel
          </RouterLink>
        </div>

        <!-- List -->
        <div v-else class="flex flex-col gap-4">
          <RouterLink
            v-for="item in filteredHistory"
            :key="item.id"
            :to="`/articles/${item.article.id}`"
            class="group flex gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
          >
            <!-- Cover thumb -->
            <div class="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-surface-container">
              <img
                v-if="getCoverImage(item.article)"
                :src="getCoverImage(item.article)"
                :alt="item.article.title"
                class="w-full h-full object-cover transition group-hover:scale-105"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="material-symbols-outlined text-3xl text-outline-variant/50">
                  {{ TYPE_ICON[item.article.article_type] || 'article' }}
                </span>
              </div>
            </div>

            <!-- Info -->
            <div class="flex flex-col flex-1 min-w-0 gap-1.5">
              <!-- Badges -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-primary/8 text-primary border border-primary/15">
                  <span class="material-symbols-outlined" style="font-size:10px">{{ TYPE_ICON[item.article.article_type] || 'article' }}</span>
                  {{ TYPE_LABEL[item.article.article_type] || item.article.article_type }}
                </span>
                <span
                  v-if="item.article.detail?.difficulty_level"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
                  :class="DIFF_COLOR[item.article.detail.difficulty_level]"
                >
                  {{ DIFF_LABEL[item.article.detail.difficulty_level] }}
                </span>
                <span v-if="item.article.category" class="text-xs font-semibold text-secondary">
                  {{ item.article.category.name }}
                </span>
              </div>

              <!-- Title -->
              <h2 class="text-sm font-bold text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {{ item.article.title }}
              </h2>

              <!-- Description -->
              <p v-if="item.article.detail?.meta_description" class="text-xs text-on-surface-variant leading-relaxed line-clamp-1 hidden sm:block">
                {{ item.article.detail.meta_description }}
              </p>

              <!-- Tags -->
              <div class="flex flex-wrap gap-1 mt-auto">
                <span
                  v-for="tag in (item.article.tags || []).slice(0, 3)"
                  :key="tag.id"
                  class="inline-flex px-1.5 py-0.5 rounded text-xs text-outline bg-surface-container border border-outline-variant/20"
                >
                  {{ tag.name }}
                </span>
              </div>
            </div>

            <!-- Read time + arrow -->
            <div class="flex flex-col items-end justify-between flex-shrink-0 text-right">
              <div class="text-xs text-on-surface-variant font-medium whitespace-nowrap" :title="formatDateFull(item.read_at)">
                <span class="material-symbols-outlined align-middle" style="font-size:12px">schedule</span>
                {{ formatReadAt(item.read_at) }}
              </div>
              <span class="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all mt-auto">
                Baca
                <span class="material-symbols-outlined" style="font-size:13px">arrow_forward</span>
              </span>
            </div>
          </RouterLink>
        </div>

        <!-- Pagination -->
        <div v-if="historyStore.historyMeta.total_pages > 1" class="flex items-center justify-center gap-3 mt-10">
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="historyStore.historyMeta.page <= 1"
            @click="load(historyStore.historyMeta.page - 1)"
          >
            <span class="material-symbols-outlined" style="font-size:16px">chevron_left</span>
            Sebelumnya
          </button>
          <span class="text-sm font-bold text-on-surface-variant">
            {{ historyStore.historyMeta.page }} / {{ historyStore.historyMeta.total_pages }}
          </span>
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="historyStore.historyMeta.page >= historyStore.historyMeta.total_pages"
            @click="load(historyStore.historyMeta.page + 1)"
          >
            Berikutnya
            <span class="material-symbols-outlined" style="font-size:16px">chevron_right</span>
          </button>
        </div>

      </div>
      <SiteFooter />
    </div>
  </div>
</template>
