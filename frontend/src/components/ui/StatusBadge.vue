<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    default: 'draft',
  },
});

const classes = computed(() => {
  if (props.status === 'published') {
    return 'bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-500/20';
  }

  if (props.status === 'revision') {
    return 'bg-[#ff7c35]/12 text-[#ffc39f] ring-1 ring-[#ff7c35]/20';
  }

  return 'bg-white/8 text-stone-200 ring-1 ring-white/10';
});

const label = computed(() => {
  if (props.status === 'published') {
    return 'Published';
  }

  if (props.status === 'revision') {
    return 'Revision';
  }

  return 'Draft';
});
</script>

<template>
  <span :class="classes" class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
    {{ label }}
  </span>
</template>
