<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useArticleStore } from '@/stores/articles';
import { useAuthStore } from '@/stores/auth';
import { useReadingHistoryStore } from '@/stores/readingHistory';
import { resolveAssetUrl } from '@/lib/assets';
import { sampleArticles } from '@/data/sampleArticles';
import api from '@/lib/api';

const articleStore        = useArticleStore();
const authStore           = useAuthStore();
const readingHistoryStore = useReadingHistoryStore();
const route = useRoute();

const filters = reactive({
  search: '',
  category: '',
  article_type: '',
  difficulty_level: '',
  tag: '',
  page: 1,
  limit: 9,
});

const availableTags = ref([]);

async function fetchTags() {
  try {
    const { data } = await api.get('/articles/tags/public');
    availableTags.value = data.data.tags || [];
  } catch {
    availableTags.value = [];
  }
}

const CATEGORIES = [
  { name: 'Batok Kelapa', icon: 'spa' },
  { name: 'Serabut Kelapa', icon: 'eco' },
  { name: 'Kulit Kelapa', icon: 'layers' },
];

const TYPE_FILTERS = [
  { value: '', label: 'Semua Tipe', icon: 'grid_view' },
  { value: 'main', label: 'Wawasan', icon: 'auto_stories' },
  { value: 'prosedur', label: 'Prosedur', icon: 'checklist' },
  { value: 'panduan', label: 'Panduan', icon: 'menu_book' },
  { value: 'referensi', label: 'Referensi', icon: 'library_books' },
  { value: 'studi_kasus', label: 'Studi Kasus', icon: 'science' },
  { value: 'troubleshooting', label: 'Troubleshoot', icon: 'build_circle' },
];

const DIFFICULTY_FILTERS = [
  { value: 'pemula',   label: 'Pemula',   cls: 'diff-pemula' },
  { value: 'menengah', label: 'Menengah', cls: 'diff-menengah' },
  { value: 'lanjutan', label: 'Lanjutan', cls: 'diff-lanjutan' },
];

const TECHNICAL_TYPES = new Set(['prosedur', 'panduan', 'referensi', 'studi_kasus', 'troubleshooting']);

const TYPE_LABEL = {
  main: 'Wawasan', detail: 'Wawasan',
  prosedur: 'Prosedur', panduan: 'Panduan',
  referensi: 'Referensi', studi_kasus: 'Studi Kasus',
  troubleshooting: 'Troubleshoot',
};

const TYPE_ICON = {
  main: 'auto_stories', detail: 'auto_stories',
  prosedur: 'checklist', panduan: 'menu_book',
  referensi: 'library_books', studi_kasus: 'science',
  troubleshooting: 'build_circle',
};

const publishedArticles = computed(() => articleStore.publishedArticles || []);
const hasRealArticles   = computed(() => publishedArticles.value.length > 0);
const visibleArticles   = computed(() => hasRealArticles.value ? publishedArticles.value : sampleArticles);
const totalArticles     = computed(() => articleStore.publishedMeta.total_items || publishedArticles.value.length || sampleArticles.length);
const totalPages        = computed(() => articleStore.publishedMeta.total_pages || 1);

const showDifficultyFilter = computed(() => TECHNICAL_TYPES.has(filters.article_type));
const hasActiveFilter      = computed(() => !!(filters.search || filters.category || filters.article_type || filters.difficulty_level || filters.tag));

const featuredArticle = computed(() =>
  hasRealArticles.value && !hasActiveFilter.value && filters.page === 1
    ? visibleArticles.value[0]
    : null
);
const gridArticles = computed(() =>
  featuredArticle.value ? visibleArticles.value.slice(1) : visibleArticles.value
);

