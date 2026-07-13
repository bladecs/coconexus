<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const forums = ref([]);
const publishedArticles = ref([]);
const isLoading = ref(false);
const error = ref(null);
const feedback = ref('');
const filters = reactive({
  status: 'all',
  search: '',
});
const newTopicForm = reactive({
  articleId: '',
  title: '',
  summary: '',
});
const isCreatingTopic = ref(false);

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

async function fetchPublishedArticles() {
  try {
    const { data } = await api.get('/articles/published', { params: { limit: 100 } });
    publishedArticles.value = data.data.articles || [];
  } catch (err) {
    publishedArticles.value = [];
  }
}

async function createTopicFromScratch() {
  feedback.value = '';

  if (!newTopicForm.articleId) {
    feedback.value = 'Pilih artikel sebagai dasar topik forum.';
    return;
  }
  if (!newTopicForm.title.trim()) {
    feedback.value = 'Judul topik forum wajib diisi.';
    return;
  }

  isCreatingTopic.value = true;
  try {
    await api.post('/moderator/forum/discussion-forums', {
      article_id: Number(newTopicForm.articleId),
      title: newTopicForm.title.trim(),
      summary: newTopicForm.summary.trim(),
      comment_ids: [],
    });
    feedback.value = 'Topik forum baru berhasil dibuat.';
    newTopicForm.articleId = '';
    newTopicForm.title = '';
    newTopicForm.summary = '';
    await fetchForums();
  } catch (err) {
    feedback.value = err.response?.data?.message || err.message;
  } finally {
    isCreatingTopic.value = false;
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
  fetchPublishedArticles();
});
</script>

