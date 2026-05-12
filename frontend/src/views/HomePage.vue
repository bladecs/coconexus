<script setup>
import { computed, onMounted, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useArticleStore } from '@/stores/articles';
import { resolveAssetUrl } from '@/lib/assets';
import { articleNeeds, sampleArticles } from '@/data/sampleArticles';

const articleStore = useArticleStore();

const filters = reactive({
  search: '',
  category: '',
  page: 1,
  limit: 6,
});

const categories = [
  {
    name: 'Batok Kelapa',
    description: 'Briket, arang aktif, asap cair, tepung tempurung, dan produk energi komunitas.',
    tone: 'orange',
  },
  {
    name: 'Serabut Kelapa',
    description: 'Cocopeat, cocofiber, cocomesh, tali serat, serta media tanam dan rehabilitasi lahan.',
    tone: 'green',
  },
  {
    name: 'Kulit Kelapa',
    description: 'Pewarna alami, mulsa organik, biomassa, pupuk cair, dan bahan kerajinan.',
    tone: 'blue',
  },
];

const heroProducts = [
  {
    title: 'Briket Batok',
    image:
      'https://images.unsplash.com/photo-1590246814883-57c511a1a0fd?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Cocopeat',
    image:
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Kerajinan Serat',
    image:
      'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Arang Aktif',
    image:
      'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=900&q=80',
  },
];

const publishedArticles = computed(() => articleStore.publishedArticles || []);
const hasRealArticles = computed(() => publishedArticles.value.length > 0);
const visibleArticles = computed(() => (hasRealArticles.value ? publishedArticles.value : sampleArticles));
const totalArticles = computed(() =>
  articleStore.publishedMeta.total_items || publishedArticles.value.length || sampleArticles.length
);

function getArticleExcerpt(article) {
  const source = article.summary || article?.detail?.meta_description || article?.detail?.body_content || '';
  return source.length > 170 ? `${source.slice(0, 170)}...` : source;
}

function getArticleImage(article) {
  const heroMedia = article?.media?.find((item) => item.media_type === 'image') || article?.media?.[0];
  return heroMedia?.media_type === 'image' ? resolveAssetUrl(heroMedia.file_path) : null;
}

async function loadPublishedArticles() {
  await articleStore.fetchPublishedArticles(filters);
}

async function applyFilters() {
  filters.page = 1;
  await loadPublishedArticles();
  document.querySelector('#articles')?.scrollIntoView({ behavior: 'smooth' });
}

async function filterCategory(category) {
  filters.category = category;
  filters.search = '';
  await applyFilters();
}

async function goToPage(page) {
  filters.page = page;
  await loadPublishedArticles();
}

onMounted(loadPublishedArticles);
</script>

