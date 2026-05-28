<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const comments = ref([]);
const isLoading = ref(false);
const error = ref(null);
const filters = reactive({
  status: 'all',
  search: '',
});

const filteredComments = computed(() => {
  return comments.value.filter((comment) => {
    const matchesStatus = filters.status === 'all' || comment.status === filters.status;
    const matchesSearch =
      comment.content.toLowerCase().includes(filters.search.toLowerCase()) ||
      comment.user?.email.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });
});

async function fetchComments() {
  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await api.get('/comments?author_articles_only=true');
    comments.value = data.data.comments || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function deleteComment(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) return;

  try {
    await api.delete(`/comments/${id}`);
    comments.value = comments.value.filter((c) => c.id !== id);
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(() => {
  fetchComments();
});
</script>

<template>
  <main class="inner-page pengelola-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="pengelola" />

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / PENGELOLA ARTIKEL</p>
          <h1>Kelola Komentar</h1>
        </div>
      </header>

      <!-- Filters -->
      <section class="admin-signal-board mb-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm mb-2">Cari Komentar</label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari berdasarkan nama atau konten..."
              class="w-full rounded bg-stone-800 px-3 py-2 text-stone-100 border border-stone-600"
            />
          </div>
        </div>
      </section>

      <!-- Comments List -->
      <section class="admin-signal-board">
        <p class="admin-section-label mb-4">DAFTAR KOMENTAR</p>

        <div v-if="isLoading" class="text-center py-8">
          <p>Memuat komentar...</p>
        </div>

        <div v-else-if="error" class="text-red-400 text-center py-8">
          {{ error }}
        </div>

        <div v-else-if="filteredComments.length === 0" class="text-center py-8 text-stone-400">
          Tidak ada komentar ditemukan
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="comment in filteredComments"
            :key="comment.id"
            class="p-4 rounded border border-stone-700 hover:bg-stone-800 transition"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="font-semibold">{{ comment.user?.profile?.full_name || comment.user?.email }}</p>
                <p class="text-xs text-stone-400">
                  {{ new Date(comment.created_at).toLocaleString('id-ID') }}
                </p>
              </div>
              <p class="text-sm font-semibold">{{ comment.article?.title || 'Artikel Dihapus' }}</p>
            </div>
            <p class="text-stone-300 mb-3">{{ comment.content }}</p>
            <div class="flex gap-2">
              <button
                @click="deleteComment(comment.id)"
                class="text-red-400 hover:text-red-300 text-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </section>
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
