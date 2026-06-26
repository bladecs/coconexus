<script setup>
import { computed } from 'vue';
import { renderSimpleRichText } from '@/lib/richText';

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
  dark: {
    type: Boolean,
    default: false,
  },
});

const rendered = computed(() => renderSimpleRichText(props.content));

const html = computed(() =>
  rendered.value ||
  `<p class="${props.dark ? 'text-stone-400' : 'text-on-surface-variant'} italic">Belum ada konten.</p>`
);
</script>

<template>
  <div>
    <p v-if="showLabel" class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
      Preview Konten
    </p>
    <div
      class="rich-preview text-sm leading-relaxed"
      :class="dark ? 'rich-preview--dark' : 'text-on-surface'"
      v-html="html"
    />
  </div>
</template>

<style scoped>
/* Light prose — uses CSS vars so dark mode is automatic */
.rich-preview :deep(h1) {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--color-primary));
  line-height: 1.3;
}
.rich-preview :deep(h2) {
  margin: 1.25rem 0 0.6rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: rgb(var(--color-primary));
  line-height: 1.3;
}
.rich-preview :deep(h3) {
  margin: 1rem 0 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: rgb(var(--color-primary));
}
.rich-preview :deep(p) {
  margin: 0 0 0.9rem;
  line-height: 1.85;
  color: rgb(var(--color-on-surface));
}
.rich-preview :deep(ul) {
  margin: 0 0 0.9rem 1.25rem;
  padding: 0;
  list-style-type: disc;
  color: rgb(var(--color-on-surface));
}
.rich-preview :deep(ol) {
  margin: 0 0 0.9rem 1.25rem;
  padding: 0;
  list-style-type: decimal;
  color: rgb(var(--color-on-surface));
}
.rich-preview :deep(.dash-list) {
  list-style-type: '- ';
}
.rich-preview :deep(li) {
  margin-bottom: 0.35rem;
  line-height: 1.8;
}
.rich-preview :deep(strong) {
  font-weight: 700;
  color: rgb(var(--color-on-surface));
}
.rich-preview :deep(em) {
  font-style: italic;
  color: rgb(var(--color-on-surface-variant));
}
.rich-preview :deep(u) {
  text-underline-offset: 0.18em;
}
.rich-preview :deep(blockquote) {
  border-left: 3px solid rgb(var(--color-primary));
  padding: 0.5em 1em;
  margin: 1em 0;
  color: rgb(var(--color-on-surface-variant));
  font-style: italic;
  background: rgb(var(--color-primary) / 0.04);
  border-radius: 0 8px 8px 0;
}
.rich-preview :deep(code) {
  background: rgb(var(--color-primary) / 0.07);
  border-radius: 4px;
  padding: 0.15em 0.4em;
  font-size: 0.85em;
  color: rgb(var(--color-primary));
  font-family: monospace;
}
.rich-preview :deep(pre) {
  background: rgb(var(--color-surface-container-low));
  border-radius: 8px;
  padding: 1em;
  overflow-x: auto;
  margin: 0.8em 0;
  border: 1px solid rgb(var(--color-outline-variant));
}
.rich-preview :deep(a) {
  color: rgb(var(--color-primary));
  text-decoration: underline;
  text-underline-offset: 2px;
}
.rich-preview :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.5em 0;
}

/* Dark variant — used only in admin editor (dark prop) — hardcoded to orange theme */
.rich-preview--dark :deep(h1),
.rich-preview--dark :deep(h2),
.rich-preview--dark :deep(h3) { color: #fff7f0; }
.rich-preview--dark :deep(p)  { color: #d0c3ba; }
.rich-preview--dark :deep(ul),
.rich-preview--dark :deep(ol),
.rich-preview--dark :deep(li) { color: #c0b3aa; }
.rich-preview--dark :deep(strong) { color: #fff7f0; }
.rich-preview--dark :deep(em)     { color: #a09590; }
.rich-preview--dark :deep(blockquote) {
  border-left-color: #ffb083;
  background: rgba(255,123,51,.05);
  color: #b0a49c;
}
.rich-preview--dark :deep(code)   { background: rgba(255,255,255,.08); color: #ffb083; }
.rich-preview--dark :deep(pre)    { background: rgba(0,0,0,.2); border-color: rgba(255,255,255,.1); }
.rich-preview--dark :deep(a)      { color: #ffb083; }
</style>
