<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useRatingStore } from '@/stores/rating';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  articleId: { type: Number, required: true },
});

const ratingStore = useRatingStore();
const authStore   = useAuthStore();

const hoveredStar = ref(0);

const data      = computed(() => ratingStore.getRating(props.articleId));
const average   = computed(() => data.value.average || 0);
const count     = computed(() => data.value.count || 0);
const myRating  = computed(() => data.value.user_rating || 0);
const canRate   = computed(() => authStore.isAuthenticated);

function starFill(star) {
  const active = hoveredStar.value || myRating.value;
  if (active) return star <= active ? 1 : 0;
  if (average.value >= star) return 1;
  if (average.value >= star - 0.5) return 0.5;
  return 0;
}

async function submitRating(star) {
  if (!canRate.value) return;
  await ratingStore.rateArticle(props.articleId, star);
}

onMounted(() => {
  ratingStore.fetchRating(props.articleId);
});
</script>

<template>
  <div class="rating-widget">
    <div class="flex items-center gap-2 mb-2">
      <span class="material-symbols-outlined text-secondary" style="font-size:18px;font-variation-settings:'FILL' 1">star</span>
      <span class="text-sm font-bold text-on-surface">Nilai Artikel Ini</span>
    </div>

    <div class="flex items-center gap-3 flex-wrap">
      <!-- Stars -->
      <div
        class="flex items-center gap-0.5"
        :class="canRate ? 'cursor-pointer' : 'cursor-default'"
        @mouseleave="hoveredStar = 0"
      >
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          class="star-btn"
          :class="!canRate && 'pointer-events-none'"
          :aria-label="`Nilai ${star} bintang`"
          @mouseenter="canRate && (hoveredStar = star)"
          @click="submitRating(star)"
        >
          <!-- Full star -->
          <span
            v-if="starFill(star) === 1"
            class="material-symbols-outlined"
            :class="(hoveredStar || myRating) ? 'text-amber-400' : 'text-amber-400'"
            style="font-size:26px;font-variation-settings:'FILL' 1"
          >star</span>
          <!-- Half star -->
          <span
            v-else-if="starFill(star) === 0.5"
            class="material-symbols-outlined text-amber-400"
            style="font-size:26px;font-variation-settings:'FILL' 1"
          >star_half</span>
          <!-- Empty star -->
          <span
            v-else
            class="material-symbols-outlined text-outline-variant"
            style="font-size:26px;font-variation-settings:'FILL' 0"
          >star</span>
        </button>
      </div>

      <!-- Score info -->
      <div class="flex items-center gap-2 text-sm">
        <span v-if="count > 0" class="font-bold text-on-surface">{{ average }}</span>
        <span v-if="count > 0" class="text-on-surface-variant">/5</span>
        <span class="text-on-surface-variant text-xs">
          {{ count > 0 ? `${count} penilaian` : 'Belum ada penilaian' }}
        </span>
      </div>
    </div>

    <!-- User feedback -->
    <div class="mt-2 text-xs">
      <span v-if="ratingStore.isSubmitting" class="text-on-surface-variant flex items-center gap-1">
        <span class="material-symbols-outlined animate-spin" style="font-size:13px">progress_activity</span>
        Menyimpan…
      </span>
      <span v-else-if="myRating && canRate" class="text-secondary font-semibold flex items-center gap-1">
        <span class="material-symbols-outlined" style="font-size:13px;font-variation-settings:'FILL' 1">check_circle</span>
        Penilaian kamu: {{ myRating }} bintang
      </span>
      <RouterLink
        v-else-if="!canRate"
        to="/login"
        class="text-primary hover:underline flex items-center gap-1"
      >
        <span class="material-symbols-outlined" style="font-size:13px">login</span>
        Login untuk memberi penilaian
      </RouterLink>
      <span v-else class="text-on-surface-variant">Klik bintang untuk memberi penilaian</span>
    </div>
  </div>
</template>

<style scoped>
.rating-widget {
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-lowest));
}
.star-btn {
  background: none;
  border: none;
  padding: 2px;
  line-height: 1;
  transition: transform 0.1s;
}
.star-btn:hover {
  transform: scale(1.15);
}
</style>
