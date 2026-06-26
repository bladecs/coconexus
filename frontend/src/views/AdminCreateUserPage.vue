<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useAdminStore } from '@/stores/admin';

const adminStore = useAdminStore();
const router = useRouter();

const creating = ref(false);
const createError = ref('');
const feedback = ref('');

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

const form = reactive({
  email: '',
  password: '',
  role: 'user',
  full_name: '',
  job_title: '',
  department: '',
  division: '',
});

async function submit() {
  createError.value = '';
  feedback.value = '';
  creating.value = true;

  try {
    await adminStore.createUser({
      email: form.email,
      password: form.password,
      role: form.role,
      full_name: form.full_name,
      job_title: form.job_title,
      department: form.department,
      division: form.division,
    });

    feedback.value = 'User berhasil dibuat.';
    // go back to users list
    await router.push({ name: 'admin-users' });
  } catch (err) {
    createError.value = err.message || 'Gagal membuat user.';
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-3xl">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">ACCESS / CREATE USER</p>
          <h1>Buat User Baru</h1>
        </div>
      </header>

      <div class="mt-6 rounded-lg border border-outline-variant/30 bg-surface-container p-6">
        <div class="space-y-4">
          <input v-model="form.email" placeholder="Email" class="w-full px-4 py-3" />
          <input v-model="form.password" type="password" placeholder="Password" class="w-full px-4 py-3" />
          <select v-model="form.role" class="w-full px-4 py-3">
            <option value="user">User</option>
            <option value="pengelola">Pengelola</option>
            <option value="admin">Admin</option>
          </select>
          <input v-model="form.full_name" placeholder="Nama lengkap" class="w-full px-4 py-3" />
          <p v-if="form.role === 'pengelola'" class="text-xs text-on-surface-variant">
            Pilih jabatan yang mengikuti alur kerja artikel: penulisan, editing, validasi, atau publikasi.
          </p>

          <template v-if="form.role === 'pengelola'">
            <select v-model="form.job_title" class="w-full px-4 py-3">
              <option value="">Pilih Jabatan Pengelola</option>
              <option v-for="opt in jobTitleOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <select v-model="form.department" class="w-full px-4 py-3">
              <option value="">Pilih Departemen Artikel</option>
              <option v-for="opt in departmentOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <select v-model="form.division" class="w-full px-4 py-3">
              <option value="">Pilih Divisi Kerja</option>
              <option v-for="opt in divisionOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </template>

          <div class="flex items-center gap-3">
            <button class="admin-primary-action transition-all duration-150" @click="submit" :disabled="creating">{{ creating ? 'Membuat...' : 'Buat User' }}</button>
            <button class="admin-secondary-action transition-all duration-150" @click="() => router.back()">Batal</button>
          </div>

          <div v-if="createError" class="text-error text-sm">{{ createError }}</div>
        </div>
      </div>
    </section>
  </main>
</template>
