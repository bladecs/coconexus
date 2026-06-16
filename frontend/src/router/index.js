import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import LoginPage from '@/views/LoginPage.vue';
import RegisterPage from '@/views/RegisterPage.vue';
import AdminDashboardPage from '@/views/AdminDashboardPage.vue';
import AdminArticlesPage from '@/views/AdminArticlesPage.vue';
import AdminArticleFormPage from '@/views/AdminArticleFormPage.vue';
import AdminUsersPage from '@/views/AdminUsersPage.vue';
import AdminCreateUserPage from '@/views/AdminCreateUserPage.vue';
import AdminCategoriesPage from '@/views/AdminCategoriesPage.vue';
import AdminCommentsPage from '@/views/AdminCommentsPage.vue';
import AdminProfilePage from '@/views/AdminProfilePage.vue';
import AdminRoleAssignmentPage from '@/views/AdminRoleAssignmentPage.vue';
import AdminJobDivisionPage from '@/views/AdminJobDivisionPage.vue';
import AdminActivityPage from '@/views/AdminActivityPage.vue';
import AdminActivityLogPage from '@/views/AdminActivityLogPage.vue';
import AdminSystemPage from '@/views/AdminSystemPage.vue';
import AdminReportPage from '@/views/AdminReportPage.vue';
import PengelolaArticlesPage from '@/views/PengelolaArticlesPage.vue';
import PengelolaArticleFormPage from '@/views/PengelolaArticleFormPage.vue';
import PengelolaCommentsPage from '@/views/PengelolaCommentsPage.vue';
import PengelolaTagsPage from '@/views/PengelolaTagsPage.vue';
import ArticleDetailPage from '@/views/ArticleDetailPage.vue';
import { useAuthStore } from '@/stores/auth';
import { useAdminStore } from '@/stores/admin';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      guestOnly: true,
    },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: {
      guestOnly: true,
    },
  },
  {
    path: '/articles/:id',
    name: 'article-detail',
    component: ArticleDetailPage,
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/articles',
    name: 'admin-articles',
    component: AdminArticlesPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/articles/new',
    name: 'admin-articles-new',
    component: AdminArticleFormPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/articles/:id/edit',
    name: 'admin-articles-edit',
    component: AdminArticleFormPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/users/create',
    name: 'admin-users-create',
    component: AdminCreateUserPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: AdminUsersPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/categories',
    name: 'admin-categories',
    component: AdminCategoriesPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/comments',
    name: 'admin-comments',
    component: AdminCommentsPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/profile',
    name: 'admin-profile',
    component: AdminProfilePage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/roles',
    name: 'admin-roles',
    component: AdminRoleAssignmentPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/job-division',
    name: 'admin-job-division',
    component: AdminJobDivisionPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/activity',
    name: 'admin-activity',
    component: AdminActivityPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/activity-log',
    name: 'admin-activity-log',
    component: AdminActivityLogPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/system',
    name: 'admin-system',
    component: AdminSystemPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/report',
    name: 'admin-report',
    component: AdminReportPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  // Pengelola Routes
  {
    path: '/pengelola/articles',
    name: 'pengelola-articles',
    component: PengelolaArticlesPage,
    meta: {
      requiresAuth: true,
      requiresPengelola: true,
      requiredJobs: ['Penulis Artikel', 'Editor Konten', 'Validator Artikel', 'Publisher Artikel'],
    },
  },
  {
    path: '/pengelola/articles/new',
    name: 'pengelola-articles-new',
    component: PengelolaArticleFormPage,
    meta: {
      requiresAuth: true,
      requiresPengelola: true,
      requiredJobs: ['Penulis Artikel', 'Editor Konten'],
    },
  },
  {
    path: '/pengelola/articles/:id/edit',
    name: 'pengelola-articles-edit',
    component: PengelolaArticleFormPage,
    meta: {
      requiresAuth: true,
      requiresPengelola: true,
      requiredJobs: ['Penulis Artikel', 'Editor Konten'],
    },
  },
  {
    path: '/pengelola/comments',
    name: 'pengelola-comments',
    component: PengelolaCommentsPage,
    meta: {
      requiresAuth: true,
      requiresPengelola: true,
      requiredJobs: ['Moderator Komentar'],
    },
  },
  {
    path: '/pengelola/tags',
    name: 'pengelola-tags',
    component: PengelolaTagsPage,
    meta: {
      requiresAuth: true,
      requiresPengelola: true,
      requiredJobs: ['Pengelola Tag/Kategori'],
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const adminStore = useAdminStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    };
  }

  if (to.meta.requiresAdmin && authStore.user?.role === 'admin' && !adminStore.dashboardStatsLoaded) {
    try {
      await adminStore.fetchDashboardStats();
    } catch (err) {
      console.warn('[router] failed to preload admin stats:', err);
    }
  }

  if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    return { name: 'home' };
  }

  if (to.meta.requiresPengelola && authStore.user?.role !== 'pengelola' && authStore.user?.role !== 'admin') {
    return { name: 'home' };
  }

  const requiredJobs = to.meta.requiredJobs;
  if (requiredJobs && authStore.user?.role === 'pengelola') {
    const jobTitle = authStore.user?.profile?.job_title;
    if (!requiredJobs.includes(jobTitle)) {
      return { name: 'home' };
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    if (authStore.user?.role === 'admin') {
      return { name: 'admin-dashboard' };
    } else if (authStore.user?.role === 'pengelola') {
      return { name: 'pengelola-articles' };
    }
    return { name: 'home' };
  }

  return true;
});

export default router;
