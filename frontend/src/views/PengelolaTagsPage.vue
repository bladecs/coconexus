<script setup>
import { onMounted, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

// ── Categories (read-only monitoring — CRUD dipindahkan ke Penata Taksonomi) ──
const categories = ref([]);
const isCatLoading = ref(false);
const catError = ref(null);

async function fetchCategories() {
  isCatLoading.value = true;
  catError.value = null;
  try {
    const { data } = await api.get('/pengelola/categories');
    categories.value = data.data.categories || [];
  } catch (err) {
    catError.value = err.message;
  } finally {
    isCatLoading.value = false;
  }
}

// ── Tags (read-only monitoring) ─────────────────────────────────
const tags = ref([]);
const isTagLoading = ref(false);
const tagError = ref(null);

async function fetchTags() {
  isTagLoading.value = true;
  tagError.value = null;
  try {
    const { data } = await api.get('/pengelola/tags');
    tags.value = data.data.tags || [];
  } catch (err) {
    tagError.value = err.response?.data?.message || err.message;
  } finally {
    isTagLoading.value = false;
  }
}

onMounted(() => {
  fetchCategories();
  fetchTags();
});
</script>

<template>
  <SiteNavbar variant="pengelola" />
  <main class="inner-page pengelola-workspace min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">
    <section class="mx-auto max-w-[1680px]">

      <!-- ── Header ── -->
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-teal-400" style="font-size:15px">sell</span>
            <p class="text-xs font-bold uppercase tracking-widest text-teal-400/80">Coconexus / Monitoring Konten</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Pantau Kategori & Tag</h1>
          <p class="mt-1 text-sm text-on-surface-variant">Monitoring taksonomi konten (read-only) — pengelolaan kategori &amp; tag adalah wewenang Penata Taksonomi</p>
        </div>
      </header>

      <div class="grid gap-8 xl:grid-cols-[1fr_1.5fr]">

        <!-- ── CATEGORIES ──────────────────────────────────── -->
        <section class="overflow-hidden rounded-2xl border border-outline-variant/30">
          <div class="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
            <span class="material-symbols-outlined text-teal-400" style="font-size:16px">category</span>
            <h2 class="text-sm font-bold text-on-surface">Daftar Kategori</h2>
            <span class="ml-auto text-xs text-on-surface-variant">{{ categories.length }} kategori</span>
          </div>

          <p v-if="catError" class="mx-5 mt-4 flex items-center gap-1.5 text-xs text-red-400">
            <span class="material-symbols-outlined" style="font-size:13px">error</span>
            {{ catError }}
          </p>

          <div v-if="isCatLoading" class="flex items-center justify-center gap-3 py-12 text-on-surface-variant">
            <span class="material-symbols-outlined animate-spin" style="font-size:18px">progress_activity</span>
            <span class="text-sm">Memuat kategori...</span>
          </div>
          <div v-else-if="categories.length === 0" class="py-16 text-center">
            <span class="material-symbols-outlined mb-2 block text-4xl text-outline-variant">category</span>
            <p class="text-sm text-on-surface-variant">Belum ada kategori</p>
          </div>
          <table v-else class="w-full text-left text-sm">
            <thead class="border-b border-outline-variant/20 bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th class="px-5 py-3 font-semibold">Nama Kategori</th>
                <th class="px-5 py-3 text-right font-semibold">Artikel</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id" class="border-b border-outline-variant/10 transition-colors last:border-0 hover:bg-teal-500/3">
                <td class="px-5 py-3 font-semibold text-on-surface">{{ category.name }}</td>
                <td class="px-5 py-3 text-right">
                  <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold" :class="(category.articles?.length || category.article_count || 0) > 0 ? 'bg-blue-500/15 text-blue-300' : 'text-on-surface-variant'">
                    {{ category.articles?.length || category.article_count || 0 }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- ── TAGS ───────────────────────────────────────── -->
        <section class="overflow-hidden rounded-2xl border border-outline-variant/30">
          <div class="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
            <span class="material-symbols-outlined text-teal-400" style="font-size:16px">sell</span>
            <h2 class="text-sm font-bold text-on-surface">Daftar Tag</h2>
            <span class="ml-auto text-xs text-on-surface-variant">{{ tags.length }} tag</span>
            <button @click="fetchTags" class="ml-2 inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 bg-surface-container-low px-2.5 py-1 text-xs text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface">
              <span class="material-symbols-outlined" style="font-size:13px">refresh</span>
            </button>
          </div>

          <div v-if="tagError" class="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            <span class="material-symbols-outlined" style="font-size:15px">error</span>
            {{ tagError }}
          </div>

          <div v-if="isTagLoading" class="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
            <span class="material-symbols-outlined animate-spin" style="font-size:18px">progress_activity</span>
            <span class="text-sm">Memuat tag...</span>
          </div>
          <div v-else-if="tags.length === 0" class="py-16 text-center">
            <span class="material-symbols-outlined mb-2 block text-4xl text-outline-variant">sell</span>
            <p class="text-sm text-on-surface-variant">Belum ada tag</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-outline-variant/20 bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th class="px-5 py-3 font-semibold">Nama Tag</th>
                  <th class="px-5 py-3 font-semibold hidden sm:table-cell">Deskripsi</th>
                  <th class="px-5 py-3 text-right font-semibold">Total</th>
                  <th class="px-5 py-3 text-right font-semibold">Terbit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tag in tags" :key="tag.id" class="border-b border-outline-variant/10 transition-colors last:border-0 hover:bg-teal-500/3">
                  <td class="px-5 py-3">
                    <span class="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface">
                      <span class="material-symbols-outlined" style="font-size:10px">sell</span>
                      {{ tag.name }}
                    </span>
                  </td>
                  <td class="max-w-[180px] truncate px-5 py-3 text-xs text-on-surface-variant hidden sm:table-cell">{{ tag.description || '—' }}</td>
                  <td class="px-5 py-3 text-right">
                    <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold" :class="tag.article_count > 0 ? 'bg-blue-500/15 text-blue-300' : 'text-on-surface-variant'">{{ tag.article_count }}</span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold" :class="tag.published_count > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'text-on-surface-variant'">{{ tag.published_count }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </section>
  </main>
</template>
