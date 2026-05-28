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
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="admin" />

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Manajemen Sistem</h1>
        </div>
      </header>

      <div v-if="error" class="text-red-400 mb-6 p-4 rounded bg-red-900">
        {{ error }}
      </div>

      <!-- System Status -->
      <section class="admin-signal-board mb-6">
        <p class="admin-section-label mb-4">STATUS SISTEM</p>

        <div v-if="isLoading" class="text-center py-8">
          <p>Memeriksa sistem...</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded bg-stone-900 border border-stone-700">
            <p class="text-sm text-stone-400 mb-2">DATABASE</p>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{{ systemInfo.database }}</span>
            </div>
          </div>
          <div class="p-4 rounded bg-stone-900 border border-stone-700">
            <p class="text-sm text-stone-400 mb-2">STORAGE</p>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{{ systemInfo.storage }}</span>
            </div>
          </div>
          <div class="p-4 rounded bg-stone-900 border border-stone-700">
            <p class="text-sm text-stone-400 mb-2">CACHE</p>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{{ systemInfo.cache }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- System Actions -->
      <section class="admin-signal-board">
        <p class="admin-section-label mb-4">AKSI SISTEM</p>

        <div class="space-y-3">
          <button
            @click="clearCache"
            class="block w-full text-left px-4 py-3 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 transition"
          >
            <p class="font-semibold">Bersihkan Cache</p>
            <p class="text-sm text-stone-400">Menghapus semua data cache yang disimpan</p>
          </button>

          <button
            @click="runMaintenance"
            class="block w-full text-left px-4 py-3 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 transition"
          >
            <p class="font-semibold">Jalankan Maintenance</p>
            <p class="text-sm text-stone-400">Optimasi database dan cleanup file</p>
          </button>

          <button
            @click="checkSystem"
            :disabled="isLoading"
            class="block w-full text-left px-4 py-3 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 transition disabled:opacity-50"
          >
            <p class="font-semibold">{{ isLoading ? 'Memeriksa...' : 'Periksa Status Sistem' }}</p>
            <p class="text-sm text-stone-400">Cek kesehatan sistem</p>
          </button>
        </div>
      </section>

      <!-- System Settings -->
      <section class="admin-signal-board mt-6">
        <p class="admin-section-label mb-4">PENGATURAN SISTEM</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-2">Maintenance Mode</label>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="maintenance" class="rounded" />
              <label for="maintenance" class="text-sm">Aktifkan maintenance mode</label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-2">Debug Mode</label>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="debug" class="rounded" />
              <label for="debug" class="text-sm">Aktifkan debug mode</label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-2">Max Upload Size (MB)</label>
            <input
              type="number"
              value="50"
              class="w-full rounded bg-stone-800 px-3 py-2 text-stone-100 border border-stone-600"
            />
          </div>

          <button class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition">
            Simpan Pengaturan
          </button>
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
