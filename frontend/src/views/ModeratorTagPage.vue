<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const categories = ref([]);
const tags = ref([]);
const isLoading = ref(false);
const isTagLoading = ref(false);
const error = ref(null);
const tagError = ref(null);
const feedback = ref('');
const search = ref('');

const isAdding = ref(false);
const newCategoryName = ref('');
const newCategoryDescription = ref('');

const editingId = ref(null);
const editForm = reactive({ name: '', description: '' });

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

async function fetchTags() {
  isTagLoading.value = true;
  tagError.value = null;
  try {
    const { data } = await api.get('/moderator/tag/tags');
    tags.value = data.data.tags || [];
  } catch (err) {
    tagError.value = err.response?.data?.message || err.message;
  } finally {
    isTagLoading.value = false;
  }
}

async function addCategory() {
  if (!newCategoryName.value.trim()) return;
  isAdding.value = true;
  error.value = null;
  try {
    const { data } = await api.post('/moderator/tag/categories', {
      name: newCategoryName.value,
      description: newCategoryDescription.value,
    });
    categories.value.push(data.data.category);
    newCategoryName.value = '';
    newCategoryDescription.value = '';
    feedback.value = 'Kategori berhasil ditambahkan.';
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Gagal menambah kategori.';
  } finally {
    isAdding.value = false;
  }
}

