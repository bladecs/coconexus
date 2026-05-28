<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  variant: {
    type: String,
    default: 'home',
  },
});

const authStore = useAuthStore();
const isHidden = ref(false);
let lastScrollY = 0;
let idleTimer = null;

const navLinks = computed(() => {
  if (props.variant === 'admin') {
    return [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/articles', label: 'Artikel' },
      { to: '/admin/users', label: 'User' },
      { to: '/admin/categories', label: 'Kategori' },
      { to: '/admin/comments', label: 'Komentar' },
      { to: '/admin/roles', label: 'Role' },
      { to: '/admin/job-division', label: 'Job/Div' },
      { to: '/admin/activity', label: 'Activity' },
      { to: '/admin/system', label: 'Sistem' },
      { to: '/admin/report', label: 'Report' },
      { to: '/admin/profile', label: 'Profil' },
    ];
  }

  if (props.variant === 'pengelola') {
    return [
      { to: '/pengelola/articles', label: 'Artikel' },
      { to: '/pengelola/comments', label: 'Komentar' },
      { to: '/pengelola/tags', label: 'Kategori' },
    ];
  }

  return [
    { to: '/', label: 'Beranda' },
    { href: '/#articles', label: 'Artikel' },
    { href: '/#categories', label: 'Kategori' },
    { href: '/#needs', label: 'Analisis' },
  ];
});

// Split visible and overflow links for admin navbar
const visibleLinks = computed(() => {
  if (props.variant !== 'admin') return navLinks.value;
  return navLinks.value.slice(0, 4);
});

const overflowLinks = computed(() => {
  if (props.variant !== 'admin') return [];
  return navLinks.value.slice(4);
});

const dropdownOpen = ref(false);
const dropdownRef = ref(null);

function toggleDropdown(e) {
  e.stopPropagation();
  dropdownOpen.value = !dropdownOpen.value;
}

function handleDocumentClick(e) {
  if (!dropdownRef.value) return;
  if (!dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false;
  }
}

function revealNavbar() {
  isHidden.value = false;
}

function hideNavbar() {
  isHidden.value = true;
}

function armIdleReveal() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(revealNavbar, 420);
}

function handleScroll() {
  const currentY = window.scrollY;
  const delta = currentY - lastScrollY;

  if (currentY <= 24) {
    revealNavbar();
  } else if (delta > 14) {
    hideNavbar();
  } else if (delta < -14) {
    revealNavbar();
  }

  lastScrollY = currentY;
  armIdleReveal();
}

function handleLogout() {
  authStore.logout();
}

