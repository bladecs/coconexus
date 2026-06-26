<script setup>
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';
import { useChatWidget } from '@/composables/useChatWidget';
import { useSidebar } from '@/composables/useSidebar';

const props = defineProps({
  variant: {
    type: String,
    default: 'home',
  },
});

const authStore = useAuthStore();
const router = useRouter();
const mobileOpen = ref(false);
const { isDark, toggleTheme } = useTheme();
const { isOpen: chatOpen, open: openChat } = useChatWidget();
const { isCollapsed, toggle: toggleSidebar } = useSidebar();
const moderatorType = computed(() => authStore.user?.moderator_assignment?.moderator_type || '');

function getDefaultPengelolaRoute() {
  return '/pengelola/articles';
}

function getDefaultModeratorRoute(type) {
  if (type === 'forum') return '/moderator/forum/comments';
  if (type === 'content') return '/moderator/content/articles';
  if (type === 'publication') return '/moderator/publication/articles';
  if (type === 'tag') return '/moderator/tag/categories';
  return '/';
}

function getModeratorNavLinks(type) {
  if (type === 'forum') {
    return [
      { to: '/moderator/forum/comments', label: 'Komentar', icon: 'chat_bubble' },
      { to: '/moderator/forum/discussions', label: 'Forum', icon: 'forum' },
    ];
  }
  if (type === 'content') {
    return [
      { to: '/moderator/content/articles', label: 'Review Konten', icon: 'rate_review' },
    ];
  }
  if (type === 'publication') {
    return [
      { to: '/moderator/publication/articles', label: 'Publikasi', icon: 'publish' },
    ];
  }
  if (type === 'tag') {
    return [
      { to: '/moderator/tag/categories', label: 'Kategori & Tag', icon: 'category' },
    ];
  }
  return [];
}

const navLinks = computed(() => {
  if (props.variant === 'admin') {
    return [
      { to: '/admin',              label: 'Dashboard', icon: 'dashboard' },
      { to: '/admin/users',        label: 'Pengguna',  icon: 'group' },
      { to: '/admin/roles',        label: 'Role',      icon: 'manage_accounts' },
      { to: '/admin/job-division', label: 'Job/Divisi',icon: 'work' },
      { to: '/admin/activity',     label: 'Aktivitas', icon: 'timeline' },
      { to: '/admin/chatbot',      label: 'Chatbot',   icon: 'smart_toy' },
      { to: '/admin/system',       label: 'Sistem',    icon: 'settings' },
      { to: '/admin/report',       label: 'Laporan',   icon: 'bar_chart' },
      { to: '/admin/profile',      label: 'Profil',    icon: 'person' },
    ];
  }
  if (props.variant === 'pengelola') {
    return [
      { to: '/pengelola/articles', label: 'Artikel',  icon: 'inventory_2' },
      { to: '/pengelola/tags',     label: 'Kategori', icon: 'category' },
    ];
  }
  if (props.variant === 'moderator') {
    return getModeratorNavLinks(moderatorType.value);
  }
  return [
    { to: '/',            label: 'Beranda',   icon: 'home',       exact: true },
    { to: '/articles',    label: 'Artikel',   icon: 'inventory_2' },
    { to: '/glosarium',   label: 'Glosarium', icon: 'menu_book' },
    { to: '/forum',       label: 'Forum',     icon: 'forum' },
  ];
});

const brandTitle = computed(() => {
  if (props.variant === 'admin')     return 'COCONEXUS Admin';
  if (props.variant === 'pengelola') return 'COCONEXUS Pengelola';
  if (props.variant === 'moderator') return 'COCONEXUS Moderator';
  return 'COCONEXUS';
});

