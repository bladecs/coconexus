<script setup>
import { onMounted, ref, computed } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const reportData = ref({
  users: 0,
  articles: 0,
  comments: 0,
  views: 0,
  categories: 0,
});
const isLoading = ref(false);
const error = ref(null);
const selectedPeriod = ref('month');

async function fetchReport() {
  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await api.get(`/admin/reports?period=${selectedPeriod.value}`);
    reportData.value = data.data.report || reportData.value;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function exportReport() {
  try {
    const { data } = await api.get(`/admin/reports/export?period=${selectedPeriod.value}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${selectedPeriod.value}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(() => {
  fetchReport();
});
</script>

<template>
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="admin" />

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Laporan Sistem</h1>
        </div>
        <button
          @click="exportReport"
          class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition"
        >
          Export Report
        </button>
      </header>

      <div v-if="error" class="text-red-400 mb-6 p-4 rounded bg-red-900">
        {{ error }}
      </div>

      <!-- Period Filter -->
      <section class="admin-signal-board mb-6">
        <div class="flex gap-4">
          <select
            v-model="selectedPeriod"
            @change="fetchReport"
            class="px-3 py-2 rounded bg-stone-800 border border-stone-600 text-stone-100"
          >
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="quarter">Kuartal Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
        </div>
      </section>

      <!-- Report Stats -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="admin-signal-board">
          <p class="admin-section-label">PENGGUNA</p>
          <strong class="text-3xl">{{ reportData.users }}</strong>
          <span class="text-sm">Total Pengguna</span>
        </div>
        <div class="admin-signal-board">
          <p class="admin-section-label">ARTIKEL</p>
          <strong class="text-3xl text-green-400">{{ reportData.articles }}</strong>
          <span class="text-sm">Total Artikel</span>
        </div>
        <div class="admin-signal-board">
          <p class="admin-section-label">KOMENTAR</p>
          <strong class="text-3xl text-blue-400">{{ reportData.comments }}</strong>
          <span class="text-sm">Total Komentar</span>
        </div>
        <div class="admin-signal-board">
          <p class="admin-section-label">VIEWS</p>
          <strong class="text-3xl text-yellow-400">{{ reportData.views }}</strong>
          <span class="text-sm">Total Views</span>
        </div>
        <div class="admin-signal-board">
          <p class="admin-section-label">KATEGORI</p>
          <strong class="text-3xl text-purple-400">{{ reportData.categories }}</strong>
          <span class="text-sm">Total Kategori</span>
        </div>
      </section>

      <!-- Detailed Report -->
      <section class="admin-signal-board">
        <p class="admin-section-label mb-4">RINGKASAN LAPORAN DETAIL</p>

        <div v-if="isLoading" class="text-center py-8">
          <p>Memuat laporan...</p>
        </div>

        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded bg-stone-900 border border-stone-700">
              <p class="text-sm text-stone-400 mb-2">Periode</p>
              <p class="font-semibold capitalize">{{ selectedPeriod }}</p>
            </div>
            <div class="p-4 rounded bg-stone-900 border border-stone-700">
              <p class="text-sm text-stone-400 mb-2">Tanggal Laporan</p>
              <p class="font-semibold">{{ new Date().toLocaleDateString('id-ID') }}</p>
            </div>
          </div>

          <div class="mt-6">
            <h3 class="font-semibold mb-4">Statistik Konten</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Rata-rata Artikel per Pengguna</span>
                <strong>{{ reportData.articles > 0 ? (reportData.articles / reportData.users).toFixed(2) : 0 }}</strong>
              </div>
              <div class="flex justify-between">
                <span>Rata-rata Komentar per Artikel</span>
                <strong>{{ reportData.articles > 0 ? (reportData.comments / reportData.articles).toFixed(2) : 0 }}</strong>
              </div>
              <div class="flex justify-between">
                <span>Rata-rata Views per Artikel</span>
                <strong>{{ reportData.articles > 0 ? (reportData.views / reportData.articles).toFixed(0) : 0 }}</strong>
              </div>
            </div>
          </div>
        </div>
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
