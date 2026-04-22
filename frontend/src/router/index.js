import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import LoginPage from '@/views/LoginPage.vue';
import RegisterPage from '@/views/RegisterPage.vue';
import AdminDashboardPage from '@/views/AdminDashboardPage.vue';
import ArticleDetailPage from '@/views/ArticleDetailPage.vue';
import { useAuthStore } from '@/stores/auth';

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    };
  }

  if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    return { name: 'home' };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return authStore.user?.role === 'admin'
      ? { name: 'admin-dashboard' }
      : { name: 'home' };
  }

  return true;
});

export default router;
