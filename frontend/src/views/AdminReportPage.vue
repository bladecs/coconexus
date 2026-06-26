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
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Laporan Sistem</h1>
        </div>
        <button
          @click="exportReport"
          class="admin-primary-action transition-all duration-150"
        >
          Export Report
        </button>
      </header>

      <div v-if="error" class="text-error mb-6 p-4 rounded bg-error-container/20 border border-error/30">
        {{ error }}
      </div>

      <!-- Period Filter -->
      <section class="admin-ds-panel mb-6">
        <div class="flex gap-4">
          <select v-model="selectedPeriod" @change="fetchReport" class="px-3 py-2 rounded">
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="quarter">Kuartal Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
        </div>
      </section>

      <!-- Report Stats -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="admin-ds-panel transition-all duration-200 hover:shadow-md">
          <p class="admin-section-label">PENGGUNA</p>
          <strong class="text-3xl text-on-surface block mt-2">{{ reportData.users }}</strong>
          <span class="text-sm text-on-surface-variant">Total Pengguna</span>
        </div>
        <div class="admin-ds-panel transition-all duration-200 hover:shadow-md">
          <p class="admin-section-label">ARTIKEL</p>
          <strong class="text-3xl text-primary block mt-2">{{ reportData.articles }}</strong>
          <span class="text-sm text-on-surface-variant">Total Artikel</span>
        </div>
        <div class="admin-ds-panel transition-all duration-200 hover:shadow-md">
          <p class="admin-section-label">KOMENTAR</p>
          <strong class="text-3xl text-secondary block mt-2">{{ reportData.comments }}</strong>
          <span class="text-sm text-on-surface-variant">Total Komentar</span>
        </div>
        <div class="admin-ds-panel transition-all duration-200 hover:shadow-md">
          <p class="admin-section-label">VIEWS</p>
          <strong class="text-3xl text-secondary block mt-2">{{ reportData.views }}</strong>
          <span class="text-sm text-on-surface-variant">Total Views</span>
        </div>
        <div class="admin-ds-panel transition-all duration-200 hover:shadow-md">
          <p class="admin-section-label">KATEGORI</p>
          <strong class="text-3xl text-primary block mt-2">{{ reportData.categories }}</strong>
          <span class="text-sm text-on-surface-variant">Total Kategori</span>
        </div>
      </section>

      <!-- Detailed Report -->
      <section class="admin-ds-panel">
        <p class="admin-section-label mb-4">RINGKASAN LAPORAN DETAIL</p>

        <div v-if="isLoading" class="text-center py-8 text-on-surface-variant">
          <p>Memuat laporan...</p>
        </div>

        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded bg-surface-container border border-outline-variant/40">
              <p class="text-sm text-on-surface-variant mb-2">Periode</p>
              <p class="font-semibold capitalize text-on-surface">{{ selectedPeriod }}</p>
            </div>
            <div class="p-4 rounded bg-surface-container border border-outline-variant/40">
              <p class="text-sm text-on-surface-variant mb-2">Tanggal Laporan</p>
              <p class="font-semibold text-on-surface">{{ new Date().toLocaleDateString('id-ID') }}</p>
            </div>
          </div>

          <div class="mt-6">
            <h3 class="font-semibold mb-4 text-on-surface">Statistik Konten</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Rata-rata Artikel per Pengguna</span>
                <strong class="text-on-surface">{{ reportData.articles > 0 ? (reportData.articles / reportData.users).toFixed(2) : 0 }}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Rata-rata Komentar per Artikel</span>
                <strong class="text-on-surface">{{ reportData.articles > 0 ? (reportData.comments / reportData.articles).toFixed(2) : 0 }}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-on-surface-variant">Rata-rata Views per Artikel</span>
                <strong class="text-on-surface">{{ reportData.articles > 0 ? (reportData.views / reportData.articles).toFixed(0) : 0 }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

