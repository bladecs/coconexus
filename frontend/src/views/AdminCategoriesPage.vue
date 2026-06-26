<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { useAdminStore } from '@/stores/admin';

const adminStore = useAdminStore();
const feedback = ref('');
const form = reactive({
  name: '',
  description: '',
});

const totalArticlesInCategories = computed(() =>
  adminStore.categories.reduce((total, category) => total + Number(category.article_count || 0), 0)
);
const mostUsedCategory = computed(() =>
  [...adminStore.categories].sort((a, b) => Number(b.article_count || 0) - Number(a.article_count || 0))[0]
);

async function refreshCategories() {
  await adminStore.fetchCategories();
}

async function handleCategoryCreate() {
  feedback.value = '';

  try {
    await adminStore.createCategory({ ...form });
    await adminStore.fetchDashboardStats();
    form.name = '';
    form.description = '';
    feedback.value = 'Kategori berhasil dibuat.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleCategoryDelete(categoryId) {
  feedback.value = '';

  try {
    await adminStore.deleteCategory(categoryId);
    await adminStore.fetchDashboardStats();
    feedback.value = 'Kategori berhasil dihapus.';
  } catch (error) {
    feedback.value = error.message;
  }
}

onMounted(async () => {
  await refreshCategories();
});
</script>

<template>
  <SiteNavbar variant="admin" />
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">

    <section class="mx-auto max-w-[1500px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">TAXONOMY / CATEGORY BOARD</p>
          <h1>Peta Kategori</h1>
        </div>
      </header>

      <p v-if="feedback" class="admin-feedback-alert mt-6">
        {{ feedback }}
      </p>

      <section class="admin-category-layout mt-6">
        <aside class="admin-filter-rail">
          <p class="admin-section-label">ADD CATEGORY</p>
          <div class="mt-5 space-y-4">
            <input
              v-model="form.name"
              type="text"
              class="w-full px-4 py-3"
              placeholder="Nama kategori"
            />
            <textarea
              v-model="form.description"
              rows="5"
              class="w-full px-4 py-3"
              placeholder="Deskripsi kategori"
            />
            <button type="button" class="admin-primary-action w-full transition-all duration-150" @click="handleCategoryCreate">
              Tambah Kategori
            </button>
          </div>
        </aside>

        <section>
          <div class="admin-category-summary">
            <div>
              <span>Kategori</span>
              <strong>{{ adminStore.categories.length }}</strong>
            </div>
            <div>
              <span>Total Artikel</span>
              <strong>{{ totalArticlesInCategories }}</strong>
            </div>
            <div>
              <span>Terpadat</span>
              <strong>{{ mostUsedCategory?.name || '-' }}</strong>
            </div>
          </div>

          <div class="admin-taxonomy-grid">
            <article
              v-for="category in adminStore.categories"
              :key="category.id"
              class="admin-taxonomy-tile hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div>
                <p>{{ category.name }}</p>
                <span>{{ category.description || 'Tanpa deskripsi' }}</span>
              </div>
              <strong>{{ category.article_count || 0 }}</strong>
              <button
                type="button"
                class="admin-delete-btn"
                @click="handleCategoryDelete(category.id)"
              >
                Hapus
              </button>
            </article>

            <div v-if="!adminStore.categories.length" class="admin-empty-state text-outline border-outline-variant/40">
              Belum ada kategori yang tersimpan.
            </div>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
