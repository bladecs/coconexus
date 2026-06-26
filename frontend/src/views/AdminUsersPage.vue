<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useAdminStore } from '@/stores/admin';
import { useAuthStore } from '@/stores/auth';

const adminStore = useAdminStore();
const authStore = useAuthStore();
const feedback = ref('');
const currentAdminId = computed(() => authStore.user?.id);
const filters = reactive({
  search: '',
  role: '',
  page: 1,
  limit: 10,
});

const roleLabels = {
  all: 'Semua',
  admin: 'Admin',
  pengelola: 'Pengelola',
  user: 'User',
};

const roleFilters = [
  { key: '', label: 'Semua' },
  { key: 'admin', label: 'Admin' },
  { key: 'pengelola', label: 'Pengelola' },
  { key: 'user', label: 'User' },
];

const roleSummary = computed(() => {
  const summary = {
    admin: 0,
    pengelola: 0,
    user: 0,
  };

  const roleStats = adminStore.dashboardStats.charts.users_by_role?.items;
  if (Array.isArray(roleStats) && roleStats.length) {
    roleStats.forEach((item) => {
      if (item.role) {
        summary[item.role] = Number(item.user_count) || 0;
      }
    });
    return summary;
  }

  adminStore.users.forEach((user) => {
    summary[user.role] = (summary[user.role] || 0) + 1;
  });

  return summary;
});

const displayedRoles = computed(() => ['admin', 'pengelola', 'user']);

const activeRole = computed(() => filters.role || 'all');

async function refreshUsers(params = filters) {
  Object.assign(filters, {
    search: params.search ?? filters.search,
    role: params.role ?? filters.role,
    page: params.page ?? filters.page,
    limit: params.limit ?? filters.limit,
  });
  await adminStore.fetchUsers(filters);
}

async function submitSearch() {
  filters.page = 1;
  await refreshUsers();
}

async function setRoleFilter(role) {
  filters.role = role;
  filters.page = 1;
  await refreshUsers();
}

async function goToPage(page) {
  filters.page = page;
  await refreshUsers();
}