<template>
  <main class="article-home">
    <SiteNavbar />

    <section class="hero-section">
      <div class="hero-mosaic" aria-label="Produk hasil pengolahan limbah kelapa">
        <figure
          v-for="product in heroProducts"
          :key="product.title"
          class="hero-panel"
          :style="{ backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.58)), url(${product.image})` }"
        >
          <figcaption>{{ product.title }}</figcaption>
        </figure>
      </div>

      <div class="hero-overlay">
        <p class="eyebrow">Knowledge Platform</p>
        <h1>COCONEXUS</h1>
        <p>
          Transformasi Strategis: Mengintegrasikan Keberlanjutan ke dalam Ekonomi Sirkular Kelapa.
        </p>
        <div class="hero-actions">
          <a href="#articles">Jelajahi artikel</a>
          <a href="#needs" class="ghost">Lihat kebutuhan web</a>
        </div>
      </div>
    </section>

    <section class="hero-bridge" aria-label="Ringkasan COCONEXUS">
      <div>
        <span>{{ totalArticles }} artikel</span>
        <span>3 kategori utama</span>
        <span>Diskusi komunitas</span>
      </div>
      <p>
        Jelajahi pengetahuan limbah kelapa dari pengolahan bahan mentah, produk turunan, sampai peluang ekonomi
        komunitas.
      </p>
    </section>

    <section id="categories" class="section-block">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Kategori</p>
          <h2>Topik utama yang dibutuhkan pembaca.</h2>
        </div>
        <p>
          Pilih kategori untuk melihat artikel yang sesuai dengan jenis limbah kelapa dan produk turunannya.
        </p>
      </div>

      <div class="category-grid">
        <article
          v-for="category in categories"
          :key="category.name"
          class="category-card"
          :class="`category-card--${category.tone}`"
        >
          <span></span>
          <h3>{{ category.name }}</h3>
          <p>{{ category.description }}</p>
          <button type="button" @click="filterCategory(category.name)">Filter artikel</button>
        </article>
      </div>
    </section>

    <section id="articles" class="section-block article-section">
      <div class="section-heading article-heading">
        <div>
          <p class="eyebrow">Artikel</p>
          <h2>Katalog pengetahuan COCONEXUS.</h2>
        </div>
        <p>
          {{ hasRealArticles ? `${totalArticles} artikel published tersedia.` : 'Menampilkan artikel contoh agar layout terlihat.' }}
        </p>
      </div>

      <form class="filter-panel" @submit.prevent="applyFilters">
        <label>
          <span>Cari artikel</span>
          <input v-model="filters.search" type="search" placeholder="Contoh: briket, cocopeat, asap cair" />
        </label>
        <label>
          <span>Kategori</span>
          <input v-model="filters.category" type="text" placeholder="Batok Kelapa" />
        </label>
        <button type="submit">Terapkan</button>
      </form>

      <div v-if="articleStore.isLoading" class="article-state">
        Memuat daftar artikel...
      </div>

      <div v-else class="article-list">
        <article
          v-for="(article, index) in visibleArticles"
          :key="article.id"
          class="story-card"
          :style="{ '--accent': article.accent || ['#ff7b33', '#c26939', '#a65328'][index % 3] }"
        >
          <div class="story-cover">
            <img v-if="getArticleImage(article)" :src="getArticleImage(article)" :alt="article.title" />
            <div v-else class="story-cover__fallback">
              <span>{{ article.category?.name || article.category || 'Artikel' }}</span>
            </div>
          </div>

          <div class="story-content">
            <p class="story-meta">
              {{ article.category?.name || article.category || 'Tanpa Kategori' }}
              <span>{{ article.readTime || `Versi ${article.version}` }}</span>
            </p>
            <h3>{{ article.title }}</h3>
            <p>{{ getArticleExcerpt(article) }}</p>

            <div class="story-tags">
              <span v-for="tag in article.tags || []" :key="tag">{{ tag }}</span>
            </div>

            <RouterLink v-if="hasRealArticles" :to="`/articles/${article.id}`">Baca detail</RouterLink>
            <span v-else class="sample-pill">Contoh layout</span>
          </div>
        </article>
      </div>

      <div v-if="hasRealArticles && articleStore.publishedMeta.total_pages > 1" class="pagination-row">
        <button type="button" :disabled="filters.page <= 1" @click="goToPage(filters.page - 1)">
          Sebelumnya
        </button>
        <span>Halaman {{ articleStore.publishedMeta.page }} dari {{ articleStore.publishedMeta.total_pages }}</span>
        <button
          type="button"
          :disabled="filters.page >= articleStore.publishedMeta.total_pages"
          @click="goToPage(filters.page + 1)"
        >
          Berikutnya
        </button>
      </div>
    </section>

    <section id="needs" class="section-block needs-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Analisis</p>
          <h2>Kebutuhan web artikel yang masih perlu ditambahkan.</h2>
        </div>
        <p>
          Catatan pengembangan berikutnya agar website artikel lebih siap dipakai sebagai platform pengetahuan.
        </p>
      </div>

      <div class="needs-grid">
        <article v-for="(need, index) in articleNeeds" :key="need" class="need-item">
          <strong>{{ String(index + 1).padStart(2, '0') }}</strong>
          <p>{{ need }}</p>
        </article>
      </div>
    </section>

    <SiteFooter />
  </main>
