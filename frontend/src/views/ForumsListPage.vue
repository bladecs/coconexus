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
  if (!t) return '';
  return `${t} forum aktif`;
});

function load(page = 1) {
  forumStore.fetchForums({ search: search.value || undefined, page, limit: 12 });
}

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => load(1), 350);
});

onMounted(() => load(1));

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const ARTICLE_TYPE_LABEL = {
  main: 'Wawasan',
  detail: 'Detail',
  prosedur: 'Prosedur',
  panduan: 'Panduan',
  referensi: 'Referensi',
  studi_kasus: 'Studi Kasus',
  troubleshooting: 'Troubleshooting',
};
</script>

<template>
  <div class="flist-page">
    <SiteNavbar variant="home" />
    <div class="md:ml-64 pt-14 md:pt-0">
    <div class="flist-shell">
      <!-- Header -->
      <header class="flist-header">
        <p class="eyebrow">Komunitas</p>
        <h1>Forum Diskusi</h1>
        <p class="flist-header__sub">
          Ruang diskusi terstruktur yang dikurasi moderator dari komentar-komentar paling relevan.
        </p>
      </header>

      <!-- Toolbar -->
      <div class="flist-toolbar">
        <div class="flist-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input v-model="search" type="text" placeholder="Cari forum diskusi..." />
        </div>
        <p v-if="totalLabel" class="flist-total">{{ totalLabel }}</p>
      </div>

      <!-- Loading -->
      <div v-if="forumStore.isLoading" class="flist-state">Memuat forum diskusi...</div>

      <!-- Empty -->
      <div v-else-if="!forumStore.forums.length" class="flist-state flist-state--empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>Belum ada forum diskusi aktif{{ search ? ' untuk pencarian ini' : '' }}.</p>
      </div>

      <!-- Grid -->
      <div v-else class="flist-grid">
        <RouterLink
          v-for="forum in forumStore.forums"
          :key="forum.id"
          :to="`/articles/${forum.article_id}/forum`"
          class="forum-card"
        >
          <!-- Top row -->
          <div class="forum-card__top">
            <span class="forum-card__badge">Forum Aktif</span>
            <span v-if="forum.article?.article_type" class="forum-card__type">
              {{ ARTICLE_TYPE_LABEL[forum.article.article_type] || forum.article.article_type }}
            </span>
          </div>

          <!-- Title -->
          <h2 class="forum-card__title">{{ forum.title }}</h2>

          <!-- Summary -->
          <p v-if="forum.summary" class="forum-card__summary">{{ forum.summary }}</p>

          <!-- Article source -->
          <p v-if="forum.article" class="forum-card__article">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            {{ forum.article.title }}
          </p>

          <!-- Meta row -->
          <div class="forum-card__meta">
            <span class="forum-card__meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ forum.comments_count || 0 }} komentar
            </span>
            <span class="forum-card__meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ formatDate(forum.validated_at) }}
            </span>
          </div>

          <!-- Arrow -->
          <div class="forum-card__arrow">
            Masuk ke forum
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </RouterLink>
      </div>

      <!-- Pagination -->
      <div v-if="forumStore.meta.total_pages > 1" class="flist-pagination">
        <button :disabled="forumStore.meta.page <= 1" @click="load(forumStore.meta.page - 1)">
          ← Sebelumnya
        </button>
        <span>{{ forumStore.meta.page }} / {{ forumStore.meta.total_pages }}</span>
        <button :disabled="forumStore.meta.page >= forumStore.meta.total_pages" @click="load(forumStore.meta.page + 1)">
          Berikutnya →
        </button>
      </div>
    </div>

    <SiteFooter />
    </div>
  </div>
</template>

<style scoped>
.flist-page { min-height: 100vh; }

.flist-shell {
  width: min(1100px, calc(100% - 48px));
  margin: 0 auto;
  padding: 40px 0 70px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #944a23;
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/* ── Header ── */
.flist-header { margin-bottom: 36px; }

.flist-header h1 {
  margin: 0 0 10px;
  font-size: clamp(2.2rem, 4vw, 3.6rem);
  font-weight: 950;
  line-height: 1.05;
  color: #0d1c2e;
}

.flist-header__sub {
  margin: 0;
  color: #404944;
  font-size: 0.95rem;
  line-height: 1.7;
  max-width: 560px;
}

/* ── Toolbar ── */
.flist-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.flist-search {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 240px;
  max-width: 400px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 14px;
  transition: border-color 0.2s;
}

.flist-search:focus-within { border-color: #003527; }

.flist-search svg { flex-shrink: 0; color: #64736d; }

.flist-search input {
  flex: 1;
  background: transparent;
  border: none;
  color: #0d1c2e;
  font-size: 0.9rem;
  outline: none;
  padding: 12px 0;
}

.flist-total {
  margin: 0;
  color: #94a3b8;
  font-size: 0.82rem;
  font-weight: 700;
}

/* ── State ── */
.flist-state {
  border: 1px dashed #bfc9c3;
  border-radius: 14px;
  color: #64736d;
  padding: 60px;
  text-align: center;
  font-size: 0.95rem;
}

.flist-state--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.flist-state--empty svg { color: #bfc9c3; }
.flist-state--empty p { margin: 0; }

/* ── Grid ── */
.flist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 36px;
}

/* ── Forum Card ── */
.forum-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0,0,0,.05);
  color: #0d1c2e;
  padding: 24px;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.forum-card:hover {
  border-color: rgba(0,53,39,.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0,0,0,.1);
}

.forum-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.forum-card__badge {
  border-radius: 999px;
  background: rgba(34,197,94,.1);
  color: #15803d;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  text-transform: uppercase;
}

.forum-card__type {
  border-radius: 999px;
  background: rgba(148,74,35,.1);
  color: #944a23;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  text-transform: uppercase;
}

.forum-card__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.35;
  color: #0d1c2e;
}

.forum-card__summary {
  margin: 0;
  color: #404944;
  font-size: 0.88rem;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.forum-card__article {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: #64736d;
  font-size: 0.8rem;
  font-weight: 700;
  padding-top: 6px;
  border-top: 1px solid #e5e7eb;
}

.forum-card__article svg { flex-shrink: 0; color: #94a3b8; }

.forum-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: auto;
}

.forum-card__meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 700;
}

.forum-card__meta-item svg { color: #bfc9c3; }

.forum-card__arrow {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #003527;
  font-size: 0.82rem;
  font-weight: 900;
  margin-top: 4px;
}

.forum-card:hover .forum-card__arrow { gap: 9px; }
.forum-card__arrow svg { transition: transform 0.2s; }
.forum-card:hover .forum-card__arrow svg { transform: translateX(3px); }

/* ── Pagination ── */
.flist-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #404944;
  font-weight: 800;
  font-size: 0.9rem;
}

.flist-pagination button {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: transparent;
  color: #0d1c2e;
  cursor: pointer;
  font-weight: 800;
  padding: 9px 16px;
  transition: background 0.2s, border-color 0.2s;
}

.flist-pagination button:hover:not(:disabled) {
  background: rgba(0,53,39,.08);
  border-color: #003527;
  color: #003527;
}

.flist-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .flist-shell { width: calc(100% - 24px); }
  .flist-grid { grid-template-columns: 1fr; }
  .flist-state { padding: 40px 24px; }
}
</style>
