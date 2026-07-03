import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import api from '@/lib/api';

export const useReadingHistoryStore = defineStore('readingHistory', () => {
  const readIds = reactive(new Set());
  const history = ref([]);
  const historyMeta = ref({ page: 1, total_pages: 1, total_items: 0 });

  async function recordRead(articleId) {
    try {
      await api.post(`/reading-history/${articleId}`);
      readIds.add(Number(articleId));
    } catch {
      // silent — non-critical
    }
  }

  async function fetchReadIds() {
    try {
      const { data } = await api.get('/reading-history/ids');
      (data.data.article_ids || []).forEach((id) => readIds.add(id));
    } catch {
      // silent
    }
  }

  async function fetchHistory(params = {}) {
    try {
      const { data } = await api.get('/reading-history', { params });
      history.value = data.data.history;
      historyMeta.value = data.data.meta;
      data.data.history.forEach((h) => readIds.add(h.article.id));
      return data.data.history;
    } catch {
      return [];
    }
  }

  function isRead(articleId) {
    return readIds.has(Number(articleId));
  }

  return { readIds, history, historyMeta, recordRead, fetchReadIds, fetchHistory, isRead };
});
