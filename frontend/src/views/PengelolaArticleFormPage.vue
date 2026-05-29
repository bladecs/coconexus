<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const router = useRouter();
const route = useRoute();

const isLoading = ref(false);
const isSaving = ref(false);
const error = ref(null);
const isEditMode = computed(() => Boolean(route.params.id));
const categories = ref([]);

const form = ref({
  title: '',
  summary: '',
  content: '',
  category_id: '',
  status: 'draft',
});

async function fetchCategories() {
  try {
    const { data } = await api.get('/categories');
    categories.value = data.data.categories || [];
  } catch (err) {
    error.value = err.message;
  }
}

async function fetchArticle(id) {
  isLoading.value = true;

  try {
    const { data } = await api.get(`/articles/${id}`);
    const article = data.data.article;

    form.value = {
      title: article.title || '',
      summary: article.detail?.meta_description || '',
      content: article.detail?.body_content || '',
      category_id: article.category_id || '',
      status: article.status === 'published' ? 'revision' : article.status || 'draft',
    };
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

async function submitForm() {
  isSaving.value = true;
  error.value = null;

  try {
    const payload = {
      title: form.value.title,
      body_content: form.value.content,
      meta_description: form.value.summary,
      category: {
        id: Number(form.value.category_id),
      },
      status: form.value.status,
    };

    if (isEditMode.value) {
      await api.put(`/articles/${route.params.id}`, payload);
    } else {
      await api.post('/articles', payload);
    }

    router.push({ name: 'pengelola-articles' });
  } catch (err) {
    error.value = err.message;
  } finally {
    isSaving.value = false;
  }
}

function goBack() {
  router.push({ name: 'pengelola-articles' });
}

onMounted(async () => {
  await fetchCategories();

  if (isEditMode.value) {
    await fetchArticle(route.params.id);
  }
});
</script>

<template>
  <main class="inner-page pengelola-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="pengelola" />

    <section class="mx-auto max-w-4xl">
      <header class="mb-8 flex items-center justify-between border-b border-stone-600 pb-4">
        <div>
          <p class="admin-section-label">COCONEXUS / PENGELOLA ARTIKEL</p>
          <h1 class="text-2xl font-bold">{{ isEditMode ? 'Edit Artikel' : 'Buat Artikel Baru' }}</h1>
        </div>
        <button @click="goBack" class="rounded border border-stone-600 px-4 py-2 transition hover:bg-stone-800">
          Kembali
        </button>
      </header>

      <div v-if="isLoading" class="py-12 text-center">
        <p>Memuat data artikel...</p>
      </div>

      <form v-else @submit.prevent="submitForm" class="space-y-6">
        <div v-if="error" class="rounded bg-red-900 p-4 text-red-200">
          {{ error }}
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold">Judul Artikel *</label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="Masukkan judul artikel..."
            class="w-full rounded bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold">Kategori *</label>
          <select
            v-model="form.category_id"
            required
            class="w-full rounded bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 focus:outline-none focus:border-stone-500"
          >
            <option value="">Pilih Kategori</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold">Ringkasan Artikel *</label>
          <textarea
            v-model="form.summary"
            rows="3"
            required
            placeholder="Ringkasan singkat artikel..."
            class="w-full rounded bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold">Konten Artikel *</label>
          <textarea
            v-model="form.content"
            rows="10"
            required
            placeholder="Tulis konten artikel di sini..."
            class="w-full rounded bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold">Status *</label>
          <select
            v-model="form.status"
            required
            class="w-full rounded bg-stone-800 border border-stone-600 px-3 py-2 text-stone-100 focus:outline-none focus:border-stone-500"
          >
            <option value="draft">Draft</option>
            <option value="revision">Revision</option>
          </select>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            :disabled="isSaving"
            class="rounded bg-green-600 px-6 py-2 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-stone-700"
          >
            {{ isSaving ? 'Menyimpan...' : isEditMode ? 'Perbarui Artikel' : 'Buat Artikel' }}
          </button>
          <button
            type="button"
            @click="goBack"
            class="rounded border border-stone-600 px-6 py-2 transition hover:bg-stone-800"
          >
            Batal
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.admin-section-label {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: rgb(168 162 158);
  font-weight: 600;
  text-transform: uppercase;
}
</style>
