<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import { useForumStore } from '@/stores/forum';

const forumStore = useForumStore();
const search = ref('');
let searchTimer = null;

const totalLabel = computed(() => {
  const t = forumStore.meta.total_items;
  return t ? `${t} forum aktif` : '';
});

function load(page = 1) {
  forumStore.fetchForums({ search: search.value || undefined, page, limit: 12 });
}

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => load(1), 350);
});

onMounted(() => load(1));

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

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
</script>

<template>
  <div class="min-h-screen bg-background">
    <SiteNavbar />
    <div class="md:ml-64 pt-14 md:pt-0">

      <!-- Page header -->
      <div class="border-b border-outline-variant/20 bg-surface-container-lowest">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary mb-3">
            <span class="material-symbols-outlined" style="font-size:14px">forum</span>
            Komunitas
          </div>
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 class="font-display text-3xl sm:text-4xl font-black text-on-surface leading-tight">
                Forum Diskusi
              </h1>
              <p class="text-sm text-on-surface-variant mt-2 max-w-lg leading-relaxed">
                Ruang diskusi terstruktur yang dikurasi moderator dari komentar-komentar paling relevan.
              </p>
            </div>
            <div v-if="totalLabel" class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/8 text-primary text-sm font-bold border border-primary/15">
              <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">mark_chat_read</span>
              {{ totalLabel }}
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
              placeholder="Cari forum diskusi…"
              class="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="forumStore.isLoading" class="flex flex-col items-center justify-center py-24 gap-3 text-on-surface-variant">
          <div class="w-10 h-10 rounded-full border-4 border-outline-variant border-t-primary animate-spin"></div>
          <p class="text-sm">Memuat forum diskusi…</p>
        </div>

        <!-- Empty -->
        <div v-else-if="!forumStore.forums.length" class="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
          <span class="material-symbols-outlined text-6xl text-outline-variant">forum</span>
          <p class="text-sm font-medium">Belum ada forum diskusi aktif{{ search ? ' untuk pencarian ini' : '' }}.</p>
          <button v-if="search" class="text-sm text-primary font-semibold hover:underline" @click="search = ''">
            Hapus pencarian
          </button>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <RouterLink
            v-for="forum in forumStore.forums"
            :key="forum.id"
            :to="`/articles/${forum.article_id}/forum`"
            class="group flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
          >
            <!-- Badges -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                <span class="material-symbols-outlined" style="font-size:11px;font-variation-settings:'FILL' 1">verified</span>
                Forum Aktif
              </span>
              <span
                v-if="forum.article?.article_type"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary border border-secondary/20"
              >
                <span class="material-symbols-outlined" style="font-size:11px">{{ TYPE_ICON[forum.article.article_type] || 'article' }}</span>
                {{ TYPE_LABEL[forum.article.article_type] || forum.article.article_type }}
              </span>
            </div>

            <!-- Title -->
            <h2 class="font-display text-base font-bold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {{ forum.title }}
            </h2>

            <!-- Summary -->
            <p v-if="forum.summary" class="text-sm text-on-surface-variant leading-relaxed line-clamp-3 flex-1">
              {{ forum.summary }}
            </p>

            <!-- Article source -->
            <div v-if="forum.article" class="flex items-start gap-2 pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant">
              <span class="material-symbols-outlined flex-shrink-0 mt-0.5 text-outline-variant" style="font-size:13px">article</span>
              <span class="line-clamp-2">{{ forum.article.title }}</span>
            </div>

            <!-- Meta + arrow -->
            <div class="flex items-center justify-between mt-auto">
              <div class="flex items-center gap-4 text-xs text-on-surface-variant">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined" style="font-size:13px">chat</span>
                  {{ forum.comments_count || 0 }}
                </span>
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined" style="font-size:13px">calendar_today</span>
                  {{ formatDate(forum.validated_at) }}
                </span>
              </div>
              <span class="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                Buka
                <span class="material-symbols-outlined" style="font-size:14px">arrow_forward</span>
              </span>
            </div>
          </RouterLink>
        </div>

        <!-- Pagination -->
        <div v-if="forumStore.meta.total_pages > 1" class="flex items-center justify-center gap-3 mt-10">
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="forumStore.meta.page <= 1"
            @click="load(forumStore.meta.page - 1)"
          >
            <span class="material-symbols-outlined" style="font-size:16px">chevron_left</span>
            Sebelumnya
          </button>
          <span class="text-sm font-bold text-on-surface-variant">
            {{ forumStore.meta.page }} / {{ forumStore.meta.total_pages }}
          </span>
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="forumStore.meta.page >= forumStore.meta.total_pages"
            @click="load(forumStore.meta.page + 1)"
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
