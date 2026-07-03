<script setup>
import { onMounted, reactive, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const requests = ref([]);
const isLoading = ref(false);
const error = ref(null);
const filters = reactive({ status: 'pending' });

const reviewModal = reactive({
  open: false,
  userId: null,
  fullName: '',
  action: '',
  note: '',
  isSubmitting: false,
  error: null,
});

const STATUS_LABEL = {
  pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak', all: 'Semua',
};
const STATUS_COLOR = {
  pending:  'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  approved: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  rejected: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function fetchRequests() {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/pengelola/contributor-requests', {
      params: { status: filters.status, limit: 50 },
    });
    requests.value = data.data.requests || [];
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    isLoading.value = false;
  }
}

function openReview(req, action) {
  reviewModal.open = true;
  reviewModal.userId = req.user_id;
  reviewModal.fullName = req.full_name;
  reviewModal.action = action;
  reviewModal.note = '';
  reviewModal.error = null;
  reviewModal.isSubmitting = false;
}

function closeReview() {
  reviewModal.open = false;
}

async function submitReview() {
  reviewModal.isSubmitting = true;
  reviewModal.error = null;
  try {
    await api.patch(`/pengelola/contributor-requests/${reviewModal.userId}`, {
      action: reviewModal.action,
      note: reviewModal.note.trim() || undefined,
    });
    reviewModal.open = false;
    await fetchRequests();
  } catch (err) {
    reviewModal.error = err.response?.data?.message || err.message;
  } finally {
    reviewModal.isSubmitting = false;
  }
}

onMounted(fetchRequests);
</script>

