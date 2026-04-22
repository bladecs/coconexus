<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { resolveAssetUrl } from '@/lib/assets';

const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
  showStatus: {
    type: Boolean,
    default: false,
  },
});

const excerpt = computed(() => {
  const text = props.article?.detail?.meta_description || props.article?.detail?.body_content || '';
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
});

const heroMedia = computed(() =>
  props.article?.media?.find((item) => item.media_type === 'image') || props.article?.media?.[0] || null
);
</script>

<template>
  <article class="group flex h-full flex-col rounded-3xl border border-white/10 bg-[#303030]/95 p-6 shadow-soft transition hover:-translate-y-1 hover:border-[#ff7c35]/40">
    <div
      v-if="heroMedia"
      class="mb-5 overflow-hidden rounded-3xl border border-white/8 bg-[#3a3a3a]"
    >
      <img
        v-if="heroMedia.media_type === 'image'"
        :src="resolveAssetUrl(heroMedia.file_path)"
        :alt="article.title"
        class="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <div v-else class="flex h-52 items-center justify-center bg-[#3b312d] text-sm font-semibold uppercase tracking-[0.2em] text-[#ffb084]">
        {{ heroMedia.media_type }}
      </div>
    </div>

    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
          {{ article.category?.name || 'Tanpa Kategori' }}
        </p>
        <h3 class="mt-3 text-xl font-bold leading-snug text-stone-100">
          {{ article.title }}
        </h3>
      </div>

      <StatusBadge v-if="showStatus" :status="article.status" />
    </div>

    <p class="mt-4 flex-1 text-sm leading-7 text-stone-300">
      {{ excerpt }}
    </p>

    <div class="mt-6 flex items-center justify-between gap-4 border-t border-white/8 pt-4">
      <div>
        <p class="text-sm font-semibold text-stone-100">
          {{ article.author?.profile?.full_name || article.author?.email || 'Penulis' }}
        </p>
        <p class="text-xs uppercase tracking-[0.2em] text-stone-500">
          Versi {{ article.version }}
        </p>
      </div>

      <RouterLink
        :to="`/articles/${article.id}`"
        class="rounded-full bg-[#ff7c35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e86f2f]"
      >
        Baca Detail
      </RouterLink>
    </div>
  </article>
</template>
