<script setup>
import { reactive } from 'vue';

const props = defineProps({
  comments: { type: Array, default: () => [] },
  meta: { type: Object, default: () => ({ page: 1, total_pages: 1 }) },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['search', 'page', 'delete']);

const filters = reactive({
  search: '',
});

function submitSearch() {
  emit('search', { ...filters, page: 1, limit: 10 });
}
</script>

<template>
  <section class="premium-panel p-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">Manage Comment</p>
        <h2 class="mt-2 text-2xl font-bold text-stone-50">Moderasi Komentar</h2>
      </div>

      <div class="flex gap-3">
        <input
          v-model="filters.search"
          type="text"
          class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          placeholder="Cari isi komentar..."
          @keyup.enter="submitSearch"
        />
        <button
          type="button"
          class="rounded-2xl bg-[#ff7c35] px-4 py-3 text-sm font-semibold text-white"
          @click="submitSearch"
        >
          Cari
        </button>
      </div>
    </div>

    <div class="mt-6 space-y-4">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="rounded-3xl border border-white/8 bg-[#383838] p-5"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="text-sm font-semibold text-stone-100">
              {{ comment.user?.profile?.full_name || comment.user?.email }}
            </p>
            <p class="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
              Artikel: {{ comment.article?.title || 'Tidak diketahui' }}
            </p>
            <p class="mt-3 text-sm leading-7 text-stone-300">{{ comment.body }}</p>
          </div>

          <button
            type="button"
            class="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200"
            @click="$emit('delete', comment.id)"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>

    <div v-if="meta.total_pages > 1" class="mt-6 flex items-center justify-between">
      <button
        type="button"
        class="rounded-full border border-white/12 bg-[#383838] px-4 py-2 text-sm font-semibold text-stone-200 disabled:opacity-40"
        :disabled="meta.page <= 1"
        @click="$emit('page', meta.page - 1)"
      >
        Sebelumnya
      </button>
      <span class="text-sm text-stone-300">Halaman {{ meta.page }} dari {{ meta.total_pages }}</span>
      <button
        type="button"
        class="rounded-full border border-white/12 bg-[#383838] px-4 py-2 text-sm font-semibold text-stone-200 disabled:opacity-40"
        :disabled="meta.page >= meta.total_pages"
        @click="$emit('page', meta.page + 1)"
      >
        Berikutnya
      </button>
    </div>
  </section>
</template>
