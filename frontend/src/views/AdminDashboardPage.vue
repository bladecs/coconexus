<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import AdminStatsChart from '@/components/admin/AdminStatsChart.vue';
import { useAdminStore } from '@/stores/admin';
import { useAuthStore } from '@/stores/auth';

const adminStore = useAdminStore();
const authStore = useAuthStore();

const stats = computed(() => adminStore.dashboardStats);
const totals = computed(() => stats.value?.totals || {
  users: 0,
  articles: 0,
  published_articles: 0,
  draft_articles: 0,
  revision_articles: 0,
  categories: 0,
  comments: 0,
  article_views: 0,
});
const charts = computed(() => stats.value?.charts || {
  articles_by_category: { labels: [], datasets: [], items: [] },
  comments_by_month: { labels: [], datasets: [], items: [] },
  users_by_role: { labels: [], datasets: [], items: [] },
  users_by_month: { labels: [], datasets: [], items: [] },
  active_users_by_month: { labels: [], datasets: [], items: [] },
  article_views_by_month: { labels: [], datasets: [], items: [] },
  reader_activity_by_article: { labels: [], datasets: [], items: [] },
});
const draftQueue = computed(
  () => (totals.value.draft_articles || 0) + (totals.value.revision_articles || 0)
);
const publishRate = computed(() => {
  if (!totals.value.articles) {
    return 0;
  }

  return Math.round((totals.value.published_articles / totals.value.articles) * 100);
});
const activeUserChart = computed(() => charts.value.active_users_by_month);
const articleViewMonthChart = computed(() => charts.value.article_views_by_month);
const userMonthChart = computed(() => charts.value.users_by_month);
const readerActivityChart = computed(() => charts.value.reader_activity_by_article);
const userRoleChart = computed(() => charts.value.users_by_role);
const articleCategoryChart = computed(() => charts.value.articles_by_category);
const commentMonthChart = computed(() => charts.value.comments_by_month);
const topReaderItems = computed(() => readerActivityChart.value.items.slice(0, 5));
const categoryItems = computed(() => articleCategoryChart.value.items.slice(0, 6));
const quickStats = computed(() => [
  { label: 'User', value: totals.value.users, note: 'akun terdaftar' },
  { label: 'Artikel', value: totals.value.articles, note: `${totals.value.published_articles} published` },
  { label: 'Antrean', value: draftQueue.value, note: 'draft + revision' },
  { label: 'Dibaca', value: totals.value.article_views, note: 'view artikel' },
]);

