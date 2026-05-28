<script setup>
import { onMounted, ref, reactive } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const logs = ref([]);
const isLoading = ref(false);
const error = ref(null);
const filters = reactive({
  action: 'all',
  user: '',
});

async function fetchLogs() {
  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await api.get('/admin/audit-logs');
    logs.value = data.data.logs || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'PUBLISH', 'DRAFT'];

onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="admin" />

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Activity Log</h1>
        </div>
      </header>

      <!-- Filters -->
      <section class="admin-signal-board mb-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm mb-2">Aksi</label>
            <select
              v-model="filters.action"
              class="w-full rounded bg-stone-800 px-3 py-2 text-stone-100 border border-stone-600"
            >
              <option value="all">Semua Aksi</option>
              <option v-for="action in actions" :key="action" :value="action">
                {{ action }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-2">Cari Email Pengguna</label>
            <input
              v-model="filters.user"
              type="text"
              placeholder="Cari email..."
              class="w-full rounded bg-stone-800 px-3 py-2 text-stone-100 border border-stone-600"
            />
          </div>
        </div>
      </section>

      <!-- Logs Table -->
      <section class="admin-signal-board overflow-x-auto">
        <p class="admin-section-label mb-4">DAFTAR AKTIVITAS</p>

        <div v-if="isLoading" class="text-center py-8">
          <p>Memuat log...</p>
        </div>

        <div v-else-if="error" class="text-red-400 text-center py-8">
          {{ error }}
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-stone-600">
              <th class="text-left px-4 py-3">Waktu</th>
              <th class="text-left px-4 py-3">Pengguna</th>
              <th class="text-left px-4 py-3">Aksi</th>
              <th class="text-left px-4 py-3">Resource</th>
              <th class="text-left px-4 py-3">Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" class="border-b border-stone-700 hover:bg-stone-800">
              <td class="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
                {{ new Date(log.created_at).toLocaleString('id-ID') }}
              </td>
              <td class="px-4 py-3">{{ log.user?.email || '-' }}</td>
              <td class="px-4 py-3">
                <span
                  :class="{
                    'px-2 py-1 rounded text-xs font-semibold': true,
                    'bg-green-900 text-green-200': log.action === 'CREATE',
                    'bg-blue-900 text-blue-200': log.action === 'READ',
                    'bg-yellow-900 text-yellow-200': log.action === 'UPDATE',
                    'bg-red-900 text-red-200': log.action === 'DELETE',
                    'bg-purple-900 text-purple-200': log.action === 'PUBLISH',
                  }"
                >
                  {{ log.action }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm">{{ log.resource_type || '-' }}</td>
              <td class="px-4 py-3 text-sm">{{ log.description || '-' }}</td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="5" class="text-center py-8 text-stone-400">
                Tidak ada log ditemukan
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