<template>
  <SiteNavbar variant="moderator" />
  <main class="inner-page moderator-workspace min-h-screen px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10">
    <section class="mx-auto max-w-7xl">

      <!-- ── Header ── -->
      <header class="mb-8 flex flex-col gap-4 border-b border-outline-variant/30 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-indigo-400" style="font-size:15px">forum</span>
            <p class="text-xs font-bold uppercase tracking-widest text-indigo-400/80">Coconexus / Forum Monitoring</p>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-on-surface">Pantau Forum Diskusi</h1>
          <p class="mt-1 max-w-3xl text-sm text-on-surface-variant">Forum kurasi dari komentar terpilih — terpisah dari komentar sumber aslinya</p>
        </div>
        <button @click="fetchForums" class="inline-flex items-center gap-2 self-start rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:self-auto">
          <span class="material-symbols-outlined" style="font-size:16px">refresh</span>
          Refresh
        </button>
      </header>

      <!-- ── Feedback ── -->
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="feedback" class="mb-6 flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-300">
          <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">info</span>
          {{ feedback }}
        </div>
      </Transition>

      <!-- ── Buat Topik Forum Baru ── -->
      <section class="mb-8 overflow-hidden rounded-2xl border border-outline-variant/30">
        <div class="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container px-5 py-3.5">
          <span class="material-symbols-outlined text-indigo-400" style="font-size:16px">add_circle</span>
          <h2 class="text-sm font-bold text-on-surface">Buat Topik Forum Baru</h2>
        </div>
        <p class="mx-5 mt-4 text-xs text-on-surface-variant">Membuka topik forum langsung tanpa perlu mengurasi komentar yang sudah ada.</p>
        <form @submit.prevent="createTopicFromScratch" class="grid gap-3 p-5 sm:grid-cols-2">
          <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
            <span class="material-symbols-outlined text-on-surface-variant shrink-0" style="font-size:15px">article</span>
            <select v-model="newTopicForm.articleId" class="flex-1 bg-transparent text-sm text-on-surface outline-none">
              <option value="" disabled>Pilih artikel...</option>
              <option v-for="article in publishedArticles" :key="article.id" :value="article.id">{{ article.title }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
            <span class="material-symbols-outlined text-on-surface-variant shrink-0" style="font-size:15px">title</span>
            <input v-model="newTopicForm.title" type="text" class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" placeholder="Judul topik forum" />
          </div>
          <div class="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 sm:col-span-2">
            <textarea v-model="newTopicForm.summary" rows="2" class="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" placeholder="Ringkasan topik (opsional)"></textarea>
          </div>
          <button type="submit" :disabled="isCreatingTopic" class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2 sm:w-fit">
            <span class="material-symbols-outlined" style="font-size:16px">{{ isCreatingTopic ? 'progress_activity' : 'add_circle' }}</span>
            {{ isCreatingTopic ? 'Membuat...' : 'Buat Topik Forum' }}
          </button>
        </form>
      </section>

      <!-- ── Stats ── -->
      <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div class="forum-stat-card">
          <span class="material-symbols-outlined forum-stat-icon text-on-surface-variant">forum</span>
          <p class="forum-stat-label">Total</p>
          <strong class="forum-stat-value text-on-surface">{{ summary.total }}</strong>
        </div>
        <div class="forum-stat-card">
          <span class="material-symbols-outlined forum-stat-icon text-amber-400">draft</span>
          <p class="forum-stat-label">Draft</p>
          <strong class="forum-stat-value text-amber-400">{{ summary.draft }}</strong>
        </div>
        <div class="forum-stat-card">
          <span class="material-symbols-outlined forum-stat-icon text-sky-400">verified</span>
          <p class="forum-stat-label">Validated</p>
          <strong class="forum-stat-value text-sky-400">{{ summary.validated }}</strong>
        </div>
        <div class="forum-stat-card">
          <span class="material-symbols-outlined forum-stat-icon text-emerald-400">play_circle</span>
          <p class="forum-stat-label">Active</p>
          <strong class="forum-stat-value text-emerald-400">{{ summary.active }}</strong>
        </div>
        <div class="forum-stat-card">
          <span class="material-symbols-outlined forum-stat-icon text-on-surface-variant">lock</span>
          <p class="forum-stat-label">Closed</p>
          <strong class="forum-stat-value text-on-surface-variant">{{ summary.closed }}</strong>
        </div>
      </section>

      <!-- ── Filter ── -->
      <section class="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 sm:w-52">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">filter_list</span>
            <select v-model="filters.status" class="flex-1 bg-transparent text-sm text-on-surface outline-none">
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="validated">Validated</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div class="flex flex-1 items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">search</span>
            <input v-model="filters.search" type="text" placeholder="Cari judul forum, artikel asal, atau ringkasan..." class="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50" />
          </div>
          <p class="shrink-0 text-xs text-on-surface-variant"><span class="font-bold text-on-surface">{{ filteredForums.length }}</span> forum</p>
        </div>
      </section>

      <!-- ── Forum Cards ── -->
      <section class="space-y-4">
        <div v-if="isLoading" class="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-outline-variant/30 py-16 text-on-surface-variant">
          <span class="material-symbols-outlined animate-spin" style="font-size:20px">progress_activity</span>
          <span class="text-sm">Memuat forum diskusi...</span>
        </div>

        <div v-else-if="error" class="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-red-500/30 bg-red-500/5 py-12 text-red-400">
          <span class="material-symbols-outlined" style="font-size:18px">error</span>
          <span class="text-sm">{{ error }}</span>
        </div>

        <div v-else-if="filteredForums.length === 0" class="rounded-2xl border border-dashed border-outline-variant/30 py-20 text-center">
          <span class="material-symbols-outlined mb-3 block text-5xl text-outline-variant">forum</span>
          <p class="font-semibold text-on-surface-variant">Belum ada forum yang cocok dengan filter ini</p>
        </div>

        <article v-for="forum in filteredForums" :key="forum.id" class="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest transition-colors hover:border-indigo-500/20">
          <div class="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex items-center gap-2">
                <span class="forum-status-badge" :class="{
                  'forum-status--draft': forum.status === 'draft',
                  'forum-status--validated': forum.status === 'validated',
                  'forum-status--active': forum.status === 'active',
                  'forum-status--closed': forum.status === 'closed',
                }">
                  <span class="material-symbols-outlined" style="font-size:10px;font-variation-settings:'FILL' 1">
                    {{ forum.status === 'active' ? 'play_circle' : forum.status === 'validated' ? 'verified' : forum.status === 'closed' ? 'lock' : 'draft' }}
                  </span>
                  {{ forum.status === 'draft' ? 'Draft' : forum.status === 'validated' ? 'Validated' : forum.status === 'active' ? 'Active' : 'Closed' }}
                </span>
                <p class="text-xs text-on-surface-variant">{{ forum.article?.title || 'Artikel tidak ditemukan' }}</p>
              </div>
              <h2 class="text-lg font-bold text-on-surface">{{ forum.title }}</h2>
              <p v-if="forum.summary" class="mt-1.5 max-w-3xl text-sm text-on-surface-variant">{{ forum.summary }}</p>

              <div class="mt-3 flex flex-wrap gap-2">
                <span class="forum-meta-chip">
                  <span class="material-symbols-outlined" style="font-size:11px">comment</span>
                  {{ forum.source_comments?.length || 0 }} sumber komentar
                </span>
                <span class="forum-meta-chip">
                  <span class="material-symbols-outlined" style="font-size:11px">person</span>
                  {{ forum.creator?.profile?.full_name || forum.creator?.email || '—' }}
                </span>
                <span v-if="forum.validator" class="forum-meta-chip">
                  <span class="material-symbols-outlined" style="font-size:11px">verified_user</span>
                  Diverifikasi: {{ forum.validator?.profile?.full_name || forum.validator?.email || '—' }}
                </span>
              </div>
            </div>

            <div class="flex shrink-0 gap-2">
              <button v-if="forum.status === 'draft'" type="button" @click="validateForum(forum.id)" class="forum-action-btn forum-action--validate">
                <span class="material-symbols-outlined" style="font-size:14px">verified</span>
                Validasi
              </button>
              <button v-if="forum.status === 'validated'" type="button" @click="activateForum(forum.id)" class="forum-action-btn forum-action--activate">
                <span class="material-symbols-outlined" style="font-size:14px">play_circle</span>
                Aktifkan
              </button>
            </div>
          </div>

          <div v-if="forum.source_comments?.length" class="border-t border-outline-variant/20 bg-surface-container px-5 pb-4 pt-3">
            <p class="mb-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Komentar Sumber</p>
            <ul class="space-y-2">
              <li v-for="item in forum.source_comments" :key="item.id" class="rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface-variant">
                <span class="mr-2 font-semibold text-on-surface">#{{ item.comment_id }}</span>
                {{ item.comment?.body || 'Komentar tidak tersedia' }}
              </li>
            </ul>
          </div>
        </article>
      </section>

    </section>
  </main>
