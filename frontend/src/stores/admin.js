import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/lib/api';

export const useAdminStore = defineStore('admin', () => {
  const users = ref([]);
  const userMeta = ref({
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 1,
    search: '',
  });
  const categories = ref([]);
  const comments = ref([]);
  const dashboardStats = ref({
    totals: {
      users: 0,
      articles: 0,
      published_articles: 0,
      draft_articles: 0,
      revision_articles: 0,
      categories: 0,
      comments: 0,
    },
    charts: {
      articles_by_category: {
        labels: [],
        datasets: [],
        items: [],
      },
      comments_by_month: {
        labels: [],
        datasets: [],
        items: [],
      },
    },
    recent_activities: [],
  });
  const commentMeta = ref({
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 1,
    search: '',
    article_id: null,
  });
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const error = ref(null);

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

  async function fetchUsers(params = {}) {
    return withLoading(async () => {
      const { data } = await api.get('/users/admin', { params });
      users.value = data.data.users;
      userMeta.value = data.data.meta || userMeta.value;
      return users.value;
    });
  }

  async function updateUser(userId, payload) {
    return withSubmitting(async () => {
      const { data } = await api.put(`/users/admin/${userId}`, payload);
      return data.data.user;
    });
  }

  async function deleteUser(userId) {
    return withSubmitting(async () => {
      await api.delete(`/users/admin/${userId}`);
      users.value = users.value.filter((user) => user.id !== userId);
    });
  }

  async function fetchCategories(params = {}) {
    return withLoading(async () => {
      const { data } = await api.get('/categories/admin', { params });
      categories.value = data.data.categories;
      return categories.value;
    });
  }

  async function createCategory(payload) {
    return withSubmitting(async () => {
      const { data } = await api.post('/categories/admin', payload);
      await fetchCategories();
      return data.data.category;
    });
  }

  async function updateCategory(categoryId, payload) {
    return withSubmitting(async () => {
      const { data } = await api.put(`/categories/admin/${categoryId}`, payload);
      await fetchCategories();
      return data.data.category;
    });
  }

  async function deleteCategory(categoryId) {
    return withSubmitting(async () => {
      await api.delete(`/categories/admin/${categoryId}`);
      categories.value = categories.value.filter((category) => category.id !== categoryId);
    });
  }

  async function fetchAdminComments(params = {}) {
    return withLoading(async () => {
      const { data } = await api.get('/admin/comments', { params });
      comments.value = data.data.comments;
      commentMeta.value = data.data.meta || commentMeta.value;
      return comments.value;
    });
  }

  async function fetchDashboardStats() {
    return withLoading(async () => {
      const { data } = await api.get('/admin/stats');
      dashboardStats.value = data.data;
      return dashboardStats.value;
    });
  }

  async function deleteComment(commentId) {
    return withSubmitting(async () => {
      await api.delete(`/comments/${commentId}`);
      comments.value = comments.value.filter((comment) => comment.id !== commentId);
    });
  }

  return {
    users,
    userMeta,
    categories,
    comments,
    dashboardStats,
    commentMeta,
    isLoading,
    isSubmitting,
    error,
    fetchUsers,
    updateUser,
    deleteUser,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchAdminComments,
    fetchDashboardStats,
    deleteComment,
  };
});