const brandSubtitle = computed(() => {
  if (props.variant === 'admin')     return 'System Control Center';
  if (props.variant === 'pengelola') return 'Article Manager';
  if (props.variant === 'moderator') {
    const subtitleMap = {
      content: 'Content Review',
      publication: 'Publication',
      forum: 'Forum Moderation',
      tag: 'Tag & Category',
    };
    return subtitleMap[moderatorType.value] || 'Moderation';
  }
  return 'Knowledge Platform';
});

function handleLogout() {
  authStore.logout();
  router.push('/');
  mobileOpen.value = false;
}

function closeMobile() {
  mobileOpen.value = false;
}
</script>

<template>
  <!-- ── Mobile Top Bar ── -->
  <header class="md:hidden w-full bg-white dark:bg-[#111f33] shadow-sm fixed top-0 z-50 flex justify-between items-center px-4 h-14 border-b border-outline-variant/30 dark:border-white/10">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-[#003527] flex items-center justify-center text-white font-bold text-sm">CX</div>
      <span class="font-semibold text-primary text-sm leading-tight">{{ brandTitle }}</span>
    </div>
    <button class="text-primary p-1 rounded-lg hover:bg-primary-container/10 transition-colors" @click="mobileOpen = !mobileOpen">
      <span class="material-symbols-outlined">{{ mobileOpen ? 'close' : 'menu' }}</span>
    </button>
  </header>

  <!-- ── Mobile Backdrop ── -->
  <Transition name="fade">
    <div
      v-if="mobileOpen"
      class="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      @click="closeMobile"
    />
  </Transition>

  <!-- ── Side Navigation ── -->
  <nav
    class="flex flex-col h-screen fixed left-0 top-0 bg-white dark:bg-[#111f33] py-6 z-40 border-r border-gray-200 dark:border-white/10 transition-[width,transform] duration-300 ease-in-out overflow-hidden"
    :class="[
      mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0',
      isCollapsed ? 'w-16' : 'w-64',
    ]"
  >
    <!-- Brand Header + Toggle -->
    <div class="flex items-center mb-8" :class="isCollapsed ? 'justify-center px-3' : 'px-4 gap-3'">
      <div class="w-10 h-10 rounded-lg bg-[#003527] flex items-center justify-center text-white font-bold flex-shrink-0">CX</div>
      <div v-if="!isCollapsed" class="flex-1 min-w-0">
        <h1 class="font-semibold text-sm text-primary leading-tight truncate">{{ brandTitle }}</h1>
        <p class="text-xs text-on-surface-variant mt-0.5">{{ brandSubtitle }}</p>
      </div>
      <button
        v-if="!isCollapsed"
        type="button"
        class="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors flex-shrink-0"
        title="Perkecil sidebar"
        @click="toggleSidebar"
      >
        <span class="material-symbols-outlined" style="font-size:18px">chevron_left</span>
      </button>
    </div>

    <!-- Expand button (collapsed state) -->
    <button
      v-if="isCollapsed"
      type="button"
      class="hidden md:flex mx-auto mb-4 items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
      title="Perluas sidebar"
      @click="toggleSidebar"
    >
      <span class="material-symbols-outlined" style="font-size:18px">chevron_right</span>
    </button>

    <!-- Navigation Links -->
    <ul class="flex-1 flex flex-col gap-0.5 overflow-y-auto" :class="isCollapsed ? 'px-2' : 'px-3'">
      <li v-for="link in navLinks" :key="link.label">
        <RouterLink
          v-if="link.to"
          :to="link.to"
          class="nav-link"
          :class="isCollapsed && 'nav-link--icon-only'"
          :exact="link.exact"
          active-class="nav-link--active"
          :exact-active-class="link.exact ? 'nav-link--active' : ''"
          :title="isCollapsed ? link.label : ''"
          @click="closeMobile"
        >
          <span class="material-symbols-outlined nav-link__icon">{{ link.icon }}</span>
          <span v-if="!isCollapsed">{{ link.label }}</span>
        </RouterLink>
        <a
          v-else
          :href="link.href"
          class="nav-link"
          :class="isCollapsed && 'nav-link--icon-only'"
          :title="isCollapsed ? link.label : ''"
          @click="closeMobile"
        >
          <span class="material-symbols-outlined nav-link__icon">{{ link.icon }}</span>
          <span v-if="!isCollapsed">{{ link.label }}</span>
        </a>
      </li>
    </ul>

    <!-- Chatbot Button (home variant only) -->
    <div v-if="variant === 'home'" class="mt-2 mb-1" :class="isCollapsed ? 'px-2' : 'px-3'">
      <button
        type="button"
        class="nav-link w-full text-left"
        :class="[chatOpen ? 'nav-link--active' : '', isCollapsed && 'nav-link--icon-only']"
        :title="isCollapsed ? 'Tanya AI' : ''"
        @click="openChat(); closeMobile();"
      >
        <span class="material-symbols-outlined nav-link__icon">smart_toy</span>
        <span v-if="!isCollapsed">Tanya AI</span>
      </button>
    </div>

    <!-- Role / Auth Links -->
    <div class="mt-2 flex flex-col gap-0.5 border-t border-outline-variant/30 pt-3" :class="isCollapsed ? 'px-2' : 'px-3'">
      <RouterLink
        v-if="authStore.isPengelola && variant !== 'pengelola'"
        :to="getDefaultPengelolaRoute()"
        class="nav-link"
        :class="isCollapsed && 'nav-link--icon-only'"
        :title="isCollapsed ? 'Mode Pengelola' : ''"
        @click="closeMobile"
      >
        <span class="material-symbols-outlined nav-link__icon">edit_note</span>
        <span v-if="!isCollapsed">Mode Pengelola</span>
      </RouterLink>
      <RouterLink
        v-if="authStore.isModerator && variant !== 'moderator'"
        :to="getDefaultModeratorRoute(moderatorType)"
        class="nav-link"
        :class="isCollapsed && 'nav-link--icon-only'"
        :title="isCollapsed ? 'Mode Moderator' : ''"
        @click="closeMobile"
      >
        <span class="material-symbols-outlined nav-link__icon">shield</span>
        <span v-if="!isCollapsed">Mode Moderator</span>
      </RouterLink>
      <RouterLink
        v-if="authStore.isAdmin && variant !== 'admin'"
        to="/admin"
        class="nav-link"
        :class="isCollapsed && 'nav-link--icon-only'"
        :title="isCollapsed ? 'Mode Admin' : ''"
        @click="closeMobile"
      >
        <span class="material-symbols-outlined nav-link__icon">admin_panel_settings</span>
        <span v-if="!isCollapsed">Mode Admin</span>
      </RouterLink>
      <RouterLink
        v-if="(authStore.isAdmin || authStore.isPengelola || authStore.isModerator) && variant !== 'home'"
        to="/"
        class="nav-link"
        :class="isCollapsed && 'nav-link--icon-only'"
        :title="isCollapsed ? 'Beranda' : ''"
        @click="closeMobile"
      >
        <span class="material-symbols-outlined nav-link__icon">home</span>
        <span v-if="!isCollapsed">Beranda</span>
      </RouterLink>
      <RouterLink
        v-if="!authStore.isAuthenticated"
        to="/login"
        class="nav-link"
        :class="isCollapsed && 'nav-link--icon-only'"
        :title="isCollapsed ? 'Login' : ''"
        @click="closeMobile"
      >
        <span class="material-symbols-outlined nav-link__icon">login</span>
        <span v-if="!isCollapsed">Login</span>
      </RouterLink>
      <button
        v-if="authStore.isAuthenticated"
        type="button"
        class="nav-link w-full text-left"
        :class="isCollapsed && 'nav-link--icon-only'"
        :title="isCollapsed ? 'Logout' : ''"
        @click="handleLogout"
      >
        <span class="material-symbols-outlined nav-link__icon">logout</span>
        <span v-if="!isCollapsed">Logout</span>
      </button>
    </div>

    <!-- Theme Toggle -->
    <div class="pt-2" :class="isCollapsed ? 'px-2' : 'px-3'">
      <button
        type="button"
        class="nav-link w-full text-left"
        :class="isCollapsed && 'nav-link--icon-only'"
        :title="isCollapsed ? (isDark ? 'Tema Terang' : 'Tema Gelap') : ''"
        @click="toggleTheme"
      >
        <span class="material-symbols-outlined nav-link__icon">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
        <span v-if="!isCollapsed">{{ isDark ? 'Tema Terang' : 'Tema Gelap' }}</span>
      </button>
    </div>

    <!-- CTA Button (hidden when collapsed) -->
    <div v-if="!isCollapsed" class="px-4 mt-3">
      <RouterLink
        v-if="authStore.isPengelola && variant === 'pengelola'"
        to="/pengelola/articles/new"
        class="cta-btn"
        @click="closeMobile"
      >
        <span class="material-symbols-outlined text-[18px]">add</span>
        Artikel Baru
      </RouterLink>
      <RouterLink
        v-else-if="!authStore.isAuthenticated"
        to="/register"
        class="cta-btn"
        @click="closeMobile"
      >
        <span class="material-symbols-outlined text-[18px]">person_add</span>
        Daftar Sekarang
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  color: #404944;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  transition: background 150ms ease, color 150ms ease;
  cursor: pointer;
  background: transparent;
  border: none;
}