async function handleRoleToggle(user) {
  feedback.value = '';

  try {
    await adminStore.updateUser(user.id, {
      role: user.role === 'admin' ? 'user' : 'admin',
      full_name: user.profile?.full_name || user.email,
      bio: user.profile?.bio || '',
      avatar_url: user.profile?.avatar_url || null,
    });
    await refreshUsers(filters);
    await adminStore.fetchDashboardStats();
    feedback.value = 'Role user berhasil diperbarui.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleUserDelete(userId) {
  feedback.value = '';

  try {
    await adminStore.deleteUser(userId);
    await adminStore.fetchDashboardStats();
    feedback.value = 'User berhasil di-soft delete.';
  } catch (error) {
    feedback.value = error.message;
  }
}

onMounted(async () => {
  await refreshUsers();
  try {
    await adminStore.fetchDashboardStats();
  } catch (err) {
    console.warn('[admin-users] failed to fetch dashboard stats:', err);
  }
});
</script>

<template>
  <SiteNavbar variant="admin" />
  <main class="inner-page px-5 pb-16 pt-32 text-on-surface sm:px-8 lg:px-10 md:pt-10">

    <section class="mx-auto max-w-[1400px]">

      <!-- ── Header ── -->
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">ADMIN / MANAJEMEN AKUN</p>
          <h1>Direktori Pengguna</h1>
        </div>
        <RouterLink :to="{ name: 'admin-users-create' }" class="admin-primary-action gap-2">
          <span class="material-symbols-outlined text-[18px]">person_add</span>
          Buat User Baru
        </RouterLink>
      </header>

      <!-- ── Stat Chips ── -->
      <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="user-stat-chip">
          <span class="material-symbols-outlined text-2xl text-on-surface-variant">group</span>
          <div>
            <p class="text-2xl font-black text-on-surface leading-none">{{ adminStore.userMeta.total_items || adminStore.users.length }}</p>
            <p class="text-xs text-on-surface-variant mt-1 font-semibold">Total Pengguna</p>
          </div>
        </div>
        <div v-for="role in displayedRoles" :key="role" class="user-stat-chip">
          <span class="material-symbols-outlined text-2xl"
            :class="{
              'text-error': role === 'admin',
              'text-secondary': role === 'pengelola',
              'text-on-surface-variant': role === 'user',
            }"
          >{{ role === 'admin' ? 'admin_panel_settings' : role === 'pengelola' ? 'edit_note' : 'person' }}</span>
          <div>
            <p class="text-2xl font-black text-on-surface leading-none">{{ roleSummary[role] || 0 }}</p>
            <p class="text-xs text-on-surface-variant mt-1 font-semibold">{{ roleLabels[role] }}</p>
          </div>
        </div>
      </div>

      <!-- ── Feedback ── -->
      <p v-if="feedback" class="admin-feedback-alert mt-5">{{ feedback }}</p>

      <!-- ── Filter & Search Bar ── -->
      <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <!-- Role tabs -->
        <div class="user-role-tabs">
          <button
            v-for="role in roleFilters"
            :key="role.key || 'all'"
            type="button"
            class="user-role-tab"
            :class="{ 'user-role-tab--active': activeRole === (role.key || 'all') }"
            @click="setRoleFilter(role.key)"
          >
            {{ role.label }}
          </button>
        </div>

        <!-- Search -->
        <div class="relative flex-1 min-w-0">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>
          <input
            v-model="filters.search"
            type="text"
            class="user-search-input"
            placeholder="Cari nama atau email..."
            @keyup.enter="submitSearch"
          />
        </div>

        <button type="button" class="user-search-btn" @click="submitSearch">
          <span class="material-symbols-outlined text-[18px]">search</span>
          Cari
        </button>
      </div>

      <!-- ── User Table ── -->
      <div class="admin-user-table-wrapper relative mt-4">
        <!-- Loading overlay -->
        <div v-if="adminStore.isLoading" class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface-container/70 backdrop-blur-sm">
          <div class="flex items-center gap-3 text-sm font-semibold text-on-surface-variant">
            <span class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            Memuat data...
          </div>
        </div>

        <table class="admin-user-table">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Role</th>
              <th>Posisi & Divisi</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in adminStore.users"
              :key="user.id"
              class="admin-table-row"
            >
              <!-- Identity -->
              <td>
                <div class="admin-user-identity">
                  <div class="user-avatar" :class="{
                    'user-avatar--admin': user.role === 'admin',
                    'user-avatar--pengelola': user.role === 'pengelola',
                  }">
                    {{ (user.profile?.full_name || user.email).trim().charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-on-surface text-sm truncate">{{ user.profile?.full_name || '—' }}</p>
                    <p class="text-xs text-on-surface-variant truncate mt-0.5">{{ user.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td>
                <span
                  class="admin-badge"
                  :class="{
                    'admin-badge--error': user.role === 'admin',
                    'admin-badge--warning': user.role === 'pengelola',
                    'admin-badge--success': user.role === 'moderator',
                    'admin-badge--info': user.role === 'user',
                  }"
                >{{ user.role }}</span>
              </td>

              <!-- Position -->
              <td>
                <p class="text-sm font-semibold text-on-surface">{{ user.profile?.job_title || '—' }}</p>
                <p class="text-xs text-on-surface-variant mt-0.5">
                  {{ user.profile?.department || 'Departemen belum diisi' }}
                  <span v-if="user.profile?.division" class="opacity-60">· {{ user.profile.division }}</span>
                </p>
              </td>

              <!-- Actions -->
              <td>
                <div class="flex items-center justify-end gap-2">
                  <template v-if="user.id !== currentAdminId">
                    <button
                      type="button"
                      class="user-action-btn user-action-btn--role"
                      :title="user.role === 'admin' ? 'Turunkan ke User' : 'Naikkan ke Admin'"
                      @click="handleRoleToggle(user)"
                    >
                      <span class="material-symbols-outlined text-[16px]">{{ user.role === 'admin' ? 'arrow_downward' : 'arrow_upward' }}</span>
                      <span class="hidden sm:inline">{{ user.role === 'admin' ? 'Turunkan' : 'Naikkan' }}</span>
                    </button>
                    <button
                      type="button"
                      class="user-action-btn user-action-btn--delete"
                      title="Soft Delete"
                      @click="handleUserDelete(user.id)"
                    >
                      <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </template>
                  <span v-else class="text-xs text-on-surface-variant italic">Akun sendiri</span>
                </div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="!adminStore.users.length && !adminStore.isLoading">
              <td colspan="4">
                <div class="flex flex-col items-center justify-center gap-3 py-12 text-on-surface-variant">
                  <span class="material-symbols-outlined text-4xl opacity-40">manage_search</span>
                  <p class="text-sm font-medium">Tidak ada pengguna yang cocok dengan filter.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Pagination ── -->
      <div v-if="adminStore.userMeta.total_pages > 1" class="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          class="user-page-btn"
          :disabled="adminStore.userMeta.page <= 1"
          @click="goToPage(adminStore.userMeta.page - 1)"
        >
          <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          Sebelumnya
        </button>

        <div class="flex items-center gap-1">
          <span class="text-sm text-on-surface-variant">Halaman</span>
          <span class="px-3 py-1 rounded-lg bg-surface-container text-sm font-bold text-on-surface">{{ adminStore.userMeta.page }}</span>
          <span class="text-sm text-on-surface-variant">dari {{ adminStore.userMeta.total_pages }}</span>
        </div>

        <button
          type="button"
          class="user-page-btn"
          :disabled="adminStore.userMeta.page >= adminStore.userMeta.total_pages"
          @click="goToPage(adminStore.userMeta.page + 1)"
        >
          Berikutnya
          <span class="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

    </section>
  </main>
</template>

<style scoped>
/* ── Stat chips ── */
.user-stat-chip {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container-low));
  transition: box-shadow 180ms, transform 180ms;
}
.user-stat-chip:hover {
  box-shadow: 0 4px 14px rgb(var(--color-on-background) / 0.06);
  transform: translateY(-1px);
}

/* ── Role filter tabs ── */
.user-role-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container-low));
  flex-shrink: 0;
}

