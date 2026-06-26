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
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Activity Log</h1>
        </div>
      </header>

      <!-- Filters -->
      <section class="admin-ds-panel mb-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm mb-2 text-on-surface-variant">Aksi</label>
            <select v-model="filters.action" class="w-full rounded px-3 py-2">
              <option value="all">Semua Aksi</option>
              <option v-for="action in actions" :key="action" :value="action">
                {{ action }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-2 text-on-surface-variant">Cari Email Pengguna</label>
            <input
              v-model="filters.user"
              type="text"
              placeholder="Cari email..."
              class="w-full rounded px-3 py-2"
            />
          </div>
        </div>
      </section>

      <!-- Logs Table -->
      <section class="admin-ds-panel overflow-x-auto">
        <p class="admin-section-label mb-4">DAFTAR AKTIVITAS</p>

        <div v-if="isLoading" class="text-center py-8 text-on-surface-variant">
          <p>Memuat log...</p>
        </div>

        <div v-else-if="error" class="text-error text-center py-8">
          {{ error }}
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-outline-variant/50">
              <th class="text-left px-4 py-3 text-on-surface">Waktu</th>
              <th class="text-left px-4 py-3 text-on-surface">Pengguna</th>
              <th class="text-left px-4 py-3 text-on-surface">Aksi</th>
              <th class="text-left px-4 py-3 text-on-surface">Resource</th>
              <th class="text-left px-4 py-3 text-on-surface">Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" class="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors">
              <td class="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                {{ new Date(log.created_at).toLocaleString('id-ID') }}
              </td>
              <td class="px-4 py-3 text-on-surface">{{ log.user?.email || '-' }}</td>
              <td class="px-4 py-3">
                <span
                  class="admin-badge"
                  :class="{
                    'admin-badge--success': log.action === 'CREATE' || log.action === 'PUBLISH',
                    'admin-badge--warning': log.action === 'UPDATE',
                    'admin-badge--error': log.action === 'DELETE',
                    'admin-badge--info': log.action === 'READ',
                    'admin-badge--muted': !['CREATE','PUBLISH','UPDATE','DELETE','READ'].includes(log.action),
                  }"
                >
                  {{ log.action }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-on-surface">{{ log.resource_type || '-' }}</td>
              <td class="px-4 py-3 text-sm text-on-surface-variant">{{ log.description || '-' }}</td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="5" class="text-center py-8 text-outline">
                Tidak ada log ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </main>
</template>

