<script setup>
import { onMounted, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

// ── Categories ───────────────────────────────────────────────
const categories = ref([]);
const isCatLoading = ref(false);
const catError = ref(null);
const isAdding = ref(false);
const newCategoryName = ref('');

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

async function addCategory() {
  if (!newCategoryName.value.trim()) return;
  isAdding.value = true;
  catError.value = null;
  try {
    const { data } = await api.post('/pengelola/categories', {
      name: newCategoryName.value,
    });
    categories.value.push(data.data.category);
    newCategoryName.value = '';
  } catch (err) {
    catError.value = err.response?.data?.message || err.message || 'Gagal menambah kategori.';
  } finally {
    isAdding.value = false;
  }
}

async function deleteCategory(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;
  try {
    await api.delete(`/pengelola/categories/${id}`);
    categories.value = categories.value.filter((c) => c.id !== id);
  } catch (err) {
    catError.value = err.response?.data?.message || err.message;
  }
}

// ── Tags ─────────────────────────────────────────────────────
const tags = ref([]);
const isTagLoading = ref(false);
const tagError = ref(null);
const tagSuccess = ref('');
const deletingTagId = ref(null);

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

async function deleteTag(tag) {
  if (!confirm(`Hapus tag "${tag.name}"?`)) return;
  deletingTagId.value = tag.id;
  tagError.value = null;
  tagSuccess.value = '';
  try {
    await api.delete(`/pengelola/tags/${tag.id}`);
    tags.value = tags.value.filter((t) => t.id !== tag.id);
    tagSuccess.value = `Tag "${tag.name}" berhasil dihapus.`;
    setTimeout(() => { tagSuccess.value = ''; }, 3000);
  } catch (err) {
    tagError.value = err.response?.data?.message || err.message;
  } finally {
    deletingTagId.value = null;
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
            <p class="text-xs font-bold uppercase tracking-widest text-teal-400/80">Coconexus / Pengelola Artikel</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Kelola Kategori & Tag</h1>
          <p class="mt-1 text-sm text-on-surface-variant">Atur taksonomi konten — kategori dan tag untuk pengelompokan artikel</p>
        </div>
      </header>

      <div class="grid gap-8 xl:grid-cols-[1fr_1.5fr]">

        <!-- ── CATEGORIES ──────────────────────────────────── -->
        <div class="space-y-5">

          <!-- Add form -->
          <section class="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
            <div class="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
              <span class="material-symbols-outlined text-teal-400" style="font-size:16px">add_circle</span>
              <h2 class="text-sm font-bold text-on-surface">Tambah Kategori Baru</h2>
            </div>
            <div class="p-5">
              <form @submit.prevent="addCategory" class="flex gap-2">
                <div class="flex flex-1 items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
                  <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">category</span>
                  <input v-model="newCategoryName" type="text" placeholder="Nama kategori baru..." class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" />
                </div>
                <button type="submit" :disabled="isAdding || !newCategoryName.trim()" class="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40">
                  <span class="material-symbols-outlined" style="font-size:15px">{{ isAdding ? 'progress_activity' : 'add' }}</span>
                  {{ isAdding ? 'Menambah...' : 'Tambah' }}
                </button>
              </form>
              <p v-if="catError" class="mt-3 flex items-center gap-1.5 text-xs text-red-400">
                <span class="material-symbols-outlined" style="font-size:13px">error</span>
                {{ catError }}
              </p>
            </div>
          </section>

          <!-- Category Table -->
          <section class="overflow-hidden rounded-2xl border border-outline-variant/30">
            <div class="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
              <span class="material-symbols-outlined text-teal-400" style="font-size:16px">category</span>
              <h2 class="text-sm font-bold text-on-surface">Daftar Kategori</h2>
              <span class="ml-auto text-xs text-on-surface-variant">{{ categories.length }} kategori</span>
            </div>

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
                  <th class="px-5 py-3 text-right font-semibold">Aksi</th>
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
                  <td class="px-5 py-3 text-right">
                    <button @click="deleteCategory(category.id)" :disabled="(category.articles?.length || category.article_count || 0) > 0" :title="(category.articles?.length || category.article_count || 0) > 0 ? 'Kategori ini masih dipakai' : 'Hapus kategori'" class="inline-flex items-center justify-center rounded-lg border border-transparent p-1.5 transition" :class="(category.articles?.length || category.article_count || 0) > 0 ? 'cursor-not-allowed text-on-surface-variant/30' : 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'">
                      <span class="material-symbols-outlined" style="font-size:14px">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="border-t border-outline-variant/10 px-5 py-3 text-xs text-on-surface-variant">* Kategori dengan artikel tidak bisa dihapus</p>
          </section>
        </div>

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

          <!-- Tag alerts -->
          <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="tagSuccess" class="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300">
              <span class="material-symbols-outlined" style="font-size:15px;font-variation-settings:'FILL' 1">check_circle</span>
              {{ tagSuccess }}
            </div>
          </Transition>
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
                  <th class="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tag in tags" :key="tag.id" class="border-b border-outline-variant/10 transition-opacity last:border-0 hover:bg-teal-500/3" :class="{ 'opacity-40': deletingTagId === tag.id }">
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
                  <td class="px-5 py-3 text-right">
                    <button @click="deleteTag(tag)" :disabled="tag.article_count > 0 || deletingTagId === tag.id" :title="tag.article_count > 0 ? `Dipakai oleh ${tag.article_count} artikel` : 'Hapus tag'" class="inline-flex items-center justify-center rounded-lg border border-transparent p-1.5 transition" :class="tag.article_count > 0 || deletingTagId === tag.id ? 'cursor-not-allowed text-on-surface-variant/30' : 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'">
                      <span class="material-symbols-outlined" style="font-size:14px">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="border-t border-outline-variant/10 px-5 py-3 text-xs text-on-surface-variant">* Tag yang masih digunakan artikel tidak dapat dihapus</p>
        </section>

      </div>
    </section>
  </main>
</template>
