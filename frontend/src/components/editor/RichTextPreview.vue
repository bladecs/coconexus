<script setup>
import { computed } from 'vue';
import { renderSimpleRichText } from '@/lib/richText';

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
});

const rendered = computed(() => renderSimpleRichText(props.content));
</script>

<template>
  <div class="premium-card p-5">
    <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
      Preview Konten
    </p>
    <div
      class="rich-preview mt-4 min-h-[280px] rounded-2xl border border-white/8 bg-[#303030] p-5 text-stone-200"
      v-html="rendered || '<p>Preview artikel akan muncul di sini.</p>'"
    />
  </div>
</template>

<style scoped>
.rich-preview :deep(h1) {
  margin: 0 0 1rem;
  font-size: 2rem;
  font-weight: 700;
  color: #fff7f0;
}

.rich-preview :deep(h2) {
  margin: 1.25rem 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffe1d0;
}

.rich-preview :deep(h3) {
  margin: 1rem 0 0.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffc39f;
}

.rich-preview :deep(p) {
  margin: 0 0 0.9rem;
  line-height: 1.9;
}

.rich-preview :deep(ul) {
  margin: 0 0 1rem 1.25rem;
  padding: 0;
}

.rich-preview :deep(li) {
  margin-bottom: 0.4rem;
  line-height: 1.8;
}
</style>