</template>

<style scoped>
.article-home {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(41, 41, 41, 0.9), rgba(31, 31, 31, 0.97)),
    url('@/assets/img/background.jpg') center top / cover fixed;
  color: #fff7f0;
}

.hero-section {
  position: relative;
  min-height: 720px;
  width: 100%;
  margin: 0;
  overflow: hidden;
  padding: 0;
}

.section-block {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(48, 48, 48, 0.94);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.34);
}

.hero-mosaic {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
}

.hero-panel {
  position: relative;
  min-width: 0;
  margin: 0;
  background-position: center;
  background-size: cover;
}

.hero-panel::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.2), transparent 22%, transparent 78%, rgba(0, 0, 0, 0.24));
  content: '';
}

.hero-panel figcaption {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(31, 31, 31, 0.62);
  color: #fff7f0;
  font-size: 0.78rem;
  font-weight: 900;
  padding: 9px 12px;
}

.hero-overlay {
  position: relative;
  z-index: 2;
  display: grid;
  min-height: 720px;
  place-content: center;
  padding: 160px 24px 96px;
  text-align: center;
}

.hero-bridge {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.72fr);
  align-items: center;
  gap: 28px;
  width: min(1440px, calc(100% - 48px));
  margin: clamp(28px, 5vw, 72px) auto 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(48, 48, 48, 0.94);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.24);
  padding: clamp(20px, 3vw, 32px);
}

.hero-bridge div {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-bridge span {
  border-radius: 999px;
  background: rgba(255, 123, 51, 0.14);
  color: #ffb083;
  font-size: 0.84rem;
  font-weight: 900;
  padding: 10px 14px;
}

.hero-bridge p {
  margin: 0;
  color: #d0c3ba;
  font-size: 0.98rem;
  line-height: 1.7;
}

.hero-overlay::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at center, rgba(0, 0, 0, 0.2), transparent 34%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.52), rgba(0, 0, 0, 0.16) 46%, rgba(0, 0, 0, 0.72));
  content: '';
}

.eyebrow {
  margin: 0 0 16px;
  color: #ffb083;
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.hero-overlay h1,
.section-heading h2 {
  margin: 0;
  max-width: 1180px;
  font-size: clamp(5rem, 12vw, 12rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 0.82;
}

.hero-overlay > p:not(.eyebrow) {
  max-width: 820px;
  margin: 32px auto 0;
  color: #d0c3ba;
  font-size: clamp(1rem, 2vw, 1.35rem);
  font-weight: 800;
  line-height: 1.55;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
  justify-content: center;
}

.hero-actions a,
.category-card button,
.filter-panel button,
.story-content a,
.pagination-row button {
  border: 0;
  border-radius: 8px;
  background: #ff7b33;
  color: #fff8ef;
  cursor: pointer;
  font-weight: 900;
  padding: 14px 18px;
  text-decoration: none;
}

.hero-actions .ghost {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(31, 31, 31, 0.45);
  color: #fff7f0;
}

.feature-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.feature-meta span,
.sample-pill,
.story-tags span {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.11);
  color: inherit;
  font-size: 0.78rem;
  font-weight: 900;
  padding: 8px 11px;
}

.section-block {
  width: min(1440px, calc(100% - 48px));
  margin: 0 auto 22px;
  padding: clamp(24px, 4vw, 44px);
}

.section-heading {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(340px, 0.42fr);
  gap: 32px;
  align-items: start;
  margin-bottom: 28px;
}

.section-heading .eyebrow {
  margin-bottom: 14px;
}

.section-heading h2 {
  max-width: 780px;
  font-size: clamp(2rem, 3.15vw, 3.35rem);
  line-height: 1.04;
}

.section-heading > p:last-child {
  margin: 0;
  color: #d0c3ba;
  padding-top: 34px;
  line-height: 1.7;
}

.category-grid,
.needs-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.category-card,
.need-item {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #383838;
  padding: 28px;
}

.category-card {
  display: grid;
  min-height: 275px;
  align-content: space-between;
}

.category-card::after {
  position: absolute;
  top: -38px;
  right: -34px;
  width: 148px;
  height: 148px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--card-accent, #ff7b33) 30%, transparent);
  content: '';
}

.category-card--orange {
  --card-accent: #ff7b33;
}

.category-card--green {
  --card-accent: #c26939;
}

.category-card--blue {
  --card-accent: #5b301f;
}

.category-card span {
  display: block;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: var(--card-accent, #ff7b33);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.22);
}

.category-card--green span {
  background: var(--card-accent);
}

.category-card--blue span {
  background: var(--card-accent);
}

.category-card h3 {
  margin: 24px 0 10px;
  font-size: clamp(1.35rem, 1.7vw, 1.75rem);
  font-weight: 950;
}

.category-card p,
.need-item p {
  color: #d0c3ba;
  line-height: 1.7;
}

.category-card button {
  margin-top: 14px;
  width: fit-content;
  background: rgba(255, 123, 51, 0.14);
  color: #fff7f0;
}

.filter-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 300px) auto;
  gap: 12px;
  margin-bottom: 14px;
}

