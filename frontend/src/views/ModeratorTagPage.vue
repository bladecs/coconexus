<script setup>
import { computed, onMounted, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const categories = ref([]);
const isLoading = ref(false);
const error = ref(null);
const search = ref('');

const filteredCategories = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return categories.value;
  return categories.value.filter((c) => (c.name || '').toLowerCase().includes(keyword) || (c.description || '').toLowerCase().includes(keyword));
});

async function fetchCategories() {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/moderator/tag/categories');
    categories.value = data.data.categories || data.data || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => fetchCategories());
</script>

<template>
  <SiteNavbar variant="moderator" />
  <main class="inner-page moderator-workspace min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">
    <section class="mx-auto max-w-5xl">

      <!-- ── Header ── -->
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/30 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-violet-400" style="font-size:15px">sell</span>
            <p class="text-xs font-bold uppercase tracking-widest text-violet-400/80">Coconexus / Penata Taksonomi</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Pantau Kategori & Tag</h1>
          <p class="mt-1 text-sm text-on-surface-variant">Tampilan read-only untuk memastikan konsistensi taksonomi konten</p>
        </div>
        <button @click="fetchCategories" class="inline-flex items-center gap-2 self-start rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:self-auto">
          <span class="material-symbols-outlined" style="font-size:16px">refresh</span>
          Refresh
        </button>
      </header>

      <!-- ── Stats ── -->
      <section class="mb-8 grid grid-cols-2 gap-4">
        <div class="tag-stat-card">
          <span class="material-symbols-outlined tag-stat-icon text-on-surface-variant">category</span>
          <p class="tag-stat-label">Total Kategori</p>
          <strong class="tag-stat-value text-on-surface">{{ categories.length }}</strong>
        </div>
        <div class="tag-stat-card">
          <span class="material-symbols-outlined tag-stat-icon text-violet-400">visibility</span>
          <p class="tag-stat-label">Ditampilkan</p>
          <strong class="tag-stat-value text-violet-400">{{ filteredCategories.length }}</strong>
        </div>
      </section>

      <!-- ── Search ── -->
      <section class="mb-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
        <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
          <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">search</span>
          <input v-model="search" type="text" placeholder="Cari nama atau deskripsi kategori..." class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" />
        </div>
      </section>

      <!-- ── Table ── -->
      <section class="overflow-hidden rounded-2xl border border-outline-variant/30">
        <div class="flex items-center justify-between border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-violet-400" style="font-size:16px">list</span>
            <h2 class="text-sm font-bold text-on-surface">Daftar Kategori</h2>
          </div>
          <span class="rounded-full border border-outline-variant/30 bg-surface-container-low px-3 py-1 text-xs text-on-surface-variant">Read-only</span>
        </div>

        <div v-if="isLoading" class="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
          <span class="material-symbols-outlined animate-spin" style="font-size:20px">progress_activity</span>
          <span class="text-sm">Memuat kategori...</span>
        </div>
        <div v-else-if="error" class="flex items-center justify-center gap-2 py-12 text-red-400">
          <span class="material-symbols-outlined" style="font-size:18px">error</span>
          <span class="text-sm">{{ error }}</span>
        </div>
        <div v-else-if="filteredCategories.length === 0" class="py-20 text-center">
          <span class="material-symbols-outlined mb-3 block text-5xl text-outline-variant">category</span>
          <p class="font-semibold text-on-surface-variant">Tidak ada kategori yang cocok</p>
        </div>

        <table v-else class="w-full text-left text-sm">
          <thead class="border-b border-outline-variant/20 bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th class="px-5 py-3.5 font-semibold">Nama</th>
              <th class="px-5 py-3.5 font-semibold">Deskripsi</th>
              <th class="px-5 py-3.5 text-right font-semibold">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in filteredCategories" :key="cat.id" class="border-b border-outline-variant/10 transition-colors last:border-0 hover:bg-violet-500/3">
              <td class="px-5 py-3.5">
                <span class="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface">
                  <span class="material-symbols-outlined" style="font-size:10px">sell</span>
                  {{ cat.name }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-sm text-on-surface-variant">{{ cat.description || '—' }}</td>
              <td class="px-5 py-3.5 text-right text-xs text-on-surface-variant">
                {{ new Date(cat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

    </section>
  </main>
</template>

<style scoped>
.tag-stat-card {
  border-radius: 1rem;
  border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-lowest));
  padding: 1.1rem 1.25rem;
  display: flex; flex-direction: column; gap: 0.35rem;
  transition: border-color 0.2s;
}
.tag-stat-card:hover { border-color: rgb(139 92 246 / 0.3); }
.tag-stat-icon { font-size: 1.25rem; }
.tag-stat-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(var(--color-on-surface-variant)); }
.tag-stat-value { font-size: 2rem; font-weight: 900; line-height: 1; display: block; }
</style>