function getExcerpt(article, max = 120) {
  const raw = article.summary || article?.detail?.meta_description || article?.detail?.body_content || '';
  const clean = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function getImage(article) {
  const m = article?.media?.find(i => i.media_type === 'image') || article?.media?.[0];
  return m?.media_type === 'image' ? resolveAssetUrl(m.file_path) : null;
}

function getReadTime(article) {
  const words = (article?.detail?.body_content || article?.summary || '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function authorInitial(article) {
  const name = article.author?.name || article.author?.username || article.user?.name || article.user?.username || 'T';
  return name[0].toUpperCase();
}

function authorName(article) {
  return article.author?.name || article.author?.username || article.user?.name || article.user?.username || 'Tim COCONEXUS';
}

async function load() {
  await articleStore.fetchPublishedArticles(filters);
}

async function applyFilters() {
  filters.page = 1;
  await load();
}

async function toggleCategory(name) {
  filters.category = filters.category === name ? '' : name;
  filters.page = 1;
  await load();
}

async function setType(type) {
  filters.article_type = type;
  if (!TECHNICAL_TYPES.has(type)) filters.difficulty_level = '';
  filters.page = 1;
  await load();
}

async function toggleDifficulty(level) {
  filters.difficulty_level = filters.difficulty_level === level ? '' : level;
  filters.page = 1;
  await load();
}

async function toggleTag(tag) {
  filters.tag = filters.tag === tag ? '' : tag;
  filters.page = 1;
  await load();
}

async function clearFilters() {
  filters.search = '';
  filters.category = '';
  filters.article_type = '';
  filters.difficulty_level = '';
  filters.tag = '';
  filters.page = 1;
  await load();
}

async function goToPage(page) {
  filters.page = page;
  await load();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  if (route.query.category) filters.category = String(route.query.category);
  if (route.query.article_type) filters.article_type = String(route.query.article_type);
  if (route.query.search) filters.search = String(route.query.search);
  if (route.query.tag) filters.tag = String(route.query.tag);
  fetchTags();
  load();
  if (authStore.isAuthenticated) readingHistoryStore.fetchReadIds();
});
</script>

<template>
  <SiteNavbar />

  <div class="md:ml-64 pt-14 md:pt-0 min-h-screen bg-background flex flex-col">

    <!-- Page header -->
    <div class="px-4 sm:px-6 pt-6 pb-4 border-b border-outline-variant/20">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary mb-1.5">
            <span class="material-symbols-outlined" style="font-size:14px">home</span>
            <RouterLink to="/" class="hover:underline">Beranda</RouterLink>
            <span class="text-outline-variant">/</span>
            <span class="text-on-surface-variant">Artikel</span>
          </div>
          <h1 class="text-2xl font-black text-on-surface">Basis Pengetahuan COCONEXUS</h1>
          <p class="text-sm text-on-surface-variant mt-0.5">
            Jelajahi prosedur teknis, wawasan ilmiah, dan panduan praktis pengolahan limbah kelapa.
          </p>
        </div>
        <div class="hidden sm:flex items-center gap-2 text-sm text-on-surface-variant flex-shrink-0 pt-1">
          <span class="material-symbols-outlined" style="font-size:16px">article</span>
          <span>{{ totalArticles }} artikel</span>
        </div>
      </div>
    </div>

    <div class="px-4 sm:px-6 mt-5 flex-1">

      <!-- Filter panel -->
      <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 mb-6 shadow-sm">

        <!-- Category chips -->
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            class="cat-chip"
            :class="!filters.category && 'cat-chip--active'"
            @click="toggleCategory('')"
          >
            <span class="material-symbols-outlined" style="font-size:14px">grid_view</span>
            Semua Topik
          </button>
          <button
            v-for="cat in CATEGORIES"
            :key="cat.name"
            class="cat-chip"
            :class="filters.category === cat.name && 'cat-chip--active'"
            @click="toggleCategory(cat.name)"
          >
            <span class="material-symbols-outlined" style="font-size:14px">{{ cat.icon }}</span>
            {{ cat.name }}
          </button>
        </div>

        <!-- Search + type chips -->
        <div class="flex flex-col sm:flex-row gap-3">
          <form class="relative flex-1 min-w-0" @submit.prevent="applyFilters">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style="font-size:18px">search</span>
            <input
              v-model="filters.search"
              type="search"
              placeholder="Cari artikel, prosedur, panduan…"
              class="w-full bg-background border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </form>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tf in TYPE_FILTERS"
              :key="tf.value"
              class="type-chip"
              :class="filters.article_type === tf.value && 'type-chip--active'"
              @click="setType(tf.value)"
            >
              <span class="material-symbols-outlined" style="font-size:13px">{{ tf.icon }}</span>
              {{ tf.label }}
            </button>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="availableTags.length" class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-outline-variant/20">
          <span class="flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
            <span class="material-symbols-outlined" style="font-size:14px">label</span>
            Tag:
          </span>
          <button
            v-for="tag in availableTags"
            :key="tag.id"
            class="tag-chip"
            :class="filters.tag === tag.name && 'tag-chip--active'"
            @click="toggleTag(tag.name)"
          >{{ tag.name }}</button>
        </div>

        <!-- Difficulty + clear -->
        <div
          v-if="showDifficultyFilter || hasActiveFilter"
          class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-outline-variant/20"
        >
          <template v-if="showDifficultyFilter">
            <span class="text-xs font-semibold text-on-surface-variant">Kesulitan:</span>
            <button
              v-for="df in DIFFICULTY_FILTERS"
              :key="df.value"
              class="diff-chip"
              :class="[df.cls, filters.difficulty_level === df.value && 'diff-chip--active']"
              @click="toggleDifficulty(df.value)"
            >{{ df.label }}</button>
          </template>
          <button
            v-if="hasActiveFilter"
            class="ml-auto flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
            @click="clearFilters"
          >
            <span class="material-symbols-outlined" style="font-size:14px">close</span>
            Hapus Filter
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="articleStore.isLoading" class="flex flex-col items-center justify-center py-24 gap-3 text-on-surface-variant">
        <div class="w-10 h-10 rounded-full border-4 border-outline-variant border-t-primary animate-spin"></div>
        <p class="text-sm">Memuat artikel…</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!visibleArticles.length" class="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
        <span class="material-symbols-outlined text-6xl text-outline-variant">search_off</span>
        <p class="text-sm font-medium">Tidak ada artikel yang cocok.</p>
        <button class="text-sm text-primary font-semibold hover:underline" @click="clearFilters">Hapus semua filter</button>
      </div>

      <div v-else>

        <!-- Featured article -->
        <RouterLink
          v-if="featuredArticle && hasRealArticles"
          :to="`/articles/${featuredArticle.id}`"
          class="featured-card group"
        >
          <!-- Image side -->
          <div class="featured-img">
            <img
              v-if="getImage(featuredArticle)"
              :src="getImage(featuredArticle)"
              :alt="featuredArticle.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div v-else class="no-img-placeholder">
              <span class="material-symbols-outlined" style="font-size:72px; color:rgba(255,255,255,0.2)">
                {{ TYPE_ICON[featuredArticle.article_type] || 'article' }}
              </span>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            <div class="absolute top-4 left-4 flex gap-2 flex-wrap">
              <span v-if="featuredArticle.category?.name" class="img-badge bg-secondary text-on-secondary">
                {{ featuredArticle.category.name }}
              </span>
              <span v-if="TYPE_LABEL[featuredArticle.article_type]" class="img-badge glass-badge">
                <span class="material-symbols-outlined" style="font-size:11px">{{ TYPE_ICON[featuredArticle.article_type] }}</span>
                {{ TYPE_LABEL[featuredArticle.article_type] }}
              </span>
            </div>
            <div class="absolute top-4 right-4">
              <span class="img-badge bg-primary text-on-primary">
                <span class="material-symbols-outlined" style="font-size:11px">star</span>
                Unggulan
              </span>
            </div>
          </div>

          <!-- Content side -->
          <div class="featured-body">
            <p class="text-xs font-bold tracking-widest uppercase text-secondary mb-2">Artikel Terbaru</p>
            <h2 class="text-2xl sm:text-3xl font-black text-on-surface leading-tight mb-3 line-clamp-3 group-hover:text-primary transition-colors">
              {{ featuredArticle.title }}
            </h2>
            <p class="text-sm text-on-surface-variant leading-relaxed mb-5 line-clamp-4">
              {{ getExcerpt(featuredArticle, 220) }}
            </p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant mt-auto">
              <span class="flex items-center gap-1.5">
                <span class="author-avatar">{{ authorInitial(featuredArticle) }}</span>
                {{ authorName(featuredArticle) }}
              </span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined" style="font-size:13px">calendar_today</span>
                {{ formatDate(featuredArticle.published_at || featuredArticle.created_at) }}
              </span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined" style="font-size:13px">timer</span>
                {{ getReadTime(featuredArticle) }} mnt
              </span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined" style="font-size:13px">visibility</span>
                {{ featuredArticle.view_count || 0 }}
              </span>
            </div>
            <div class="mt-5">
              <span class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-md group-hover:shadow-lg transition-shadow">
                Baca Artikel
                <span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span>
              </span>
            </div>
          </div>
        </RouterLink>

        <!-- Article grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
          <component
            :is="hasRealArticles ? RouterLink : 'div'"
            v-for="article in gridArticles"
            :key="article.id"
            :to="hasRealArticles ? `/articles/${article.id}` : undefined"
            class="article-card group"
          >
            <!-- Thumbnail -->
            <div class="card-img">
              <img
                v-if="getImage(article)"
                :src="getImage(article)"
                :alt="article.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="no-img-placeholder">
                <span class="material-symbols-outlined" style="font-size:48px; color:rgba(255,255,255,0.2)">
                  {{ TYPE_ICON[article.article_type] || 'article' }}
                </span>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <div class="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                <span v-if="article.category?.name" class="img-badge bg-secondary/90 text-on-secondary">
                  {{ article.category.name }}
                </span>
                <span v-if="article.article_type && TYPE_LABEL[article.article_type]" class="img-badge glass-badge">
                  {{ TYPE_LABEL[article.article_type] }}
                </span>
              </div>
              <div class="absolute top-3 right-3 flex gap-1.5">
                <span
                  v-if="hasRealArticles && readingHistoryStore.isRead(article.id)"
                  class="img-badge"
                  style="background:rgba(16,185,129,0.85);color:#fff"
                >
                  <span class="material-symbols-outlined" style="font-size:11px;font-variation-settings:'FILL' 1">check_circle</span>
                  Dibaca
                </span>
                <span v-if="!hasRealArticles" class="img-badge" style="background:rgba(255,255,255,0.15);color:#fff">Contoh</span>
              </div>
            </div>

            <!-- Card body -->
            <div class="card-body">
              <div v-if="article.detail?.difficulty_level" class="mb-2">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300': article.detail.difficulty_level === 'pemula',
                    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300': article.detail.difficulty_level === 'menengah',
                    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300': article.detail.difficulty_level === 'lanjutan',
                  }"
                >{{ article.detail.difficulty_level }}</span>
              </div>
              <h3 class="font-bold text-on-surface text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {{ article.title }}
              </h3>
              <p class="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-4 flex-1">
                {{ getExcerpt(article, 100) }}
              </p>
              <div class="flex items-center justify-between pt-3 border-t border-outline-variant/20 mt-auto">
                <div class="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span class="author-avatar text-[10px]">{{ authorInitial(article) }}</span>
                  <span class="truncate max-w-[90px]">{{ authorName(article) }}</span>
                </div>
                <div class="flex items-center gap-3 text-xs text-on-surface-variant">
                  <span class="flex items-center gap-0.5">
                    <span class="material-symbols-outlined" style="font-size:12px">timer</span>
                    {{ getReadTime(article) }}m
                  </span>
                  <span class="flex items-center gap-0.5">
                    <span class="material-symbols-outlined" style="font-size:12px">visibility</span>
                    {{ article.view_count || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </component>
        </div>

        <!-- Pagination -->
        <div
          v-if="hasRealArticles && totalPages > 1"
          class="flex justify-center items-center mt-10 mb-4 gap-1.5"
        >
          <button class="page-btn" :disabled="filters.page <= 1" @click="goToPage(filters.page - 1)">
            <span class="material-symbols-outlined" style="font-size:18px">chevron_left</span>
          </button>
          <template v-for="p in totalPages" :key="p">
            <button
              v-if="p <= 2 || p === totalPages || Math.abs(p - filters.page) <= 1"
              class="page-btn"
              :class="p === filters.page && 'page-btn--active'"
              @click="goToPage(p)"
            >{{ p }}</button>
            <span
              v-else-if="p === 3 && filters.page > 4"
              class="text-on-surface-variant px-1 text-sm select-none"
            >…</span>
          </template>
          <button class="page-btn" :disabled="filters.page >= totalPages" @click="goToPage(filters.page + 1)">
            <span class="material-symbols-outlined" style="font-size:18px">chevron_right</span>
          </button>
        </div>

      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
/* ── Category chips ── */
.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  border: 1.5px solid rgb(var(--color-outline-variant) / 0.5);
  background: transparent;
  color: rgb(var(--color-on-surface-variant));
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.cat-chip:hover {
  border-color: rgb(var(--color-primary) / 0.4);
  color: rgb(var(--color-primary));
  background: rgb(var(--color-primary) / 0.05);
}
.cat-chip--active {
  background: rgb(var(--color-primary));
  color: rgb(var(--color-on-primary));
  border-color: rgb(var(--color-primary));
}

/* ── Type chips ── */
.type-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  border: 1.5px solid rgb(var(--color-outline-variant) / 0.5);
  background: transparent;
  color: rgb(var(--color-on-surface-variant));
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.type-chip:hover {
  border-color: rgb(var(--color-secondary) / 0.4);
  color: rgb(var(--color-secondary));
  background: rgb(var(--color-secondary) / 0.05);
}
.type-chip--active {
  background: rgb(var(--color-secondary));
  color: rgb(var(--color-on-secondary));
  border-color: rgb(var(--color-secondary));
}

/* ── Difficulty chips ── */
.diff-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  border: 1.5px solid rgb(var(--color-outline-variant) / 0.4);
  background: transparent;
  color: rgb(var(--color-on-surface-variant));
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.diff-pemula.diff-chip--active   { background: rgb(var(--color-primary) / 0.12); color: rgb(var(--color-primary)); border-color: rgb(var(--color-primary) / 0.35); }
.diff-menengah.diff-chip--active { background: rgb(var(--color-secondary) / 0.12); color: rgb(var(--color-secondary)); border-color: rgb(var(--color-secondary) / 0.35); }
.diff-lanjutan.diff-chip--active { background: rgb(var(--color-error) / 0.12); color: rgb(var(--color-error)); border-color: rgb(var(--color-error) / 0.35); }

/* ── Tag chips ── */
.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgb(var(--color-outline-variant) / 0.5);
  background: rgb(var(--color-surface-container));
  color: rgb(var(--color-on-surface-variant));
  cursor: pointer;
  transition: all 0.15s;
}
.tag-chip:hover {
  background: rgb(var(--color-primary) / 0.08);
  color: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary) / 0.3);
}
.tag-chip--active {
  background: rgb(var(--color-secondary-container));
  color: rgb(var(--color-on-secondary-container));
  border-color: rgb(var(--color-secondary) / 0.4);
  font-weight: 700;
}