function formatActivityDate(value) {
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

onMounted(async () => {
  try {
    await adminStore.fetchDashboardStats();
  } catch (err) {
    console.warn('[admin-dashboard] failed to fetch stats:', err);
  }
});
</script>

<template>
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1680px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">COCONEXUS / ADMIN OPERATIONS</p>
          <h1>Ruang Kendali Konten</h1>
        </div>
        <div class="admin-header-actions">
          <span>{{ authStore.user?.profile?.full_name || authStore.user?.email || 'Admin' }}</span>
          <div>
            <RouterLink to="/admin/articles/new" class="admin-primary-action">
              Tambah Artikel
            </RouterLink>
            <RouterLink to="/admin/articles" class="admin-secondary-action">
              Buka CMS
            </RouterLink>
          </div>
        </div>
      </header>

      <section class="admin-command-grid">
        <article class="admin-signal-board">
          <div>
            <p class="admin-section-label">TODAY'S SIGNAL</p>
            <strong>{{ publishRate }}%</strong>
            <span>artikel sudah published dari total konten yang tersimpan.</span>
          </div>
          <div class="admin-stat-strip">
            <div v-for="item in quickStats" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.note }}</small>
            </div>
          </div>
        </article>

        <aside class="admin-editorial-queue">
          <p class="admin-section-label">EDITORIAL QUEUE</p>
          <div class="admin-queue-line">
            <span>Draft</span>
            <strong>{{ totals.draft_articles }}</strong>
          </div>
          <div class="admin-queue-line is-warm">
            <span>Revision</span>
            <strong>{{ totals.revision_articles }}</strong>
          </div>
          <div class="admin-queue-line">
            <span>Published</span>
            <strong>{{ totals.published_articles }}</strong>
          </div>
        </aside>
      </section>

      <section class="admin-analytics-mosaic">
        <div class="admin-chart-wide">
          <AdminStatsChart
            type="bar"
            title="Keaktifan Membaca Artikel"
            description="Artikel published dengan interaksi komentar terbanyak sebagai sinyal keterlibatan pembaca."
            :chart-data="readerActivityChart"
            height-class="h-96"
          />
        </div>
        <AdminStatsChart
          type="bar"
          title="User Baru per Bulan"
          description="Pertumbuhan pengguna berdasarkan tanggal pendaftaran akun."
          :chart-data="userMonthChart"
          height-class="h-80"
        />
        <AdminStatsChart
          type="bar"
          title="User Aktif Membaca"
          description="Jumlah pembaca unik berdasarkan user login, sesi browser, atau IP anonim."
          :chart-data="activeUserChart"
          height-class="h-80"
        />
        <AdminStatsChart
          type="bar"
          title="Artikel Dibaca per Bulan"
          description="Total kunjungan ke detail artikel published yang tercatat sistem."
          :chart-data="articleViewMonthChart"
          height-class="h-80"
        />
        <AdminStatsChart
          type="doughnut"
          title="Komposisi Role Pengguna"
          description="Perbandingan akun admin dan user yang tersimpan di sistem."
          :chart-data="userRoleChart"
          height-class="h-80"
        />
        <AdminStatsChart
          type="bar"
          title="Artikel per Kategori"
          description="Distribusi konten untuk melihat kategori yang paling aktif."
          :chart-data="articleCategoryChart"
          height-class="h-80"
        />
        <AdminStatsChart
          type="doughnut"
          title="Komentar per Bulan"
          description="Ritme diskusi komunitas dari bulan ke bulan."
          :chart-data="commentMonthChart"
          height-class="h-80"
        />
      </section>

      <section class="admin-bottom-grid">
        <article class="admin-table-panel">
          <div class="admin-panel-heading">
            <div>
              <p class="admin-section-label">READING INTERACTION</p>
              <h2>Artikel Paling Aktif</h2>
            </div>
            <RouterLink to="/admin/comments" class="admin-secondary-action">Moderasi</RouterLink>
          </div>

          <div class="admin-ranked-list">
            <div
              v-for="(item, index) in topReaderItems"
              :key="item.article_id"
              class="admin-ranked-row"
            >
              <span>{{ index + 1 }}</span>
              <div>
                <p>{{ item.article_title }}</p>
                <small>{{ item.active_readers }} user aktif</small>
              </div>
              <strong>{{ item.interaction_count }}</strong>
            </div>

            <div v-if="!topReaderItems.length" class="admin-empty-state">
              Belum ada interaksi pembaca yang tercatat.
            </div>
          </div>
        </article>

        <article class="admin-table-panel">
          <div class="admin-panel-heading">
            <div>
              <p class="admin-section-label">CATEGORY BALANCE</p>
              <h2>Sebaran Konten</h2>
            </div>
          </div>
          <div class="admin-category-bars">
            <div
              v-for="item in categoryItems"
              :key="item.category_id"
            >
              <span>{{ item.category_name }}</span>
              <div>
                <i
                  :style="{
                    width: `${Math.max(
                      8,
                      (item.article_count /
                        Math.max(...categoryItems.map((categoryItem) => categoryItem.article_count), 1)) *
                        100
                    )}%`,
                  }"
                />
              </div>
              <strong>{{ item.article_count }}</strong>
            </div>
          </div>
        </article>

        <article class="admin-table-panel">
          <div class="admin-panel-heading">
            <div>
              <p class="admin-section-label">AUDIT TRAIL</p>
              <h2>Aktivitas Terakhir</h2>
            </div>
          </div>

          <div class="admin-feed">
            <div
              v-for="activity in stats.recent_activities"
              :key="activity.id"
            >
              <time>{{ formatActivityDate(activity.created_at) }}</time>
              <p>
                <strong>{{ activity.actor?.profile?.full_name || activity.actor?.email || 'Admin' }}</strong>
                {{ activity.action }} pada {{ activity.entity_type }}
                <span v-if="activity.entity_id">#{{ activity.entity_id }}</span>
              </p>
            </div>

            <div v-if="!stats.recent_activities.length" class="admin-empty-state">
              Belum ada aktivitas admin yang tercatat.
            </div>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
