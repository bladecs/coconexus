<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useArticleStore } from '@/stores/articles';
import { useAdminStore } from '@/stores/admin';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import AdminStatsChart from '@/components/admin/AdminStatsChart.vue';
import AdminArticleEditor from '@/components/admin/AdminArticleEditor.vue';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import AdminUserManager from '@/components/admin/AdminUserManager.vue';
import AdminCategoryManager from '@/components/admin/AdminCategoryManager.vue';
import AdminCommentManager from '@/components/admin/AdminCommentManager.vue';
import { resolveAssetUrl } from '@/lib/assets';

const router = useRouter();
const authStore = useAuthStore();
const articleStore = useArticleStore();
const adminStore = useAdminStore();
const selectedArticleId = ref(null);
const feedback = ref('');
const activeTab = ref('articles');
const profileForm = reactive({
  full_name: '',
  bio: '',
});
const filters = reactive({
  search: '',
  status: '',
  category: '',
  page: 1,
  limit: 10,
});

const selectedArticle = computed(() =>
  articleStore.adminArticles.find((article) => article.id === selectedArticleId.value) || null
);

const editorArticle = computed(() => {
  if (articleStore.currentArticle?.id === selectedArticleId.value) {
    return articleStore.currentArticle;
  }

  return selectedArticle.value;
});

const avatarPreviewUrl = computed(() => resolveAssetUrl(authStore.user?.profile?.avatar_url));
const profileInitial = computed(() =>
  (authStore.user?.profile?.full_name || authStore.user?.email || 'A').trim().charAt(0).toUpperCase()
);
const articleCategoryChart = computed(() => adminStore.dashboardStats.charts.articles_by_category);
const commentMonthChart = computed(() => adminStore.dashboardStats.charts.comments_by_month);

function selectArticle(articleId) {
  selectedArticleId.value = articleId;
}

async function refreshAdminArticles() {
  await articleStore.fetchAdminArticles(filters);

  if (!selectedArticleId.value && articleStore.adminArticles.length) {
    selectedArticleId.value = articleStore.adminArticles[0].id;
  }
}

async function refreshUsers(params = { page: 1, limit: 10 }) {
  await adminStore.fetchUsers(params);
}

async function refreshCategories() {
  await adminStore.fetchCategories();
}

async function refreshComments(params = { page: 1, limit: 10 }) {
  await adminStore.fetchAdminComments(params);
}

async function refreshDashboardStats() {
  await adminStore.fetchDashboardStats();
}

async function applyAdminFilters() {
  filters.page = 1;
  await refreshAdminArticles();
}

async function goToAdminPage(page) {
  filters.page = page;
  await refreshAdminArticles();
}

