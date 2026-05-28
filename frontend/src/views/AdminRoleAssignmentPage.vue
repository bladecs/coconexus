<script setup>
import { onMounted, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const users = ref([]);
const isLoading = ref(false);
const error = ref(null);
const selectedRole = ref('user');
const updatingUserId = ref(null);

async function fetchUsers() {
  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await api.get('/admin/users');
    users.value = data.data.users || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function updateUserRole(userId, newRole) {
  if (!confirm(`Ubah role ke ${newRole}?`)) return;

  updatingUserId.value = userId;
  error.value = null;

  try {
    const { data } = await api.put(`/admin/users/${userId}/role`, {
      role: newRole,
    });
    const user = users.value.find((u) => u.id === userId);
    if (user) {
      user.role = data.data.user.role;
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    updatingUserId.value = null;
  }
}

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="admin" />

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Manajemen Role Pengguna</h1>
        </div>
      </header>

      <!-- Users Table -->
      <section class="admin-signal-board overflow-x-auto">
        <p class="admin-section-label mb-4">DAFTAR PENGGUNA</p>

        <div v-if="isLoading" class="text-center py-8">
          <p>Memuat pengguna...</p>
        </div>

        <div v-else-if="error" class="text-red-400 text-center py-8">
          {{ error }}
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-stone-600">
              <th class="text-left px-4 py-3">Nama</th>
              <th class="text-left px-4 py-3">Email</th>
              <th class="text-left px-4 py-3">Role Saat Ini</th>
              <th class="text-left px-4 py-3">Ubah Role</th>
              <th class="text-right px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-b border-stone-700 hover:bg-stone-800">
              <td class="px-4 py-3">{{ user.profile?.full_name || '-' }}</td>
              <td class="px-4 py-3">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span
                  :class="{
                    'px-2 py-1 rounded text-xs font-semibold': true,
                    'bg-red-900 text-red-200': user.role === 'admin',
                    'bg-yellow-900 text-yellow-200': user.role === 'pengelola',
                    'bg-blue-900 text-blue-200': user.role === 'user',
                  }"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button
                    v-if="user.role !== 'admin'"
                    @click="updateUserRole(user.id, 'admin')"
                    :disabled="updatingUserId === user.id"
                    class="text-xs px-2 py-1 rounded bg-red-900 hover:bg-red-800 disabled:bg-stone-700"
                  >
                    Admin
                  </button>
                  <button
                    v-if="user.role !== 'pengelola'"
                    @click="updateUserRole(user.id, 'pengelola')"
                    :disabled="updatingUserId === user.id"
                    class="text-xs px-2 py-1 rounded bg-yellow-900 hover:bg-yellow-800 disabled:bg-stone-700"
                  >
                    Pengelola
                  </button>
                  <button
                    v-if="user.role !== 'user'"
                    @click="updateUserRole(user.id, 'user')"
                    :disabled="updatingUserId === user.id"
                    class="text-xs px-2 py-1 rounded bg-blue-900 hover:bg-blue-800 disabled:bg-stone-700"
                  >
                    User
                  </button>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs text-stone-400">{{ new Date(user.created_at).toLocaleDateString('id-ID') }}</span>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="5" class="text-center py-8 text-stone-400">
                Tidak ada pengguna ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </main>
</template>

<style scoped>
.admin-ops-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgb(120 113 108);
}

.admin-ops-header h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 0.25rem;
}

.admin-section-label {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: rgb(168 162 158);
  font-weight: 600;
  text-transform: uppercase;
}

.admin-signal-board {
  background-color: rgb(41 37 36);
  border: 1px solid rgb(120 113 108);
  border-radius: 0.5rem;
  padding: 1.5rem;
}
</style>
