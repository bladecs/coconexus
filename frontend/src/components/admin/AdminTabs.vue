<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const tabs = [
  { key: 'articles', label: 'Artikel' },
  { key: 'users', label: 'User' },
  { key: 'categories', label: 'Kategori' },
  { key: 'comments', label: 'Komentar' },
];
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="rounded-full px-4 py-2 text-sm font-semibold transition"
      :class="
        modelValue === tab.key
          ? 'bg-[#ff7c35] text-white'
          : 'border border-white/12 bg-[#303030] text-stone-200 hover:bg-[#3a3a3a]'
      "
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
