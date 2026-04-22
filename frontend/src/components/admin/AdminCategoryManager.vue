<script setup>
import { reactive } from 'vue';

const props = defineProps({
  categories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['create', 'update', 'delete']);

const form = reactive({
  name: '',
  description: '',
});

function submit() {
  emit('create', { ...form });
  form.name = '';
  form.description = '';
}
</script>

<template>
  <section class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
    <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">Manage Tags / Category</p>
    <h2 class="mt-2 text-2xl font-bold text-stone-50">Kelola Kategori Artikel</h2>

    <div class="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
      <input
        v-model="form.name"
        type="text"
        class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
        placeholder="Nama kategori"
      />
      <input
        v-model="form.description"
        type="text"
        class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
        placeholder="Deskripsi kategori"
      />
      <button
        type="button"
        class="rounded-2xl bg-[#ff7c35] px-4 py-3 text-sm font-semibold text-white"
        @click="submit"
      >
        Tambah
      </button>
    </div>

    <div class="mt-6 space-y-4">
      <div
        v-for="category in categories"
        :key="category.id"
        class="flex flex-col gap-4 rounded-3xl border border-white/8 bg-[#383838] p-5 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p class="text-lg font-bold text-stone-100">{{ category.name }}</p>
          <p class="mt-1 text-sm text-stone-400">{{ category.description || 'Tanpa deskripsi' }}</p>
          <p class="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">{{ category.article_count }} artikel</p>
        </div>

        <button
          type="button"
          class="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200"
          @click="$emit('delete', category.id)"
        >
          Hapus
        </button>
      </div>
    </div>
  </section>
</template>
