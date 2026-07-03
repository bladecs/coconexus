<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import { useBookmarkStore } from '@/stores/bookmark';
import { resolveAssetUrl } from '@/lib/assets';

const bookmarkStore = useBookmarkStore();
const search = ref('');
const isRemoving = ref(null);

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

const filteredBookmarks = computed(() => {
  if (!search.value.trim()) return bookmarkStore.bookmarks;
  const q = search.value.toLowerCase();
  return bookmarkStore.bookmarks.filter(b =>
    b.article?.title?.toLowerCase().includes(q) ||
    b.article?.category?.name?.toLowerCase().includes(q) ||
    b.article?.tags?.some(t => t.name.toLowerCase().includes(q))
  );
});

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getCoverImage(article) {
  const img = article?.media?.find(m => m.media_type === 'image');
  if (!img) return null;
  return resolveAssetUrl(img.file_path);
}

async function removeBookmark(articleId) {
  isRemoving.value = articleId;
  try {
    await bookmarkStore.toggleBookmark(articleId);
    await bookmarkStore.fetchBookmarks({ page: bookmarkStore.bookmarkMeta.page, limit: 12 });
  } finally {
    isRemoving.value = null;
  }
}

function load(page = 1) {
  bookmarkStore.fetchBookmarks({ page, limit: 12 });
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
            <span class="material-symbols-outlined" style="font-size:14px">bookmark</span>
            Koleksi Saya
          </div>
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 class="font-display text-3xl sm:text-4xl font-black text-on-surface leading-tight">
                Artikel Tersimpan
              </h1>
              <p class="text-sm text-on-surface-variant mt-2 max-w-lg leading-relaxed">
                Kumpulan artikel yang telah Anda simpan untuk dibaca atau dijadikan referensi.
              </p>
            </div>
            <div
              v-if="bookmarkStore.bookmarkMeta.total_items"
              class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/8 text-primary text-sm font-bold border border-primary/15"
            >
              <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">bookmarks</span>
              {{ bookmarkStore.bookmarkMeta.total_items }} artikel tersimpan
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
              placeholder="Cari artikel tersimpan…"
              class="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="bookmarkStore.isSubmitting && !bookmarkStore.bookmarks.length" class="flex flex-col items-center justify-center py-24 gap-3 text-on-surface-variant">
          <div class="w-10 h-10 rounded-full border-4 border-outline-variant border-t-primary animate-spin"></div>
          <p class="text-sm">Memuat bookmark…</p>
        </div>

        <!-- Empty -->
        <div
          v-else-if="!filteredBookmarks.length"
          class="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant"
        >
          <span class="material-symbols-outlined text-6xl text-outline-variant">bookmark_border</span>
          <div class="text-center">
            <p class="text-sm font-semibold">
              {{ search ? 'Tidak ada artikel yang cocok' : 'Belum ada artikel tersimpan' }}
            </p>
            <p class="text-xs mt-1 text-outline">
              {{ search ? 'Coba kata kunci lain.' : 'Simpan artikel menarik dengan klik ikon bookmark.' }}
            </p>
          </div>
          <button v-if="search" class="text-sm text-primary font-semibold hover:underline" @click="search = ''">
            Hapus pencarian
          </button>
          <RouterLink
            v-else
            to="/articles"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold transition hover:opacity-90"
          >
            <span class="material-symbols-outlined" style="font-size:16px">explore</span>
            Jelajahi Artikel
          </RouterLink>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="item in filteredBookmarks"
            :key="item.id"
            class="group flex flex-col rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
          >
            <!-- Cover Image -->
            <RouterLink :to="`/articles/${item.article.id}`" class="block">
              <div class="relative h-36 bg-surface-container overflow-hidden">
                <img
                  v-if="getCoverImage(item.article)"
                  :src="getCoverImage(item.article)"
                  :alt="item.article.title"
                  class="w-full h-full object-cover transition group-hover:scale-105"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="material-symbols-outlined text-5xl text-outline-variant/50">
                    {{ TYPE_ICON[item.article.article_type] || 'article' }}
                  </span>
                </div>
                <!-- Type badge overlay -->
                <div class="absolute top-2.5 left-2.5 flex gap-1.5">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface/90 backdrop-blur-sm text-on-surface border border-outline-variant/30">
                    <span class="material-symbols-outlined" style="font-size:11px">{{ TYPE_ICON[item.article.article_type] || 'article' }}</span>
                    {{ TYPE_LABEL[item.article.article_type] || item.article.article_type }}
                  </span>
                </div>
              </div>
            </RouterLink>

            <!-- Content -->
            <div class="flex flex-col flex-1 p-4 gap-3">
              <!-- Category -->
              <div v-if="item.article.category" class="text-xs font-bold text-secondary uppercase tracking-wider">
                {{ item.article.category.name }}
              </div>

              <!-- Title -->
              <RouterLink :to="`/articles/${item.article.id}`">
                <h2 class="text-sm font-bold text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {{ item.article.title }}
                </h2>
              </RouterLink>

              <!-- Meta description -->
              <p v-if="item.article.detail?.meta_description" class="text-xs text-on-surface-variant leading-relaxed line-clamp-2 flex-1">
                {{ item.article.detail.meta_description }}
              </p>
              <div v-else class="flex-1"></div>

              <!-- Tags + Difficulty -->
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-if="item.article.detail?.difficulty_level"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
                  :class="DIFF_COLOR[item.article.detail.difficulty_level]"
                >
                  {{ DIFF_LABEL[item.article.detail.difficulty_level] }}
                </span>
                <span
                  v-for="tag in (item.article.tags || []).slice(0, 2)"
                  :key="tag.id"
                  class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant/30"
                >
                  {{ tag.name }}
                </span>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between pt-3 border-t border-outline-variant/20 mt-auto">
                <div class="flex items-center gap-1 text-xs text-outline">
                  <span class="material-symbols-outlined" style="font-size:12px">bookmark_added</span>
                  {{ formatDate(item.created_at) }}
                </div>
                <div class="flex items-center gap-2">
                  <RouterLink
                    :to="`/articles/${item.article.id}`"
                    class="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Baca
                    <span class="material-symbols-outlined" style="font-size:13px">arrow_forward</span>
                  </RouterLink>
                  <button
                    :disabled="isRemoving === item.article.id"
                    class="p-1 rounded-lg text-outline hover:text-error hover:bg-error/8 transition disabled:opacity-50"
                    title="Hapus dari bookmark"
                    @click="removeBookmark(item.article.id)"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">
                      {{ isRemoving === item.article.id ? 'hourglass_empty' : 'bookmark_remove' }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="bookmarkStore.bookmarkMeta.total_pages > 1" class="flex items-center justify-center gap-3 mt-10">
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="bookmarkStore.bookmarkMeta.page <= 1"
            @click="load(bookmarkStore.bookmarkMeta.page - 1)"
          >
            <span class="material-symbols-outlined" style="font-size:16px">chevron_left</span>
            Sebelumnya
          </button>
          <span class="text-sm font-bold text-on-surface-variant">
            {{ bookmarkStore.bookmarkMeta.page }} / {{ bookmarkStore.bookmarkMeta.total_pages }}
          </span>
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="bookmarkStore.bookmarkMeta.page >= bookmarkStore.bookmarkMeta.total_pages"
            @click="load(bookmarkStore.bookmarkMeta.page + 1)"
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
