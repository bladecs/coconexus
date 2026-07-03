import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import api from '@/lib/api';

export const useBookmarkStore = defineStore('bookmark', () => {
  const bookmarkedIds = reactive(new Set());
  const bookmarks = ref([]);
  const isSubmitting = ref(false);
  const bookmarkMeta = ref({ page: 1, total_pages: 1, total_items: 0 });

  async function toggleBookmark(articleId) {
    isSubmitting.value = true;
    try {
      const { data } = await api.post(`/bookmarks/toggle/${articleId}`);
      if (data.data.bookmarked) {
        bookmarkedIds.add(articleId);
      } else {
        bookmarkedIds.delete(articleId);
      }
      return data.data;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function checkBookmark(articleId) {
    try {
      const { data } = await api.get(`/bookmarks/check/${articleId}`);
      if (data.data.bookmarked) {
        bookmarkedIds.add(articleId);
      } else {
        bookmarkedIds.delete(articleId);
      }
      return data.data.bookmarked;
    } catch {
      return false;
    }
  }

  async function fetchBookmarks(params = {}) {
    try {
      const { data } = await api.get('/bookmarks', { params });
      bookmarks.value = data.data.bookmarks;
      bookmarkMeta.value = data.data.meta;
      data.data.bookmarks.forEach((b) => bookmarkedIds.add(b.article.id));
      return data.data.bookmarks;
    } catch {
      return [];
    }
  }

  function isBookmarked(articleId) {
    return bookmarkedIds.has(Number(articleId));
  }

  return { bookmarkedIds, bookmarks, bookmarkMeta, isSubmitting, toggleBookmark, checkBookmark, fetchBookmarks, isBookmarked };
});
