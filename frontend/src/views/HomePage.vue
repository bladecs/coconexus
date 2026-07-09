<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useArticleStore } from '@/stores/articles';
import { resolveAssetUrl } from '@/lib/assets';
import { sampleArticles } from '@/data/sampleArticles';

const articleStore = useArticleStore();
const router = useRouter();

const searchQuery = ref('');

const QUICK_LINKS = [
  {
    label: 'Glosarium Istilah',
    desc: 'Kamus terminologi teknis pengolahan limbah kelapa.',
    icon: 'menu_book',
    to: '/glosarium',
    cls: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400',
  },
  {
    label: 'Forum Diskusi',
    desc: 'Tanya jawab dan diskusi antar praktisi dan peneliti.',
    icon: 'forum',
    to: '/forum',
    cls: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/50 text-violet-700 dark:text-violet-400',
  },
  {
    label: 'Prosedur Teknis',
    desc: 'Panduan langkah demi langkah untuk produksi dan pengolahan.',
    icon: 'checklist',
    to: '/articles?article_type=prosedur',
    cls: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50 text-teal-700 dark:text-teal-400',
  },
  {
    label: 'Studi Kasus',
    desc: 'Kisah nyata penerapan teknologi pengolahan di lapangan.',
    icon: 'science',
    to: '/articles?article_type=studi_kasus',
    cls: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400',
  },
];

const publishedArticles = computed(() => articleStore.publishedArticles || []);
const totalArticles     = computed(() =>
  articleStore.publishedMeta.total_items || publishedArticles.value.length || sampleArticles.length
);
const featuredMainArticles = computed(() => articleStore.featuredMainArticles || []);

function getImage(article) {
  const m = article?.media?.find(i => i.media_type === 'image') || article?.media?.[0];
  return m?.media_type === 'image' ? resolveAssetUrl(m.file_path) : null;
}

function getExcerpt(article) {
  const raw = article.summary || article?.detail?.meta_description || article?.detail?.body_content || '';
  const clean = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > 110 ? `${clean.slice(0, 110)}…` : clean;
}

function getProductPreview(article) {
  const cards = Array.isArray(article?.product_cards) ? article.product_cards : [];
  const names = cards.slice(0, 3).map((card) => card.title);
  const extra = cards.length - names.length;
  return extra > 0 ? `${names.join(', ')}, +${extra} lainnya` : names.join(', ');
}

function handleSearch() {
  const q = searchQuery.value.trim();
  if (q) router.push(`/articles?search=${encodeURIComponent(q)}`);
  else router.push('/articles');
}

onMounted(() => {
  articleStore.fetchPublishedArticles({ page: 1, limit: 6 });
  articleStore.fetchFeaturedMainArticles();
});
</script>

