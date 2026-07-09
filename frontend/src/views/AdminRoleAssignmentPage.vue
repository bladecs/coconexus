<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/lib/api';
import { getModeratorTypeLabel } from '@/lib/moderatorLabels';

const authStore = useAuthStore();
const users = ref([]);
const isLoading = ref(false);
const error = ref(null);
const updatingUserId = ref(null);

const currentAdminId = computed(() => authStore.user?.id);

const roleOptions = ['admin', 'pengelola', 'moderator', 'user'];

const pendingModeratorType = reactive({});

const moderatorTypeOptions = [
  { value: 'content',     label: 'Konten' },
  { value: 'publication', label: 'Publikasi' },
  { value: 'forum',       label: 'Forum' },
  { value: 'tag',         label: 'Kategori & Tag' },
];

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
    const payload = { role: newRole };
    if (newRole === 'moderator' && pendingModeratorType[userId]) {
      payload.moderator_type = pendingModeratorType[userId];
    }
    const { data } = await api.put(`/admin/users/${userId}/role`, payload);
    const idx = users.value.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users.value[idx] = data.data.user;
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    updatingUserId.value = null;
  }
}

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Manajemen Role Pengguna</h1>
        </div>
      </header>

      <!-- Info Kontributor -->
      <div class="mb-4 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <span class="material-symbols-outlined text-base mt-0.5">info</span>
        <span>Permohonan verifikasi kontributor dikelola oleh <strong>Pengelola</strong> di halaman <strong>Kontributor</strong>. Kolom "Kontributor" di bawah menampilkan status permohonan user biasa.</span>
      </div>

      <!-- Users Table -->
      <section class="admin-ds-panel overflow-x-auto">
        <p class="admin-section-label mb-4">DAFTAR PENGGUNA</p>

        <div v-if="isLoading" class="text-center py-8 text-on-surface-variant">
          <p>Memuat pengguna...</p>
        </div>

        <div v-else-if="error" class="text-error text-center py-8">
          {{ error }}
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-outline-variant/50">
              <th class="text-left px-4 py-3 text-on-surface">Nama</th>
              <th class="text-left px-4 py-3 text-on-surface">Email</th>
              <th class="text-left px-4 py-3 text-on-surface">Role Saat Ini</th>
              <th class="text-left px-4 py-3 text-on-surface">Kontributor</th>
              <th class="text-left px-4 py-3 text-on-surface">Ubah Role</th>
              <th class="text-right px-4 py-3 text-on-surface">Bergabung</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors">
              <td class="px-4 py-3 text-on-surface">{{ user.profile?.full_name || '-' }}</td>
              <td class="px-4 py-3 text-on-surface-variant">{{ user.email }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                  <span
                    class="admin-badge w-fit"
                    :class="{
                      'admin-badge--error': user.role === 'admin',
                      'admin-badge--warning': user.role === 'pengelola',
                      'admin-badge--success': user.role === 'moderator',
                      'admin-badge--info': user.role === 'user',
                    }"
                  >
                    {{ user.role }}
                  </span>
                  <span v-if="user.role === 'moderator' && user.moderator_assignment?.moderator_type" class="text-xs text-on-surface-variant">
                    {{ getModeratorTypeLabel(user.moderator_assignment.moderator_type) }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="user.role === 'user' && user.profile?.contributor_status && user.profile.contributor_status !== 'none'"
                  class="admin-badge w-fit text-xs"
                  :class="{
                    'admin-badge--warning': user.profile.contributor_status === 'pending',
                    'admin-badge--success': user.profile.contributor_status === 'approved',
                    'admin-badge--error':   user.profile.contributor_status === 'rejected',
                  }"
                >
                  {{ user.profile.contributor_status === 'pending' ? 'Menunggu' : user.profile.contributor_status === 'approved' ? 'Terverifikasi' : 'Ditolak' }}
                </span>
                <span v-else class="text-xs text-on-surface-variant">-</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-col gap-2">
                  <template v-if="user.id !== currentAdminId">
                    <div class="flex flex-wrap gap-2">
                      <template v-for="role in roleOptions.filter((r) => r !== user.role)" :key="role">
                        <button
                          v-if="role !== 'moderator'"
                          @click="updateUserRole(user.id, role)"
                          :disabled="updatingUserId === user.id"
                          class="text-xs px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors disabled:opacity-50"
                        >
                          {{ role }}
                        </button>
                      </template>
                      <template v-if="user.role !== 'moderator'">
                        <div class="flex items-center gap-1">
                          <select
                            v-model="pendingModeratorType[user.id]"
                            class="text-xs rounded border border-outline-variant/50 px-2 py-1"
                          >
                            <option value="">Tipe moderator</option>
                            <option v-for="opt in moderatorTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                          </select>
                          <button
                            @click="updateUserRole(user.id, 'moderator')"
                            :disabled="updatingUserId === user.id || !pendingModeratorType[user.id]"
                            class="text-xs px-2 py-1 rounded bg-primary-container hover:bg-primary-container/80 text-on-primary-container transition-colors disabled:opacity-40"
                          >
                            moderator
                          </button>
                        </div>
                      </template>
                    </div>
                  </template>
                  <span v-else class="text-xs text-on-surface-variant">Role akun sendiri dikunci</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs text-on-surface-variant">{{ new Date(user.created_at).toLocaleDateString('id-ID') }}</span>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="6" class="text-center py-8 text-outline">
                Tidak ada pengguna ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </main>
</template>

