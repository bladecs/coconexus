<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import CommentComposer from '@/components/comments/CommentComposer.vue';
import CommentItem from '@/components/comments/CommentItem.vue';
import SectionRenderer from '@/components/editor/SectionRenderer.vue';
import ArticleRating from '@/components/article/ArticleRating.vue';
import RelatedArticles from '@/components/article/RelatedArticles.vue';
import { useArticleStore } from '@/stores/articles';
import { useAuthStore } from '@/stores/auth';
import { useBookmarkStore } from '@/stores/bookmark';
import { useReadingHistoryStore } from '@/stores/readingHistory';
import { useStepProgressStore } from '@/stores/stepProgress';
import { resolveAssetUrl } from '@/lib/assets';
import api from '@/lib/api';

const route = useRoute();
const articleStore        = useArticleStore();
const authStore           = useAuthStore();
const bookmarkStore       = useBookmarkStore();
const readingHistoryStore = useReadingHistoryStore();
const stepProgressStore   = useStepProgressStore();
const commentNotice   = ref('');
const bookmarkLoading = ref(false);
const downloadingPdf  = ref(false);
const pdfError        = ref('');

// Step guide state (technical articles only)
const activeStep = ref(0);
const completedSteps = ref([]);

const articleId = computed(() => Number(route.params.id));
const article   = computed(() => articleStore.currentArticle);

const TECHNICAL_TYPES = ['prosedur', 'panduan', 'referensi', 'studi_kasus', 'troubleshooting'];
const isTechnical = computed(() => TECHNICAL_TYPES.includes(article.value?.article_type));
const isWawasan   = computed(() => ['main', 'detail'].includes(article.value?.article_type));
const isMain      = computed(() => article.value?.article_type !== 'detail');

const linkedTechnical = computed(() => article.value?.technical_articles || []);
const linkedWawasan   = computed(() => article.value?.wawasan_article || null);

const TYPE_LABEL = {
  main: 'Wawasan', detail: 'Wawasan Detail',
  prosedur: 'Prosedur', panduan: 'Panduan',
  referensi: 'Referensi', studi_kasus: 'Studi Kasus',
  troubleshooting: 'Troubleshooting',
};

const TYPE_BADGE = {
  main:            'bg-primary/10 text-primary border-primary/20',
  detail:          'bg-primary/10 text-primary border-primary/20',
  prosedur:        'bg-secondary/10 text-secondary border-secondary/20',
  panduan:         'bg-secondary/10 text-secondary border-secondary/20',
  referensi:       'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
  studi_kasus:     'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
  troubleshooting: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50',
};

const TYPE_ICON = {
  main: 'auto_stories', detail: 'auto_stories',
  prosedur: 'checklist', panduan: 'menu_book',
  referensi: 'library_books', studi_kasus: 'science',
  troubleshooting: 'build_circle',
};

const DIFF_LABEL = { pemula: 'Pemula', menengah: 'Menengah', lanjutan: 'Lanjutan' };
const DIFF_BADGE = {
  pemula:   'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
  menengah: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
  lanjutan: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50',
};

const meta = computed(() => {
  const d = article.value?.detail;
  if (!d) return null;
  return {
    difficulty:        d.difficulty_level,
    time:              d.time_required_minutes,
    materials:         d.materials_list,
    tools:             d.tools_list,
    safetyNotes:       d.safety_notes,
    processParams:     d.process_parameters,
    qualityIndicators: d.quality_indicators,
  };
});

const hasTechSpec = computed(() =>
  isTechnical.value && meta.value &&
  (meta.value.materials?.filter(m => m.name).length ||
   meta.value.tools?.filter(t => t.name).length ||
   meta.value.processParams || meta.value.safetyNotes || meta.value.qualityIndicators)
);

const sections = computed(() => {
  const s = article.value?.detail?.sections || [];
  if (s.length) return s;
  const body = article.value?.detail?.body_content;
  return body ? [{ title: 'Pengantar', body_content: body, video_path: null }] : [];
});

const stepProgress = computed(() => {
  if (!sections.value.length) return 0;
  return Math.round((completedSteps.value.length / sections.value.length) * 100);
});

const heroImage = computed(() => {
  const m = article.value?.media?.find(x => x.media_type === 'image');
  return m?.file_path ? resolveAssetUrl(m.file_path) : null;
});

const articleSources = computed(() => article.value?.detail?.sources || []);
const productCards   = computed(() => article.value?.product_cards || []);
const tags           = computed(() => article.value?.tags || []);

const AUTHOR_ROLE_LABELS = { pengelola: 'Pengelola', admin: 'Admin', moderator: 'Moderator' };
const authorName = computed(() => article.value?.author?.profile?.full_name || 'Tim COCONEXUS');
const authorRoleLabel = computed(() => {
  const role = article.value?.author?.role;
  return AUTHOR_ROLE_LABELS[role] || article.value?.author?.profile?.job_title || 'Kontributor';
});

// Untuk artikel utama, produk turunan dikelompokkan sebagai "pohon turunan limbah"
// berdasarkan cara pengelolaannya (dibakar, dihancurkan, dst).
const productCardGroups = computed(() => {
  if (article.value?.article_type !== 'main') return null;

  const groups = new Map();
  productCards.value.forEach((pc) => {
    const method = pc.processing_method?.trim() || 'Lainnya';
    if (!groups.has(method)) groups.set(method, []);
    groups.get(method).push(pc);
  });

  return Array.from(groups.entries()).map(([method, items]) => ({ method, items }));
});

