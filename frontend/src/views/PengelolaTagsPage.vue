<script setup>
import { onMounted, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const categories = ref([]);
const isLoading = ref(false);
const error = ref(null);
const isAdding = ref(false);
const newCategoryName = ref('');

async function fetchCategories() {
  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await api.get('/categories');
    categories.value = data.data.categories || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function addCategory() {
  if (!newCategoryName.value.trim()) return;

  isAdding.value = true;
  error.value = null;

  try {
    const { data } = await api.post('/categories', {
      name: newCategoryName.value,
    });
    categories.value.push(data.data.category);
    newCategoryName.value = '';
  } catch (err) {
    error.value = err.message;
  } finally {
    isAdding.value = false;
  }
}

async function deleteCategory(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;

  try {
    await api.delete(`/categories/${id}`);
    categories.value = categories.value.filter((c) => c.id !== id);
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <SiteNavbar variant="pengelola" />
  <main class="inner-page pengelola-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / PENGELOLA ARTIKEL</p>
          <h1>Kelola Kategori & Tag</h1>
        </div>
      </header>

      <!-- Add New Category -->
      <section class="admin-signal-board mb-6">
        <p class="admin-section-label mb-4">TAMBAH KATEGORI BARU</p>
        <form @submit.prevent="addCategory" class="flex gap-2">
          <input
            v-model="newCategoryName"
            type="text"
            placeholder="Nama kategori baru..."
            class="flex-1 px-3 py-2 rounded bg-stone-800 border border-stone-600 text-on-surface placeholder-stone-400 focus:outline-none focus:border-stone-500"
          />
          <button
            type="submit"
            :disabled="isAdding"
            class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-stone-700 disabled:cursor-not-allowed transition"
          >
            {{ isAdding ? 'Menambah...' : 'Tambah' }}
          </button>
        </form>
      </section>

      <!-- Categories List -->
      <section class="admin-signal-board">
        <p class="admin-section-label mb-4">DAFTAR KATEGORI</p>

        <div v-if="isLoading" class="text-center py-8">
          <p>Memuat kategori...</p>
        </div>

        <div v-else-if="error" class="text-red-400 text-center py-8">
          {{ error }}
        </div>

        <div v-else-if="categories.length === 0" class="text-center py-8 text-on-surface-variant">
          Belum ada kategori
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-stone-600">
                <th class="text-left px-4 py-3">Nama Kategori</th>
                <th class="text-right px-4 py-3">Total Artikel</th>
                <th class="text-right px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id" class="border-b border-outline-variant/40 hover:bg-stone-800">
                <td class="px-4 py-3">{{ category.name }}</td>
                <td class="px-4 py-3 text-right">{{ category.articles?.length || 0 }}</td>
                <td class="px-4 py-3 text-right">
                  <button
                    @click="deleteCategory(category.id)"
                    :disabled="(category.articles?.length || 0) > 0"
                    class="text-red-400 hover:text-red-300 disabled:text-stone-600 disabled:cursor-not-allowed text-sm"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p class="text-xs text-on-surface-variant mt-4">
        *Kategori yang memiliki artikel tidak bisa dihapus
      </p>
    </section>
  </main>
</template>

<style scoped>
.admin-ops-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgb(120 113 108);
}

.admin-ops-header h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 0.25rem;
}

.admin-section-label {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: rgb(168 162 158);
  font-weight: 600;
  text-transform: uppercase;
}

.admin-signal-board {
  background-color: rgb(41 37 36);
  border: 1px solid rgb(120 113 108);
  border-radius: 0.5rem;
  padding: 1.5rem;
}
</style>