.nav-link:hover {
  background: rgba(0, 53, 39, 0.07);
  color: #003527;
}

.nav-link--active,
.nav-link.router-link-active:not(.router-link-exact-active[data-exact="false"]) {
  background: rgba(0, 53, 39, 0.13);
  color: #003527;
  font-weight: 700;
  border-left: 3px solid #003527;
  padding-left: 9px;
  box-shadow: 0 1px 6px rgba(0, 53, 39, 0.12);
}

.nav-link--icon-only {
  justify-content: center;
  padding: 8px;
  gap: 0;
}

/* Icon-only active: no left-border, use ring instead */
.nav-link--icon-only.nav-link--active,
.nav-link--icon-only.router-link-active {
  border-left: none;
  padding: 8px;
  background: rgba(0, 53, 39, 0.15);
  box-shadow: 0 0 0 2px rgba(0, 53, 39, 0.25);
}

.nav-link__icon {
  font-size: 20px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  flex-shrink: 0;
}

.nav-link--active .nav-link__icon,
.nav-link.router-link-active .nav-link__icon {
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}

.cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  background: #003527;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 53, 39, 0.2);
  transition: opacity 150ms ease, transform 150ms ease;
}

.cta-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* ── Dark mode overrides (explicit, no CSS var dependency) ── */
:global(html.dark) .nav-link {
  color: #bfc9c3;
}

:global(html.dark) .nav-link:hover {
  background: rgba(149, 211, 186, 0.08);
  color: #95d3ba;
}

:global(html.dark) .nav-link--active,
:global(html.dark) .nav-link.router-link-active {
  background: rgba(149, 211, 186, 0.15);
  color: #95d3ba;
  font-weight: 700;
  border-left-color: #95d3ba;
  box-shadow: 0 1px 6px rgba(149, 211, 186, 0.12);
}

:global(html.dark) .nav-link--icon-only.nav-link--active,
:global(html.dark) .nav-link--icon-only.router-link-active {
  border-left: none;
  padding: 8px;
  background: rgba(149, 211, 186, 0.18);
  box-shadow: 0 0 0 2px rgba(149, 211, 186, 0.3);
}

:global(html.dark) .cta-btn {
  background: #0b513d;
  color: #b0f0d6;
  box-shadow: 0 2px 8px rgba(11, 81, 61, 0.3);
}

/* Vue Transition */
.fade-enter-active,
.fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