.filter-panel label {
  display: grid;
  gap: 8px;
  color: #d0c3ba;
  font-size: 0.82rem;
  font-weight: 900;
}

.filter-panel input {
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #303030;
  color: #fff7f0;
  font: inherit;
  padding: 14px;
  outline: none;
}

.filter-panel input:focus {
  border-color: rgba(255, 123, 51, 0.55);
  box-shadow: 0 0 0 4px rgba(255, 123, 51, 0.16);
}

.filter-panel button {
  align-self: end;
}

.article-list {
  display: grid;
  gap: 14px;
}

.story-card {
  display: grid;
  grid-template-columns: minmax(230px, 340px) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #303030;
}

.story-cover {
  min-height: 260px;
  background: var(--accent);
}

.story-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-cover__fallback {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 260px;
  place-items: center;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.34)),
    url('@/assets/img/background.jpg') center / cover;
  color: #fff8ef;
}

.story-cover__fallback span {
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.34);
  font-weight: 950;
  padding: 10px 14px;
}

.story-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: clamp(22px, 4vw, 38px);
}

.story-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 12px;
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 950;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.story-meta span {
  color: #d0c3ba;
  letter-spacing: 0;
  text-transform: none;
}

.story-content h3 {
  max-width: 740px;
  margin: 0;
  color: #fff7f0;
  font-size: clamp(1.45rem, 2.35vw, 2.25rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.04;
}

.story-content > p:not(.story-meta) {
  max-width: 720px;
  margin: 16px 0 0;
  color: #d0c3ba;
  line-height: 1.75;
}

.story-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.story-tags span {
  background: rgba(255, 123, 51, 0.12);
  color: #ffb083;
}

.story-content a,
.sample-pill {
  align-self: flex-start;
  margin-top: 22px;
}

.sample-pill {
  background: rgba(255, 123, 51, 0.16);
  color: #ffb083;
}

.article-state {
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  color: #d0c3ba;
  font-weight: 850;
  padding: 28px;
  text-align: center;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 22px;
  color: #d0c3ba;
  font-weight: 850;
}

.pagination-row button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.need-item strong {
  color: #ffb083;
  font-size: 1.1rem;
}

.need-item p {
  margin: 16px 0 0;
}

@media (max-width: 940px) {
  .section-heading,
  .hero-bridge,
  .filter-panel,
  .story-card {
    grid-template-columns: 1fr;
  }

  .hero-section,
  .hero-overlay {
    min-height: 620px;
  }

  .hero-mosaic {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .category-grid,
  .needs-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .hero-section {
    width: 100%;
  }

  .section-block {
    width: calc(100% - 20px);
    padding: 22px;
  }

  .hero-overlay {
    padding-top: 240px;
  }

  .hero-overlay h1 {
    font-size: clamp(3.6rem, 18vw, 5.5rem);
  }
}
</style>
