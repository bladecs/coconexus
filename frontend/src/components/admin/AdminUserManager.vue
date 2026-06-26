<script setup>
import { reactive } from 'vue';

const props = defineProps({
  users: { type: Array, default: () => [] },
  meta: { type: Object, default: () => ({ page: 1, total_pages: 1 }) },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['search', 'page', 'update', 'delete']);

const filters = reactive({
  search: '',
});

function submitSearch() {
  emit('search', { ...filters, page: 1, limit: 10 });
}

function handleRoleToggle(user) {
  emit('update', {
    id: user.id,
    payload: {
      role: user.role === 'admin' ? 'user' : 'admin',
      full_name: user.profile?.full_name || user.email,
      bio: user.profile?.bio || '',
      avatar_url: user.profile?.avatar_url || null,
    },
  });
}
</script>

<template>
  <section class="premium-panel p-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">Manage User</p>
        <h2 class="mt-2 text-2xl font-bold text-stone-50">Kelola Pengguna Sistem</h2>
      </div>

      <div class="flex gap-3">
        <input
          v-model="filters.search"
          type="text"
          class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          placeholder="Cari nama atau email..."
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
        v-for="user in users"
        :key="user.id"
        class="flex flex-col gap-4 rounded-3xl border border-white/8 bg-[#383838] p-5 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p class="text-lg font-bold text-stone-100">
            {{ user.profile?.full_name || user.email }}
          </p>
          <p class="mt-1 text-sm text-stone-400">{{ user.email }}</p>
          <p class="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">{{ user.role }}</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-full border border-[#ff7c35]/20 bg-[#3b312d] px-4 py-2 text-sm font-semibold text-[#ffb084]"
            @click="handleRoleToggle(user)"
          >
            {{ user.role === 'admin' ? 'Turunkan ke User' : 'Naikkan ke Admin' }}
          </button>
          <button
            type="button"
            class="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200"
            @click="$emit('delete', user.id)"
          >
            Soft Delete
          </button>
        </div>
      </div>

      <div
        v-if="!users.length && !loading"
        class="rounded-3xl border border-dashed border-white/15 bg-[#383838] p-6 text-sm text-stone-400"
      >
        Tidak ada user yang cocok dengan filter.
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
