import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/lib/api';

export const useForumStore = defineStore('forum', () => {
  const forums = ref([]);
  const meta = ref({ page: 1, limit: 12, total_items: 0, total_pages: 1 });
  const isLoading = ref(false);
  const error = ref(null);

  async function fetchForums(params = {}) {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.get('/forums', { params });
      forums.value = data.data.forums || [];
      meta.value = data.data.meta || meta.value;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return { forums, meta, isLoading, error, fetchForums };
});
