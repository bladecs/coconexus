<script setup>
import { onMounted, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const users = ref([]);
const isLoading = ref(false);
const error = ref(null);
const editingUserId = ref(null);
const editingData = ref({});

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

function startEdit(user) {
  editingUserId.value = user.id;
  editingData.value = {
    job_title: user.profile?.job_title || '',
    department: user.profile?.department || '',
    division: user.profile?.division || '',
  };
}

function cancelEdit() {
  editingUserId.value = null;
  editingData.value = {};
}

async function saveEdit(userId) {
  error.value = null;

  try {
    await api.put(`/admin/users/${userId}/profile`, editingData.value);
    const user = users.value.find((u) => u.id === userId);
    if (user && user.profile) {
      user.profile.job_title = editingData.value.job_title;
      user.profile.department = editingData.value.department;
      user.profile.division = editingData.value.division;
    }
    cancelEdit();
  } catch (err) {
    error.value = err.message;
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
          <h1>Kelola Job & Divisi</h1>
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
              <th class="text-left px-4 py-3">Job Title</th>
              <th class="text-left px-4 py-3">Department</th>
              <th class="text-left px-4 py-3">Division</th>
              <th class="text-right px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-b border-stone-700 hover:bg-stone-800">
              <td class="px-4 py-3">{{ user.profile?.full_name || '-' }}</td>
              <td class="px-4 py-3">{{ user.email }}</td>
              <td v-if="editingUserId === user.id" class="px-4 py-3">
                <input
                  v-model="editingData.job_title"
                  type="text"
                  class="w-full rounded bg-stone-700 px-2 py-1 text-stone-100 border border-stone-500"
                />
              </td>
              <td v-else class="px-4 py-3">{{ user.profile?.job_title || '-' }}</td>
              <td v-if="editingUserId === user.id" class="px-4 py-3">
                <input
                  v-model="editingData.department"
                  type="text"
                  class="w-full rounded bg-stone-700 px-2 py-1 text-stone-100 border border-stone-500"
                />
              </td>
              <td v-else class="px-4 py-3">{{ user.profile?.department || '-' }}</td>
              <td v-if="editingUserId === user.id" class="px-4 py-3">
                <input
                  v-model="editingData.division"
                  type="text"
                  class="w-full rounded bg-stone-700 px-2 py-1 text-stone-100 border border-stone-500"
                />
              </td>
              <td v-else class="px-4 py-3">{{ user.profile?.division || '-' }}</td>
              <td class="px-4 py-3 text-right">
                <div v-if="editingUserId === user.id" class="flex gap-2 justify-end">
                  <button
                    @click="saveEdit(user.id)"
                    class="text-xs px-2 py-1 rounded bg-green-900 hover:bg-green-800"
                  >
                    Simpan
                  </button>
                  <button
                    @click="cancelEdit"
                    class="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                  >
                    Batal
                  </button>
                </div>
                <button
                  v-else
                  @click="startEdit(user)"
                  class="text-xs px-3 py-1 rounded bg-blue-900 hover:bg-blue-800"
                >
                  Edit
                </button>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="6" class="text-center py-8 text-stone-400">
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
