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
import AdminChatbotPage from '@/views/AdminChatbotPage.vue';
import PengelolaArticlesPage from '@/views/PengelolaArticlesPage.vue';
import PengelolaArticleDetailPage from '@/views/PengelolaArticleDetailPage.vue';
import PengelolaCommentsPage from '@/views/PengelolaCommentsPage.vue';
import ModeratorForumsPage from '@/views/ModeratorForumsPage.vue';
import ModeratorContentPage from '@/views/ModeratorContentPage.vue';
import ModeratorContentFormPage from '@/views/ModeratorContentFormPage.vue';
import ModeratorPublicationPage from '@/views/ModeratorPublicationPage.vue';
import ModeratorTagPage from '@/views/ModeratorTagPage.vue';
import PengelolaTagsPage from '@/views/PengelolaTagsPage.vue';
import ArticlesPage from '@/views/ArticlesPage.vue';
import ArticleDetailPage from '@/views/ArticleDetailPage.vue';
import GlossaryPage from '@/views/GlossaryPage.vue';
import ForumDiscussionPage from '@/views/ForumDiscussionPage.vue';
import ForumsListPage from '@/views/ForumsListPage.vue';
import BookmarksPage from '@/views/BookmarksPage.vue';
import ReadingHistoryPage from '@/views/ReadingHistoryPage.vue';
import UserProfilePage from '@/views/UserProfilePage.vue';
import PengelolaContributorsPage from '@/views/PengelolaContributorsPage.vue';
import ContributorArticlesPage from '@/views/ContributorArticlesPage.vue';
import ContributorArticleFormPage from '@/views/ContributorArticleFormPage.vue';
import { useAuthStore } from '@/stores/auth';
import { useAdminStore } from '@/stores/admin';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/articles',
    name: 'articles',
    component: ArticlesPage,
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
    path: '/glosarium',
    name: 'glossary',
    component: GlossaryPage,
  },
  {
    path: '/forum',
    name: 'forums-list',
    component: ForumsListPage,
  },
  {
    path: '/articles/:id/forum',
    name: 'article-forum',
    component: ForumDiscussionPage,
  },
  {
    path: '/profil',
    name: 'user-profile',
    component: UserProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: '/profil/tersimpan',
    name: 'bookmarks',
    component: BookmarksPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/profil/riwayat-baca',
    name: 'reading-history',
    component: ReadingHistoryPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/kontributor/artikel',
    name: 'contributor-articles',
    component: ContributorArticlesPage,
    meta: { requiresAuth: true, requiresContributor: true },
  },
  {
    path: '/kontributor/artikel/baru',
    name: 'contributor-article-new',
    component: ContributorArticleFormPage,
    meta: { requiresAuth: true, requiresContributor: true },
  },
  {
    path: '/kontributor/artikel/:id/edit',
    name: 'contributor-article-edit',
    component: ContributorArticleFormPage,
    meta: { requiresAuth: true, requiresContributor: true },
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
  {
    path: '/admin/chatbot',
    name: 'admin-chatbot',
    component: AdminChatbotPage,
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
    },
  },
  {
    path: '/pengelola/articles/:id',
    name: 'pengelola-articles-detail',
    component: PengelolaArticleDetailPage,
    meta: {
      requiresAuth: true,
      requiresPengelola: true,
    },
  },
  {
    path: '/moderator/content/articles',
    name: 'moderator-content-articles',
    component: ModeratorContentPage,
    meta: {
      requiresAuth: true,
      requiresModerator: true,
      requiredModeratorTypes: ['content'],
    },
  },
  {
    path: '/moderator/content/articles/new',
    name: 'moderator-content-articles-new',
    component: ModeratorContentFormPage,
    meta: {
      requiresAuth: true,
      requiresModerator: true,
      requiredModeratorTypes: ['content'],
    },
  },
  {
    path: '/moderator/content/articles/:id/edit',
    name: 'moderator-content-articles-edit',
    component: ModeratorContentFormPage,
    meta: {
      requiresAuth: true,
      requiresModerator: true,
      requiredModeratorTypes: ['content'],
    },
  },
  {
    path: '/moderator/publication/articles',
    name: 'moderator-publication-articles',
    component: ModeratorPublicationPage,
    meta: {
      requiresAuth: true,
      requiresModerator: true,
      requiredModeratorTypes: ['publication'],
    },
  },
  {
    path: '/moderator/forum/comments',
    name: 'moderator-forum-comments',
    component: PengelolaCommentsPage,
    meta: {
      requiresAuth: true,
      requiresModerator: true,
      requiredModeratorTypes: ['forum'],
    },
  },
  {
    path: '/moderator/forum/discussions',
    name: 'moderator-forum-discussions',
    component: ModeratorForumsPage,
    meta: {
      requiresAuth: true,
      requiresModerator: true,
      requiredModeratorTypes: ['forum'],
    },
  },
  {
    path: '/moderator/tag/categories',
    name: 'moderator-tag-categories',
    component: ModeratorTagPage,
    meta: {
      requiresAuth: true,
      requiresModerator: true,
      requiredModeratorTypes: ['tag'],
    },
  },
  {
    path: '/pengelola/tags',
    name: 'pengelola-tags',
    component: PengelolaTagsPage,
    meta: {
      requiresAuth: true,
      requiresPengelola: true,
    },
  },
  {
    path: '/pengelola/contributors',
    name: 'pengelola-contributors',
    component: PengelolaContributorsPage,
    meta: {
      requiresAuth: true,
      requiresPengelola: true,
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

  if (to.meta.requiresPengelola && authStore.user?.role !== 'pengelola') {
    return { name: 'home' };
  }

  if (to.meta.requiresModerator && authStore.user?.role !== 'moderator') {
    return { name: 'home' };
  }

  if (to.meta.requiresContributor) {
    const profile = authStore.user?.profile;
    if (authStore.user?.role !== 'user' || profile?.contributor_status !== 'approved') {
      return { name: 'user-profile' };
    }
  }

  const requiredModeratorTypes = to.meta.requiredModeratorTypes;
  if (requiredModeratorTypes && authStore.user?.role === 'moderator') {
    const moderatorType = authStore.user?.moderator_assignment?.moderator_type;
    if (!requiredModeratorTypes.includes(moderatorType)) {
      return { name: 'home' };
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    if (authStore.user?.role === 'admin') {
      return { name: 'admin-dashboard' };
    } else if (authStore.user?.role === 'pengelola') {
      return { name: 'pengelola-articles' };
    } else if (authStore.user?.role === 'moderator') {
      const modType = authStore.user?.moderator_assignment?.moderator_type;
      if (modType === 'content') return { name: 'moderator-content-articles' };
      if (modType === 'publication') return { name: 'moderator-publication-articles' };
      if (modType === 'tag') return { name: 'moderator-tag-categories' };
      return { name: 'moderator-forum-comments' };
    }
    return { name: 'home' };
  }

  return true;
});

export default router;
