<script setup>
import { ref, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import api from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assets';

const props = defineProps({
  articleId: { type: Number, required: true },
});

const articles = ref([]);
const loading  = ref(false);

const TYPE_LABEL = {
  main: 'Wawasan', detail: 'Wawasan',
  prosedur: 'Prosedur', panduan: 'Panduan',
  referensi: 'Referensi', studi_kasus: 'Studi Kasus',
  troubleshooting: 'Troubleshoot',
};
const TYPE_ICON = {
  main: 'auto_stories', detail: 'auto_stories',
  prosedur: 'checklist', panduan: 'menu_book',
  referensi: 'library_books', studi_kasus: 'science',
  troubleshooting: 'build_circle',
};

function getImage(article) {
  const m = article?.media?.find(x => x.media_type === 'image') || article?.media?.[0];
  return m?.media_type === 'image' ? resolveAssetUrl(m.file_path) : null;
}

function getExcerpt(article) {
  const raw = article?.summary || article?.detail?.meta_description || '';
  const clean = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > 90 ? `${clean.slice(0, 90)}…` : clean;
}

async function load() {
  if (!props.articleId) return;
  loading.value = true;
  try {
    const { data } = await api.get(`/articles/published/${props.articleId}/related`);
    articles.value = data.data.articles || [];
  } catch {
    articles.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.articleId, load);
</script>

<template>
  <section v-if="loading || articles.length" class="mt-10 pt-8 border-t border-outline-variant/40">
    <div class="flex items-center gap-2 mb-5">
      <span class="material-symbols-outlined text-primary" style="font-size:20px;font-variation-settings:'FILL' 1">auto_awesome</span>
      <h2 class="font-display text-lg font-bold text-on-surface">Artikel Terkait</h2>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="i in 2" :key="i" class="h-28 rounded-2xl bg-surface-container animate-pulse" />
    </div>

    <!-- Cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <RouterLink
        v-for="article in articles"
        :key="article.id"
        :to="`/articles/${article.id}`"
        class="flex gap-3 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/30 hover:bg-primary/4 transition-all group"
      >
        <!-- Thumbnail -->
        <div class="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-surface-container">
          <img
            v-if="getImage(article)"
            :src="getImage(article)"
            :alt="article.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="material-symbols-outlined text-outline-variant" style="font-size:28px;font-variation-settings:'FILL' 1">
              {{ TYPE_ICON[article.article_type] || 'article' }}
            </span>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="material-symbols-outlined text-secondary" style="font-size:12px;font-variation-settings:'FILL' 1">
              {{ TYPE_ICON[article.article_type] || 'article' }}
            </span>
            <span class="text-xs font-semibold text-secondary uppercase tracking-wide">
              {{ TYPE_LABEL[article.article_type] || 'Artikel' }}
            </span>
          </div>
          <h3 class="text-sm font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
            {{ article.title }}
          </h3>
          <p class="text-xs text-on-surface-variant line-clamp-2">{{ getExcerpt(article) }}</p>
        </div>
      </RouterLink>
    </div>
  </section>
</template>