const formattedDate = computed(() => {
  if (!article.value?.created_at) return '';
  return new Date(article.value.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
});

const readTime = computed(() => {
  const bodyWords = (article.value?.detail?.body_content || '').split(/\s+/).length;
  const sectionWords = sections.value.reduce(
    (sum, s) => sum + (s.body_content || '').split(/\s+/).length, 0
  );
  return Math.max(1, Math.round((bodyWords + sectionWords) / 200));
});

function isYT(url) {
  return url?.includes('youtube.com') || url?.includes('youtu.be');
}
function ytEmbed(url) {
  let id = '';
  if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
  else { const p = new URLSearchParams(url.split('?')[1]); id = p.get('v'); }
  return `https://www.youtube.com/embed/${id}`;
}

function toolIcon(name = '') {
  const n = name.toLowerCase();
  if (/drum|tungku|kiln|karbonisasi|bakar|api|oven|pengering|furnace|muffle|reaktor/.test(n)) return 'local_fire_department';
  if (/press|cetak|pencetak|kempa/.test(n))                    return 'compress';
  if (/timbang|neraca|scale/.test(n))                          return 'scale';
  if (/termometer|suhu|thermocouple/.test(n))                  return 'thermostat';
  if (/blender|giling|grind|mill|penggiling|crusher|hancur/.test(n)) return 'settings';
  if (/saring|sieve|filter|ayak/.test(n))                      return 'filter_alt';
  if (/pipet|buret|erlenmeyer|labu|kimia/.test(n))             return 'science';
  if (/ph meter|conductivity|meter/.test(n))                   return 'speed';
  if (/gelas|beaker|tabung|wadah/.test(n))                     return 'water_drop';
  if (/spatula|pengaduk|stirrer/.test(n))                      return 'blender';
  if (/gergaji|potong|pisau/.test(n))                          return 'content_cut';
  if (/amplas|ukir/.test(n))                                   return 'brush';
  return 'build';
}

function materialIcon(name = '') {
  const n = name.toLowerCase();
  if (/air|cair|larutan/.test(n))         return 'water_drop';
  if (/perekat|resin|lem|lateks/.test(n)) return 'water_drop';
  if (/arang|karbon|batok|tempurung/.test(n)) return 'eco';
  return 'inventory_2';
}

function getStepState(index) {
  if (completedSteps.value.includes(index)) return 'completed';
  if (index === activeStep.value) return 'active';
  return 'upcoming';
}

async function markStepComplete(index) {
  if (!completedSteps.value.includes(index)) {
    completedSteps.value = [...completedSteps.value, index];
  }
  let next = index + 1;
  while (next < sections.value.length && completedSteps.value.includes(next)) next++;
  if (next < sections.value.length) activeStep.value = next;

  if (authStore.isAuthenticated) {
    await stepProgressStore.toggleStep(articleId.value, index);
  }
}

async function resetSteps() {
  activeStep.value = 0;
  completedSteps.value = [];
  if (authStore.isAuthenticated) {
    await stepProgressStore.resetProgress(articleId.value);
  }
}

function jumpToStep(index) {
  activeStep.value = index;
  document.getElementById(`step-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const isBookmarked = computed(() => bookmarkStore.isBookmarked(articleId.value));

async function toggleBookmark() {
  if (!authStore.isAuthenticated) return;
  bookmarkLoading.value = true;
  try {
    await bookmarkStore.toggleBookmark(articleId.value);
  } finally {
    bookmarkLoading.value = false;
  }
}

async function loadArticle() {
  commentNotice.value = '';
  activeStep.value = 0;
  completedSteps.value = [];
  if (Number.isInteger(articleId.value) && articleId.value > 0) {
    await articleStore.fetchPublishedArticleDetail(articleId.value);
    if (authStore.isAuthenticated) {
      bookmarkStore.checkBookmark(articleId.value);
      readingHistoryStore.recordRead(articleId.value);
      const savedSteps = await stepProgressStore.fetchProgress(articleId.value);
      completedSteps.value = savedSteps;
      if (savedSteps.length > 0) {
        let next = Math.max(...savedSteps) + 1;
        while (next < sections.value.length && savedSteps.includes(next)) next++;
        activeStep.value = Math.min(next, sections.value.length - 1);
      }
    }
  }
}

async function handleCommentSubmit(payload) {
  try {
    const r = await articleStore.postComment(articleId.value, payload);
    commentNotice.value = r?.message || 'Komentar berhasil dikirim.';
  } catch (e) { commentNotice.value = e.message; }
}

async function handleDeleteComment(id) {
  await articleStore.deleteComment(id, articleId.value);
}

async function printArticle() {
  if (downloadingPdf.value || !articleId.value) return;

  downloadingPdf.value = true;
  pdfError.value = '';

  try {
    const response = await api.get(`/articles/published/${articleId.value}/pdf`, {
      responseType: 'blob',
    });

    const blobUrl = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${(article.value?.title || 'artikel').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    pdfError.value = error.message || 'Gagal mengunduh PDF.';
  } finally {
    downloadingPdf.value = false;
  }
}

watch(() => route.params.id, loadArticle);
onMounted(loadArticle);
</script>

<template>
  <div class="min-h-screen bg-background">
    <SiteNavbar />

    <div class="md:ml-64 pt-14 md:pt-0">

      <!-- Loading / Not found -->
      <div v-if="!article" class="flex items-center justify-center min-h-[70vh]">
        <div class="text-center py-20">
          <span class="material-symbols-outlined block text-6xl text-outline-variant mb-4">
            {{ articleStore.isLoading ? 'hourglass_empty' : 'article' }}
          </span>
          <p class="text-on-surface-variant text-sm">
            {{ articleStore.isLoading ? 'Memuat artikel…' : 'Artikel tidak ditemukan.' }}
          </p>
          <RouterLink to="/" class="mt-4 inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
            <span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>
            Kembali ke Beranda
          </RouterLink>
        </div>
      </div>

      <div v-else id="article-print-area">

        <!-- ═══════════════════════════════════════════════════════
             LAYOUT A — WAWASAN (main / detail)
        ═══════════════════════════════════════════════════════ -->
        <div v-if="isWawasan" class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          <!-- Breadcrumbs -->
          <nav class="flex items-center gap-1.5 text-xs text-on-surface-variant mb-6 flex-wrap">
            <RouterLink to="/" class="hover:text-primary transition-colors">Beranda</RouterLink>
            <span class="material-symbols-outlined text-outline-variant" style="font-size:14px">chevron_right</span>
            <span v-if="article.category" class="hover:text-primary cursor-pointer transition-colors">
              {{ article.category.name }}
            </span>
            <span class="material-symbols-outlined text-outline-variant" style="font-size:14px">chevron_right</span>
            <span class="text-on-surface font-medium truncate max-w-[200px] sm:max-w-xs">{{ article.title }}</span>
          </nav>

          <!-- 12-col grid: main content (8) + sidebar (4) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

            <!-- ── Main Content ── -->
            <main class="lg:col-span-8 min-w-0 article-main-col">

              <!-- Article Header -->
              <header class="mb-8">
                <!-- Badges row -->
                <div class="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                    :class="TYPE_BADGE[article.article_type] || 'bg-surface-container text-on-surface-variant border-outline-variant'"
                  >
                    <span class="material-symbols-outlined" style="font-size:13px;font-variation-settings:'FILL' 1">
                      {{ TYPE_ICON[article.article_type] || 'article' }}
                    </span>
                    {{ TYPE_LABEL[article.article_type] || 'Artikel' }}
                  </span>
                  <span
                    v-if="meta?.difficulty"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border"
                    :class="DIFF_BADGE[meta.difficulty] || 'bg-surface-container text-on-surface-variant border-outline-variant'"
                  >
                    {{ DIFF_LABEL[meta.difficulty] || meta.difficulty }}
                  </span>
                  <span
                    v-if="meta?.time"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant"
                  >
                    <span class="material-symbols-outlined" style="font-size:13px">schedule</span>
                    {{ meta.time }} menit
                  </span>
                </div>

                <!-- Title -->
                <h1 class="font-display text-3xl sm:text-4xl font-bold text-on-surface leading-tight mb-5">
                  {{ article.title }}
                </h1>

                <!-- Meta row -->
                <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-surface-variant border-t border-b border-outline-variant/40 py-3 mb-6">
                  <span class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined" style="font-size:15px">person</span>
                    {{ authorName }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined" style="font-size:15px">calendar_today</span>
                    {{ formattedDate }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined" style="font-size:15px">visibility</span>
                    {{ article.view_count || 0 }} tayangan
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined" style="font-size:15px">timer</span>
                    {{ readTime }} menit baca
                  </span>
                  <!-- Bookmark button -->
                  <button
                    v-if="authStore.isAuthenticated"
                    type="button"
                    :disabled="bookmarkLoading"
                    class="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors"
                    :class="isBookmarked
                      ? 'text-primary bg-primary/8 hover:bg-primary/15'
                      : 'text-on-surface-variant hover:text-primary hover:bg-primary/8'"
                    :aria-label="isBookmarked ? 'Hapus bookmark' : 'Simpan bookmark'"
                    @click="toggleBookmark"
                  >
                    <span
                      class="material-symbols-outlined"
                      style="font-size:18px"
                      :style="isBookmarked ? 'font-variation-settings:\'FILL\' 1' : 'font-variation-settings:\'FILL\' 0'"
                    >bookmark</span>
                    <span class="text-xs font-medium">{{ isBookmarked ? 'Tersimpan' : 'Simpan' }}</span>
                  </button>
                </div>

                <!-- Hero Image -->
                <div v-if="heroImage" class="rounded-2xl overflow-hidden mb-6 bg-surface-container aspect-video">
                  <img :src="heroImage" :alt="article.title" class="w-full h-full object-cover" />
                </div>

                <!-- Executive Summary -->
                <div
                  v-if="article.detail?.meta_description"
                  class="flex gap-4 p-5 rounded-xl bg-primary/5 border border-primary/15 border-l-4 border-l-primary mb-2"
                >
                  <span
                    class="material-symbols-outlined text-primary flex-shrink-0 mt-0.5"
                    style="font-size:22px;font-variation-settings:'FILL' 1"
                  >summarize</span>
                  <div>
                    <p class="text-xs font-bold tracking-widest uppercase text-primary mb-2">Ringkasan Eksekutif</p>
                    <p class="text-on-surface text-sm leading-relaxed">{{ article.detail.meta_description }}</p>
                  </div>
                </div>
              </header>

              <!-- Wawasan → Teknis callout -->
              <div
                v-if="linkedTechnical.length"
                class="mb-8 rounded-xl border border-secondary/20 bg-secondary/5 overflow-hidden"
              >
                <div class="flex items-center gap-2 px-4 py-3 border-b border-secondary/15">
                  <span
                    class="material-symbols-outlined text-secondary"
                    style="font-size:17px;font-variation-settings:'FILL' 1"
                  >build_circle</span>
                  <p class="text-xs font-bold tracking-wide uppercase text-secondary">Panduan Praktis Terkait</p>
                </div>
                <div class="divide-y divide-outline-variant/20">
                  <RouterLink
                    v-for="ta in linkedTechnical"
                    :key="ta.id"
                    :to="`/articles/${ta.id}`"
                    class="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-secondary/5 transition-colors group"
                  >
                    <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-secondary/10 text-secondary flex-shrink-0">
                      {{ TYPE_LABEL[ta.article_type] || ta.article_type }}
                    </span>
                    <span class="flex-1 text-sm font-medium leading-snug">{{ ta.title }}</span>
                    <span
                      class="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors flex-shrink-0"
                      style="font-size:17px"
                    >arrow_forward</span>
                  </RouterLink>
                </div>
              </div>

              <!-- Article Body: Sections -->
              <div class="article-body space-y-10 mb-10">
                <section
                  v-for="(s, i) in sections"
                  :key="i"
                  :id="i === 0 ? 'section-intro' : `section-${i}`"
                >
                  <h2
                    v-if="i > 0 || sections.length > 1"
                    class="font-display text-xl font-bold text-on-surface mb-4 pb-2.5 border-b-2 border-primary/20"
                  >{{ s.title }}</h2>
                  <img
                    v-if="s.image_path"
                    :src="resolveAssetUrl(s.image_path)"
                    :alt="s.title"
                    class="w-full rounded-xl mb-4 border border-outline-variant/40 object-cover aspect-video"
                  />
                  <template v-if="s.video_path">
                    <iframe
                      v-if="isYT(s.video_path)"
                      class="w-full aspect-video rounded-xl mb-4 border border-outline-variant/40"
                      :src="ytEmbed(s.video_path)"
                      frameborder="0" allowfullscreen
                    />
                    <video
                      v-else
                      class="w-full rounded-xl mb-4 border border-outline-variant/40"
                      :src="resolveAssetUrl(s.video_path)"
                      controls
                    />
                  </template>
                  <SectionRenderer :section="s" />
                </section>
              </div>

              <!-- Tags -->
              <div v-if="tags.length" class="flex flex-wrap gap-2 pt-6 border-t border-outline-variant/40 mb-8">
                <span class="text-xs text-on-surface-variant font-medium self-center">Tag:</span>
                <span
                  v-for="t in tags" :key="t"
                  class="px-3 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant/50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors cursor-default"
                >{{ t }}</span>
              </div>

              <!-- Action Buttons -->
              <div class="no-print flex flex-col gap-2 mb-10">
                <div class="flex flex-wrap gap-3">
                <button
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
                  :disabled="downloadingPdf"
                  @click="printArticle"
                >
                  <span class="material-symbols-outlined" style="font-size:17px">download</span>
                  {{ downloadingPdf ? 'Menyiapkan PDF…' : 'Unduh PDF' }}
                </button>
                <button
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container text-on-surface text-sm font-semibold border border-outline-variant hover:bg-surface-container-high transition-colors"
                >
                  <span class="material-symbols-outlined" style="font-size:17px">format_quote</span>
                  Kutip Artikel
                </button>
                <RouterLink
                  v-if="authStore.isAuthenticated"
                  :to="`/articles/${article.id}/forum`"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container text-on-surface text-sm font-semibold border border-outline-variant hover:bg-surface-container-high transition-colors"
                >
                  <span class="material-symbols-outlined" style="font-size:17px">forum</span>
                  Forum Diskusi
                </RouterLink>
                </div>
                <p v-if="pdfError" class="text-sm text-red-500">{{ pdfError }}</p>
              </div>

              <!-- References -->
              <section
                v-if="articleSources.length"
                id="sources"
                class="mb-10 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/40"
              >
                <h3 class="flex items-center gap-2 text-sm font-bold text-on-surface mb-4">
                  <span
                    class="material-symbols-outlined text-primary"
                    style="font-size:17px;font-variation-settings:'FILL' 1"
                  >library_books</span>
                  Referensi & Sumber
                </h3>
                <ol class="space-y-2 pl-5 list-decimal">
                  <li v-for="src in articleSources" :key="src.title" class="text-sm text-on-surface-variant">
                    <a
                      :href="src.url || resolveAssetUrl(src.file_path)"
                      target="_blank" rel="noreferrer"
                      class="text-primary hover:underline"
                    >{{ src.title }}</a>
                  </li>
                </ol>
              </section>

              <!-- Pohon Turunan Limbah (artikel utama) — menggantikan Artikel Terkait -->
              <section v-if="productCardGroups" class="no-print mb-10">
                <h3 class="flex items-center gap-2 text-lg font-bold text-on-surface mb-5">
                  <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">device_hub</span>
                  Pohon Turunan Limbah
                </h3>

                <p v-if="!productCardGroups.length" class="text-sm text-on-surface-variant">
                  Belum ada produk turunan untuk artikel ini.
                </p>

                <div v-else class="grid gap-5" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                  <div v-for="group in productCardGroups" :key="group.method" class="flex flex-col gap-3">
                    <p class="text-xs font-bold text-primary uppercase tracking-wide text-center pb-2 border-b-2 border-primary/25">
                      {{ group.method }}
                    </p>
                    <div
                      v-for="pc in group.items"
                      :key="pc.id"
                      class="rounded-xl border border-outline-variant/40 bg-surface-container-lowest overflow-hidden"
                    >
                      <div class="aspect-video bg-surface-container overflow-hidden">
                        <img
                          v-if="pc.image"
                          :src="resolveAssetUrl(pc.image)"
                          :alt="pc.title"
                          class="w-full h-full object-cover"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center">
                          <span class="material-symbols-outlined text-outline-variant" style="font-size:28px">eco</span>
                        </div>
                      </div>
                      <div class="p-3">
                        <p class="text-sm font-semibold text-on-surface mb-1 leading-snug">{{ pc.title }}</p>
                        <p class="text-xs text-on-surface-variant mb-2 leading-relaxed line-clamp-2">{{ pc.description }}</p>
                        <RouterLink
                          v-if="pc.linked_article?.id && pc.linked_article?.status === 'published'"
                          :to="`/articles/${pc.linked_article.id}`"
                          class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Buka artikel
                          <span class="material-symbols-outlined" style="font-size:12px">arrow_forward</span>
                        </RouterLink>
                        <span v-else class="text-xs text-on-surface-variant italic">Segera tersedia</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Related Articles (artikel non-utama) -->
              <div v-else class="no-print"><RelatedArticles :article-id="articleId" /></div>

              <!-- Rating -->
              <div class="no-print mt-10 mb-8">
                <ArticleRating :article-id="articleId" />
              </div>

              <!-- Discussion -->
              <section id="discussion" class="no-print border-t border-outline-variant/40 pt-8">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="font-display text-xl font-bold text-on-surface">Diskusi</h2>
                  <RouterLink
                    v-if="authStore.isAuthenticated"
                    :to="`/articles/${article.id}/forum`"
                    class="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Forum Diskusi
                    <span class="material-symbols-outlined" style="font-size:13px">arrow_forward</span>
                  </RouterLink>
                </div>
                <CommentComposer
                  :article-id="article.id"
                  :loading="articleStore.isSubmitting"
                  :placeholder="authStore.isAuthenticated ? 'Bagikan pendapat Anda…' : 'Login untuk berkomentar…'"
                  @submit="handleCommentSubmit"
                />
                <p v-if="commentNotice" class="mt-3 text-sm text-secondary bg-secondary/5 rounded-lg px-4 py-2.5 border border-secondary/10">
                  {{ commentNotice }}
                </p>
                <div class="mt-6 space-y-3">
                  <CommentItem
                    v-for="c in articleStore.comments"
                    :key="c.id"
                    :comment="c"
                    :article-id="article.id"
                    :loading="articleStore.isSubmitting"
                    @reply="handleCommentSubmit"
                    @delete="handleDeleteComment"
                  />
                  <p v-if="!articleStore.comments.length" class="text-center text-sm text-on-surface-variant py-8">
                    Belum ada komentar. Jadilah yang pertama!
                  </p>
                </div>
              </section>

            </main>

            <!-- ── Right Sidebar ── -->
            <aside class="no-print lg:col-span-4 space-y-5">

              <!-- Resource Info Card -->
              <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden shadow-md">
                <div class="px-4 py-3.5 bg-primary text-on-primary">
                  <p class="text-xs font-bold tracking-widest uppercase">Informasi Sumber</p>
                </div>
                <div class="divide-y divide-outline-variant/30">
                  <div class="flex items-start gap-3 px-4 py-3">
                    <span class="material-symbols-outlined text-outline-variant mt-0.5" style="font-size:15px">category</span>
                    <div>
                      <p class="text-xs text-on-surface-variant mb-0.5">Kategori</p>
                      <p class="text-sm font-semibold text-on-surface">{{ article.category?.name || 'Umum' }}</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 px-4 py-3">
                    <span class="material-symbols-outlined text-outline-variant mt-0.5" style="font-size:15px">auto_stories</span>
                    <div>
                      <p class="text-xs text-on-surface-variant mb-0.5">Tipe Artikel</p>
                      <p class="text-sm font-semibold text-on-surface">{{ TYPE_LABEL[article.article_type] || 'Artikel' }}</p>
                    </div>
                  </div>
                  <div v-if="meta?.difficulty" class="flex items-start gap-3 px-4 py-3">
                    <span class="material-symbols-outlined text-outline-variant mt-0.5" style="font-size:15px">signal_cellular_alt</span>
                    <div>
                      <p class="text-xs text-on-surface-variant mb-0.5">Tingkat Kesulitan</p>
                      <p class="text-sm font-semibold text-on-surface">{{ DIFF_LABEL[meta.difficulty] }}</p>
                    </div>
                  </div>
                  <div v-if="meta?.time" class="flex items-start gap-3 px-4 py-3">
                    <span class="material-symbols-outlined text-outline-variant mt-0.5" style="font-size:15px">schedule</span>
                    <div>
                      <p class="text-xs text-on-surface-variant mb-0.5">Waktu yang Dibutuhkan</p>
                      <p class="text-sm font-semibold text-on-surface">{{ meta.time }} menit</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 px-4 py-3">
                    <span class="material-symbols-outlined text-outline-variant mt-0.5" style="font-size:15px">calendar_today</span>
                    <div>
                      <p class="text-xs text-on-surface-variant mb-0.5">Diterbitkan</p>
                      <p class="text-sm font-semibold text-on-surface">{{ formattedDate }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Keywords -->
              <div v-if="tags.length" class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-4">
                <p class="text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-3">Kata Kunci</p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="t in tags" :key="t"
                    class="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/5 text-primary border border-primary/15"
                  >{{ t }}</span>
                </div>
              </div>

              <!-- Related Technical Resources -->
              <div
                v-if="linkedTechnical.length"
                class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden"
              >
                <div class="px-4 py-3 border-b border-outline-variant/40">
                  <p class="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Sumber Terkait</p>
                </div>
                <div class="divide-y divide-outline-variant/20">
                  <RouterLink
                    v-for="ta in linkedTechnical"
                    :key="ta.id"
                    :to="`/articles/${ta.id}`"
                    class="flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group border-l-2 border-transparent hover:border-primary"
                  >
                    <div class="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <span
                        class="material-symbols-outlined text-secondary"
                        style="font-size:16px;font-variation-settings:'FILL' 1"
                      >description</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs text-secondary font-semibold mb-0.5">{{ TYPE_LABEL[ta.article_type] }}</p>
                      <p class="text-sm font-medium text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {{ ta.title }}
                      </p>
                    </div>
                  </RouterLink>
                </div>
              </div>

              <!-- Linked Wawasan (for detail type) -->
              <div
                v-if="linkedWawasan && !isMain"
                class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden"
              >
                <div class="px-4 py-3 border-b border-outline-variant/40">
                  <p class="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Dasar Wawasan</p>
                </div>
                <RouterLink
                  :to="`/articles/${linkedWawasan.id}`"
                  class="flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group border-l-2 border-transparent hover:border-primary"
                >
                  <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span
                      class="material-symbols-outlined text-primary"
                      style="font-size:16px;font-variation-settings:'FILL' 1"
                    >menu_book</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs text-primary font-semibold mb-0.5">Wawasan</p>
                    <p class="text-sm font-medium text-on-surface leading-snug group-hover:text-primary transition-colors">
                      {{ linkedWawasan.title }}
                    </p>
                  </div>
                </RouterLink>
              </div>

              <!-- Penulis -->
              <div v-if="article.author" class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-4">
                <p class="text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-3">Penulis</p>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 border border-primary/20">
                    {{ authorName[0].toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-on-surface">
                      {{ authorName }}
                    </p>
                    <p class="text-xs text-on-surface-variant">{{ authorRoleLabel }}</p>
                  </div>
                </div>
              </div>

              <!-- Table of Contents -->
              <div
                v-if="sections.length > 1"
                class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden"
              >
                <div class="px-4 py-3 border-b border-outline-variant/40 flex items-center gap-2">
                  <span class="material-symbols-outlined text-on-surface-variant" style="font-size:15px">format_list_bulleted</span>
                  <p class="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Daftar Isi</p>
                </div>
                <nav class="p-3 space-y-0.5">
                  <a
                    v-for="(s, i) in sections"
                    :key="i"
                    :href="i === 0 ? '#section-intro' : `#section-${i}`"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <span class="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold flex-shrink-0 text-on-surface-variant">
                      {{ i + 1 }}
                    </span>
                    <span class="line-clamp-1">{{ s.title }}</span>
                  </a>
                  <a
                    v-if="articleSources.length"
                    href="#sources"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <span class="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span class="material-symbols-outlined" style="font-size:11px">library_books</span>
                    </span>
                    Referensi
                  </a>
                  <a
                    href="#discussion"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <span class="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span class="material-symbols-outlined" style="font-size:11px">forum</span>
                    </span>
                    Diskusi
                  </a>
                </nav>
              </div>

            </aside>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             LAYOUT B — TECHNICAL (prosedur / panduan / referensi / studi_kasus / troubleshooting)
        ═══════════════════════════════════════════════════════ -->
        <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          <!-- Breadcrumbs -->
          <nav class="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4 flex-wrap">
            <RouterLink to="/" class="hover:text-primary transition-colors">Beranda</RouterLink>
            <span class="material-symbols-outlined text-outline-variant" style="font-size:14px">chevron_right</span>
            <span v-if="article.category">{{ article.category.name }}</span>
            <span class="material-symbols-outlined text-outline-variant" style="font-size:14px">chevron_right</span>
            <span class="text-on-surface font-medium truncate max-w-[200px] sm:max-w-xs">{{ article.title }}</span>
          </nav>

          <!-- Sticky Progress Bar -->
          <div class="no-print sticky top-0 z-30 bg-background/95 backdrop-blur-sm -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-8 border-b border-outline-variant/30">
            <div class="flex items-center justify-between text-sm mb-1.5">
              <span class="font-semibold text-on-surface">
                Langkah {{ Math.min(activeStep + 1, sections.length) }} dari {{ sections.length }}
              </span>
              <span class="font-bold text-primary">{{ stepProgress }}%</span>
            </div>
            <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                :style="{ width: stepProgress + '%' }"
              />
            </div>
          </div>

          <!-- Article Header -->
          <header class="mb-8">
            <div class="flex flex-wrap items-center gap-2 mb-4">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                :class="TYPE_BADGE[article.article_type] || 'bg-surface-container text-on-surface-variant border-outline-variant'"
              >
                <span class="material-symbols-outlined" style="font-size:13px;font-variation-settings:'FILL' 1">
                  {{ TYPE_ICON[article.article_type] || 'article' }}
                </span>
                {{ TYPE_LABEL[article.article_type] || 'Artikel' }}
              </span>
              <span
                v-if="meta?.difficulty"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border"
                :class="DIFF_BADGE[meta.difficulty] || 'bg-surface-container text-on-surface-variant border-outline-variant'"
              >
                {{ DIFF_LABEL[meta.difficulty] || meta.difficulty }}
              </span>
              <span
                v-if="meta?.time"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant"
              >
                <span class="material-symbols-outlined" style="font-size:13px">schedule</span>
                {{ meta.time }} menit
              </span>
            </div>

            <h1 class="font-display text-2xl sm:text-3xl font-bold text-on-surface leading-tight mb-3">
              {{ article.title }}
            </h1>

            <!-- Wawasan back link -->
            <div v-if="linkedWawasan" class="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
              <span class="material-symbols-outlined" style="font-size:15px">menu_book</span>
              Berdasarkan wawasan:
              <RouterLink :to="`/articles/${linkedWawasan.id}`" class="text-primary hover:underline font-semibold">
                {{ linkedWawasan.title }}
              </RouterLink>
            </div>

            <p v-if="article.detail?.meta_description" class="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
              {{ article.detail.meta_description }}
            </p>
          </header>

          <!-- 12-col grid: steps (8) + sidebar (4) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

            <!-- ── Steps Column ── -->
            <div class="lg:col-span-8 space-y-5 article-main-col">

              <!-- Technical Specs Card -->
              <div v-if="hasTechSpec" class="rounded-2xl border border-outline-variant/40 overflow-hidden">
                <div class="px-5 py-3 bg-surface-container-low border-b border-outline-variant/40 flex items-center gap-2">
                  <span
                    class="material-symbols-outlined text-secondary"
                    style="font-size:17px;font-variation-settings:'FILL' 1"
                  >science</span>
                  <h2 class="text-sm font-bold text-on-surface">Spesifikasi Teknis</h2>
                </div>
                <div class="p-5 space-y-5">

                  <!-- Safety -->
                  <div
                    v-if="meta.safetyNotes"
                    class="flex gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 border-l-4 border-l-red-500 dark:border-l-red-500"
                  >
                    <span
                      class="material-symbols-outlined text-red-500 dark:text-red-400 flex-shrink-0"
                      style="font-size:20px;font-variation-settings:'FILL' 1"
                    >warning</span>
                    <div>
                      <p class="text-xs font-bold text-red-700 dark:text-red-300 mb-1">Keselamatan Kerja (K3)</p>
                      <p class="text-sm text-red-600 dark:text-red-400 leading-relaxed">{{ meta.safetyNotes }}</p>
                    </div>
                  </div>

                  <!-- Materials -->
                  <div v-if="meta.materials?.filter(m => m.name).length">
                    <p class="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 mb-3">
                      <span class="material-symbols-outlined" style="font-size:16px">eco</span>
                      Bahan yang Dibutuhkan
                    </p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div
                        v-for="m in meta.materials.filter(m => m.name)" :key="m.name"
                        class="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 hover:-translate-y-0.5 hover:shadow-sm transition-all"
                      >
                        <div class="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                          <span class="material-symbols-outlined" style="font-size:18px">{{ materialIcon(m.name) }}</span>
                        </div>
                        <div class="min-w-0">
                          <span v-if="m.quantity" class="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">{{ m.quantity }} {{ m.unit }}</span>
                          <span class="text-sm font-semibold text-on-surface block leading-snug">{{ m.name }}</span>
                          <span v-if="m.note" class="text-xs text-on-surface-variant italic">{{ m.note }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Tools -->
                  <div v-if="meta.tools?.filter(t => t.name).length">
                    <p class="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-secondary mb-3">
                      <span class="material-symbols-outlined" style="font-size:16px">build</span>
                      Alat yang Diperlukan
                    </p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div
                        v-for="t in meta.tools.filter(t => t.name)" :key="t.name"
                        class="flex items-start gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-secondary/30 hover:-translate-y-0.5 hover:shadow-sm transition-all"
                      >
                        <div class="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary flex-shrink-0">
                          <span class="material-symbols-outlined" style="font-size:18px">{{ toolIcon(t.name) }}</span>
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-on-surface leading-snug">{{ t.name }}</p>
                          <p v-if="t.spec" class="text-xs font-mono text-secondary">{{ t.spec }}</p>
                          <p v-if="t.purpose" class="text-xs text-on-surface-variant mt-0.5">{{ t.purpose }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Params + Quality -->
                  <div
                    v-if="meta.processParams || meta.qualityIndicators"
                    class="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div v-if="meta.processParams">
                      <p class="text-xs font-bold tracking-wider uppercase text-on-surface-variant mb-2">Parameter Proses</p>
                      <div class="rounded-xl border border-outline-variant/40 overflow-hidden divide-y divide-outline-variant/20">
                        <div
                          v-for="(v, k) in meta.processParams" :key="k"
                          class="flex justify-between gap-2 px-3 py-2.5 text-xs"
                        >
                          <span class="text-on-surface-variant capitalize">{{ k.replace(/_/g, ' ') }}</span>
                          <strong class="text-on-surface font-mono">
                            <template v-if="v.min !== undefined">{{ v.min }}–{{ v.max }}</template>
                            <template v-else-if="v.value !== undefined">{{ v.value }}</template>
                            <em v-if="v.unit" class="not-italic text-on-surface-variant"> {{ v.unit }}</em>
                          </strong>
                        </div>
                      </div>
                    </div>
                    <div v-if="meta.qualityIndicators">
                      <p class="text-xs font-bold tracking-wider uppercase text-on-surface-variant mb-2">Indikator Kualitas</p>
                      <div class="rounded-xl border border-outline-variant/40 overflow-hidden divide-y divide-outline-variant/20">
                        <div
                          v-for="(v, k) in meta.qualityIndicators" :key="k"
                          class="flex justify-between gap-2 px-3 py-2.5 text-xs"
                        >
                          <span class="text-on-surface-variant capitalize">{{ k.replace(/_/g, ' ') }}</span>
                          <strong class="text-on-surface font-mono">
                            <template v-if="v.min !== undefined">min {{ v.min }}</template>
                            <template v-else-if="v.max !== undefined">maks {{ v.max }}</template>
                            <template v-else-if="v.value !== undefined">{{ v.value }}</template>
                            <em v-if="v.unit" class="not-italic text-on-surface-variant"> {{ v.unit }}</em>
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── Step Cards ── -->
              <div
                v-for="(s, i) in sections"
                :key="i"
                :id="`step-${i}`"
                class="rounded-2xl border overflow-hidden transition-all duration-300"
                :class="{
                  'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm': getStepState(i) === 'completed',
                  'border-primary bg-surface-container-lowest shadow-lg shadow-primary/10':                          getStepState(i) === 'active',
                  'border-outline-variant/40 bg-surface-container-lowest opacity-60':                                getStepState(i) === 'upcoming',
                }"
              >
                <!-- Step Header -->
                <div
                  class="flex items-start gap-4 p-5 border-b cursor-pointer select-none"
                  :class="{
                    'border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-950/25': getStepState(i) === 'completed',
                    'border-primary/15 bg-primary/5':                                                           getStepState(i) === 'active',
                    'border-outline-variant/30':                                                                 getStepState(i) === 'upcoming',
                  }"
                  @click="jumpToStep(i)"
                >
                  <!-- Step circle -->
                  <div
                    class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                    :class="{
                      'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300': getStepState(i) === 'completed',
                      'bg-primary text-on-primary':                                                    getStepState(i) === 'active',
                      'bg-surface-container text-on-surface-variant':                                  getStepState(i) === 'upcoming',
                    }"
                  >
                    <span
                      v-if="getStepState(i) === 'completed'"
                      class="material-symbols-outlined"
                      style="font-size:18px;font-variation-settings:'FILL' 1"
                    >check</span>
                    <span v-else>{{ i + 1 }}</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="text-xs text-on-surface-variant">Langkah {{ i + 1 }}</span>
                      <!-- Active pulsing indicator -->
                      <span v-if="getStepState(i) === 'active'" class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                        <span class="relative inline-flex h-2 w-2 rounded-full bg-secondary"></span>
                      </span>
                      <!-- Completed badge -->
                      <span
                        v-if="getStepState(i) === 'completed'"
                        class="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"
                      >Selesai</span>
                    </div>
                    <h3
                      class="font-display text-base font-bold leading-snug"
                      :class="{
                        'text-emerald-800':         getStepState(i) === 'completed',
                        'text-on-surface':          getStepState(i) === 'active',
                        'text-on-surface-variant':  getStepState(i) === 'upcoming',
                      }"
                    >{{ s.title }}</h3>
                  </div>
                </div>

                <!-- Step Body -->
                <div class="p-5">
                  <!-- Upcoming lock notice -->
                  <div
                    v-if="getStepState(i) === 'upcoming'"
                    class="flex items-center gap-2 mb-4 p-3 rounded-lg bg-surface-container border border-outline-variant/40 text-sm text-on-surface-variant"
                  >
                    <span class="material-symbols-outlined flex-shrink-0" style="font-size:16px">lock</span>
                    Selesaikan langkah {{ i }} terlebih dahulu untuk membuka langkah ini.
                  </div>

                  <!-- Photo/video (only visible for non-upcoming) -->
                  <template v-if="getStepState(i) !== 'upcoming'">
                    <img
                      v-if="s.image_path"
                      :src="resolveAssetUrl(s.image_path)"
                      :alt="s.title"
                      class="w-full rounded-xl mb-4 border border-outline-variant/40 object-cover aspect-video"
                    />
                    <template v-if="s.video_path">
                      <iframe
                        v-if="isYT(s.video_path)"
                        class="w-full aspect-video rounded-xl mb-4 border border-outline-variant/40"
                        :src="ytEmbed(s.video_path)"
                        frameborder="0" allowfullscreen
                      />
                      <video
                        v-else
                        class="w-full rounded-xl mb-4 border border-outline-variant/40"
                        :src="resolveAssetUrl(s.video_path)"
                        controls
                      />
                    </template>
                  </template>

                  <!-- Section content (dimmed for upcoming) -->
                  <div :class="getStepState(i) === 'upcoming' ? 'opacity-40 pointer-events-none select-none' : ''">
                    <SectionRenderer :section="s" />
                  </div>

                  <!-- Action button row -->
                  <div class="no-print mt-5 flex items-center justify-end">
                    <button
                      v-if="getStepState(i) === 'active'"
                      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                      @click="markStepComplete(i)"
                    >
                      <span class="material-symbols-outlined" style="font-size:17px;font-variation-settings:'FILL' 1">check_circle</span>
                      Tandai Selesai
                    </button>
                    <span
                      v-else-if="getStepState(i) === 'completed'"
                      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-semibold cursor-default"
                    >
                      <span class="material-symbols-outlined" style="font-size:17px;font-variation-settings:'FILL' 1">check_circle</span>
                      Selesai
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant text-xs font-medium cursor-not-allowed border border-outline-variant/40"
                    >
                      <span class="material-symbols-outlined" style="font-size:15px">lock</span>
                      Prasyarat: Selesaikan langkah {{ i }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- References -->
              <section
                v-if="articleSources.length"
                class="rounded-2xl border border-outline-variant/40 p-5 bg-surface-container-low"
              >
                <h3 class="flex items-center gap-2 text-sm font-bold text-on-surface mb-4">
                  <span
                    class="material-symbols-outlined text-primary"
                    style="font-size:17px;font-variation-settings:'FILL' 1"
                  >library_books</span>
                  Referensi
                </h3>
                <ol class="space-y-2 pl-5 list-decimal">
                  <li v-for="src in articleSources" :key="src.title" class="text-sm text-on-surface-variant">
                    <a
                      :href="src.url || resolveAssetUrl(src.file_path)"
                      target="_blank" rel="noreferrer"
                      class="text-primary hover:underline"
                    >{{ src.title }}</a>
                  </li>
                </ol>
              </section>

              <!-- Discussion -->
              <section class="no-print rounded-2xl border border-outline-variant/40 p-5 bg-surface-container-low">
                <div class="flex items-center justify-between mb-5">
                  <h2 class="font-display text-lg font-bold text-on-surface">Diskusi</h2>
                  <RouterLink
                    v-if="authStore.isAuthenticated"
                    :to="`/articles/${article.id}/forum`"
                    class="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Forum
                    <span class="material-symbols-outlined" style="font-size:13px">arrow_forward</span>
                  </RouterLink>
                </div>
                <CommentComposer
                  :article-id="article.id"
                  :loading="articleStore.isSubmitting"
                  :placeholder="authStore.isAuthenticated ? 'Bagikan pendapat Anda…' : 'Login untuk berkomentar…'"
                  @submit="handleCommentSubmit"
                />
                <p v-if="commentNotice" class="mt-3 text-sm text-secondary bg-secondary/5 rounded-lg px-4 py-2.5 border border-secondary/10">
                  {{ commentNotice }}
                </p>
                <div class="mt-5 space-y-3">
                  <CommentItem
                    v-for="c in articleStore.comments"
                    :key="c.id"
                    :comment="c"
                    :article-id="article.id"
                    :loading="articleStore.isSubmitting"
                    @reply="handleCommentSubmit"
                    @delete="handleDeleteComment"
                  />
                  <p v-if="!articleStore.comments.length" class="text-center text-sm text-on-surface-variant py-6">
                    Belum ada komentar.
                  </p>
                </div>
              </section>

            </div>

            <!-- ── Right Sidebar (Technical) ── -->
            <aside class="no-print lg:col-span-4 space-y-5">

              <!-- Download CTA -->
              <button
                class="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20 disabled:opacity-60"
                :disabled="downloadingPdf"
                @click="printArticle"
              >
                <span class="material-symbols-outlined" style="font-size:19px">download</span>
                {{ downloadingPdf ? 'Menyiapkan PDF…' : 'Unduh Panduan PDF' }}
              </button>
              <p v-if="pdfError" class="text-xs text-red-500 text-center">{{ pdfError }}</p>

              <!-- Progress Summary -->
              <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-4">
                <p class="text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-3">Progres Belajar</p>
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="text-on-surface">{{ completedSteps.length }} dari {{ sections.length }} langkah</span>
                  <span class="font-bold text-primary">{{ stepProgress }}%</span>
                </div>
                <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full transition-all duration-500"
                    :style="{ width: stepProgress + '%' }"
                  />
                </div>
                <div
                  v-if="stepProgress === 100"
                  class="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2"
                >
                  <span class="material-symbols-outlined" style="font-size:14px;font-variation-settings:'FILL' 1">check_circle</span>
                  Semua langkah telah diselesaikan!
                </div>
                <button
                  v-if="completedSteps.length > 0"
                  type="button"
                  class="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-secondary transition-colors"
                  @click="resetSteps"
                >
                  <span class="material-symbols-outlined" style="font-size:14px">restart_alt</span>
                  Ulangi dari Awal
                </button>
              </div>

              <!-- Table of Contents -->
              <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden">
                <div class="px-4 py-3 border-b border-outline-variant/40 flex items-center gap-2">
                  <span class="material-symbols-outlined text-on-surface-variant" style="font-size:15px">list</span>
                  <p class="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Daftar Langkah</p>
                </div>
                <nav class="p-3 space-y-0.5">
                  <button
                    v-for="(s, i) in sections"
                    :key="i"
                    type="button"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left"
                    :class="{
                      'text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40': getStepState(i) === 'completed',
                      'text-primary font-semibold bg-primary/5':                 getStepState(i) === 'active',
                      'text-on-surface-variant hover:bg-surface-container':      getStepState(i) === 'upcoming',
                    }"
                    @click="jumpToStep(i)"
                  >
                    <span
                      class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors"
                      :class="{
                        'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300': getStepState(i) === 'completed',
                        'bg-primary text-on-primary':                                                    getStepState(i) === 'active',
                        'bg-surface-container text-on-surface-variant':                                  getStepState(i) === 'upcoming',
                      }"
                    >
                      <span
                        v-if="getStepState(i) === 'completed'"
                        class="material-symbols-outlined"
                        style="font-size:11px;font-variation-settings:'FILL' 1"
                      >check</span>
                      <span v-else>{{ i + 1 }}</span>
                    </span>
                    <span class="line-clamp-1 text-left">{{ s.title }}</span>
                  </button>
                </nav>
              </div>

              <!-- Resource Info -->
              <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden">
                <div class="px-4 py-3.5 bg-primary text-on-primary">
                  <p class="text-xs font-bold tracking-widest uppercase">Informasi Sumber</p>
                </div>
                <div class="divide-y divide-outline-variant/30">
                  <div class="flex items-start gap-3 px-4 py-3">
                    <span class="material-symbols-outlined text-outline-variant mt-0.5" style="font-size:15px">category</span>
                    <div>
                      <p class="text-xs text-on-surface-variant mb-0.5">Kategori</p>
                      <p class="text-sm font-semibold text-on-surface">{{ article.category?.name || 'Umum' }}</p>
                    </div>
                  </div>
                  <div v-if="meta?.difficulty" class="flex items-start gap-3 px-4 py-3">
                    <span class="material-symbols-outlined text-outline-variant mt-0.5" style="font-size:15px">signal_cellular_alt</span>
                    <div>
                      <p class="text-xs text-on-surface-variant mb-0.5">Tingkat Kesulitan</p>
                      <p class="text-sm font-semibold text-on-surface">{{ DIFF_LABEL[meta.difficulty] }}</p>
                    </div>
                  </div>
                  <div v-if="meta?.time" class="flex items-start gap-3 px-4 py-3">
                    <span class="material-symbols-outlined text-outline-variant mt-0.5" style="font-size:15px">schedule</span>
                    <div>
                      <p class="text-xs text-on-surface-variant mb-0.5">Estimasi Waktu</p>
                      <p class="text-sm font-semibold text-on-surface">{{ meta.time }} menit</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 px-4 py-3">
                    <span class="material-symbols-outlined text-outline-variant mt-0.5" style="font-size:15px">person</span>
                    <div>
                      <p class="text-xs text-on-surface-variant mb-0.5">Penulis</p>
                      <p class="text-sm font-semibold text-on-surface">
                        {{ authorName }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Lanjutkan Belajar (produk turunan artikel non-utama) -->
              <div
                v-if="!productCardGroups && productCards.length"
                class="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden"
              >
                <div class="px-4 py-3 border-b border-outline-variant/40">
                  <p class="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Lanjutkan Belajar</p>
                </div>
                <div class="divide-y divide-outline-variant/20">
                  <div v-for="pc in productCards" :key="pc.id" class="p-4">
                    <p class="text-sm font-semibold text-on-surface mb-1">{{ pc.title }}</p>
                    <p class="text-xs text-on-surface-variant mb-2 leading-relaxed">{{ pc.description }}</p>
                    <RouterLink
                      v-if="pc.linked_article?.id && pc.linked_article?.status === 'published'"
                      :to="`/articles/${pc.linked_article.id}`"
                      class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Buka artikel
                      <span class="material-symbols-outlined" style="font-size:12px">arrow_forward</span>
                    </RouterLink>
                    <span v-else class="text-xs text-on-surface-variant italic">Segera tersedia</span>
                  </div>
                </div>
              </div>

            </aside>
          </div>
        </div>

      </div>

      <SiteFooter />
    </div>
  </div>
</template>

<style scoped>
/* Prose styles for article body content — all colors use CSS vars to adapt light/dark */
.article-body :deep(p) {
  color: var(--inner-text);
  line-height: 1.85;
  margin-bottom: 1.1em;
  font-size: 0.95rem;
}
.article-body :deep(h2),
.article-body :deep(h3) {
  color: rgb(var(--color-primary));
  font-weight: 700;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  line-height: 1.3;
}
.article-body :deep(h2) { font-size: 1.2rem; }
.article-body :deep(h3) { font-size: 1rem; }
.article-body :deep(ul),
.article-body :deep(ol) {
  padding-left: 1.5em;
  margin-bottom: 1em;
  color: var(--inner-text);
  line-height: 1.8;
}
.article-body :deep(li) { margin-bottom: 0.35em; }
.article-body :deep(blockquote) {
  border-left: 3px solid rgb(var(--color-primary));
  padding: 0.5em 1em;
  color: var(--inner-muted);
  font-style: italic;
  margin: 1.2em 0;
  background: rgb(var(--color-surface-container));
  border-radius: 0 8px 8px 0;
}
.article-body :deep(code) {
  background: rgb(var(--color-primary) / 0.08);
  border-radius: 4px;
  padding: 0.15em 0.4em;
  font-size: 0.84em;
  color: rgb(var(--color-primary));
}
.article-body :deep(pre) {
  background: rgb(var(--color-surface-container));
  border-radius: 10px;
  padding: 1em;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid rgb(var(--color-outline-variant) / 0.5);
}
.article-body :deep(pre) :deep(code) {
  background: transparent;
  color: var(--inner-text);
  padding: 0;
}
.article-body :deep(img)   { max-width: 100%; border-radius: 10px; margin: 1em 0; }
.article-body :deep(a)     { color: rgb(var(--color-primary)); text-decoration: underline; text-underline-offset: 2px; }
.article-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.88rem;
}
.article-body :deep(th) {
  background: rgb(var(--color-surface-container-high));
  color: var(--inner-text);
  font-weight: 600;
  padding: 8px 12px;
  text-align: left;
  border: 1px solid rgb(var(--color-outline-variant) / 0.5);
}
.article-body :deep(td) {
  padding: 8px 12px;
  border: 1px solid rgb(var(--color-outline-variant) / 0.5);
  color: var(--inner-text);
}
.article-body :deep(tr:nth-child(even) td) { background: rgb(var(--color-surface-container-low)); }

/* ── Print styles ── */
@media print {
  .article-main-col {
    grid-column: 1 / -1 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* All step content visible in print regardless of progress state */
  .article-main-col [class*="opacity-40"] {
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  /* Article body text for print */
  .article-body :deep(p),
  .article-body :deep(li) { color: #1a1a1a !important; }
  .article-body :deep(h2),
  .article-body :deep(h3) { color: #1a4731 !important; }
  .article-body :deep(a)  { color: #1a4731 !important; }
  .article-body :deep(blockquote) {
    background: #f5f5f5 !important;
    color: #444 !important;
  }
  .article-body :deep(code) {
    background: #f0f0f0 !important;
    color: #333 !important;
  }
  .article-body :deep(pre) {
    background: #f0f0f0 !important;
    border: 1px solid #ccc !important;
  }
  .article-body :deep(th) {
    background: #e8e8e8 !important;
    color: #1a1a1a !important;
    border-color: #ccc !important;
  }
  .article-body :deep(td)           { color: #1a1a1a !important; border-color: #ccc !important; }
  .article-body :deep(tr:nth-child(even) td) { background: #f5f5f5 !important; }
}
</style>