/* ── Image badge ── */
.img-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
}
.glass-badge {
  background: rgba(255,255,255,0.2);
  color: #fff;
  backdrop-filter: blur(4px);
}

/* ── Author avatar ── */
.author-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 9999px;
  background: rgb(var(--color-primary) / 0.1);
  color: rgb(var(--color-primary));
  font-size: 0.6875rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* ── Featured card ── */
.featured-card {
  display: grid;
  grid-template-columns: 1fr;
  border-radius: 1.25rem;
  overflow: hidden;
  border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-lowest));
  box-shadow: 0 4px 24px rgb(0 0 0 / 0.06);
  text-decoration: none;
  transition: box-shadow 0.25s, transform 0.25s;
}
.featured-card:hover {
  box-shadow: 0 8px 40px rgb(0 0 0 / 0.12);
  transform: translateY(-2px);
}
@media (min-width: 768px) {
  .featured-card { grid-template-columns: 1fr 1fr; min-height: 340px; }
}
.featured-img {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: linear-gradient(135deg, #003527, #005c41);
}
@media (min-width: 768px) {
  .featured-img { aspect-ratio: unset; min-height: 340px; }
}
.featured-body {
  display: flex;
  flex-direction: column;
  padding: 1.75rem;
}

/* ── Article card ── */
.article-card {
  display: flex;
  flex-direction: column;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-lowest));
  box-shadow: 0 2px 12px rgb(0 0 0 / 0.05);
  text-decoration: none;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}
.article-card:hover {
  box-shadow: 0 6px 28px rgb(0 0 0 / 0.1);
  transform: translateY(-3px);
  border-color: rgb(var(--color-primary) / 0.25);
}
.card-img {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  flex-shrink: 0;
}
.card-body {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  flex: 1;
}

/* ── No-image placeholder ── */
.no-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #003527 0%, #005c41 100%);
}

/* ── Pagination ── */
.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  border-radius: 0.625rem;
  border: 1.5px solid rgb(var(--color-outline-variant) / 0.5);
  background: rgb(var(--color-surface-container-lowest));
  color: rgb(var(--color-on-surface-variant));
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.page-btn:hover:not(:disabled) {
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary));
  background: rgb(var(--color-primary) / 0.05);
}
.page-btn--active {
  background: rgb(var(--color-primary));
  color: rgb(var(--color-on-primary));
  border-color: rgb(var(--color-primary));
  box-shadow: 0 2px 8px rgb(var(--color-primary) / 0.3);
}
.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