function startEdit(category) {
  editingId.value = category.id;
  editForm.name = category.name;
  editForm.description = category.description || '';
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit(id) {
  error.value = null;
  try {
    const { data } = await api.put(`/moderator/tag/categories/${id}`, {
      name: editForm.name,
      description: editForm.description,
    });
    const idx = categories.value.findIndex((c) => c.id === id);
    if (idx !== -1) categories.value[idx] = data.data.category;
    editingId.value = null;
    feedback.value = 'Kategori berhasil diperbarui.';
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  }
}

async function deleteCategory(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;
  error.value = null;
  try {
    await api.delete(`/moderator/tag/categories/${id}`);
    categories.value = categories.value.filter((c) => c.id !== id);
    feedback.value = 'Kategori berhasil dihapus.';
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  }
}

async function deleteTag(tag) {
  if (!confirm(`Hapus tag "${tag.name}"?`)) return;
  tagError.value = null;
  try {
    await api.delete(`/moderator/tag/tags/${tag.id}`);
    tags.value = tags.value.filter((t) => t.id !== tag.id);
    feedback.value = `Tag "${tag.name}" berhasil dihapus.`;
  } catch (err) {
    tagError.value = err.response?.data?.message || err.message;
  }
}

onMounted(() => {
  fetchCategories();
  fetchTags();
});
</script>

<template>
  <SiteNavbar variant="moderator" />
  <main class="inner-page moderator-workspace min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">
    <section class="mx-auto max-w-6xl">

      <!-- ── Header ── -->
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/30 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-violet-400" style="font-size:15px">sell</span>
            <p class="text-xs font-bold uppercase tracking-widest text-violet-400/80">Coconexus / Penata Taksonomi</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Kelola Kategori & Tag</h1>
          <p class="mt-1 text-sm text-on-surface-variant">CRUD kategori penuh, serta pembersihan tag yang tidak lagi terpakai</p>
        </div>
        <button @click="fetchCategories(); fetchTags();" class="inline-flex items-center gap-2 self-start rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:self-auto">
          <span class="material-symbols-outlined" style="font-size:16px">refresh</span>
          Refresh
        </button>
      </header>

      <!-- ── Feedback ── -->
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="feedback" class="mb-6 flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-300">
          <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">check_circle</span>
          {{ feedback }}
        </div>
      </Transition>

      <div class="grid gap-8 xl:grid-cols-[1fr_1.3fr]">

        <!-- ── CATEGORIES ──────────────────────────────────── -->
        <div class="space-y-5">

          <!-- Add form -->
          <section class="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
            <div class="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
              <span class="material-symbols-outlined text-violet-400" style="font-size:16px">add_circle</span>
              <h2 class="text-sm font-bold text-on-surface">Tambah Kategori Baru</h2>
            </div>
            <div class="p-5">
              <form @submit.prevent="addCategory" class="space-y-2.5">
                <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
                  <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">category</span>
                  <input v-model="newCategoryName" type="text" placeholder="Nama kategori baru..." class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" />
                </div>
                <div class="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
                  <input v-model="newCategoryDescription" type="text" placeholder="Deskripsi (opsional)..." class="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" />
                </div>
                <button type="submit" :disabled="isAdding || !newCategoryName.trim()" class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40">
                  <span class="material-symbols-outlined" style="font-size:15px">{{ isAdding ? 'progress_activity' : 'add' }}</span>
                  {{ isAdding ? 'Menambah...' : 'Tambah Kategori' }}
                </button>
              </form>
              <p v-if="error" class="mt-3 flex items-center gap-1.5 text-xs text-red-400">
                <span class="material-symbols-outlined" style="font-size:13px">error</span>
                {{ error }}
              </p>
            </div>
          </section>

          <!-- Search -->
          <section class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
              <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">search</span>
              <input v-model="search" type="text" placeholder="Cari nama atau deskripsi kategori..." class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" />
            </div>
          </section>

          <!-- Category Table -->
          <section class="overflow-hidden rounded-2xl border border-outline-variant/30">
            <div class="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
              <span class="material-symbols-outlined text-violet-400" style="font-size:16px">category</span>
              <h2 class="text-sm font-bold text-on-surface">Daftar Kategori</h2>
              <span class="ml-auto text-xs text-on-surface-variant">{{ filteredCategories.length }} kategori</span>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center gap-3 py-12 text-on-surface-variant">
              <span class="material-symbols-outlined animate-spin" style="font-size:18px">progress_activity</span>
              <span class="text-sm">Memuat kategori...</span>
            </div>
            <div v-else-if="filteredCategories.length === 0" class="py-16 text-center">
              <span class="material-symbols-outlined mb-2 block text-4xl text-outline-variant">category</span>
              <p class="text-sm text-on-surface-variant">Tidak ada kategori yang cocok</p>
            </div>
            <ul v-else class="divide-y divide-outline-variant/10">
              <li v-for="cat in filteredCategories" :key="cat.id" class="px-5 py-3.5">
                <template v-if="editingId === cat.id">
                  <div class="space-y-2">
                    <input v-model="editForm.name" type="text" class="w-full rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-sm text-on-surface outline-none" />
                    <input v-model="editForm.description" type="text" placeholder="Deskripsi" class="w-full rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-sm text-on-surface outline-none" />
                    <div class="flex gap-2">
                      <button @click="saveEdit(cat.id)" class="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500">Simpan</button>
                      <button @click="cancelEdit" class="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high">Batal</button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="font-semibold text-on-surface">{{ cat.name }}</p>
                      <p v-if="cat.description" class="truncate text-xs text-on-surface-variant">{{ cat.description }}</p>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="(cat.article_count || 0) > 0 ? 'bg-blue-500/15 text-blue-300' : 'text-on-surface-variant'">
                        {{ cat.article_count || 0 }} artikel
                      </span>
                      <button @click="startEdit(cat)" class="tag-action-btn tag-action--edit" title="Edit">
                        <span class="material-symbols-outlined" style="font-size:14px">edit</span>
                      </button>
                      <button @click="deleteCategory(cat.id)" :disabled="(cat.article_count || 0) > 0" :title="(cat.article_count || 0) > 0 ? 'Kategori ini masih dipakai' : 'Hapus kategori'" class="tag-action-btn tag-action--delete" :class="{ 'cursor-not-allowed opacity-30': (cat.article_count || 0) > 0 }">
                        <span class="material-symbols-outlined" style="font-size:14px">delete</span>
                      </button>
                    </div>
                  </div>
                </template>
              </li>
            </ul>
            <p class="border-t border-outline-variant/10 px-5 py-3 text-xs text-on-surface-variant">* Kategori dengan artikel tidak bisa dihapus</p>
          </section>
        </div>

        <!-- ── TAGS ───────────────────────────────────────── -->
        <section class="overflow-hidden rounded-2xl border border-outline-variant/30 self-start">
          <div class="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
            <span class="material-symbols-outlined text-violet-400" style="font-size:16px">sell</span>
            <h2 class="text-sm font-bold text-on-surface">Daftar Tag</h2>
            <span class="ml-auto text-xs text-on-surface-variant">{{ tags.length }} tag</span>
          </div>
          <p class="mx-5 mt-4 text-xs text-on-surface-variant">Tag dibuat otomatis saat Kurator Konten menandai artikel — Penata Taksonomi hanya membersihkan tag yang sudah tidak terpakai.</p>

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
                  <th class="px-5 py-3 text-right font-semibold">Total</th>
                  <th class="px-5 py-3 text-right font-semibold">Terbit</th>
                  <th class="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tag in tags" :key="tag.id" class="border-b border-outline-variant/10 transition-colors last:border-0 hover:bg-violet-500/3">
                  <td class="px-5 py-3">
                    <span class="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface">
                      <span class="material-symbols-outlined" style="font-size:10px">sell</span>
                      {{ tag.name }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold" :class="tag.article_count > 0 ? 'bg-blue-500/15 text-blue-300' : 'text-on-surface-variant'">{{ tag.article_count }}</span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold" :class="tag.published_count > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'text-on-surface-variant'">{{ tag.published_count }}</span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <button @click="deleteTag(tag)" :disabled="tag.article_count > 0" :title="tag.article_count > 0 ? `Dipakai oleh ${tag.article_count} artikel` : 'Hapus tag'" class="tag-action-btn tag-action--delete" :class="{ 'cursor-not-allowed opacity-30': tag.article_count > 0 }">
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

<style scoped>
.tag-action-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.875rem; height: 1.875rem;
  border-radius: 0.5rem; border: 1px solid transparent;
  cursor: pointer; transition: background-color 0.15s;
}
.tag-action--edit   { background: rgb(14 165 233 / 0.1); color: rgb(56 189 248); border-color: rgb(14 165 233 / 0.2); }
.tag-action--edit:hover { background: rgb(14 165 233 / 0.2); }
.tag-action--delete { background: rgb(239 68 68 / 0.1); color: rgb(248 113 113); border-color: rgb(239 68 68 / 0.2); }
.tag-action--delete:hover { background: rgb(239 68 68 / 0.2); }
</style>