<template>
  <SiteNavbar variant="pengelola" />

  <main class="inner-page pengelola-workspace min-h-screen px-5 pb-16 pt-32 sm:px-8 lg:px-10">
    <section class="mx-auto max-w-[1680px]">

      <header class="mb-8 border-b border-outline-variant/30 pb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-symbols-outlined text-primary" style="font-size:15px">verified_user</span>
          <p class="text-xs font-bold uppercase tracking-widest text-primary/80">Coconexus / Pengelola Kontributor</p>
        </div>
        <h1 class="text-3xl font-black tracking-tight text-on-surface">Permohonan Kontributor</h1>
        <p class="mt-1 text-sm text-on-surface-variant">Tinjau dan kelola permohonan verifikasi kontributor</p>
      </header>

      <!-- Filter Tabs -->
      <div class="flex gap-1 bg-surface-container-low rounded-lg p-1 w-fit mb-6">
        <button
          v-for="s in ['pending', 'approved', 'rejected', 'all']"
          :key="s"
          @click="filters.status = s; fetchRequests()"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            filters.status === s
              ? 'bg-surface text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface',
          ]"
        >
          {{ STATUS_LABEL[s] }}
        </button>
      </div>

      <!-- Loading / Error -->
      <div v-if="isLoading" class="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
        <span class="material-symbols-outlined animate-spin" style="font-size:18px">progress_activity</span>
        <span class="text-sm">Memuat permohonan...</span>
      </div>
      <div v-else-if="error" class="text-center py-12 text-error text-sm">{{ error }}</div>

      <!-- Empty -->
      <div
        v-else-if="requests.length === 0"
        class="text-center py-16 text-on-surface-variant"
      >
        <span class="material-symbols-outlined mb-2 block text-4xl text-outline-variant">inbox</span>
        <p class="text-sm">Tidak ada permohonan berstatus "{{ STATUS_LABEL[filters.status] }}"</p>
      </div>

      <!-- Table -->
      <div v-else class="admin-ds-panel overflow-x-auto p-0">
        <table class="w-full text-sm">
          <thead class="border-b border-outline-variant/20 bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th class="text-left px-4 py-3 font-semibold">Pengguna</th>
              <th class="text-left px-4 py-3 font-semibold">Jabatan / Dept</th>
              <th class="text-left px-4 py-3 font-semibold">Catatan</th>
              <th class="text-left px-4 py-3 font-semibold">Status</th>
              <th class="text-left px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in requests" :key="req.user_id" class="border-b border-outline-variant/10 last:border-0 hover:bg-teal-500/3 transition-colors">
              <td class="px-4 py-3">
                <p class="font-medium text-on-surface">{{ req.full_name }}</p>
                <p class="text-xs text-on-surface-variant">{{ req.email }}</p>
                <p class="text-xs text-on-surface-variant">Bergabung: {{ formatDate(req.user_created_at) }}</p>
              </td>
              <td class="px-4 py-3 text-on-surface-variant">
                <p>{{ req.job_title || '-' }}</p>
                <p class="text-xs">{{ req.department || '' }}</p>
              </td>
              <td class="px-4 py-3 max-w-xs">
                <p class="text-on-surface line-clamp-3 text-xs">{{ req.contributor_note || '-' }}</p>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[STATUS_COLOR[req.contributor_status] || 'bg-surface-container text-on-surface-variant', 'px-2 py-0.5 rounded-full text-xs font-medium']"
                >
                  {{ STATUS_LABEL[req.contributor_status] || req.contributor_status }}
                </span>
                <p v-if="req.contributor_reviewed_at" class="text-xs text-on-surface-variant mt-1">
                  {{ formatDate(req.contributor_reviewed_at) }}
                </p>
              </td>
              <td class="px-4 py-3">
                <div v-if="req.contributor_status === 'pending'" class="flex gap-2">
                  <button
                    @click="openReview(req, 'approve')"
                    class="inline-flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <span class="material-symbols-outlined text-sm">check</span>
                    Setujui
                  </button>
                  <button
                    @click="openReview(req, 'reject')"
                    class="inline-flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <span class="material-symbols-outlined text-sm">close</span>
                    Tolak
                  </button>
                </div>
                <span v-else class="text-xs text-on-surface-variant">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </section>
  </main>

  <!-- Review Modal -->
  <Teleport to="body">
      <div
        v-if="reviewModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="closeReview"
      >
        <div class="bg-surface rounded-xl shadow-xl w-full max-w-md p-6 border border-outline-variant/20">
          <h2 class="text-base font-semibold text-on-surface mb-4">
            {{ reviewModal.action === 'approve' ? 'Setujui' : 'Tolak' }} Permohonan
          </h2>
          <p class="text-sm text-on-surface-variant mb-4">
            Anda akan
            <strong class="text-on-surface">{{ reviewModal.action === 'approve' ? 'menyetujui' : 'menolak' }}</strong>
            permohonan dari <strong class="text-on-surface">{{ reviewModal.fullName }}</strong>.
          </p>
          <div class="mb-4">
            <label class="block text-sm font-medium text-on-surface mb-1">
              {{ reviewModal.action === 'reject' ? 'Alasan Penolakan (opsional)' : 'Catatan (opsional)' }}
            </label>
            <textarea
              v-model="reviewModal.note"
              rows="3"
              class="w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              :placeholder="reviewModal.action === 'reject' ? 'Mis: Profil keahlian belum memadai...' : 'Catatan untuk kontributor...'"
            />
          </div>
          <p v-if="reviewModal.error" class="text-sm text-error mb-3">{{ reviewModal.error }}</p>
          <div class="flex justify-end gap-2">
            <button
              @click="closeReview"
              class="text-sm text-on-surface-variant hover:underline px-3 py-2"
            >
              Batal
            </button>
            <button
              @click="submitReview"
              :disabled="reviewModal.isSubmitting"
              :class="[
                'inline-flex items-center gap-1 text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50',
                reviewModal.action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white',
              ]"
            >
              {{ reviewModal.isSubmitting ? 'Menyimpan...' : (reviewModal.action === 'approve' ? 'Setujui' : 'Tolak') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
</template>