</template>

<style scoped>
.forum-stat-card {
  border-radius: 1rem;
  border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-lowest));
  padding: 1.1rem 1.25rem;
  display: flex; flex-direction: column; gap: 0.35rem;
  transition: border-color 0.2s;
}
.forum-stat-card:hover { border-color: rgb(99 102 241 / 0.25); }
.forum-stat-icon { font-size: 1.25rem; }
.forum-stat-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(var(--color-on-surface-variant)); }
.forum-stat-value { font-size: 2rem; font-weight: 900; line-height: 1; display: block; }

.forum-status-badge {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.2rem 0.6rem; border-radius: 9999px;
  font-size: 0.7rem; font-weight: 700; border: 1px solid transparent;
}
.forum-status--draft     { background: rgb(245 158 11 / 0.12); color: rgb(251 191 36); border-color: rgb(245 158 11 / 0.25); }
.forum-status--validated { background: rgb(14 165 233 / 0.12); color: rgb(56 189 248); border-color: rgb(14 165 233 / 0.25); }
.forum-status--active    { background: rgb(16 185 129 / 0.12); color: rgb(52 211 153); border-color: rgb(16 185 129 / 0.25); }
.forum-status--closed    { background: rgb(var(--color-outline-variant) / 0.15); color: rgb(var(--color-on-surface-variant)); border-color: rgb(var(--color-outline-variant) / 0.3); }

.forum-meta-chip {
  display: inline-flex; align-items: center; gap: 0.3rem;
  border-radius: 9999px; border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  padding: 0.2rem 0.65rem;
  font-size: 0.7rem; color: rgb(var(--color-on-surface-variant));
}

.forum-action-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 0.9rem; border-radius: 0.6rem; border: 1px solid transparent;
  font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: background-color 0.15s;
}
.forum-action--validate { background: rgb(14 165 233 / 0.1); color: rgb(56 189 248); border-color: rgb(14 165 233 / 0.25); }
.forum-action--validate:hover { background: rgb(14 165 233 / 0.2); }
.forum-action--activate { background: rgb(16 185 129 / 0.1); color: rgb(52 211 153); border-color: rgb(16 185 129 / 0.25); }
.forum-action--activate:hover { background: rgb(16 185 129 / 0.2); }
</style>
