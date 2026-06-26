<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const router = useRouter();

const articles = ref([]);
const isLoading = ref(false);
const error = ref(null);
const feedback = ref('');
const filters = reactive({ status: 'all', search: '' });

const filteredArticles = computed(() => {
  return articles.value.filter((a) => {
    const matchesStatus = filters.status === 'all' || a.status === filters.status;
    const matchesSearch = (a.title || '').toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });
});

const stats = computed(() => ({
  total: articles.value.length,
  draft: articles.value.filter((a) => a.status === 'draft').length,
  revision: articles.value.filter((a) => a.status === 'revision').length,
  under_review: articles.value.filter((a) => a.status === 'under_review').length,
  published: articles.value.filter((a) => a.status === 'published').length,
}));

async function fetchArticles() {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/moderator/content/articles');
    articles.value = data.data.articles || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function updateStatus(id, status) {
  feedback.value = '';
  try {
    await api.patch(`/moderator/content/articles/${id}/status`, { status });
    feedback.value = `Status artikel berhasil diubah ke "${status}".`;
    await fetchArticles();
  } catch (err) {
    feedback.value = err.message;
  }
}

onMounted(() => fetchArticles());
</script>

<template>
  <SiteNavbar variant="moderator" />
  <main class="inner-page min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-7xl">
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/40 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Coconexus / Moderator Konten</p>
          <h1 class="text-3xl font-extrabold tracking-tight text-white">Review Konten Artikel</h1>
          <p class="mt-2 text-sm text-on-surface-variant">Tinjau kualitas dan kepatuhan naskah artikel sebelum lanjut ke tahap publikasi.</p>
        </div>
      </header>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="-translate-y-4 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-4 opacity-0"
      >
        <div v-if="feedback" class="mb-6 rounded-lg border border-sky-500/20 bg-sky-500/10 px-5 py-3 text-sm font-medium text-sky-300">
          {{ feedback }}
        </div>
      </Transition>

      <!-- Stats -->
      <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total</p>
          <strong class="mt-2 block text-3xl font-black text-on-surface">{{ stats.total }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Draft</p>
          <strong class="mt-2 block text-3xl font-black text-amber-400">{{ stats.draft }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Revisi</p>
          <strong class="mt-2 block text-3xl font-black text-orange-400">{{ stats.revision }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Dalam Review</p>
          <strong class="mt-2 block text-3xl font-black text-sky-400">{{ stats.under_review }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Published</p>
          <strong class="mt-2 block text-3xl font-black text-emerald-400">{{ stats.published }}</strong>
        </div>
      </section>

      <!-- Filters -->
      <section class="mb-6 rounded-xl border border-outline-variant/40 bg-stone-800/30 p-5">
        <div class="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <label class="mb-2 block text-sm font-medium text-on-surface-variant">Status</label>
            <select v-model="filters.status" class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400">
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="revision">Revision</option>
              <option value="under_review">Under Review</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-on-surface-variant">Cari Artikel</label>
            <input v-model="filters.search" type="text" placeholder="Cari judul artikel..." class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400" />
          </div>
        </div>
      </section>

      <!-- Table -->
      <section class="rounded-xl border border-outline-variant/40 bg-stone-800/30 overflow-hidden">
        <div class="border-b border-outline-variant/40 bg-stone-800/50 px-5 py-4">
          <h2 class="text-sm font-semibold text-stone-200">Daftar Artikel</h2>
        </div>

        <div v-if="isLoading" class="py-16 text-center text-on-surface-variant">Memuat artikel...</div>
        <div v-else-if="error" class="py-12 text-center text-red-400">{{ error }}</div>
        <div v-else-if="filteredArticles.length === 0" class="py-16 text-center text-stone-500">
          Tidak ada artikel yang cocok dengan filter ini.
        </div>

        <table v-else class="w-full text-left text-sm">
          <thead class="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th class="px-6 py-4 font-medium">Judul</th>
              <th class="px-6 py-4 font-medium">Status</th>
              <th class="px-6 py-4 font-medium">Kategori</th>
              <th class="px-6 py-4 font-medium text-right">Tanggal</th>
              <th class="px-6 py-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-700/50">
            <tr v-for="article in filteredArticles" :key="article.id" class="group transition-colors hover:bg-stone-800/80">
              <td class="px-6 py-4 font-medium text-stone-200">{{ article.title }}</td>
              <td class="px-6 py-4">
                <span :class="{
                  'rounded-md border px-2.5 py-1 text-xs font-medium': true,
                  'border-emerald-500/20 bg-primary/10 text-emerald-400': article.status === 'published',
                  'border-amber-500/20 bg-amber-500/10 text-amber-400': article.status === 'draft',
                  'border-orange-500/20 bg-orange-500/10 text-orange-400': article.status === 'revision',
                  'border-sky-500/20 bg-sky-500/10 text-sky-400': article.status === 'under_review',
                }">
                  {{ article.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-on-surface-variant">{{ article.category?.name || '-' }}</td>
              <td class="px-6 py-4 text-right text-xs text-on-surface-variant">
                {{ new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                  <button @click="router.push({ name: 'article-detail', params: { id: article.id } })" class="rounded px-3 py-1.5 text-xs font-medium bg-stone-700/50 text-on-surface-variant hover:bg-stone-700 transition-colors">
                    Lihat
                  </button>
                  <button v-if="article.status === 'draft' || article.status === 'revision'" @click="updateStatus(article.id, 'under_review')" class="rounded px-3 py-1.5 text-xs font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors">
                    Tandai Review
                  </button>
                  <button v-if="article.status === 'under_review'" @click="updateStatus(article.id, 'revision')" class="rounded px-3 py-1.5 text-xs font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors">
                    Kembalikan
                  </button>
                  <button v-if="article.status === 'under_review'" @click="updateStatus(article.id, 'published')" class="rounded px-3 py-1.5 text-xs font-medium bg-primary/10 text-emerald-400 hover:bg-primary/20 transition-colors">
                    Setujui
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </main>
</template>