<template>
  <SiteNavbar />

  <div class="md:ml-64 pt-14 md:pt-0 min-h-screen bg-background flex flex-col">

    <!-- ── Hero / Welcome ── -->
    <section class="relative overflow-hidden"
      style="background: linear-gradient(135deg, #002a1f 0%, #003d2d 55%, #004d38 100%)">
      <div class="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
        style="background: radial-gradient(circle, rgba(149,211,186,0.08), transparent 70%)"></div>
      <div class="absolute -bottom-10 -left-10 w-52 h-52 rounded-full pointer-events-none"
        style="background: radial-gradient(circle, rgba(149,211,186,0.05), transparent 70%)"></div>

      <div class="relative z-10 px-6 sm:px-10 py-9 flex flex-col lg:flex-row gap-8 items-start lg:items-center">

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style="background:rgba(149,211,186,0.15); color:#95d3ba; border:1px solid rgba(149,211,186,0.25)">
            <span class="material-symbols-outlined" style="font-size:13px">eco</span>
            Platform Manajemen Pengetahuan
          </span>
          <h1 class="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
            Selamat Datang di <br class="hidden sm:block">COCONEXUS
          </h1>
          <p class="text-sm leading-relaxed mb-5 max-w-md" style="color:rgba(176,240,214,0.75)">
            Temukan prosedur teknis, panduan ilmiah, dan studi kasus pengolahan limbah kelapa secara terpadu.
          </p>

          <!-- Search bar -->
          <form class="flex gap-2 max-w-lg" @submit.prevent="handleSearch">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style="font-size:18px; color:rgba(255,255,255,0.45)">search</span>
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Cari artikel, prosedur, panduan…"
                class="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); color:#fff; caret-color:#95d3ba"
              />
            </div>
            <button type="submit"
              class="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
              style="background:#95d3ba; color:#002a1f">
              Cari
            </button>
          </form>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 lg:grid-cols-1 gap-2 w-full lg:w-auto">
          <div class="hero-stat">
            <span class="material-symbols-outlined hero-stat__icon">article</span>
            <div>
              <p class="hero-stat__value">{{ totalArticles }}</p>
              <p class="hero-stat__label">Artikel</p>
            </div>
          </div>
          <div class="hero-stat">
            <span class="material-symbols-outlined hero-stat__icon">category</span>
            <div>
              <p class="hero-stat__value">3</p>
              <p class="hero-stat__label">Kategori</p>
            </div>
          </div>
          <RouterLink to="/forum" class="hero-stat hover:border-[rgba(149,211,186,0.4)] transition-colors">
            <span class="material-symbols-outlined hero-stat__icon">forum</span>
            <div>
              <p class="hero-stat__value">Forum</p>
              <p class="hero-stat__label">Diskusi</p>
            </div>
          </RouterLink>
        </div>

      </div>
    </section>

    <div class="px-4 sm:px-6 mt-7 flex-1 flex flex-col gap-8">

      <!-- ── 3 Artikel Utama ── -->
      <section>
        <div class="flex items-end justify-between mb-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Pengetahuan Dasar</p>
            <h2 class="text-xl font-black text-on-surface">3 Artikel Utama Limbah Kelapa</h2>
          </div>
          <RouterLink to="/articles" class="text-sm font-semibold text-primary hover:underline hidden sm:flex items-center gap-1">
            Lihat semua
            <span class="material-symbols-outlined" style="font-size:15px">arrow_forward</span>
          </RouterLink>
        </div>

        <!-- Loading -->
        <div v-if="articleStore.isLoading && !featuredMainArticles.length" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="rounded-2xl overflow-hidden border border-outline-variant/20 bg-surface-container-lowest animate-pulse">
            <div class="aspect-video bg-outline-variant/20"></div>
            <div class="p-4 space-y-2">
              <div class="h-3 bg-outline-variant/20 rounded w-1/3"></div>
              <div class="h-4 bg-outline-variant/20 rounded w-full"></div>
              <div class="h-4 bg-outline-variant/20 rounded w-3/4"></div>
            </div>
          </div>
        </div>

        <p v-else-if="!featuredMainArticles.length" class="text-sm text-on-surface-variant">
          Belum ada artikel utama yang ditampilkan.
        </p>

        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RouterLink
            v-for="article in featuredMainArticles"
            :key="article.id"
            :to="`/articles/${article.id}`"
            class="group flex flex-col rounded-2xl overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/20"
          >
            <!-- Thumbnail -->
            <div class="relative aspect-video overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#003527] to-[#005c41]">
              <img
                v-if="getImage(article)"
                :src="getImage(article)"
                :alt="article.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="material-symbols-outlined" style="font-size:40px; color:rgba(255,255,255,0.2)">article</span>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div class="absolute bottom-2 left-2">
                <span v-if="article.category?.name" class="inline-flex text-xs font-bold px-2 py-0.5 rounded-full bg-secondary/90 text-on-secondary">
                  {{ article.category.name }}
                </span>
              </div>
            </div>

            <!-- Card body -->
            <div class="flex flex-col flex-1 p-4">
              <h3 class="font-bold text-sm text-on-surface leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {{ article.title }}
              </h3>
              <p class="text-xs text-on-surface-variant leading-relaxed line-clamp-2 flex-1">
                {{ getExcerpt(article) }}
              </p>
              <div v-if="getProductPreview(article)" class="mt-3 pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined" style="font-size:12px">eco</span>
                  <span class="truncate">{{ getProductPreview(article) }}</span>
                </span>
              </div>
            </div>
          </RouterLink>
        </div>
      </section>

      <!-- ── Akses Cepat ── -->
      <section class="pb-2">
        <div class="mb-4">
          <p class="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Navigasi Cepat</p>
          <h2 class="text-xl font-black text-on-surface">Akses langsung ke fitur utama</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <RouterLink
            v-for="link in QUICK_LINKS"
            :key="link.label"
            :to="link.to"
            class="group flex items-start gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md"
            :class="link.cls"
          >
            <span class="material-symbols-outlined text-2xl flex-shrink-0 mt-0.5"
              style="font-variation-settings:'FILL' 1,'wght' 400">{{ link.icon }}</span>
            <div class="min-w-0">
              <p class="font-bold text-sm text-on-surface leading-tight mb-1 group-hover:underline">{{ link.label }}</p>
              <p class="text-xs text-on-surface-variant leading-snug">{{ link.desc }}</p>
            </div>
          </RouterLink>
        </div>
      </section>

    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.hero-stat {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.875rem;
  border: 1px solid rgba(149, 211, 186, 0.2);
  background: rgba(255, 255, 255, 0.06);
  text-decoration: none;
}
.hero-stat__icon {
  font-size: 1.25rem;
  color: #95d3ba;
  flex-shrink: 0;
  font-variation-settings: 'FILL' 1, 'wght' 400;
}
.hero-stat__value {
  font-size: 1rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
}
.hero-stat__label {
  font-size: 0.6875rem;
  color: rgba(176, 240, 214, 0.65);
}

input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}
</style>