.user-role-tab {
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--inner-muted);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
  transition: background 150ms, color 150ms;
  white-space: nowrap;
}
.user-role-tab:hover { background: rgb(var(--color-surface-container)); color: var(--inner-text); }
.user-role-tab--active {
  background: rgb(var(--color-surface-container-high));
  color: var(--inner-text);
  box-shadow: 0 1px 4px rgb(var(--color-on-background) / 0.08);
}

/* ── Search ── */
.user-search-input {
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border-radius: 10px;
  border: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container-low));
  color: var(--inner-text);
  font-size: 0.88rem;
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;
}
.user-search-input::placeholder { color: var(--inner-faint); }
.user-search-input:focus {
  border-color: var(--inner-accent);
  box-shadow: 0 0 0 3px rgb(var(--color-secondary) / 0.1);
}

.user-search-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 1.1rem;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-primary));
  background: rgb(var(--color-primary));
  color: rgb(var(--color-on-primary));
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 150ms;
  flex-shrink: 0;
}
.user-search-btn:hover { opacity: 0.87; }

/* ── User Avatar ── */
.user-avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container-high));
  color: var(--inner-muted);
  font-weight: 900;
  font-size: 0.95rem;
}
.user-avatar--admin {
  border-color: rgb(var(--color-error) / 0.25);
  background: rgb(var(--color-error-container) / 0.15);
  color: rgb(var(--color-error));
}
.user-avatar--pengelola {
  border-color: rgb(var(--color-secondary) / 0.25);
  background: rgb(var(--color-secondary) / 0.1);
  color: var(--inner-accent);
}

/* ── Action buttons ── */
.user-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms, transform 150ms;
  white-space: nowrap;
}
.user-action-btn--role {
  border: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container));
  color: var(--inner-muted);
}
.user-action-btn--role:hover {
  background: rgb(var(--color-surface-container-high));
  color: var(--inner-text);
  transform: translateY(-1px);
}
.user-action-btn--delete {
  border: 1px solid rgb(var(--color-error) / 0.2);
  background: transparent;
  color: rgb(var(--color-error));
}
.user-action-btn--delete:hover {
  background: rgb(var(--color-error-container) / 0.2);
}

/* ── Pagination ── */
.user-page-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.55rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container-low));
  color: var(--inner-muted);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
}
.user-page-btn:hover:not(:disabled) {
  background: rgb(var(--color-surface-container));
  border-color: rgb(var(--color-outline-variant));
  color: var(--inner-text);
}
.user-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Animate spin ── */
@keyframes spin { to { transform: rotate(360deg); } }
.animate-spin { animation: spin 1s linear infinite; }
</style>