onMounted(() => {
  lastScrollY = window.scrollY;
  window.addEventListener('scroll', handleScroll, { passive: true });
  armIdleReveal();
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
  window.clearTimeout(idleTimer);
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <header
    class="site-navbar"
    :class="[`site-navbar--${variant}`, { 'is-hidden': isHidden }]"
    @mouseenter="revealNavbar"
    @focusin="revealNavbar"
    @touchstart.passive="revealNavbar"
  >
    <RouterLink to="/" class="site-brand" aria-label="COCONEXUS Home">
      <span class="site-brand__mark">CX</span>
      <span>
        <strong>{{
          variant === 'admin'
            ? 'COCONEXUS Admin'
            : variant === 'pengelola'
              ? 'COCONEXUS Pengelola'
              : 'COCONEXUS'
        }}</strong>
        <small>{{
          variant === 'admin'
            ? 'Control Center'
            : variant === 'pengelola'
              ? 'Article Manager'
              : 'Community Article Hub'
        }}</small>
      </span>
    </RouterLink>

    <nav class="site-navlinks" aria-label="Navigasi utama">
      <template v-if="props.variant === 'admin'">
        <template v-for="link in visibleLinks" :key="link.label">
          <RouterLink v-if="link.to" :to="link.to">{{ link.label }}</RouterLink>
          <a v-else :href="link.href">{{ link.label }}</a>
        </template>

        <div class="nav-overflow" ref="dropdownRef">
          <button class="ellipsis-btn" aria-label="Lainnya" @click="toggleDropdown">
            •••
          </button>
          <div v-if="dropdownOpen" class="nav-dropdown">
            <template v-for="link in overflowLinks" :key="link.label">
              <RouterLink v-if="link.to" :to="link.to" class="nav-dropdown-item">
                {{ link.label }}
              </RouterLink>
              <a v-else :href="link.href" class="nav-dropdown-item">
                {{ link.label }}
              </a>
            </template>
          </div>
        </div>
      </template>

      <template v-else>
        <template v-for="link in navLinks" :key="link.label">
          <RouterLink v-if="link.to" :to="link.to">{{ link.label }}</RouterLink>
          <a v-else :href="link.href">{{ link.label }}</a>
        </template>
      </template>
    </nav>

    <div class="site-actions">
      <RouterLink
        v-if="authStore.isPengelola && variant !== 'pengelola'"
        to="/pengelola/articles"
        class="site-action site-action--ghost"
      >
        Pengelola
      </RouterLink>
      <RouterLink
        v-if="authStore.isAdmin && variant !== 'admin'"
        to="/admin"
        class="site-action site-action--ghost"
      >
        Admin
      </RouterLink>
      <RouterLink
        v-if="(authStore.isAdmin || authStore.isPengelola) && variant !== 'home'"
        to="/"
        class="site-action site-action--ghost"
      >
        Beranda
      </RouterLink>
      <RouterLink
        v-if="authStore.isPengelola && variant === 'pengelola'"
        to="/pengelola/articles/new"
        class="site-action"
      >
        Artikel Baru
      </RouterLink>
      <RouterLink
        v-if="authStore.isAdmin && variant === 'admin'"
        to="/admin/articles/new"
        class="site-action"
      >
        Artikel Baru
      </RouterLink>
      <button
        v-if="authStore.isAuthenticated"
        type="button"
        class="site-action site-action--ghost"
        @click="handleLogout"
      >
        Logout
      </button>
      <RouterLink v-if="!authStore.isAuthenticated" to="/login" class="site-action site-action--ghost">
        Login
      </RouterLink>
      <RouterLink v-if="!authStore.isAuthenticated" to="/register" class="site-action">
        Daftar
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.site-navbar {
  position: fixed;
  top: 18px;
  left: 50%;
  z-index: 50;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto minmax(220px, 1fr);
  align-items: center;
  width: min(1440px, calc(100% - 48px));
  min-height: 76px;
  gap: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(48, 48, 48, 0.9);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.34);
  padding: 12px 14px;
  transform: translateX(-50%) translateY(0);
  transition: opacity 220ms ease, transform 220ms ease;
  backdrop-filter: blur(18px);
}

.site-navbar.is-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(-130%);
}

.site-brand,
.site-navlinks a,
.site-action {
  color: #fff7f0;
  text-decoration: none;
}

.site-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.site-brand__mark {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff7b33, #5b301f);
  color: #ffffff;
  font-weight: 950;
}

.site-brand strong,
.site-brand small {
  display: block;
}

.site-brand strong {
  font-size: 0.92rem;
  letter-spacing: 0.08em;
}

.site-brand small {
  color: #d0c3ba;
  font-size: 0.72rem;
  font-weight: 800;
}

.site-navlinks {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.nav-overflow {
  position: relative;
}

.ellipsis-btn {
  background: transparent;
  border: none;
  color: #fff7f0;
  font-size: 20px;
  line-height: 1;
  padding: 6px 10px;
  cursor: pointer;
}

.nav-dropdown {
  position: absolute;
  right: 0;
  margin-top: 8px;
  background: rgba(20,20,20,0.95);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  z-index: 80;
}

.nav-dropdown-item {
  display: block;
  padding: 8px 12px;
  color: #fff7f0;
  text-decoration: none;
}

.nav-dropdown-item:hover {
  background: rgba(255,255,255,0.03);
}

.site-navlinks {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  background: rgba(255, 123, 51, 0.12);
  padding: 6px;
}

.site-navlinks a {
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 850;
  padding: 11px 14px;
  white-space: nowrap;
}

.site-navlinks a:hover,
.site-navlinks a.router-link-active {
  background: rgba(255, 123, 51, 0.24);
  color: #ffffff;
}

.site-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.site-action {
  border: 0;
  border-radius: 8px;
  background: #ff7b33;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 900;
  padding: 12px 16px;
}

.site-action--ghost {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(31, 31, 31, 0.38);
  color: #fff7f0;
}

@media (max-width: 940px) {
  .site-navbar {
    grid-template-columns: 1fr;
    position: absolute;
  }

  .site-navlinks,
  .site-actions {
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
  }
}

@media (max-width: 560px) {
  .site-navbar {
    top: 10px;
    width: calc(100% - 20px);
  }
}
</style>
