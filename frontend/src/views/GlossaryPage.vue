<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useGlossaryStore } from '@/stores/glossary';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import { useTheme } from '@/composables/useTheme';

const glossaryStore = useGlossaryStore();
const { isDark } = useTheme();
const search = ref('');
const activeCategory = ref('');
let searchTimeout = null;

const categories = [
  { value: '', label: 'Semua' },
  { value: 'kimia', label: 'Kimia' },
  { value: 'proses', label: 'Proses' },
  { value: 'kualitas', label: 'Kualitas' },
  { value: 'alat', label: 'Alat' },
  { value: 'umum', label: 'Umum' },
];

const CATEGORY_COLOR = computed(() => isDark.value ? {
  kimia:    { bg: 'rgba(59,130,246,.14)',  text: '#93c5fd', border: 'rgba(59,130,246,.2)' },
  proses:   { bg: 'rgba(168,85,247,.14)', text: '#d8b4fe', border: 'rgba(168,85,247,.2)' },
  kualitas: { bg: 'rgba(234,179,8,.12)',  text: '#fde047', border: 'rgba(234,179,8,.2)' },
  alat:     { bg: 'rgba(20,184,166,.12)', text: '#5eead4', border: 'rgba(20,184,166,.2)' },
  umum:     { bg: 'rgba(255,255,255,.08)',text: '#d0c3ba', border: 'rgba(255,255,255,.12)' },
} : {
  kimia:    { bg: 'rgba(59,130,246,.1)',  text: '#1d4ed8', border: 'rgba(59,130,246,.3)' },
  proses:   { bg: 'rgba(168,85,247,.1)',  text: '#7e22ce', border: 'rgba(168,85,247,.3)' },
  kualitas: { bg: 'rgba(202,138,4,.1)',   text: '#a16207', border: 'rgba(202,138,4,.3)' },
  alat:     { bg: 'rgba(20,184,166,.1)',  text: '#0d9488', border: 'rgba(20,184,166,.3)' },
  umum:     { bg: 'rgba(0,0,0,.05)',      text: '#6b7280', border: 'rgba(0,0,0,.12)' },
});

const totalInfo = computed(() => {
  const meta = glossaryStore.meta;
  if (!meta.total_items) return '';
  return `${meta.total_items} istilah`;
});

function loadTerms(page = 1) {
  glossaryStore.fetchTerms({
    search: search.value || undefined,
    category: activeCategory.value || undefined,
    page,
    limit: 20,
  });
}

watch(search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadTerms(1), 350);
});

watch(activeCategory, () => loadTerms(1));

onMounted(() => loadTerms(1));
</script>

