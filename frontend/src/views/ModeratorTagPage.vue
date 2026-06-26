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
  <main class="inner-page min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-5xl">
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/40 pb-6">
        <div>
          <p class="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Coconexus / Moderator Tag</p>
          <h1 class="text-3xl font-extrabold tracking-tight text-white">Pantau Kategori & Tag</h1>
          <p class="mt-2 text-sm text-on-surface-variant">Tampilan read-only daftar kategori untuk memastikan konsistensi taksonomi konten.</p>
        </div>
      </header>

      <!-- Stats -->
      <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-2">
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Kategori</p>
          <strong class="mt-2 block text-3xl font-black text-on-surface">{{ categories.length }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Ditampilkan</p>
          <strong class="mt-2 block text-3xl font-black text-sky-400">{{ filteredCategories.length }}</strong>
        </div>
      </section>

      <!-- Search -->
      <section class="mb-6 rounded-xl border border-outline-variant/40 bg-stone-800/30 p-5">
        <label class="mb-2 block text-sm font-medium text-on-surface-variant">Cari Kategori</label>
        <input v-model="search" type="text" placeholder="Cari nama atau deskripsi kategori..." class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400" />
      </section>

      <!-- List -->
      <section class="rounded-xl border border-outline-variant/40 bg-stone-800/30 overflow-hidden">
        <div class="border-b border-outline-variant/40 bg-stone-800/50 px-5 py-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-stone-200">Daftar Kategori</h2>
          <span class="text-xs text-on-surface-variant rounded-full bg-stone-700 px-3 py-1">Read-only</span>
        </div>

        <div v-if="isLoading" class="py-16 text-center text-on-surface-variant">Memuat kategori...</div>
        <div v-else-if="error" class="py-12 text-center text-red-400">{{ error }}</div>
        <div v-else-if="filteredCategories.length === 0" class="py-16 text-center text-stone-500">Tidak ada kategori yang cocok.</div>

        <table v-else class="w-full text-left text-sm">
          <thead class="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th class="px-6 py-4 font-medium">Nama</th>
              <th class="px-6 py-4 font-medium">Deskripsi</th>
              <th class="px-6 py-4 font-medium text-right">Dibuat</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-700/50">
            <tr v-for="cat in filteredCategories" :key="cat.id" class="hover:bg-stone-800/50 transition-colors">
              <td class="px-6 py-4 font-semibold text-stone-200">{{ cat.name }}</td>
              <td class="px-6 py-4 text-on-surface-variant">{{ cat.description || '-' }}</td>
              <td class="px-6 py-4 text-right text-xs text-stone-500">
                {{ new Date(cat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </main>
</template>
