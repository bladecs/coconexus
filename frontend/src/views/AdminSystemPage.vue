<script setup>
import { onMounted, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const systemInfo = ref({
  database: 'Connected',
  storage: 'Connected',
  cache: 'Connected',
});
const isLoading = ref(false);
const error = ref(null);

async function checkSystem() {
  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await api.get('/admin/system-health');
    systemInfo.value = data.data.system || systemInfo.value;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function clearCache() {
  if (!confirm('Yakin ingin menghapus cache?')) return;

  try {
    await api.post('/admin/system/cache/clear');
    alert('Cache berhasil dihapus');
  } catch (err) {
    error.value = err.message;
  }
}

async function runMaintenance() {
  if (!confirm('Yakin ingin menjalankan maintenance?')) return;

  isLoading.value = true;
  try {
    await api.post('/admin/system/maintenance');
    alert('Maintenance selesai');
    await checkSystem();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  checkSystem();
});
</script>

<template>
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Manajemen Sistem</h1>
        </div>
      </header>

      <div v-if="error" class="text-error mb-6 p-4 rounded bg-error-container/20 border border-error/30">
        {{ error }}
      </div>

      <!-- System Status -->
      <section class="admin-ds-panel mb-6">
        <p class="admin-section-label mb-4">STATUS SISTEM</p>

        <div v-if="isLoading" class="text-center py-8 text-on-surface-variant">
          <p>Memeriksa sistem...</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded bg-surface-container border border-outline-variant/40 transition-all duration-200 hover:shadow-md">
            <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">DATABASE</p>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <span class="text-on-surface">{{ systemInfo.database }}</span>
            </div>
          </div>
          <div class="p-4 rounded bg-surface-container border border-outline-variant/40 transition-all duration-200 hover:shadow-md">
            <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">STORAGE</p>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <span class="text-on-surface">{{ systemInfo.storage }}</span>
            </div>
          </div>
          <div class="p-4 rounded bg-surface-container border border-outline-variant/40 transition-all duration-200 hover:shadow-md">
            <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">CACHE</p>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <span class="text-on-surface">{{ systemInfo.cache }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- System Actions -->
      <section class="admin-ds-panel">
        <p class="admin-section-label mb-4">AKSI SISTEM</p>

        <div class="space-y-3">
          <button
            @click="clearCache"
            class="block w-full text-left px-4 py-3 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 transition-all duration-150"
          >
            <p class="font-semibold text-on-surface">Bersihkan Cache</p>
            <p class="text-sm text-on-surface-variant">Menghapus semua data cache yang disimpan</p>
          </button>

          <button
            @click="runMaintenance"
            class="block w-full text-left px-4 py-3 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 transition-all duration-150"
          >
            <p class="font-semibold text-on-surface">Jalankan Maintenance</p>
            <p class="text-sm text-on-surface-variant">Optimasi database dan cleanup file</p>
          </button>

          <button
            @click="checkSystem"
            :disabled="isLoading"
            class="block w-full text-left px-4 py-3 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 transition-all duration-150 disabled:opacity-50"
          >
            <p class="font-semibold text-on-surface">{{ isLoading ? 'Memeriksa...' : 'Periksa Status Sistem' }}</p>
            <p class="text-sm text-on-surface-variant">Cek kesehatan sistem</p>
          </button>
        </div>
      </section>

      <!-- System Settings -->
      <section class="admin-ds-panel mt-6">
        <p class="admin-section-label mb-4">PENGATURAN SISTEM</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-2 text-on-surface">Maintenance Mode</label>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="maintenance" class="rounded" />
              <label for="maintenance" class="text-sm text-on-surface-variant">Aktifkan maintenance mode</label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-2 text-on-surface">Debug Mode</label>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="debug" class="rounded" />
              <label for="debug" class="text-sm text-on-surface-variant">Aktifkan debug mode</label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-2 text-on-surface">Max Upload Size (MB)</label>
            <input type="number" value="50" class="w-full rounded px-3 py-2" />
          </div>

          <button class="px-4 py-2 rounded bg-primary text-on-primary hover:opacity-90 transition-all duration-150">
            Simpan Pengaturan
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

