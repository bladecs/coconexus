import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/lib/api';

export const useArticleStore = defineStore('articles', () => {
  const publishedArticles = ref([]);
  const adminArticles = ref([]);
  const mainArticles = ref([]);
  const availableProductCards = ref([]);
  const currentArticle = ref(null);
  const comments = ref([]);
  const publishedMeta = ref({
    page: 1,
    limit: 6,
    total_items: 0,
    total_pages: 1,
    search: '',
    category: '',
  });
  const adminMeta = ref({
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 1,
    search: '',
    status: '',
    category: '',
  });
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const error = ref(null);

  const publishedCount = computed(() =>
    adminArticles.value.filter((article) => article.status === 'published').length
  );

  const revisionCount = computed(() =>
    adminArticles.value.filter((article) => article.status === 'revision').length
  );

  const draftCount = computed(() =>
    adminArticles.value.filter((article) => article.status === 'draft').length
  );

  async function withLoading(task) {
    isLoading.value = true;
    error.value = null;

    try {
      return await task();
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function withSubmitting(task) {
    isSubmitting.value = true;
    error.value = null;

    try {
      return await task();
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function fetchPublishedArticles(params = {}) {
    return withLoading(async () => {
      const { data } = await api.get('/articles/published', {
        params,
      });
      publishedArticles.value = data.data.articles;
      publishedMeta.value = data.data.meta || publishedMeta.value;
      return data.data.articles;
    });
  }

  async function fetchPublishedArticleDetail(articleId) {
    return withLoading(async () => {
      const { data } = await api.get(`/articles/published/${articleId}`);
      currentArticle.value = data.data.article;
      comments.value = data.data.article.comments || [];
      return data.data.article;
    });
  }

  async function fetchArticleComments(articleId) {
    return withLoading(async () => {
      const { data } = await api.get(`/articles/${articleId}/comments`);
      comments.value = data.data.comments;
      return data.data.comments;
    });
  }

  async function fetchAdminArticles(params = {}) {
    return withLoading(async () => {
      const { data } = await api.get('/articles/admin', {
        params,
      });
      adminArticles.value = data.data.articles;
      adminMeta.value = data.data.meta || adminMeta.value;
      return data.data.articles;
    });
  }

  async function fetchAdminArticleDetail(articleId) {
    return withLoading(async () => {
      const { data } = await api.get(`/articles/admin/${articleId}`);
      currentArticle.value = data.data.article;
      comments.value = data.data.article.comments || [];
      return data.data.article;
    });
  }

  async function fetchMainArticles(params = {}) {
    return withLoading(async () => {
      const { data } = await api.get('/articles/admin/main-articles', { params });
      mainArticles.value = data.data.articles;
      return mainArticles.value;
    });
  }

  async function fetchAvailableProductCards(articleId) {
    if (!articleId) {
      availableProductCards.value = [];
      return [];
    }

    return withLoading(async () => {
      const { data } = await api.get('/articles/admin/product-cards/available', {
        params: {
          article_id: articleId,
        },
      });
      availableProductCards.value = data.data.product_cards || [];
      return availableProductCards.value;
    });
  }

  async function createArticle(payload) {
    return withSubmitting(async () => {
      const { data } = await api.post('/articles/admin', payload);
      await fetchAdminArticles();
      return data.data.article;
    });
  }

  async function updateArticle(articleId, payload) {
    return withSubmitting(async () => {
      const { data } = await api.put(`/articles/admin/${articleId}`, payload);
      await fetchAdminArticles();
      currentArticle.value = data.data.article;
      return data.data.article;
    });
  }

  async function updateArticleStatus(articleId, status) {
    return withSubmitting(async () => {
      const { data } = await api.patch(`/articles/admin/${articleId}/status`, { status });
      await fetchAdminArticles();
      currentArticle.value = data.data.article;
      return data.data.article;
    });
  }

  async function deleteArticle(articleId) {
    return withSubmitting(async () => {
      await api.delete(`/articles/admin/${articleId}`);
      adminArticles.value = adminArticles.value.filter((article) => article.id !== articleId);

      if (currentArticle.value?.id === articleId) {
        currentArticle.value = null;
        comments.value = [];
      }
    });
  }

  async function postComment(articleId, payload) {
    return withSubmitting(async () => {
      const { data } = await api.post(`/articles/${articleId}/comments`, payload);
      await fetchArticleComments(articleId);
      return data;
    });
  }

  async function deleteComment(commentId, articleId) {
    return withSubmitting(async () => {
      await api.delete(`/comments/${commentId}`);
      await fetchArticleComments(articleId);
    });
  }

  function clearCurrentArticle() {
    currentArticle.value = null;
    comments.value = [];
  }

  async function uploadArticleMedia(file) {
    return withSubmitting(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/uploads/articles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return data.data.media;
    });
  }

  async function uploadArticleMediaMany(files) {
    // files: FileList or Array<File>
    const fileArray = Array.isArray(files) ? files : Array.from(files || []);

    if (fileArray.length === 0) return [];

    return withSubmitting(async () => {
      const promises = fileArray.map((file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/uploads/articles', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      });

      const settled = await Promise.allSettled(promises);
      const results = [];

      for (const r of settled) {
        if (r.status === 'fulfilled' && r.value && r.value.data && r.value.data.data && r.value.data.data.media) {
          results.push(r.value.data.data.media);
        }
      }

      return results;
    });
  }

  return {
    publishedArticles,
    adminArticles,
    mainArticles,
    availableProductCards,
    currentArticle,
    comments,
    publishedMeta,
    adminMeta,
    isLoading,
    isSubmitting,
    error,
    publishedCount,
    revisionCount,
    draftCount,
    fetchPublishedArticles,
    fetchPublishedArticleDetail,
    fetchArticleComments,
    fetchAdminArticles,
    fetchAdminArticleDetail,
    fetchMainArticles,
    fetchAvailableProductCards,
    createArticle,
    updateArticle,
    updateArticleStatus,
    deleteArticle,
    postComment,
    deleteComment,
    uploadArticleMedia,
    clearCurrentArticle,
  };
});
