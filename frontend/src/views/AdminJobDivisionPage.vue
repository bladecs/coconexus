<script setup>
import { onMounted, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const jobTitleOptions = [
  'Penulis Artikel',
  'Editor Konten',
  'Validator Artikel',
  'Publisher Artikel',
  'Moderator Komentar',
  'Pengelola Tag/Kategori',
];
const departmentOptions = [
  'Produksi Konten',
  'Redaksi',
  'Validasi & Publikasi',
  'Moderasi Komentar',
  'Kategori & Tag',
];
const divisionOptions = [
  'Artikel Utama',
  'Artikel Detail',
  'Komentar',
  'Kategori',
];

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
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Kelola Job & Divisi</h1>
        </div>
      </header>

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
              <th class="text-left px-4 py-3 text-on-surface">Job Title</th>
              <th class="text-left px-4 py-3 text-on-surface">Department</th>
              <th class="text-left px-4 py-3 text-on-surface">Division</th>
              <th class="text-right px-4 py-3 text-on-surface">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors">
              <td class="px-4 py-3 text-on-surface">{{ user.profile?.full_name || '-' }}</td>
              <td class="px-4 py-3 text-on-surface-variant">{{ user.email }}</td>
              <td v-if="editingUserId === user.id" class="px-4 py-3">
                <select v-model="editingData.job_title" class="w-full rounded px-2 py-1">
                  <option value="">Pilih jabatan</option>
                  <option v-for="opt in jobTitleOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </td>
              <td v-else class="px-4 py-3 text-on-surface">{{ user.profile?.job_title || '-' }}</td>
              <td v-if="editingUserId === user.id" class="px-4 py-3">
                <select v-model="editingData.department" class="w-full rounded px-2 py-1">
                  <option value="">Pilih departemen</option>
                  <option v-for="opt in departmentOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </td>
              <td v-else class="px-4 py-3 text-on-surface">{{ user.profile?.department || '-' }}</td>
              <td v-if="editingUserId === user.id" class="px-4 py-3">
                <select v-model="editingData.division" class="w-full rounded px-2 py-1">
                  <option value="">Pilih divisi</option>
                  <option v-for="opt in divisionOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </td>
              <td v-else class="px-4 py-3 text-on-surface">{{ user.profile?.division || '-' }}</td>
              <td class="px-4 py-3 text-right">
                <div v-if="editingUserId === user.id" class="flex gap-2 justify-end">
                  <button
                    @click="saveEdit(user.id)"
                    class="text-xs px-2 py-1 rounded bg-primary text-on-primary hover:opacity-80 transition-all"
                  >
                    Simpan
                  </button>
                  <button
                    @click="cancelEdit"
                    class="text-xs px-2 py-1 rounded bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all"
                  >
                    Batal
                  </button>
                </div>
                <button
                  v-else
                  @click="startEdit(user)"
                  class="text-xs px-3 py-1 rounded bg-secondary text-on-secondary hover:opacity-80 transition-all"
                >
                  Edit
                </button>
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

