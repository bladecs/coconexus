<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useAdminStore } from '@/stores/admin';

const adminStore = useAdminStore();
const feedback = ref('');
const filters = reactive({
  search: '',
  page: 1,
  limit: 10,
});

const roleSummary = computed(() => {
  const summary = { admin: 0, user: 0 };

  adminStore.users.forEach((user) => {
    summary[user.role] = (summary[user.role] || 0) + 1;
  });

  return summary;
});

async function refreshUsers(params = filters) {
  Object.assign(filters, {
    search: params.search ?? filters.search,
    page: params.page ?? filters.page,
    limit: params.limit ?? filters.limit,
  });
  await adminStore.fetchUsers(filters);
}

async function submitSearch() {
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
    await refreshUsers(adminStore.userMeta);
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
            <div>
              <span>Admin</span>
              <strong>{{ roleSummary.admin || 0 }}</strong>
            </div>
            <div>
              <span>User</span>
              <strong>{{ roleSummary.user || 0 }}</strong>
            </div>
          </div>

          <div class="mt-6 space-y-4">
            <input
              v-model="filters.search"
              type="text"
              class="w-full px-4 py-3"
              placeholder="Cari nama atau email..."
              @keyup.enter="submitSearch"
            />
            <button type="button" class="admin-primary-action w-full" @click="submitSearch">
              Cari User
            </button>
          </div>
        </aside>

        <section class="admin-article-table">
          <article
            v-for="user in adminStore.users"
            :key="user.id"
            class="admin-user-row"
          >
            <div class="admin-user-identity">
              <span>{{ (user.profile?.full_name || user.email).trim().charAt(0).toUpperCase() }}</span>
              <div>
                <h2>{{ user.profile?.full_name || user.email }}</h2>
                <p>{{ user.email }}</p>
              </div>
            </div>
            <strong class="admin-role-pill" :class="`is-${user.role}`">{{ user.role }}</strong>
            <p>{{ user.profile?.bio || 'Bio belum diisi' }}</p>
            <div class="admin-article-actions">
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
          </article>

          <div v-if="!adminStore.users.length && !adminStore.isLoading" class="admin-empty-state m-4">
            Tidak ada user yang cocok dengan filter.
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