<template>
  <div class="glos-page">
    <SiteNavbar variant="home" />
    <div class="md:ml-64 pt-14 md:pt-0">
    <div class="glos-shell">
      <!-- Header -->
      <header class="glos-header">
        <p class="eyebrow">Referensi Teknis</p>
        <h1>Glosarium Istilah</h1>
        <p class="glos-header__sub">Kamus istilah teknis pengolahan produk kelapa — kimia, proses, kualitas, dan alat.</p>
      </header>

      <!-- Body -->
      <div class="glos-body">
        <!-- Sidebar -->
        <aside class="glos-sidebar">
          <!-- Search -->
          <div class="sidebar-group">
            <p class="sidebar-label">Cari Istilah</p>
            <div class="sidebar-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input v-model="search" type="text" placeholder="ketik untuk mencari..." />
            </div>
          </div>

          <!-- Category -->
          <div class="sidebar-group">
            <p class="sidebar-label">Kategori</p>
            <div class="sidebar-categories">
              <button
                v-for="cat in categories"
                :key="cat.value"
                class="cat-chip"
                :class="{ active: activeCategory === cat.value }"
                @click="activeCategory = cat.value"
              >{{ cat.label }}</button>
            </div>
          </div>

          <!-- Stats -->
          <p v-if="totalInfo" class="sidebar-stats">{{ totalInfo }}</p>
        </aside>

        <!-- Terms List -->
        <div class="glos-content">
          <!-- Loading -->
          <div v-if="glossaryStore.isLoading" class="glos-state">Memuat glosarium...</div>

          <!-- Empty -->
          <div v-else-if="!glossaryStore.terms.length" class="glos-state">
            Tidak ada istilah yang cocok dengan pencarian.
          </div>

          <!-- List -->
          <div v-else class="terms-list">
            <div v-for="term in glossaryStore.terms" :key="term.id" class="term-card">
              <div class="term-card__head">
                <h2>{{ term.term }}</h2>
                <span
                  class="term-badge"
                  :style="{
                    background: CATEGORY_COLOR[term.category]?.bg,
                    color: CATEGORY_COLOR[term.category]?.text,
                    borderColor: CATEGORY_COLOR[term.category]?.border,
                  }"
                >{{ term.category }}</span>
              </div>
              <p class="term-card__def">{{ term.definition }}</p>
              <p v-if="term.standard_reference" class="term-card__ref">
                <span>SNI / Ref</span>{{ term.standard_reference }}
              </p>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="glossaryStore.meta.total_pages > 1" class="glos-pagination">
            <button
              :disabled="glossaryStore.meta.page <= 1"
              @click="loadTerms(glossaryStore.meta.page - 1)"
            >← Sebelumnya</button>
            <span>{{ glossaryStore.meta.page }} / {{ glossaryStore.meta.total_pages }}</span>
            <button
              :disabled="glossaryStore.meta.page >= glossaryStore.meta.total_pages"
              @click="loadTerms(glossaryStore.meta.page + 1)"
            >Berikutnya →</button>
          </div>
        </div>
      </div>
    </div>

    <SiteFooter />
    </div>
  </div>
</template>

<style scoped>
.glos-page { min-height: 100vh; }

.eyebrow {
  margin: 0 0 12px;
  color: rgb(var(--color-secondary));
  font-size: .72rem;
  font-weight: 950;
  letter-spacing: .2em;
  text-transform: uppercase;
}

.glos-shell {
  width: min(1100px, calc(100% - 48px));
  margin: 0 auto;
  padding: 40px 0 60px;
}

/* ── Header ── */
.glos-header { margin-bottom: 36px; }

.glos-header h1 {
  margin: 0 0 10px;
  font-size: clamp(2.2rem, 4vw, 3.6rem);
  font-weight: 950;
  line-height: 1.05;
  color: rgb(var(--color-on-surface));
}

.glos-header__sub {
  margin: 0;
  color: rgb(var(--color-on-surface-variant));
  font-size: .95rem;
  line-height: 1.7;
  max-width: 560px;
}

/* ── Body Layout ── */
.glos-body {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  align-items: start;
}

/* ── Sidebar ── */
.glos-sidebar {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
  border: 1px solid rgb(var(--color-outline-variant) / 0.4);
  border-radius: 12px;
  background: rgb(var(--color-surface-container-lowest));
  box-shadow: 0 2px 12px rgb(var(--color-on-background) / 0.06);
}

.sidebar-group { display: flex; flex-direction: column; gap: 10px; }

.sidebar-label {
  margin: 0;
  font-size: .68rem;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgb(var(--color-on-surface-variant));
}

.sidebar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgb(var(--color-surface-container));
  border: 1px solid rgb(var(--color-outline-variant) / 0.5);
  border-radius: 8px;
  padding: 0 0 0 10px;
  transition: border-color .2s;
}

.sidebar-search:focus-within { border-color: rgb(var(--color-primary)); }

.sidebar-search svg { flex-shrink: 0; color: rgb(var(--color-on-surface-variant)); }

.sidebar-search input {
  flex: 1;
  background: transparent;
  border: none;
  color: rgb(var(--color-on-surface));
  font-size: .86rem;
  outline: none;
  padding: 9px 8px 9px 0;
  min-width: 0;
}

