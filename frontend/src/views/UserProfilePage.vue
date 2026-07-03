<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/lib/api';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const profile = computed(() => authStore.user?.profile);
const contributorStatus = computed(() => profile.value?.contributor_status ?? 'none');

const isLoading = ref(false);
const error = ref(null);
const success = ref(null);
const note = ref('');
const showForm = ref(false);

onMounted(async () => {
  try {
    const { data } = await api.get('/users/me');
    if (data?.data?.user) {
      authStore.setSession(authStore.token, data.data.user);
    }
  } catch {
    // biarkan data lama tetap tampil jika gagal
  }
});

const STATUS_LABEL = {
  none: 'Belum Mendaftar',
  pending: 'Menunggu Verifikasi',
  approved: 'Kontributor Terverifikasi',
  rejected: 'Ditolak',
};

const STATUS_COLOR = {
  none:     'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  pending:  'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  approved: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  rejected: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
};

const STATUS_ICON = {
  none:     'person',
  pending:  'hourglass_empty',
  approved: 'verified',
  rejected: 'cancel',
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

async function applyContributor() {
  if (!note.value.trim()) {
    error.value = 'Mohon isi alasan atau latar belakang keahlian Anda.';
    return;
  }
  isLoading.value = true;
  error.value = null;
  success.value = null;
  try {
    const { data } = await api.post('/users/me/contributor-request', { note: note.value.trim() });
    authStore.setSession(authStore.token, data.data.user);
    success.value = 'Permohonan berhasil dikirim. Pengelola akan segera meninjau permohonan Anda.';
    note.value = '';
    showForm.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    isLoading.value = false;
  }
}

async function cancelRequest() {
  if (!confirm('Apakah Anda yakin ingin membatalkan permohonan ini?')) return;
  isLoading.value = true;
  error.value = null;
  success.value = null;
  try {
    await api.delete('/users/me/contributor-request');
    const { data } = await api.get('/users/me').catch(() => null);
    if (data?.data?.user) {
      authStore.setSession(authStore.token, data.data.user);
    } else if (authStore.user?.profile) {
      authStore.user.profile.contributor_status = 'none';
      authStore.user.profile.contributor_note = null;
    }
    success.value = 'Permohonan berhasil dibatalkan.';
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <SiteNavbar variant="home" />
    <div class="md:ml-64 pt-14 md:pt-0">

    <main class="max-w-3xl mx-auto w-full px-4 py-10">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Profil Saya</h1>

      <!-- Info Akun -->
      <section class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <h2 class="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">Informasi Akun</h2>
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <span v-if="profile?.avatar_url">
              <img :src="profile.avatar_url" class="w-14 h-14 rounded-full object-cover" alt="Avatar" />
            </span>
            <span v-else class="material-symbols-outlined text-3xl text-emerald-600 dark:text-emerald-400">person</span>
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-gray-100 text-lg">{{ profile?.full_name || '-' }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ user?.email }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">Jabatan</span>
            <p class="text-gray-800 dark:text-gray-200 font-medium">{{ profile?.job_title || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Departemen</span>
            <p class="text-gray-800 dark:text-gray-200 font-medium">{{ profile?.department || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Divisi</span>
            <p class="text-gray-800 dark:text-gray-200 font-medium">{{ profile?.division || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Role</span>
            <p class="text-gray-800 dark:text-gray-200 font-medium capitalize">{{ user?.role }}</p>
          </div>
        </div>
      </section>

      <!-- Status Kontributor -->
      <section class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 class="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">Status Kontributor</h2>

        <div class="flex items-center gap-3 mb-4">
          <span
            :class="[STATUS_COLOR[contributorStatus], 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium']"
          >
            <span class="material-symbols-outlined text-base">{{ STATUS_ICON[contributorStatus] }}</span>
            {{ STATUS_LABEL[contributorStatus] }}
          </span>
        </div>

        <!-- Approved -->
        <div v-if="contributorStatus === 'approved'" class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>Akun Anda telah diverifikasi sebagai <strong>Kontributor Terverifikasi</strong>. Anda dapat membuat dan mengirimkan artikel untuk ditinjau oleh pengelola.</p>
          <p>Diverifikasi pada: {{ formatDate(profile?.contributor_reviewed_at) }}</p>
          <RouterLink
            to="/kontributor/artikel"
            class="inline-flex items-center gap-1 mt-3 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
          >
            <span class="material-symbols-outlined text-base">article</span>
            Kelola Artikel Saya
          </RouterLink>
        </div>

        <!-- Pending -->
        <div v-else-if="contributorStatus === 'pending'" class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Permohonan Anda sedang ditinjau oleh pengelola. Harap bersabar.
          </p>
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <p class="font-medium text-gray-500 dark:text-gray-400 mb-1 text-xs uppercase tracking-wide">Catatan yang Anda kirimkan</p>
            <p>{{ profile?.contributor_note || '-' }}</p>
          </div>
          <button
            @click="cancelRequest"
            :disabled="isLoading"
            class="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
          >
            Batalkan Permohonan
          </button>
        </div>

        <!-- Rejected -->
        <div v-else-if="contributorStatus === 'rejected'" class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Permohonan Anda sebelumnya ditolak. Anda dapat mengajukan kembali.
          </p>
          <div
            v-if="profile?.contributor_note"
            class="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50"
          >
            <p class="font-medium mb-1 text-xs uppercase tracking-wide">Alasan penolakan</p>
            <p>{{ profile.contributor_note }}</p>
          </div>
          <button
            @click="showForm = true"
            class="inline-flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <span class="material-symbols-outlined text-base">send</span>
            Ajukan Ulang
          </button>
        </div>

        <!-- None — belum pernah mendaftar -->
        <div v-else class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Sebagai <strong>Kontributor Terverifikasi</strong>, Anda dapat mempublikasikan artikel pengetahuan tentang pengolahan limbah kelapa yang akan ditinjau dan diterbitkan oleh pengelola.
          </p>
          <button
            v-if="!showForm"
            @click="showForm = true"
            class="inline-flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <span class="material-symbols-outlined text-base">edit_note</span>
            Ajukan sebagai Kontributor
          </button>
        </div>

        <!-- Form Pengajuan -->
        <div v-if="showForm && ['none', 'rejected'].includes(contributorStatus)" class="mt-4 space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Latar Belakang & Keahlian
            </label>
            <textarea
              v-model="note"
              rows="4"
              placeholder="Ceritakan tentang keahlian Anda di bidang pengolahan kelapa, pengalaman kerja, institusi, atau alasan ingin berkontribusi..."
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
          <div class="flex gap-2">
            <button
              @click="applyContributor"
              :disabled="isLoading"
              class="inline-flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <span class="material-symbols-outlined text-base">send</span>
              {{ isLoading ? 'Mengirim...' : 'Kirim Permohonan' }}
            </button>
            <button
              @click="showForm = false; note = ''; error = null"
              class="text-sm text-gray-500 dark:text-gray-400 hover:underline px-3 py-2"
            >
              Batal
            </button>
          </div>
        </div>

        <!-- Feedback -->
        <p v-if="error" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{{ success }}</p>
      </section>
    </main>

    <SiteFooter />
    </div>
  </div>
</template>