async function handleCreate(payload) {
  feedback.value = '';

  try {
    const article = await articleStore.createArticle(payload);
    selectedArticleId.value = article.id;
    await articleStore.fetchAdminArticleDetail(article.id);
    feedback.value = 'Draft artikel berhasil dibuat.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleUpdate({ id, payload }) {
  feedback.value = '';

  try {
    await articleStore.updateArticle(id, payload);
    await articleStore.fetchAdminArticleDetail(id);
    feedback.value = 'Artikel berhasil diperbarui.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handlePublish(articleId) {
  feedback.value = '';

  try {
    await articleStore.updateArticleStatus(articleId, 'published');
    await articleStore.fetchAdminArticleDetail(articleId);
    await refreshDashboardStats();
    feedback.value = 'Artikel berhasil dipublish.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleRevision(articleId) {
  feedback.value = '';

  try {
    await articleStore.updateArticleStatus(articleId, 'revision');
    await articleStore.fetchAdminArticleDetail(articleId);
    await refreshDashboardStats();
    feedback.value = 'Artikel berhasil dikembalikan ke revision.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleDelete(articleId) {
  feedback.value = '';

  try {
    await articleStore.deleteArticle(articleId);
    selectedArticleId.value = articleStore.adminArticles[0]?.id || null;
    if (selectedArticleId.value) {
      await articleStore.fetchAdminArticleDetail(selectedArticleId.value);
    } else {
      articleStore.clearCurrentArticle();
    }
    await refreshDashboardStats();
    feedback.value = 'Artikel berhasil dihapus.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleUserUpdate({ id, payload }) {
  feedback.value = '';

  try {
    await adminStore.updateUser(id, payload);
    await refreshUsers(adminStore.userMeta);
    await refreshDashboardStats();
    feedback.value = 'Data user berhasil diperbarui.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleUserDelete(userId) {
  feedback.value = '';

  try {
    await adminStore.deleteUser(userId);
    await refreshDashboardStats();
    feedback.value = 'User berhasil di-soft delete.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleCategoryCreate(payload) {
  feedback.value = '';

  try {
    await adminStore.createCategory(payload);
    await refreshDashboardStats();
    feedback.value = 'Kategori berhasil dibuat.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleCategoryDelete(categoryId) {
  feedback.value = '';

  try {
    await adminStore.deleteCategory(categoryId);
    await refreshDashboardStats();
    feedback.value = 'Kategori berhasil dihapus.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleCommentDelete(commentId) {
  feedback.value = '';

  try {
    await adminStore.deleteComment(commentId);
    await refreshComments(adminStore.commentMeta);
    await refreshDashboardStats();
    feedback.value = 'Komentar berhasil dihapus.';
  } catch (error) {
    feedback.value = error.message;
  }
}

function logout() {
  authStore.logout();
  router.push('/login');
}

async function handleProfileUpdate() {
  feedback.value = '';

  try {
    await authStore.updateProfile(profileForm);
    feedback.value = 'Profil admin berhasil diperbarui.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleAvatarUpload(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  feedback.value = '';

  try {
    await authStore.uploadAvatar(file);
    feedback.value = 'Avatar admin berhasil diperbarui.';
  } catch (error) {
    feedback.value = error.message;
  }
}

onMounted(async () => {
  profileForm.full_name = authStore.user?.profile?.full_name || '';
  profileForm.bio = authStore.user?.profile?.bio || '';
  await refreshAdminArticles();
  await refreshUsers();
  await refreshCategories();
  await refreshComments();
  await refreshDashboardStats();

  if (selectedArticleId.value) {
    await articleStore.fetchAdminArticleDetail(selectedArticleId.value);
  }
});
</script>

<template>
  <main class="mx-auto max-w-7xl px-6 py-12 text-stone-100">
    <section class="rounded-[2rem] border border-white/10 bg-[#303030] p-8 shadow-soft">
      <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.25em] text-[#ffb084]">
            Dashboard Admin
          </p>
          <h1 class="mt-3 text-3xl font-bold text-stone-50">
            {{ authStore.user?.profile?.full_name || authStore.user?.email }}
          </h1>
          <p class="mt-3 max-w-3xl text-stone-300">
            Panel ini menjadi CMS artikel COCONEXUS: membuat draft, mengubah kategori, memperbarui konten,
            meminta revisi, dan mempublish artikel sesuai alur diagram aktivitas Anda.
          </p>
        </div>

        <button
          type="button"
          class="rounded-full border border-white/12 bg-[#383838] px-5 py-3 text-sm font-semibold text-stone-200 transition hover:bg-[#444444]"
          @click="logout"
        >
          Logout
        </button>
      </div>

      <div class="mt-10 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div class="rounded-3xl border border-white/8 bg-[#3b312d] p-5">
          <p class="text-sm font-semibold text-[#ffb084]">Published</p>
          <p class="mt-3 text-4xl font-bold text-stone-50">{{ adminStore.dashboardStats.totals.published_articles }}</p>
          <p class="mt-2 text-sm leading-6 text-stone-300">Artikel siap tampil di daftar publik.</p>
        </div>

        <div class="rounded-3xl border border-white/8 bg-[#383838] p-5">
          <p class="text-sm font-semibold text-[#ffb084]">Revision</p>
          <p class="mt-3 text-4xl font-bold text-stone-50">{{ adminStore.dashboardStats.totals.revision_articles }}</p>
          <p class="mt-2 text-sm leading-6 text-stone-300">Artikel yang perlu perbaikan konten.</p>
        </div>

        <div class="rounded-3xl border border-white/8 bg-[#383838] p-5">
          <p class="text-sm font-semibold text-stone-300">Draft</p>
          <p class="mt-3 text-4xl font-bold text-stone-50">{{ adminStore.dashboardStats.totals.draft_articles }}</p>
          <p class="mt-2 text-sm leading-6 text-stone-300">Draft yang masih dalam proses penulisan.</p>
        </div>

        <div class="rounded-3xl border border-white/8 bg-[#383838] p-5">
          <p class="text-sm font-semibold text-stone-300">User</p>
          <p class="mt-3 text-4xl font-bold text-stone-50">{{ adminStore.dashboardStats.totals.users }}</p>
          <p class="mt-2 text-sm leading-6 text-stone-300">Total akun yang aktif di sistem.</p>
        </div>

        <div class="rounded-3xl border border-white/8 bg-[#383838] p-5">
          <p class="text-sm font-semibold text-stone-300">Kategori</p>
          <p class="mt-3 text-4xl font-bold text-stone-50">{{ adminStore.dashboardStats.totals.categories }}</p>
          <p class="mt-2 text-sm leading-6 text-stone-300">Taksonomi artikel dan repository.</p>
        </div>

        <div class="rounded-3xl border border-white/8 bg-[#383838] p-5">
          <p class="text-sm font-semibold text-stone-300">Komentar</p>
          <p class="mt-3 text-4xl font-bold text-stone-50">{{ adminStore.dashboardStats.totals.comments }}</p>
          <p class="mt-2 text-sm leading-6 text-stone-300">Interaksi pembaca pada artikel published.</p>
        </div>
      </div>
    </section>

    <p
      v-if="feedback"
      class="mt-6 rounded-3xl border border-[#ff7c35]/20 bg-[#ff7c35]/10 px-5 py-4 text-sm font-medium text-[#ffd1b8]"
    >
      {{ feedback }}
    </p>

    <section class="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
      <AdminStatsChart
        type="bar"
        title="Artikel per Kategori"
        description="Memantau distribusi konten COCONEXUS di setiap kategori agar admin bisa cepat melihat kategori yang aktif dan yang masih perlu diperkaya."
        :chart-data="articleCategoryChart"
        height-class="h-96"
      />

      <AdminStatsChart
        type="doughnut"
        title="Komentar per Bulan"
        description="Membaca ritme diskusi komunitas dari bulan ke bulan untuk melihat kapan interaksi pembaca sedang naik atau turun."
        :chart-data="commentMonthChart"
        height-class="h-96"
      />
    </section>

    <section class="mt-8 grid gap-6 lg:grid-cols-2">
      <article class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
              Ringkasan Kategori
            </p>
            <h2 class="mt-2 text-2xl font-bold text-stone-50">Prioritas Konten</h2>
          </div>
          <div class="rounded-full border border-[#ff7c35]/20 bg-[#3b312d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffb084]">
            {{ articleCategoryChart.items.length }} kategori
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <div
            v-for="item in articleCategoryChart.items"
            :key="item.category_id"
            class="flex items-center justify-between rounded-3xl bg-[#383838] px-5 py-4"
          >
            <div>
              <p class="text-sm font-semibold text-stone-100">{{ item.category_name }}</p>
              <p class="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                Kategori artikel
              </p>
            </div>
            <div class="rounded-2xl border border-white/8 bg-[#303030] px-4 py-2 text-right shadow-sm">
              <p class="text-2xl font-bold text-stone-50">{{ item.article_count }}</p>
              <p class="text-xs font-medium text-stone-400">artikel</p>
            </div>
          </div>

          <div
            v-if="!articleCategoryChart.items.length"
            class="rounded-3xl border border-dashed border-white/15 bg-[#383838] p-6 text-sm leading-7 text-stone-400"
          >
            Belum ada distribusi kategori yang bisa ditampilkan.
          </div>
        </div>
      </article>

      <article class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
              Ringkasan Interaksi
            </p>
            <h2 class="mt-2 text-2xl font-bold text-stone-50">Komentar Bulanan</h2>
          </div>
          <div class="rounded-full border border-white/10 bg-[#383838] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-300">
            Tren komunitas
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <div
            v-for="item in commentMonthChart.items"
            :key="item.month_key"
            class="rounded-3xl border border-white/8 bg-gradient-to-r from-[#303030] via-[#353535] to-[#3b312d] px-5 py-4"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-semibold text-stone-100">{{ item.month_label }}</p>
                <p class="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                  Periode komentar
                </p>
              </div>
              <p class="text-2xl font-bold text-[#ffb084]">{{ item.comment_count }}</p>
            </div>

            <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                class="h-full rounded-full bg-gradient-to-r from-[#c26939] to-[#ff7c35]"
                :style="{
                  width: `${Math.max(
                    8,
                    (item.comment_count /
                      Math.max(...commentMonthChart.items.map((monthItem) => monthItem.comment_count), 1)) *
                      100
                  )}%`,
                }"
              />
            </div>
          </div>

          <div
            v-if="!commentMonthChart.items.length"
            class="rounded-3xl border border-dashed border-white/15 bg-[#383838] p-6 text-sm leading-7 text-stone-400"
          >
            Belum ada histori komentar bulanan untuk divisualisasikan.
          </div>
        </div>
      </article>
    </section>

    <section class="mt-8 grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
          Profil Admin
        </p>
        <div class="mt-5 flex flex-col items-center rounded-3xl bg-[#383838] p-6 text-center">
          <img
            v-if="avatarPreviewUrl"
            :src="avatarPreviewUrl"
            alt="Avatar admin"
            class="h-32 w-32 rounded-full border-4 border-white/10 object-cover shadow-soft"
          />
          <div
            v-else
            class="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/10 bg-[#3b312d] text-4xl font-bold text-[#ffb084] shadow-soft"
          >
            {{ profileInitial }}
          </div>
          <label class="mt-4 inline-flex cursor-pointer rounded-full border border-[#ff7c35]/20 bg-[#3b312d] px-4 py-2 text-sm font-semibold text-[#ffb084] transition hover:bg-[#47352c]">
            Upload Avatar
            <input
              type="file"
              class="hidden"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              @change="handleAvatarUpload"
            />
          </label>
        </div>

        <div class="mt-5 space-y-4">
          <input
            v-model="profileForm.full_name"
            type="text"
            class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
            placeholder="Nama lengkap"
          />
          <textarea
            v-model="profileForm.bio"
            rows="4"
            class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
            placeholder="Bio admin"
          />
          <button
            type="button"
            class="w-full rounded-2xl bg-[#ff7c35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e86f2f]"
            @click="handleProfileUpdate"
          >
            Simpan Profil
          </button>
        </div>
      </aside>

      <section class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
          Filter CMS
        </p>
        <div class="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_200px_auto]">
          <input
            v-model="filters.search"
            type="text"
            class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
            placeholder="Cari judul, isi, atau penulis..."
            @keyup.enter="applyAdminFilters"
          />
          <select
            v-model="filters.status"
            class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="revision">Revision</option>
            <option value="published">Published</option>
          </select>
          <input
            v-model="filters.category"
            type="text"
            class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
            placeholder="Kategori"
            @keyup.enter="applyAdminFilters"
          />
          <button
            type="button"
            class="rounded-2xl bg-[#ff7c35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e86f2f]"
            @click="applyAdminFilters"
          >
            Terapkan
          </button>
        </div>
      </section>
    </section>

    <section class="mt-8 rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
      <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
        Activity Feed
      </p>
      <h2 class="mt-2 text-2xl font-bold text-stone-50">Aktivitas Admin Terbaru</h2>
      <div class="mt-6 grid gap-4 lg:grid-cols-2">
        <div
          v-for="activity in adminStore.dashboardStats.recent_activities"
          :key="activity.id"
          class="rounded-3xl border border-white/8 bg-[#383838] p-5"
        >
          <p class="text-sm font-semibold text-stone-100">
            {{ activity.actor?.profile?.full_name || activity.actor?.email || 'Admin' }}
          </p>
          <p class="mt-2 text-sm leading-7 text-stone-300">
            <strong>{{ activity.action }}</strong> pada {{ activity.entity_type }}
            <span v-if="activity.entity_id">#{{ activity.entity_id }}</span>
          </p>
          <p class="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
            {{ new Date(activity.created_at).toLocaleString('id-ID') }}
          </p>
        </div>

        <div
          v-if="!adminStore.dashboardStats.recent_activities.length"
          class="rounded-3xl border border-dashed border-white/15 bg-[#383838] p-6 text-sm text-stone-400"
        >
          Belum ada aktivitas admin yang tercatat.
        </div>
      </div>
    </section>

    <section class="mt-8">
      <AdminTabs v-model="activeTab" />
    </section>

    <section v-if="activeTab === 'articles'" class="mt-8 grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
        <div class="flex items-center justify-between gap-4 border-b border-white/8 pb-5">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
              Daftar Artikel
            </p>
            <h2 class="mt-2 text-2xl font-bold text-stone-50">CMS List</h2>
          </div>

          <button
            type="button"
            class="rounded-full bg-[#ff7c35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e86f2f]"
            @click="
              selectedArticleId = null;
              articleStore.clearCurrentArticle();
            "
          >
            Draft Baru
          </button>
        </div>

        <div class="mt-5 space-y-4">
          <button
            v-for="article in articleStore.adminArticles"
            :key="article.id"
            type="button"
            class="w-full rounded-3xl border px-4 py-4 text-left transition"
            :class="
              selectedArticleId === article.id
                ? 'border-[#ff7c35]/35 bg-[#3b312d]'
                : 'border-white/8 bg-[#383838] hover:border-[#ff7c35]/25 hover:bg-[#404040]'
            "
            @click="
              selectArticle(article.id);
              articleStore.fetchAdminArticleDetail(article.id);
            "
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffb084]">
                  {{ article.category?.name || 'Tanpa Kategori' }}
                </p>
                <h3 class="mt-2 text-base font-bold text-stone-100">
                  {{ article.title }}
                </h3>
                <p class="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  Versi {{ article.version }}
                </p>
              </div>

              <StatusBadge :status="article.status" />
            </div>
          </button>

          <div
            v-if="!articleStore.adminArticles.length"
            class="rounded-3xl border border-dashed border-white/15 bg-[#383838] p-6 text-sm leading-7 text-stone-400"
          >
            Belum ada artikel. Buat draft pertama Anda dari tombol "Draft Baru".
          </div>
        </div>

        <div
          v-if="articleStore.adminMeta.total_pages > 1"
          class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5"
        >
          <button
            type="button"
            class="rounded-full border border-white/12 bg-[#383838] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-[#404040] disabled:opacity-40"
            :disabled="filters.page <= 1"
            @click="goToAdminPage(filters.page - 1)"
          >
            Sebelumnya
          </button>

          <span class="text-sm font-medium text-stone-300">
            Halaman {{ articleStore.adminMeta.page }} dari {{ articleStore.adminMeta.total_pages }}
          </span>

          <button
            type="button"
            class="rounded-full border border-white/12 bg-[#383838] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-[#404040] disabled:opacity-40"
            :disabled="filters.page >= articleStore.adminMeta.total_pages"
            @click="goToAdminPage(filters.page + 1)"
          >
            Berikutnya
          </button>
        </div>
      </aside>

      <div class="space-y-8">
        <AdminArticleEditor
          :selected-article="editorArticle"
          :loading="articleStore.isSubmitting"
          @create="handleCreate"
          @update="handleUpdate"
          @publish="handlePublish"
          @request-revision="handleRevision"
          @delete="handleDelete"
        />

        <section
          v-if="articleStore.currentArticle?.comments?.length"
          class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
            Review Komentar
          </p>
          <h2 class="mt-2 text-2xl font-bold text-stone-50">
            Diskusi pada Artikel Terpilih
          </h2>
          <div class="mt-6 space-y-4">
            <div
              v-for="comment in articleStore.currentArticle.comments"
              :key="comment.id"
              class="rounded-3xl bg-[#383838] p-5"
            >
              <p class="text-sm font-semibold text-stone-100">
                {{ comment.user?.profile?.full_name || comment.user?.email }}
              </p>
              <p class="mt-3 text-sm leading-7 text-stone-300">{{ comment.body }}</p>
              <p class="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">
                {{ comment.replies?.length || 0 }} balasan
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section v-else-if="activeTab === 'users'" class="mt-8">
      <AdminUserManager
        :users="adminStore.users"
        :meta="adminStore.userMeta"
        :loading="adminStore.isLoading"
        @search="refreshUsers"
        @page="(page) => refreshUsers({ ...adminStore.userMeta, page })"
        @update="handleUserUpdate"
        @delete="handleUserDelete"
      />
    </section>

    <section v-else-if="activeTab === 'categories'" class="mt-8">
      <AdminCategoryManager
        :categories="adminStore.categories"
        :loading="adminStore.isLoading"
        @create="handleCategoryCreate"
        @delete="handleCategoryDelete"
      />
    </section>

    <section v-else class="mt-8">
      <AdminCommentManager
        :comments="adminStore.comments"
        :meta="adminStore.commentMeta"
        :loading="adminStore.isLoading"
        @search="refreshComments"
        @page="(page) => refreshComments({ ...adminStore.commentMeta, page })"
        @delete="handleCommentDelete"
      />
    </section>
  </main>
</template>
