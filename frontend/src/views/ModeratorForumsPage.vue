<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const forums = ref([]);
const isLoading = ref(false);
const error = ref(null);
const feedback = ref('');
const filters = reactive({
  status: 'all',
  search: '',
});

const summary = computed(() => ({
  total: forums.value.length,
  draft: forums.value.filter((forum) => forum.status === 'draft').length,
  validated: forums.value.filter((forum) => forum.status === 'validated').length,
  active: forums.value.filter((forum) => forum.status === 'active').length,
  closed: forums.value.filter((forum) => forum.status === 'closed').length,
}));

const filteredForums = computed(() => {
  const keyword = filters.search.trim().toLowerCase();

  return forums.value.filter((forum) => {
    const matchesStatus = filters.status === 'all' || forum.status === filters.status;
    if (!matchesStatus) return false;

    if (!keyword) return true;

    const title = (forum.title || '').toLowerCase();
    const articleTitle = (forum.article?.title || '').toLowerCase();
    const summaryText = (forum.summary || '').toLowerCase();

    return title.includes(keyword) || articleTitle.includes(keyword) || summaryText.includes(keyword);
  });
});

async function fetchForums() {
  isLoading.value = true;
  error.value = null;

  try {
    const params = {};
    if (filters.status !== 'all') {
      params.status = filters.status;
    }

    const { data } = await api.get('/moderator/forum/discussion-forums', { params });
    forums.value = data.data.forums || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function validateForum(id) {
  feedback.value = '';

  try {
    await api.patch(`/moderator/forum/discussion-forums/${id}/validate`, {
      notes: 'Divalidasi dari halaman monitoring forum.',
    });
    feedback.value = 'Forum berhasil divalidasi.';
    await fetchForums();
  } catch (err) {
    feedback.value = err.message;
  }
}

async function activateForum(id) {
  feedback.value = '';

  try {
    await api.patch(`/moderator/forum/discussion-forums/${id}/activate`);
    feedback.value = 'Forum berhasil diaktifkan.';
    await fetchForums();
  } catch (err) {
    feedback.value = err.message;
  }
}

watch(
  () => filters.status,
  () => {
    fetchForums();
  }
);

onMounted(() => {
  fetchForums();
});
</script>

<template>
  <SiteNavbar variant="moderator" />
  <main class="inner-page min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-7xl">
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/40 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Coconexus / Forum Monitoring</p>
          <h1 class="text-3xl font-extrabold tracking-tight text-white">Pantau Forum Diskusi</h1>
          <p class="mt-2 max-w-3xl text-sm text-on-surface-variant">
            Halaman ini menampilkan forum yang dibentuk moderator dari komentar terpilih. Komentar sumber tetap ada, tetapi forum adalah entitas kurasi yang terpisah.
          </p>
        </div>
      </header>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div
          v-if="feedback"
          class="mb-6 rounded-lg border border-sky-500/20 bg-sky-500/10 px-5 py-3 text-sm font-medium text-sky-300"
        >
          {{ feedback }}
        </div>
      </Transition>

      <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total</p>
          <strong class="mt-2 block text-3xl font-black text-on-surface">{{ summary.total }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Draft</p>
          <strong class="mt-2 block text-3xl font-black text-amber-400">{{ summary.draft }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Validated</p>
          <strong class="mt-2 block text-3xl font-black text-sky-400">{{ summary.validated }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Active</p>
          <strong class="mt-2 block text-3xl font-black text-emerald-400">{{ summary.active }}</strong>
        </div>
        <div class="rounded-xl border border-outline-variant/40 bg-stone-800/50 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Closed</p>
          <strong class="mt-2 block text-3xl font-black text-on-surface-variant">{{ summary.closed }}</strong>
        </div>
      </section>

      <section class="mb-8 rounded-xl border border-outline-variant/40 bg-stone-800/30 p-5">
        <div class="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
          <div>
            <label class="mb-2 block text-sm font-medium text-on-surface-variant">Status Forum</label>
            <select
              v-model="filters.status"
              class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="validated">Validated</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-on-surface-variant">Cari Forum</label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari judul forum, artikel asal, atau ringkasan..."
              class="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-stone-400"
            />
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div v-if="isLoading" class="rounded-xl border border-dashed border-outline-variant/40 py-16 text-center text-on-surface-variant">
          Memuat forum diskusi...
        </div>

        <div v-else-if="error" class="rounded-xl border border-dashed border-red-500/30 bg-red-500/5 py-12 text-center text-red-400">
          {{ error }}
        </div>

        <div v-else-if="filteredForums.length === 0" class="rounded-xl border border-dashed border-outline-variant/40 py-16 text-center text-stone-500">
          Belum ada forum diskusi yang cocok dengan filter ini.
        </div>

        <article
          v-for="forum in filteredForums"
          :key="forum.id"
          class="rounded-xl border border-outline-variant/40 bg-stone-800/30 p-5"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {{ forum.article?.title || 'Artikel tidak ditemukan' }}
              </p>
              <h2 class="mt-2 text-xl font-bold text-on-surface">{{ forum.title }}</h2>
              <p v-if="forum.summary" class="mt-2 max-w-4xl text-sm text-on-surface-variant">
                {{ forum.summary }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2 text-xs">
                <span class="rounded-full border border-outline-variant/40 px-3 py-1 text-on-surface-variant">
                  Status: {{ forum.status }}
                </span>
                <span class="rounded-full border border-outline-variant/40 px-3 py-1 text-on-surface-variant">
                  Sumber komentar: {{ forum.source_comments?.length || 0 }}
                </span>
                <span class="rounded-full border border-outline-variant/40 px-3 py-1 text-on-surface-variant">
                  Dibuat oleh: {{ forum.creator?.profile?.full_name || forum.creator?.email || '-' }}
                </span>
                <span v-if="forum.validator" class="rounded-full border border-outline-variant/40 px-3 py-1 text-on-surface-variant">
                  Diverifikasi oleh: {{ forum.validator?.profile?.full_name || forum.validator?.email || '-' }}
                </span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-if="forum.status === 'draft'"
                type="button"
                class="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-300 transition hover:bg-sky-500 hover:text-white"
                @click="validateForum(forum.id)"
              >
                Validasi
              </button>
              <button
                v-if="forum.status === 'validated'"
                type="button"
                class="rounded-lg border border-emerald-500/30 bg-primary/10 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:bg-primary hover:text-white"
                @click="activateForum(forum.id)"
              >
                Aktifkan
              </button>
            </div>
          </div>

          <div v-if="forum.source_comments?.length" class="mt-4 rounded-lg border border-outline-variant/40 bg-surface-container p-4">
            <p class="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Komentar Sumber</p>
            <ul class="space-y-2">
              <li
                v-for="item in forum.source_comments"
                :key="item.id"
                class="rounded-lg border border-stone-800 bg-stone-800/60 px-4 py-3 text-sm text-on-surface-variant"
              >
                <strong class="text-on-surface">#{{ item.comment_id }}</strong>
                <span class="ml-2">{{ item.comment?.body || 'Komentar tidak tersedia' }}</span>
              </li>
            </ul>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
