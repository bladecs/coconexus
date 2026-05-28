<script setup>
import { onMounted, ref, computed } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const activities = ref([]);
const isLoading = ref(false);
const error = ref(null);

const stats = computed(() => ({
  total: activities.value.length,
  today: activities.value.filter((a) => {
    const actDate = new Date(a.created_at);
    const today = new Date();
    return actDate.toDateString() === today.toDateString();
  }).length,
  thisWeek: activities.value.filter((a) => {
    const actDate = new Date(a.created_at);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return actDate >= weekAgo;
  }).length,
}));

async function fetchActivities() {
  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await api.get('/admin/audit-logs');
    activities.value = data.data.logs || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

const activityByUser = computed(() => {
  const map = {};
  activities.value.forEach((a) => {
    const key = a.user?.email || 'Unknown';
    if (!map[key]) map[key] = 0;
    map[key]++;
  });
  return Object.entries(map)
    .map(([user, count]) => ({ user, count }))
    .sort((a, b) => b.count - a.count);
});

const activityByAction = computed(() => {
  const map = {};
  activities.value.forEach((a) => {
    const key = a.action || 'Unknown';
    if (!map[key]) map[key] = 0;
    map[key]++;
  });
  return Object.entries(map)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);
});

onMounted(() => {
  fetchActivities();
});
</script>

<template>
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="admin" />

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Monitor Aktivitas</h1>
        </div>
      </header>

      <!-- Stats Cards -->
      <section class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6 mb-8">
        <div class="admin-signal-board">
          <p class="admin-section-label">TOTAL</p>
          <strong class="text-3xl">{{ stats.total }}</strong>
          <span class="text-sm">Total Aktivitas</span>
        </div>
        <div class="admin-signal-board">
          <p class="admin-section-label">HARI INI</p>
          <strong class="text-3xl text-green-400">{{ stats.today }}</strong>
          <span class="text-sm">Aktivitas Hari Ini</span>
        </div>
        <div class="admin-signal-board">
          <p class="admin-section-label">MINGGU INI</p>
          <strong class="text-3xl text-blue-400">{{ stats.thisWeek }}</strong>
          <span class="text-sm">Aktivitas Minggu Ini</span>
        </div>
      </section>

      <!-- Activity by User -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="admin-signal-board">
          <p class="admin-section-label mb-4">AKTIVITAS PER PENGGUNA</p>
          <div v-if="isLoading" class="text-center py-4">
            <p>Memuat...</p>
          </div>
          <div v-else-if="activityByUser.length === 0" class="text-center py-4 text-stone-400">
            Belum ada aktivitas
          </div>
          <div v-else class="space-y-2">
            <div v-for="(item, idx) in activityByUser.slice(0, 10)" :key="idx" class="flex justify-between text-sm">
              <span>{{ item.user }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>

        <!-- Activity by Action -->
        <div class="admin-signal-board">
          <p class="admin-section-label mb-4">AKTIVITAS PER AKSI</p>
          <div v-if="isLoading" class="text-center py-4">
            <p>Memuat...</p>
          </div>
          <div v-else-if="activityByAction.length === 0" class="text-center py-4 text-stone-400">
            Belum ada aktivitas
          </div>
          <div v-else class="space-y-2">
            <div v-for="(item, idx) in activityByAction" :key="idx" class="flex justify-between text-sm">
              <span>{{ item.action }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activities -->
      <section class="admin-signal-board">
        <p class="admin-section-label mb-4">AKTIVITAS TERBARU</p>

        <div v-if="isLoading" class="text-center py-8">
          <p>Memuat aktivitas...</p>
        </div>

        <div v-else-if="error" class="text-red-400 text-center py-8">
          {{ error }}
        </div>

        <div v-else-if="activities.length === 0" class="text-center py-8 text-stone-400">
          Belum ada aktivitas
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-stone-600">
                <th class="text-left px-4 py-3">Waktu</th>
                <th class="text-left px-4 py-3">Pengguna</th>
                <th class="text-left px-4 py-3">Aksi</th>
                <th class="text-left px-4 py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in activities.slice(0, 20)" :key="activity.id" class="border-b border-stone-700 hover:bg-stone-800">
                <td class="px-4 py-3 text-xs text-stone-400">
                  {{ new Date(activity.created_at).toLocaleString('id-ID') }}
                </td>
                <td class="px-4 py-3">{{ activity.user?.email || '-' }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded text-xs bg-stone-700">
                    {{ activity.action }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs">{{ activity.description || '-' }}</td>
              </tr>
            </tbody>
          </table>
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