.sidebar-search input::placeholder { color: rgb(var(--color-outline)); }

.sidebar-categories { display: flex; flex-direction: column; gap: 2px; }

.cat-chip {
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgb(var(--color-on-surface-variant));
  cursor: pointer;
  font-size: .84rem;
  font-weight: 700;
  padding: 7px 10px;
  text-align: left;
  transition: background .15s, color .15s;
}

.cat-chip:hover { background: rgb(var(--color-primary) / 0.08); color: rgb(var(--color-primary)); }
.cat-chip.active { background: rgb(var(--color-primary) / 0.14); color: rgb(var(--color-primary)); font-weight: 900; }

.sidebar-stats {
  margin: 0;
  font-size: .78rem;
  color: rgb(var(--color-outline));
  font-weight: 700;
  text-align: center;
  padding-top: 4px;
  border-top: 1px solid rgb(var(--color-outline-variant) / 0.4);
}

/* ── Content ── */
.glos-content { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

.glos-state {
  border: 1px dashed rgb(var(--color-outline-variant));
  border-radius: 12px;
  color: rgb(var(--color-on-surface-variant));
  padding: 48px;
  text-align: center;
  font-size: .95rem;
}

.terms-list { display: flex; flex-direction: column; gap: 12px; }

.term-card {
  padding: 22px 24px;
  border: 1px solid rgb(var(--color-outline-variant) / 0.4);
  border-radius: 12px;
  background: rgb(var(--color-surface-container-lowest));
  box-shadow: 0 2px 8px rgb(var(--color-on-background) / 0.04);
  transition: border-color .2s, box-shadow .2s;
}

.term-card:hover {
  border-color: rgb(var(--color-primary) / 0.3);
  box-shadow: 0 4px 16px rgb(var(--color-on-background) / 0.08);
}

.term-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.term-card__head h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.3;
  color: rgb(var(--color-on-surface));
}

.term-badge {
  flex-shrink: 0;
  border: 1px solid;
  border-radius: 999px;
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .06em;
  padding: 3px 10px;
  text-transform: uppercase;
}

.term-card__def {
  margin: 0;
  color: rgb(var(--color-on-surface-variant));
  font-size: .92rem;
  line-height: 1.75;
}

.term-card__ref {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0 0;
  font-size: .8rem;
  color: rgb(var(--color-on-surface-variant));
}

.term-card__ref span {
  border: 1px solid rgb(var(--color-primary) / 0.25);
  border-radius: 4px;
  color: rgb(var(--color-primary));
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .08em;
  padding: 2px 7px;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── Pagination ── */
.glos-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgb(var(--color-on-surface-variant));
  font-weight: 800;
  font-size: .88rem;
}

.glos-pagination button {
  border: 1px solid rgb(var(--color-outline-variant) / 0.5);
  border-radius: 8px;
  background: rgb(var(--color-surface-container-lowest));
  color: rgb(var(--color-on-surface));
  cursor: pointer;
  font-weight: 800;
  padding: 8px 14px;
  transition: background .2s, border-color .2s, color .2s;
}

.glos-pagination button:hover:not(:disabled) {
  background: rgb(var(--color-primary) / 0.08);
  border-color: rgb(var(--color-primary) / 0.4);
  color: rgb(var(--color-primary));
}
.glos-pagination button:disabled { opacity: .4; cursor: not-allowed; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .glos-body { grid-template-columns: 1fr; }

  .glos-sidebar {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
  }

  .sidebar-group { flex: 1; min-width: 140px; }
  .sidebar-categories { flex-direction: row; flex-wrap: wrap; }
  .cat-chip { padding: 5px 10px; font-size: .8rem; }
}

@media (max-width: 480px) {
  .glos-shell { width: calc(100% - 20px); }
  .glos-sidebar { flex-direction: column; }
}
</style>
