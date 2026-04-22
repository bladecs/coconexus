<script setup>
import { computed, onMounted, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useArticleStore } from '@/stores/articles';
import ArticleCard from '@/components/articles/ArticleCard.vue';

const authStore = useAuthStore();
const articleStore = useArticleStore();
const filters = reactive({
  search: '',
  category: '',
  page: 1,
  limit: 6,
});

const headline = computed(() =>
  authStore.isAuthenticated
    ? `Selamat datang kembali, ${authStore.user?.profile?.full_name || authStore.user?.email}.`
    : 'Repository Pengolahan Limbah Kelapa untuk pembelajaran dan publikasi artikel.'
);

const subHeadline = computed(() =>
  authStore.isAuthenticated
    ? authStore.isAdmin
      ? 'Anda sudah login sebagai admin. Akses ke halaman login akan diarahkan ke dashboard admin oleh route guard.'
      : 'Anda sudah login sebagai user. Halaman login dan register memang tidak akan terbuka lagi sampai Anda logout.'
    : 'Jelajahi artikel pengolahan limbah kelapa, dokumentasi praktik komunitas, dan pembelajaran yang sudah dipublikasikan. Struktur halaman ini sudah terhubung ke endpoint artikel published dari backend.'
);

async function loadPublishedArticles() {
  await articleStore.fetchPublishedArticles(filters);
}

async function applyFilters() {
  filters.page = 1;
  await loadPublishedArticles();
}

async function goToPage(page) {
  filters.page = page;
  await loadPublishedArticles();
}

onMounted(loadPublishedArticles);

function handleLogout() {
  authStore.logout();
}
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-12 text-stone-100">
    <section class="overflow-hidden rounded-[2rem] border border-white/10 bg-coconut-500/95 shadow-soft backdrop-blur">
      <div class="grid gap-8 p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
        <div>
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#ffb084]">
            COCONEXUS
          </p>
          <h1 class="max-w-3xl text-4xl font-bold leading-tight text-stone-50">
            {{ headline }}
          </h1>
          <p class="mt-5 max-w-2xl text-base leading-8 text-stone-300">
            {{ subHeadline }}
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <RouterLink
              v-if="!authStore.isAuthenticated"
              to="/login"
              class="rounded-full bg-[#ff7c35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e86f2f]"
            >
              Buka Halaman Login
            </RouterLink>
            <RouterLink
              v-if="!authStore.isAuthenticated"
              to="/register"
              class="rounded-full border border-white/12 bg-[#3a3a3a] px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-[#444444]"
            >
              Register User
            </RouterLink>
            <RouterLink
              v-if="authStore.isAdmin"
              to="/admin"
              class="rounded-full border border-[#ff7c35]/25 bg-[#3d3028] px-5 py-3 text-sm font-semibold text-[#ffb084] transition hover:bg-[#49362c]"
            >
              Dashboard Admin
            </RouterLink>
            <button
              v-if="authStore.isAuthenticated"
              type="button"
              class="rounded-full border border-white/12 bg-[#3a3a3a] px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-[#444444]"
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
          <div class="rounded-3xl border border-white/8 bg-gradient-to-br from-[#3a2f2a] to-[#2f2f2f] p-6 text-white">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffc39f]">
              Artikel Tersedia
            </p>
            <p class="mt-4 text-4xl font-bold">
              {{ articleStore.publishedArticles.length }}
            </p>
            <p class="mt-2 text-sm leading-7 text-stone-300">
              Seluruh artikel yang tampil di landing page hanya yang berstatus published.
            </p>
          </div>

          <div class="rounded-3xl border border-white/8 bg-[#383838] p-6">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
              Fokus Sistem
            </p>
            <p class="mt-4 text-lg font-bold text-stone-100">
              Repository Pengolahan Limbah Kelapa
            </p>
            <p class="mt-2 text-sm leading-7 text-stone-300">
              Cocok untuk dokumentasi, edukasi, dan kurasi konten berbasis komunitas.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-12">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
            Artikel Publik
          </p>
          <h2 class="mt-2 text-3xl font-bold text-stone-50">
            Baca dan telusuri pengetahuan terbaru
          </h2>
        </div>

        <p class="max-w-xl text-sm leading-7 text-stone-400">
          Halaman ini menjadi landing page sekaligus daftar artikel published sesuai use case diagram Anda.
        </p>
      </div>

      <div class="mt-8 grid gap-4 rounded-[2rem] border border-white/10 bg-[#303030]/95 p-5 shadow-soft md:grid-cols-[minmax(0,1fr)_240px_auto]">
        <input
          v-model="filters.search"
          type="text"
          class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          placeholder="Cari judul atau isi artikel..."
          @keyup.enter="applyFilters"
        />

        <input
          v-model="filters.category"
          type="text"
          class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          placeholder="Filter kategori"
          @keyup.enter="applyFilters"
        />

        <button
          type="button"
          class="rounded-2xl bg-[#ff7c35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e86f2f]"
          @click="applyFilters"
        >
          Terapkan Filter
        </button>
      </div>

      <div v-if="articleStore.isLoading" class="mt-8 rounded-3xl border border-white/8 bg-[#303030] p-6 text-sm text-stone-300 shadow-soft">
        Memuat daftar artikel...
      </div>

      <div v-else-if="articleStore.publishedArticles.length" class="mt-8 grid gap-6 lg:grid-cols-2">
        <ArticleCard
          v-for="article in articleStore.publishedArticles"
          :key="article.id"
          :article="article"
        />
      </div>

      <div
        v-else
        class="mt-8 rounded-3xl border border-dashed border-white/15 bg-[#303030] p-8 text-sm leading-7 text-stone-300 shadow-soft"
      >
        Belum ada artikel yang dipublish.
      </div>

      <div
        v-if="articleStore.publishedMeta.total_pages > 1"
        class="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          type="button"
          class="rounded-full border border-white/12 bg-[#303030] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-[#3a3a3a] disabled:opacity-40"
          :disabled="filters.page <= 1"
          @click="goToPage(filters.page - 1)"
        >
          Sebelumnya
        </button>

        <span class="text-sm font-medium text-stone-300">
          Halaman {{ articleStore.publishedMeta.page }} dari {{ articleStore.publishedMeta.total_pages }}
        </span>

        <button
          type="button"
          class="rounded-full border border-white/12 bg-[#303030] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-[#3a3a3a] disabled:opacity-40"
          :disabled="filters.page >= articleStore.publishedMeta.total_pages"
          @click="goToPage(filters.page + 1)"
        >
          Berikutnya
        </button>
      </div>
    </section>
  </main>
</template>
