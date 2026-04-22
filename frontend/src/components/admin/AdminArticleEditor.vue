<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { useArticleStore } from '@/stores/articles';
import RichTextPreview from '@/components/editor/RichTextPreview.vue';

const props = defineProps({
  selectedArticle: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['create', 'update', 'publish', 'request-revision', 'delete']);
const articleStore = useArticleStore();
const formError = ref('');

function emptyForm() {
  return {
    articleMode: 'main',
    parentArticleId: '',
    linkedProductCardId: '',
    title: '',
    categoryName: '',
    metaDescription: '',
    bodyContent: '',
    status: 'draft',
    productCards: [
      {
        title: '',
        description: '',
        image: '',
      },
    ],
    media: [
      {
        file_path: '',
        media_type: 'image',
      },
    ],
  };
}

const form = reactive(emptyForm());

const isEditing = computed(() => Boolean(props.selectedArticle?.id));
const isDetailArticle = computed(() => form.articleMode === 'detail');
const currentLinkedProductCard = computed(() => props.selectedArticle?.linked_product_card || null);
const productCardOptions = computed(() => {
  const options = [...articleStore.availableProductCards];

  if (
    currentLinkedProductCard.value &&
    currentLinkedProductCard.value.article_id === Number(form.parentArticleId) &&
    !options.some((item) => item.id === currentLinkedProductCard.value.id)
  ) {
    options.unshift(currentLinkedProductCard.value);
  }

  return options;
});

async function refreshMainArticleOptions() {
  await articleStore.fetchMainArticles({
    exclude_article_id: props.selectedArticle?.id || undefined,
  });
}

watch(
  () => props.selectedArticle,
  (article) => {
    formError.value = '';

    if (!article) {
      Object.assign(form, emptyForm());
      return;
    }

    Object.assign(form, {
      articleMode: article.parent_article_id ? 'detail' : 'main',
      parentArticleId: article.parent_article_id || '',
      linkedProductCardId: article.linked_product_card?.id || '',
      title: article.title || '',
      categoryName: article.category?.name || '',
      metaDescription: article.detail?.meta_description || '',
      bodyContent: article.detail?.body_content || '',
      status: article.status || 'draft',
      productCards:
        article.product_cards?.length > 0
          ? article.product_cards
              .filter((item) => !item.linked_article_id)
              .map((item) => ({
              title: item.title || '',
              description: item.description || '',
              image: item.image || '',
              }))
          : [
              {
                title: '',
                description: '',
                image: '',
              },
            ],
      media:
        article.media?.length > 0
          ? article.media.map((item) => ({
              file_path: item.file_path || '',
              media_type: item.media_type || 'image',
            }))
          : [
              {
                file_path: '',
                media_type: 'image',
              },
            ],
    });
  },
  { immediate: true }
);

watch(
  () => form.articleMode,
  async (mode) => {
    if (mode === 'main') {
      form.parentArticleId = '';
      form.linkedProductCardId = '';
      articleStore.availableProductCards = [];
      return;
    }

    if (!articleStore.mainArticles.length) {
      await refreshMainArticleOptions();
    }
  }
);

watch(
  () => form.parentArticleId,
  async (parentArticleId, previousParentArticleId) => {
    if (form.articleMode !== 'detail') {
      return;
    }

    if (!parentArticleId) {
      form.linkedProductCardId = '';
      articleStore.availableProductCards = [];
      return;
    }

    await articleStore.fetchAvailableProductCards(parentArticleId);

    if (parentArticleId !== previousParentArticleId && !currentLinkedProductCard.value) {
      form.linkedProductCardId = '';
    }
  }
);

watch(
  () => props.selectedArticle?.id,
  async () => {
    await refreshMainArticleOptions();
  }
);

onMounted(async () => {
  await refreshMainArticleOptions();

  if (form.articleMode === 'detail' && form.parentArticleId) {
    await articleStore.fetchAvailableProductCards(form.parentArticleId);
  }
});

function addMediaRow() {
  form.media.push({
    file_path: '',
    media_type: 'image',
  });
}

function addProductCardRow() {
  form.productCards.push({
    title: '',
    description: '',
    image: '',
  });
}

function removeProductCardRow(index) {
  if (form.productCards.length === 1) {
    form.productCards[0].title = '';
    form.productCards[0].description = '';
    form.productCards[0].image = '';
    return;
  }

  form.productCards.splice(index, 1);
}

function removeMediaRow(index) {
  if (form.media.length === 1) {
    form.media[0].file_path = '';
    form.media[0].media_type = 'image';
    return;
  }

  form.media.splice(index, 1);
}

async function handleFileSelection(event, index) {
  const selectedFile = event.target.files?.[0];

  if (!selectedFile) {
    return;
  }

  const uploadedMedia = await articleStore.uploadArticleMedia(selectedFile);

  form.media[index].file_path = uploadedMedia.file_path;
  form.media[index].media_type = uploadedMedia.media_type;
}

async function handleProductCardImageSelection(event, index) {
  const selectedFile = event.target.files?.[0];

  if (!selectedFile) {
    return;
  }

  const uploadedMedia = await articleStore.uploadArticleMedia(selectedFile);
  form.productCards[index].image = uploadedMedia.file_path;
}

function buildPayload() {
  return {
    parent_article_id: isDetailArticle.value ? Number(form.parentArticleId) : null,
    linked_product_card_id:
      isDetailArticle.value && form.linkedProductCardId ? Number(form.linkedProductCardId) : null,
    title: form.title,
    body_content: form.bodyContent,
    meta_description: form.metaDescription,
    status: form.status,
    category: {
      name: form.categoryName,
    },
    product_cards: isDetailArticle.value
      ? []
      : form.productCards
          .filter((item) => item.title.trim() || item.description.trim() || item.image.trim())
          .map((item) => ({
            title: item.title,
            description: item.description,
            image: item.image || null,
          })),
    media: form.media.filter((item) => item.file_path.trim()),
  };
}

function validateForm() {
  formError.value = '';

  if (!form.title.trim()) {
    formError.value = 'Judul artikel wajib diisi.';
    return false;
  }

  if (!form.categoryName.trim()) {
    formError.value = 'Kategori artikel wajib diisi.';
    return false;
  }

  if (!form.bodyContent.trim()) {
    formError.value = 'Body content wajib diisi.';
    return false;
  }

  if (isDetailArticle.value) {
    if (!form.parentArticleId) {
      formError.value = 'Pilih artikel utama terlebih dahulu untuk artikel detail.';
      return false;
    }

    if (!form.linkedProductCardId) {
      formError.value = 'Pilih product card yang akan dihubungkan ke artikel detail.';
      return false;
    }

    return true;
  }

  const partiallyFilledCard = form.productCards.find((item) => {
    const hasAnyValue = item.title.trim() || item.description.trim() || item.image.trim();
    const isComplete = item.title.trim() && item.description.trim();
    return hasAnyValue && !isComplete;
  });

  if (partiallyFilledCard) {
    formError.value = 'Setiap product card yang diisi harus memiliki judul produk dan deskripsi singkat.';
    return false;
  }

  return true;
}

function submitForm() {
  if (!validateForm()) {
    return;
  }

  if (isEditing.value) {
    emit('update', {
      id: props.selectedArticle.id,
      payload: buildPayload(),
    });
    return;
  }

  emit('create', buildPayload());
}
</script>

<template>
  <section class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
    <div class="flex flex-col gap-4 border-b border-white/8 pb-5 md:flex-row md:items-start md:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffb084]">
          Editor Artikel
        </p>
        <h2 class="mt-2 text-2xl font-bold text-stone-50">
          {{ isEditing ? 'Edit Konten Artikel' : 'Buat Draft Artikel Baru' }}
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-stone-400">
          Isi kategori, body, dan media sesuai alur diagram. Publish artikel dilakukan lewat tombol validasi terpisah.
        </p>
      </div>

      <StatusBadge v-if="selectedArticle" :status="selectedArticle.status" />
    </div>

    <div class="mt-6 grid gap-5 md:grid-cols-2">
      <div>
        <label class="mb-2 block text-sm font-medium text-stone-300">Tipe Artikel</label>
        <select
          v-model="form.articleMode"
          class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
        >
          <option value="main">Artikel Utama</option>
          <option value="detail">Artikel Detail</option>
        </select>
      </div>

      <div class="md:col-span-2">
        <label class="mb-2 block text-sm font-medium text-stone-300">Judul Artikel</label>
        <input
          v-model="form.title"
          type="text"
          class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          placeholder="Contoh: Inovasi Pengolahan Sabut Kelapa Berbasis Komunitas"
        />
      </div>

      <template v-if="isDetailArticle">
        <div>
          <label class="mb-2 block text-sm font-medium text-stone-300">Hubungkan ke Artikel Utama</label>
          <select
            v-model="form.parentArticleId"
            class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          >
            <option value="">Pilih artikel utama</option>
            <option
              v-for="article in articleStore.mainArticles"
              :key="article.id"
              :value="article.id"
            >
              {{ article.title }}{{ article.category?.name ? ` - ${article.category.name}` : '' }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-stone-300">Hubungkan ke Card Produk</label>
          <select
            v-model="form.linkedProductCardId"
            :disabled="!form.parentArticleId"
            class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          >
            <option value="">Pilih product card</option>
            <option
              v-for="productCard in productCardOptions"
              :key="productCard.id"
              :value="productCard.id"
            >
              {{ productCard.title }}
            </option>
          </select>
        </div>

        <div class="md:col-span-2 rounded-3xl border border-[#ff7c35]/15 bg-[#3b312d] p-5">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
            Mode Linking
          </p>
          <p class="mt-2 text-sm leading-7 text-stone-300">
            Artikel detail akan menjadi konten lanjutan dari artikel utama yang dipilih, lalu dikunci ke satu
            product card yang masih tersedia.
          </p>
        </div>
      </template>

      <div>
        <label class="mb-2 block text-sm font-medium text-stone-300">Nama Kategori</label>
        <input
          v-model="form.categoryName"
          type="text"
          class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          placeholder="Masukkan kategori atau tag"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-stone-300">Status Draft Kerja</label>
        <select
          v-model="form.status"
          class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
        >
          <option value="draft">Draft</option>
          <option value="revision">Revision</option>
        </select>
      </div>

      <div class="md:col-span-2">
        <label class="mb-2 block text-sm font-medium text-stone-300">Meta Description</label>
        <textarea
          v-model="form.metaDescription"
          rows="3"
          class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          placeholder="Ringkasan singkat artikel untuk preview daftar artikel."
        />
      </div>

      <div class="md:col-span-2 grid gap-5 xl:grid-cols-2">
        <div>
          <label class="mb-2 block text-sm font-medium text-stone-300">Body Content</label>
          <textarea
            v-model="form.bodyContent"
            rows="12"
            class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
            placeholder="Tulis isi lengkap artikel di sini... Gunakan # Judul, ## Subjudul, - list, **tebal**, *miring*."
          />
        </div>

        <RichTextPreview :content="form.bodyContent" />
      </div>
    </div>

    <p
      v-if="formError"
      class="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-200"
    >
      {{ formError }}
    </p>

    <div v-if="!isDetailArticle" class="mt-8 rounded-3xl bg-[#383838] p-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-[0.22em] text-stone-300">
            Product Cards Turunan
          </h3>
          <p class="mt-1 text-sm text-stone-400">
            Tambahkan daftar produk turunan yang akan tampil sebagai card pada artikel utama.
          </p>
        </div>

        <button
          type="button"
          class="rounded-full border border-white/12 bg-[#303030] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-[#3a3a3a]"
          @click="addProductCardRow"
        >
          Tambah Card
        </button>
      </div>

      <div class="mt-5 space-y-4">
        <div
          v-for="(item, index) in form.productCards"
          :key="`product-card-${index}`"
          class="rounded-3xl border border-white/8 bg-[#303030] p-5"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-stone-300">Judul Produk</label>
              <input
                v-model="item.title"
                type="text"
                class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
                placeholder="Contoh: Arang Tempurung"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-stone-300">Gambar Produk</label>
              <div class="flex flex-col gap-3 md:flex-row">
                <input
                  v-model="item.image"
                  type="text"
                  class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
                  placeholder="/uploads/articles/product-card.jpg"
                />

                <label class="flex cursor-pointer items-center justify-center rounded-2xl border border-[#ff7c35]/20 bg-[#3b312d] px-4 py-3 text-sm font-semibold text-[#ffb084] transition hover:bg-[#47352c]">
                  Upload
                  <input
                    type="file"
                    class="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    @change="handleProductCardImageSelection($event, index)"
                  />
                </label>
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="mb-2 block text-sm font-medium text-stone-300">Deskripsi Singkat</label>
              <textarea
                v-model="item.description"
                rows="3"
                class="w-full rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
                placeholder="Jelaskan singkat produk turunan ini."
              />
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <button
              type="button"
              class="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
              @click="removeProductCardRow(index)"
            >
              Hapus Card
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="mt-8 rounded-3xl border border-dashed border-white/15 bg-[#383838] p-5 text-sm leading-7 text-stone-400"
    >
      Dynamic product cards hanya dibuat pada artikel utama. Untuk artikel detail, gunakan panel linking di atas.
    </div>

    <div class="mt-8 rounded-3xl bg-[#383838] p-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-[0.22em] text-stone-300">
            Media Artikel
          </h3>
          <p class="mt-1 text-sm text-stone-400">
            Tambahkan path file media dan jenis medianya.
          </p>
        </div>

        <button
          type="button"
          class="rounded-full border border-white/12 bg-[#303030] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-[#3a3a3a]"
          @click="addMediaRow"
        >
          Tambah Media
        </button>
      </div>

      <div class="mt-5 space-y-4">
        <div
          v-for="(item, index) in form.media"
          :key="`${index}-${item.file_path}`"
          class="grid gap-3 rounded-2xl border border-white/8 bg-[#303030] p-4 md:grid-cols-[1fr_180px_180px_auto]"
        >
          <input
            v-model="item.file_path"
            type="text"
            class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
            placeholder="/uploads/articles/gambar-utama.jpg"
          />

          <select
            v-model="item.media_type"
            class="rounded-2xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-stone-100 outline-none transition focus:border-[#ff7c35] focus:ring-4 focus:ring-[#ff7c35]/15"
          >
            <option value="image">image</option>
            <option value="video">video</option>
            <option value="document">document</option>
          </select>

          <label class="flex cursor-pointer items-center justify-center rounded-2xl border border-[#ff7c35]/20 bg-[#3b312d] px-4 py-3 text-sm font-semibold text-[#ffb084] transition hover:bg-[#47352c]">
            Upload File
            <input
              type="file"
              class="hidden"
              accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.pdf"
              @change="handleFileSelection($event, index)"
            />
          </label>

          <button
            type="button"
            class="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
            @click="removeMediaRow(index)"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8 flex flex-wrap gap-3">
      <button
        type="button"
        :disabled="loading"
        class="rounded-full bg-[#ff7c35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e86f2f] disabled:cursor-not-allowed disabled:opacity-60"
        @click="submitForm"
      >
        {{ loading ? 'Memproses...' : isEditing ? 'Simpan Perubahan' : 'Simpan Draft' }}
      </button>

      <button
        v-if="selectedArticle && selectedArticle.status !== 'published'"
        type="button"
        :disabled="loading"
        class="rounded-full bg-[#c26939] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b15f34] disabled:cursor-not-allowed disabled:opacity-60"
        @click="$emit('publish', selectedArticle.id)"
      >
        Publish Artikel
      </button>

      <button
        v-if="selectedArticle && selectedArticle.status !== 'revision'"
        type="button"
        :disabled="loading"
        class="rounded-full border border-[#ff7c35]/20 bg-[#ff7c35]/15 px-5 py-3 text-sm font-semibold text-[#ffd1b8] transition hover:bg-[#ff7c35]/25 disabled:cursor-not-allowed disabled:opacity-60"
        @click="$emit('request-revision', selectedArticle.id)"
      >
        Minta Revisi
      </button>

      <button
        v-if="selectedArticle"
        type="button"
        :disabled="loading"
        class="rounded-full border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        @click="$emit('delete', selectedArticle.id)"
      >
        Hapus Artikel
      </button>
    </div>
  </section>
</template>
