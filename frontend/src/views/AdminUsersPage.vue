<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useAdminStore } from '@/stores/admin';

const adminStore = useAdminStore();
const feedback = ref('');
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
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="admin" />

    <section class="mx-auto max-w-[1600px]">
      <header class="admin-ops-header">
          <div>
            <p class="admin-section-label">ACCESS / USER LEDGER</p>
            <h1>Direktori Pengguna</h1>
          </div>
          <div>
            <router-link class="admin-primary-action" :to="{ name: 'admin-users-create' }">Buat User Baru</router-link>
          </div>
        </header>

      <p v-if="feedback" class="mt-6 rounded-lg border border-[#ff7c35]/20 bg-[#ff7c35]/10 px-5 py-4 text-sm font-medium text-[#ffd1b8]">
        {{ feedback }}
      </p>

      <section class="admin-list-shell mt-6">
        <aside class="admin-filter-rail">
          <p class="admin-section-label">USER INDEX</p>
          <div class="admin-tally-stack mt-5">
            <div>
              <span>Total</span>
              <strong>{{ adminStore.userMeta.total_items || adminStore.users.length }}</strong>
            </div>
            <template v-for="role in displayedRoles" :key="role">
              <div>
                <span>{{ roleLabels[role] || role }}</span>
                <strong>{{ roleSummary[role] || 0 }}</strong>
              </div>
            </template>
          </div>

          <div class="mt-6 space-y-5">
            <div class="admin-role-filter-card">
              <p class="admin-section-label mb-3">Filter Role</p>
              <div class="admin-role-filters">
                <button
                  v-for="role in roleFilters"
                  :key="role.key || 'all'"
                  type="button"
                  class="admin-role-filter-btn"
                  :class="{ 'is-active': activeRole === (role.key || 'all') }"
                  @click="setRoleFilter(role.key)"
                >
                  {{ role.label }}
                </button>
              </div>
            </div>

            <div class="admin-search-group">
              <input
                v-model="filters.search"
                type="text"
                class="w-full px-4 py-3"
                placeholder="Cari nama atau email..."
                @keyup.enter="submitSearch"
              />
            </div>

            <RouterLink class="admin-primary-action w-full text-center" :to="{ name: 'admin-users-create' }">Buat User Baru</RouterLink>
          </div>
        </aside>

        <section class="admin-user-table-section">
          <div class="admin-user-table-wrapper relative">
            <div v-if="adminStore.isLoading" class="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-slate-950/80 text-slate-100">
              Memuat data pengguna...
            </div>
            <table class="admin-user-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Posisi</th>
                  <th>Bio</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in adminStore.users" :key="user.id">
                  <td>
                    <div class="admin-user-identity">
                      <span>{{ (user.profile?.full_name || user.email).trim().charAt(0).toUpperCase() }}</span>
                      <div>
                        <h2>{{ user.profile?.full_name || user.email }}</h2>
                        <p>{{ user.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <strong class="admin-role-pill" :class="`is-${user.role}`">{{ user.role }}</strong>
                  </td>
                  <td>
                    <div class="admin-user-position">
                      <p>{{ user.profile?.job_title || 'Belum diatur' }}</p>
                      <p class="admin-user-position-meta">
                        {{ user.profile?.department || 'Departemen belum diisi' }}
                        <span v-if="user.profile?.division">• {{ user.profile.division }}</span>
                      </p>
                    </div>
                  </td>
                  <td>{{ user.profile?.bio || 'Bio belum diisi' }}</td>
                  <td>
                    <div class="admin-user-actions">
                      <button type="button" class="admin-secondary-action" @click="handleRoleToggle(user)">
                        Ubah ke {{ user.role === 'admin' ? 'User' : 'Admin' }}
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200"
                        @click="handleUserDelete(user.id)"
                      >
                        Soft Delete
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!adminStore.users.length && !adminStore.isLoading">
                  <td colspan="6" class="admin-empty-state-table">Tidak ada user yang cocok dengan filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <div v-if="adminStore.userMeta.total_pages > 1" class="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          class="admin-secondary-action disabled:opacity-40"
          :disabled="adminStore.userMeta.page <= 1"
          @click="goToPage(adminStore.userMeta.page - 1)"
        >
          Sebelumnya
        </button>
        <span class="text-sm font-medium text-stone-300">
          Halaman {{ adminStore.userMeta.page }} dari {{ adminStore.userMeta.total_pages }}
        </span>
        <button
          type="button"
          class="admin-secondary-action disabled:opacity-40"
          :disabled="adminStore.userMeta.page >= adminStore.userMeta.total_pages"
          @click="goToPage(adminStore.userMeta.page + 1)"
        >
          Berikutnya
        </button>
      </div>
    </section>
  </main>
</template>
