import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/lib/api';

export const useRatingStore = defineStore('rating', () => {
  const ratings = ref({});
  const isSubmitting = ref(false);

  async function fetchRating(articleId) {
    try {
      const { data } = await api.get(`/articles/published/${articleId}/rating`);
      ratings.value[articleId] = data.data;
      return data.data;
    } catch {
      ratings.value[articleId] = { average: 0, count: 0, user_rating: null };
      return ratings.value[articleId];
    }
  }

  async function rateArticle(articleId, rating) {
    isSubmitting.value = true;
    try {
      const { data } = await api.post(`/articles/published/${articleId}/rating`, { rating });
      ratings.value[articleId] = data.data;
      return data.data;
    } finally {
      isSubmitting.value = false;
    }
  }

  function getRating(articleId) {
    return ratings.value[articleId] || { average: 0, count: 0, user_rating: null };
  }

  return { ratings, isSubmitting, fetchRating, rateArticle, getRating };
});
