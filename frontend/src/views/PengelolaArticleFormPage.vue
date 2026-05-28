<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import api from '@/lib/api';

const router = useRouter();
const route = useRoute();

const isLoading = ref(false);
const isSaving = ref(false);
const error = ref(null);
const isEditMode = computed(() => !!route.params.id);
const categories = ref([]);

const form = ref({
  title: '',
  slug: '',
  summary: '',
  content: '',
  category_id: '',
  status: 'draft',
  cover_image_url: '',
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
    form.value = {
      title: data.data.title,
      slug: data.data.slug,
      summary: data.data.summary,
      content: data.data.articleDetail?.content || '',
      category_id: data.data.category_id,
      status: data.data.status,
      cover_image_url: data.data.cover_image_url,
    };
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

function generateSlug() {
  form.value.slug = form.value.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function submitForm() {
  isSaving.value = true;
  error.value = null;

  try {
    const payload = {
      title: form.value.title,
      slug: form.value.slug,
      summary: form.value.summary,
      category_id: form.value.category_id,
      status: form.value.status,
      cover_image_url: form.value.cover_image_url,
      content: form.value.content,
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
      <header class="flex items-center justify-between mb-8 pb-4 border-b border-stone-600">
        <div>
          <p class="admin-section-label">COCONEXUS / PENGELOLA ARTIKEL</p>
          <h1 class="text-2xl font-bold">{{ isEditMode ? 'Edit Artikel' : 'Buat Artikel Baru' }}</h1>
        </div>
        <button
          @click="goBack"
          class="px-4 py-2 rounded border border-stone-600 hover:bg-stone-800 transition"
        >
          Kembali
        </button>
      </header>

      <div v-if="isLoading" class="text-center py-12">
        <p>Memuat data artikel...</p>
      </div>

      <form v-else @submit.prevent="submitForm" class="space-y-6">
        <div v-if="error" class="p-4 rounded bg-red-900 text-red-200">
          {{ error }}
        </div>

        <!-- Title -->
        <div>
          <label class="block text-sm font-semibold mb-2">Judul Artikel *</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="Masukkan judul artikel..."
            required
            class="w-full px-3 py-2 rounded bg-stone-800 border border-stone-600 text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500"
            @blur="generateSlug"
          />
        </div>

        <!-- Slug -->
        <div>
          <label class="block text-sm font-semibold mb-2">URL Slug *</label>
          <div class="flex gap-2">
            <input
              v-model="form.slug"
              type="text"
              placeholder="url-artikel"
              required
              class="flex-1 px-3 py-2 rounded bg-stone-800 border border-stone-600 text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500"
            />
            <button
              type="button"
              @click="generateSlug"
              class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition"
            >
              Generate
            </button>
          </div>
        </div>

        <!-- Summary -->
        <div>
          <label class="block text-sm font-semibold mb-2">Ringkasan Artikel *</label>
          <textarea
            v-model="form.summary"
            placeholder="Ringkasan singkat artikel..."
            required
            rows="3"
            class="w-full px-3 py-2 rounded bg-stone-800 border border-stone-600 text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500"
          ></textarea>
        </div>

        <!-- Content -->
        <div>
          <label class="block text-sm font-semibold mb-2">Konten Artikel *</label>
          <textarea
            v-model="form.content"
            placeholder="Tulis konten artikel di sini..."
            required
            rows="10"
            class="w-full px-3 py-2 rounded bg-stone-800 border border-stone-600 text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500 font-mono text-sm"
          ></textarea>
        </div>

        <!-- Cover Image -->
        <div>
          <label class="block text-sm font-semibold mb-2">URL Gambar Cover</label>
          <input
            v-model="form.cover_image_url"
            type="url"
            placeholder="https://example.com/image.jpg"
            class="w-full px-3 py-2 rounded bg-stone-800 border border-stone-600 text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500"
          />
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-semibold mb-2">Kategori *</label>
          <select
            v-model="form.category_id"
            required
            class="w-full px-3 py-2 rounded bg-stone-800 border border-stone-600 text-stone-100 focus:outline-none focus:border-stone-500"
          >
            <option value="">Pilih Kategori</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-semibold mb-2">Status *</label>
          <select
            v-model="form.status"
            required
            class="w-full px-3 py-2 rounded bg-stone-800 border border-stone-600 text-stone-100 focus:outline-none focus:border-stone-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Publikasikan</option>
          </select>
          <p class="text-xs text-stone-400 mt-1">
            Pilih "Publikasikan" untuk menerbitkan artikel, atau "Draft" untuk menyimpan sebagai draft.
          </p>
        </div>

        <!-- Buttons -->
        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            :disabled="isSaving"
            class="px-6 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-stone-700 disabled:cursor-not-allowed transition"
          >
            {{ isSaving ? 'Menyimpan...' : isEditMode ? 'Perbarui Artikel' : 'Buat Artikel' }}
          </button>
          <button
            type="button"
            @click="goBack"
            class="px-6 py-2 rounded border border-stone-600 hover:bg-stone-800 transition"
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
