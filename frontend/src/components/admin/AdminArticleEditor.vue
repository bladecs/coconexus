<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
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
  canFeatureOnHome: {
    type: Boolean,
    default: false,
  },
  allowMainArticle: {
    type: Boolean,
    default: true,
  },
  canPublish: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['create', 'update', 'publish', 'request-revision', 'publish-version', 'delete', 'toggle-feature']);
const articleStore = useArticleStore();
const formError = ref('');
const sectionTextareaRefs = ref([]);
const selectedVersionToPublish = ref('');

const inlineToolbarItems = [
  { label: 'B', title: 'Tebal', format: 'bold' },
  { label: 'I', title: 'Miring', format: 'italic' },
  { label: 'U', title: 'Underline', format: 'underline' },
];

const blockToolbarItems = [
  { label: 'H1', title: 'Judul utama', format: 'heading1' },
  { label: 'H2', title: 'Sub judul', format: 'heading2' },
  { label: 'H3', title: 'Judul kecil', format: 'heading3' },
  { label: 'Dot', title: 'List titik', format: 'bulletList' },
  { label: '1.', title: 'List nomor', format: 'numberList' },
  { label: '-', title: 'List dash', format: 'dashList' },
];

const categoryOptions = [
  'Batok Kelapa',
  'Serabut Kelapa',
  'Kulit Kelapa',
];

function emptyForm() {
  return {
    articleMode: props.allowMainArticle ? 'main' : 'detail',
    parentArticleId: '',
    linkedProductCardId: '',
    wawasanArticleId: '',
    title: '',
    categoryName: '',
    isHomeFeatured: false,
    tagsText: '',
    metaDescription: '',
    bodyContent: '',
    status: 'draft',
    difficultyLevel: '',
    timeRequiredMinutes: '',
    materialsList: [],
    toolsList: [],
    processParameters: {},
    qualityIndicators: {},
    safetyNotes: '',
    sections: [
      {
        section_type: 'info',
        title: 'Ringkasan',
        body_content: '',
        video_path: '',
        image_path: '',
      },
    ],
    sources: [
      {
        title: '',
        source_type: 'link',
        url: '',
        file_path: '',
      },
    ],
    productCards: [
      {
        title: '',
        description: '',
        image: '',
        processingMethod: '',
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

const TECHNICAL_TYPES = ['prosedur', 'panduan', 'referensi', 'studi_kasus', 'troubleshooting'];

const articleTypeOptions = [
  { value: 'main', label: 'Artikel Utama (Wawasan)', group: 'Wawasan' },
  { value: 'detail', label: 'Artikel Detail (Wawasan)', group: 'Wawasan' },
  { value: 'prosedur', label: 'Prosedur (SOP Langkah-langkah)', group: 'Teknis' },
  { value: 'panduan', label: 'Panduan Teknis', group: 'Teknis' },
  { value: 'referensi', label: 'Referensi Data / Spesifikasi', group: 'Teknis' },
  { value: 'studi_kasus', label: 'Studi Kasus', group: 'Teknis' },
  { value: 'troubleshooting', label: 'Troubleshooting', group: 'Teknis' },
];

const isEditing = computed(() => Boolean(props.selectedArticle?.id));
const isDetailArticle = computed(() => form.articleMode === 'detail');
const isMainArticle = computed(() => form.articleMode === 'main');
const isTechnicalArticle = computed(() => TECHNICAL_TYPES.includes(form.articleMode));
const articleFamily = computed(() => {
  if (['main', 'detail'].includes(form.articleMode)) return 'wawasan';
  if (TECHNICAL_TYPES.includes(form.articleMode)) return 'teknis';
  return 'wawasan';
});

const wawasanTypeOptions = [
  { value: 'main',   label: 'Artikel Utama',   icon: 'article',     desc: 'Konten pengetahuan utama dengan product cards dan artikel detail turunan' },
  { value: 'detail', label: 'Artikel Detail',  icon: 'description', desc: 'Artikel penjelasan mendalam yang terhubung ke artikel utama via product card' },
];

const visibleWawasanTypeOptions = computed(() =>
  props.allowMainArticle ? wawasanTypeOptions : wawasanTypeOptions.filter((opt) => opt.value !== 'main')
);

const technicalTypeOptions = [
  { value: 'prosedur',       label: 'Prosedur',       icon: 'list_alt',     desc: 'SOP langkah-langkah pelaksanaan teknis' },
  { value: 'panduan',        label: 'Panduan',         icon: 'menu_book',    desc: 'Panduan teknis pengoperasian alat/bahan' },
  { value: 'referensi',      label: 'Referensi',       icon: 'data_table',   desc: 'Data, spesifikasi, atau tabel parameter teknis' },
  { value: 'studi_kasus',    label: 'Studi Kasus',     icon: 'science',      desc: 'Dokumentasi kasus nyata di lapangan' },
  { value: 'troubleshooting',label: 'Troubleshooting', icon: 'build',        desc: 'Panduan penyelesaian masalah teknis' },
];

function selectFamily(family) {
  if (family === 'wawasan') {
    form.articleMode = props.allowMainArticle ? 'main' : 'detail';
    return;
  }
  form.articleMode = 'prosedur';
}
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

async function refreshVersionHistory() {
  selectedVersionToPublish.value = '';

  if (!props.selectedArticle?.id) {
    articleStore.articleVersions = [];
    return;
  }

  await articleStore.fetchArticleVersions(props.selectedArticle.id);
}

watch(
  () => props.selectedArticle,
  (article) => {
    formError.value = '';

    if (!article) {
      Object.assign(form, emptyForm());
      selectedVersionToPublish.value = '';
      if (form.articleMode === 'main') {
        ensureMainArticleSections();
      }
      return;
    }

    Object.assign(form, {
      articleMode: article.article_type || (article.parent_article_id ? 'detail' : 'main'),
      parentArticleId: article.parent_article_id || '',
      linkedProductCardId: article.linked_product_card?.id || '',
      wawasanArticleId: article.wawasan_article_id || '',
      title: article.title || '',
      categoryName: article.category?.name || '',
      isHomeFeatured: Boolean(article.is_home_featured),
      tagsText: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      metaDescription: article.detail?.meta_description || '',
      bodyContent: article.detail?.body_content || '',
      status: article.status || 'draft',
      difficultyLevel: article.detail?.difficulty_level || '',
      timeRequiredMinutes: article.detail?.time_required_minutes || '',
      materialsList: Array.isArray(article.detail?.materials_list) ? article.detail.materials_list : [],
      toolsList: Array.isArray(article.detail?.tools_list) ? article.detail.tools_list : [],
      processParameters: article.detail?.process_parameters || {},
      qualityIndicators: article.detail?.quality_indicators || {},
      safetyNotes: article.detail?.safety_notes || '',
      sections:
        article.detail?.sections?.length > 0
          ? article.detail.sections.map((item) => ({
              section_type: item.section_type || 'info',
              title: item.title || '',
              body_content: item.body_content || '',
              video_path: item.video_path || '',
              image_path: item.image_path || '',
            }))
          : [
              {
                section_type: 'info',
                title: 'Ringkasan',
                body_content: article.detail?.body_content || '',
                video_path: '',
                image_path: '',
              },
            ],
      sources:
        article.detail?.sources?.length > 0
          ? article.detail.sources.map((item) => ({
              title: item.title || '',
              source_type: item.source_type || 'link',
              url: item.url || '',
              file_path: item.file_path || '',
            }))
          : [
              {
                title: '',
                source_type: 'link',
                url: '',
                file_path: '',
              },
            ],
      productCards:
        article.product_cards?.length > 0
          ? article.product_cards
              .filter((item) => !item.linked_article_id)
              .map((item) => ({
              title: item.title || '',
              description: item.description || '',
              image: item.image || '',
              processingMethod: item.processing_method || '',
              }))
          : [
              {
                title: '',
                description: '',
                image: '',
                processingMethod: '',
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

    if (form.articleMode === 'main') {
      ensureMainArticleSections();
    }
  },
  { immediate: true }
);

watch(
  () => props.selectedArticle?.id,
  async () => {
    await refreshVersionHistory();
  },
  { immediate: true }
);

watch(
  () => form.articleMode,
  async (mode) => {
    if (mode === 'main') {
      form.parentArticleId = '';
      form.linkedProductCardId = '';
      form.wawasanArticleId = '';
      articleStore.availableProductCards = [];
      ensureMainArticleSections();
      return;
    }

    if (!articleStore.mainArticles.length) {
      await refreshMainArticleOptions();
    }
  }
);

watch(
  () => form.categoryName,
  () => {
    if (form.articleMode === 'main') {
      ensureMainArticleSections();
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
    processingMethod: '',
  });
}

function mainArticleSectionTitles(categoryName) {
  const label = categoryName || 'Limbah Ini';
  return [
    `Apa Itu ${label}?`,
    `Manfaat ${label}`,
    `Mengapa ${label} Menjadi Limbah Bernilai Tinggi?`,
    `Ragam Cara Pengelolaan ${label}`,
  ];
}

function ensureMainArticleSections() {
  const titles = mainArticleSectionTitles(form.categoryName);
  const next = titles.map((title, index) => ({
    section_type: 'info',
    title,
    body_content: form.sections[index]?.body_content || '',
    video_path: form.sections[index]?.video_path || '',
    image_path: form.sections[index]?.image_path || '',
  }));
  form.sections.splice(0, form.sections.length, ...next);
}

function addSectionRow() {
  form.sections.push({
    section_type: 'info',
    title: '',
    body_content: '',
    video_path: '',
    image_path: '',
  });
}

function removeSectionRow(index) {
  if (form.sections.length === 1) {
    form.sections[0].section_type = 'info';
    form.sections[0].title = 'Ringkasan';
    form.sections[0].body_content = '';
    form.sections[0].video_path = '';
    form.sections[0].image_path = '';
    return;
  }

  form.sections.splice(index, 1);
  sectionTextareaRefs.value.splice(index, 1);
}

function setSectionTextareaRef(element, index) {
  if (element) {
    sectionTextareaRefs.value[index] = element;
  }
}

function wrapInlineText(text, format) {
  const fallbackText = text || 'teks';
  if (format === 'bold') return `**${fallbackText}**`;
  if (format === 'italic') return `*${fallbackText}*`;
  if (format === 'underline') return `++${fallbackText}++`;
  return fallbackText;
}

function stripExistingBlockMarker(line) {
  return line.replace(/^(#{1,3}\s+|\*\s+|-\s+|\d+\.\s+)/, '');
}

function formatBlockText(text, format) {
  const selectedText = text || 'Tulis teks di sini';
  const lines = selectedText.split('\n');

  return lines
    .map((line, lineIndex) => {
      const cleanLine = stripExistingBlockMarker(line);
      if (format === 'heading1') return `# ${cleanLine}`;
      if (format === 'heading2') return `## ${cleanLine}`;
      if (format === 'heading3') return `### ${cleanLine}`;
      if (format === 'bulletList') return `* ${cleanLine}`;
      if (format === 'numberList') return `${lineIndex + 1}. ${cleanLine}`;
      if (format === 'dashList') return `- ${cleanLine}`;
      return cleanLine;
    })
    .join('\n');
}

async function applySectionFormat(index, format) {
  const textarea = sectionTextareaRefs.value[index];
  const section = form.sections[index];

  if (!textarea || !section) return;

  const selectionStart = textarea.selectionStart;
  const selectionEnd = textarea.selectionEnd;
  const selectedText = section.body_content.slice(selectionStart, selectionEnd);
  const isBlockFormat = blockToolbarItems.some((item) => item.format === format);
  const replacement = isBlockFormat ? formatBlockText(selectedText, format) : wrapInlineText(selectedText, format);

  section.body_content =
    section.body_content.slice(0, selectionStart) + replacement + section.body_content.slice(selectionEnd);

  await nextTick();
  textarea.focus();
  textarea.setSelectionRange(selectionStart, selectionStart + replacement.length);
}

function addSourceRow() {
  form.sources.push({
    title: '',
    source_type: 'link',
    url: '',
    file_path: '',
  });
}

function removeSourceRow(index) {
  if (form.sources.length === 1) {
    form.sources[0].title = '';
    form.sources[0].source_type = 'link';
    form.sources[0].url = '';
    form.sources[0].file_path = '';
    return;
  }
  form.sources.splice(index, 1);
}

function removeProductCardRow(index) {
  if (form.productCards.length === 1) {
    form.productCards[0].title = '';
    form.productCards[0].description = '';
    form.productCards[0].image = '';
    form.productCards[0].processingMethod = '';
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
  const fileList = event.target.files;
  if (!fileList || fileList.length === 0) return;

  if (fileList.length === 1) {
    const uploadedMedia = await articleStore.uploadArticleMedia(fileList[0]);
    form.media[index].file_path = uploadedMedia.file_path;
    form.media[index].media_type = uploadedMedia.media_type;
    return;
  }

  const uploadedArray = await articleStore.uploadArticleMediaMany(fileList);
  if (!uploadedArray || uploadedArray.length === 0) return;

  form.media[index].file_path = uploadedArray[0].file_path;
  form.media[index].media_type = uploadedArray[0].media_type;

  for (let i = 1; i < uploadedArray.length; i += 1) {
    form.media.splice(index + i, 0, {
      file_path: uploadedArray[i].file_path || '',
      media_type: uploadedArray[i].media_type || 'image',
    });
  }
}

async function handleProductCardImageSelection(event, index) {
  const selectedFile = event.target.files?.[0];
  if (!selectedFile) return;

  const uploadedMedia = await articleStore.uploadArticleMedia(selectedFile);
  form.productCards[index].image = uploadedMedia.file_path;
}

async function handleSectionVideoSelection(event, index) {
  const selectedFile = event.target.files?.[0];
  if (!selectedFile) return;

  const uploadedMedia = await articleStore.uploadArticleMedia(selectedFile);
  form.sections[index].video_path = uploadedMedia.file_path;
}

async function handleSectionImageSelection(event, index) {
  const selectedFile = event.target.files?.[0];
  if (!selectedFile) return;

  const uploadedMedia = await articleStore.uploadArticleMedia(selectedFile);
  form.sections[index].image_path = uploadedMedia.file_path;
}

async function handleSourceFileSelection(event, index) {
  const selectedFile = event.target.files?.[0];
  if (!selectedFile) return;

  const uploadedMedia = await articleStore.uploadArticleMedia(selectedFile);
  form.sources[index].file_path = uploadedMedia.file_path;
  form.sources[index].source_type = 'pdf';
}

function buildPayload() {
  const sections = form.sections
    .filter((item) => item.title.trim() || item.body_content.trim() || item.video_path.trim() || item.image_path.trim())
    .map((item) => ({
      section_type: item.section_type || 'info',
      title: item.title,
      body_content: item.body_content,
      video_path: item.video_path || null,
      image_path: item.image_path || null,
    }));
  const sources = form.sources
    .filter((item) => item.title.trim() || item.url.trim() || item.file_path.trim())
    .map((item) => ({
      title: item.title,
      source_type: item.source_type,
      url: item.url || null,
      file_path: item.file_path || null,
    }));
  const tags = form.tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const technicalPayload = isTechnicalArticle.value
    ? {
        difficulty_level: form.difficultyLevel || null,
        time_required_minutes: form.timeRequiredMinutes ? Number(form.timeRequiredMinutes) : null,
        materials_list: form.materialsList.filter(m => m.name?.trim()).length > 0
          ? form.materialsList.filter(m => m.name?.trim())
          : null,
        tools_list: form.toolsList.filter(t => t.name?.trim()).length > 0
          ? form.toolsList.filter(t => t.name?.trim())
          : null,
        process_parameters: Object.keys(form.processParameters).length > 0 ? form.processParameters : null,
        quality_indicators: Object.keys(form.qualityIndicators).length > 0 ? form.qualityIndicators : null,
        safety_notes: form.safetyNotes || null,
      }
    : {};

  return {
    article_type: form.articleMode,
    parent_article_id: isDetailArticle.value ? Number(form.parentArticleId) : null,
    wawasan_article_id: isTechnicalArticle.value && form.wawasanArticleId ? Number(form.wawasanArticleId) : null,
    linked_product_card_id:
      isDetailArticle.value && form.linkedProductCardId ? Number(form.linkedProductCardId) : null,
    title: form.title,
    body_content: sections.map((section) => section.body_content).join('\n\n') || form.bodyContent,
    meta_description: form.metaDescription,
    status: form.status,
    sections,
    sources,
    tags,
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
            processing_method: item.processingMethod?.trim() || null,
          })),
    media: form.media.filter((item) => item.file_path.trim()),
    ...technicalPayload,
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

  const completeSections = form.sections.filter((item) => item.title.trim() || item.body_content.trim());
  if (!completeSections.length || completeSections.some((item) => !item.title.trim() || !item.body_content.trim())) {
    formError.value = 'Minimal satu section wajib diisi lengkap dengan judul dan isi.';
    return false;
  }

  const invalidSource = form.sources.find((item) => {
    const hasValue = item.title.trim() || item.url.trim() || item.file_path.trim();
    if (!hasValue) return false;
    if (!item.title.trim()) return true;
    return item.source_type === 'link' ? !item.url.trim() : !item.file_path.trim();
  });

  if (invalidSource) {
    formError.value = 'Setiap sumber harus punya judul dan link jurnal yang valid.';
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
  if (!validateForm()) return;

  if (isEditing.value) {
    emit('update', {
      id: props.selectedArticle.id,
      payload: buildPayload(),
    });
    return;
  }
  emit('create', buildPayload());
}

function handleToggleHomeFeature() {
  if (!props.selectedArticle?.id) return;
  emit('toggle-feature', {
    id: props.selectedArticle.id,
    isHomeFeatured: form.isHomeFeatured,
  });
}

function publishSelectedVersion() {
  if (!props.selectedArticle?.id || !selectedVersionToPublish.value) {
    return;
  }

  emit('publish-version', {
    id: props.selectedArticle.id,
    version: Number(selectedVersionToPublish.value),
  });
}
</script>

<template>
  <div class="flex flex-col gap-6 p-4 w-full lg:p-6">

    <!-- Error -->
    <div v-if="formError" class="rounded-xl border border-error/30 bg-error-container/20 px-5 py-4 text-sm font-medium text-error">
      {{ formError }}
    </div>

    <!-- ── PILIH JENIS ARTIKEL ── -->
    <div class="editor-panel">
      <div class="editor-panel-header">
        <div>
          <p class="editor-label">LANGKAH 1 — JENIS KONTEN</p>
          <h3 class="editor-panel-title">Pilih Jenis Artikel</h3>
        </div>
        <span v-if="isEditing" class="editor-badge">
          <span class="material-symbols-outlined text-base">edit</span>
          Mode Edit
        </span>
      </div>

      <!-- Family cards -->
      <div class="grid gap-4 md:grid-cols-2 mt-5">
        <button
          type="button"
          class="type-family-card"
          :class="articleFamily === 'wawasan' ? 'type-family-card--wawasan-active' : 'type-family-card--idle'"
          @click="selectFamily('wawasan')"
        >
          <div class="type-family-icon" :class="articleFamily === 'wawasan' ? 'type-icon--wawasan' : ''">
            <span class="material-symbols-outlined">library_books</span>
          </div>
          <div class="flex-1 text-left min-w-0">
            <strong class="block text-[15px] font-black">Artikel Wawasan</strong>
            <p class="text-sm mt-1.5 leading-relaxed text-on-surface-variant">Konten edukatif: penjelasan umum, data, dan informasi seputar pengolahan limbah kelapa.</p>
            <div class="mt-3 flex gap-2 flex-wrap">
              <span class="type-tag">Artikel Utama</span>
              <span class="type-tag">Artikel Detail</span>
            </div>
          </div>
          <span v-if="articleFamily === 'wawasan'" class="type-check-icon text-primary">
            <span class="material-symbols-outlined">check_circle</span>
          </span>
        </button>

        <button
          type="button"
          class="type-family-card"
          :class="articleFamily === 'teknis' ? 'type-family-card--teknis-active' : 'type-family-card--idle'"
          @click="selectFamily('teknis')"
        >
          <div class="type-family-icon" :class="articleFamily === 'teknis' ? 'type-icon--teknis' : ''">
            <span class="material-symbols-outlined">engineering</span>
          </div>
          <div class="flex-1 text-left min-w-0">
            <strong class="block text-[15px] font-black">Artikel Teknis</strong>
            <p class="text-sm mt-1.5 leading-relaxed text-on-surface-variant">Panduan operasional: prosedur, panduan teknis, referensi data, studi kasus, dan troubleshooting.</p>
            <div class="mt-3 flex gap-2 flex-wrap">
              <span class="type-tag">Prosedur</span>
              <span class="type-tag">Panduan</span>
              <span class="type-tag">Referensi</span>
              <span class="type-tag type-tag--more">+2</span>
            </div>
          </div>
          <span v-if="articleFamily === 'teknis'" class="type-check-icon text-secondary">
            <span class="material-symbols-outlined">check_circle</span>
          </span>
        </button>
      </div>

      <!-- Sub-type: Wawasan -->
      <Transition name="subtype-fade">
        <div v-if="articleFamily === 'wawasan'" class="sub-type-section">
          <p class="editor-label mb-3">SUB-JENIS WAWASAN</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="opt in visibleWawasanTypeOptions"
              :key="opt.value"
              type="button"
              class="subtype-card"
              :class="{ 'subtype-card--active subtype-card--wawasan': form.articleMode === opt.value }"
              @click="form.articleMode = opt.value"
            >
              <span class="material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5">{{ opt.icon }}</span>
              <div class="text-left">
                <strong class="block font-bold text-sm">{{ opt.label }}</strong>
                <span class="text-xs text-on-surface-variant mt-0.5 block leading-relaxed">{{ opt.desc }}</span>
              </div>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Sub-type: Teknis -->
      <Transition name="subtype-fade">
        <div v-if="articleFamily === 'teknis'" class="sub-type-section">
          <p class="editor-label mb-3">SUB-JENIS TEKNIS</p>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="opt in technicalTypeOptions"
              :key="opt.value"
              type="button"
              class="subtype-card"
              :class="{ 'subtype-card--active subtype-card--teknis': form.articleMode === opt.value }"
              @click="form.articleMode = opt.value"
            >
              <span class="material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5">{{ opt.icon }}</span>
              <div class="text-left">
                <strong class="block font-bold text-sm">{{ opt.label }}</strong>
                <span class="text-xs text-on-surface-variant mt-0.5 block leading-relaxed">{{ opt.desc }}</span>
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── INFORMASI UMUM ── -->
    <div class="editor-panel space-y-6">
      <div class="editor-panel-header">
        <div>
          <p class="editor-label">LANGKAH 2 — IDENTITAS ARTIKEL</p>
          <h3 class="editor-panel-title">Informasi Umum</h3>
        </div>
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        <div>
          <label class="editor-field-label">Nama Kategori</label>
          <select v-model="form.categoryName" class="form-input">
            <option value="" disabled>Pilih Kategori</option>
            <option v-for="(cat, index) in categoryOptions" :key="index" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div>
          <label class="editor-field-label">Status Draft</label>
          <select v-model="form.status" class="form-input">
            <option value="draft">Draft (Simpan sementara)</option>
            <option value="revision">Revision (Butuh perbaikan)</option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="editor-field-label">Judul Artikel</label>
          <input v-model="form.title" type="text" class="form-input" placeholder="Contoh: Inovasi Pengolahan Sabut Kelapa" />
        </div>

        <div>
          <label class="editor-field-label">Tag Artikel</label>
          <input v-model="form.tagsText" type="text" class="form-input" placeholder="Contoh: Cocopeat, Pertanian" />
          <p class="mt-1.5 text-xs text-on-surface-variant">Pisahkan dengan koma.</p>
        </div>

        <div>
          <label class="editor-field-label">Meta Description</label>
          <textarea v-model="form.metaDescription" rows="2" class="form-input" placeholder="Ringkasan singkat untuk SEO dan preview card..."></textarea>
        </div>
      </div>

      <!-- Tandai sebagai artikel utama homepage -->
      <div
        v-if="canFeatureOnHome && isEditing && form.articleMode === 'main'"
        class="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 flex items-start gap-3"
      >
        <input
          id="is-home-featured"
          v-model="form.isHomeFeatured"
          type="checkbox"
          class="mt-1"
          @change="handleToggleHomeFeature"
        />
        <label for="is-home-featured" class="text-sm">
          <span class="font-semibold text-on-surface block">Tampilkan sebagai artikel utama di homepage</span>
          <span class="text-xs text-on-surface-variant leading-relaxed block mt-0.5">
            Homepage hanya menampilkan 1 artikel utama per kategori limbah. Mengaktifkan ini akan otomatis
            melepas tanda dari artikel utama lain di kategori "{{ form.categoryName || '—' }}".
          </span>
        </label>
      </div>

      <!-- Koneksi: Detail → Utama -->
      <template v-if="isDetailArticle">
        <div class="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <p class="editor-label text-primary">KONEKSI ARTIKEL DETAIL</p>
          <div class="grid gap-5 md:grid-cols-2">
            <div>
              <label class="editor-field-label">Link ke Artikel Utama</label>
              <select v-model="form.parentArticleId" class="form-input">
                <option value="">Pilih artikel utama</option>
                <option v-for="article in articleStore.mainArticles" :key="article.id" :value="article.id">
                  {{ article.title }}{{ article.category?.name ? ` — ${article.category.name}` : '' }}
                </option>
              </select>
            </div>
            <div>
              <label class="editor-field-label">Link ke Card Produk</label>
              <select v-model="form.linkedProductCardId" :disabled="!form.parentArticleId" class="form-input">
                <option value="">Pilih product card</option>
                <option v-for="productCard in productCardOptions" :key="productCard.id" :value="productCard.id">
                  {{ productCard.title }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </template>

      <!-- Koneksi: Teknis → Wawasan -->
      <template v-if="isTechnicalArticle">
        <div class="rounded-xl border border-secondary/20 bg-secondary/5 p-5">
          <p class="editor-label text-secondary mb-3">KONEKSI KE ARTIKEL WAWASAN (OPSIONAL)</p>
          <select v-model="form.wawasanArticleId" class="form-input">
            <option value="">Tidak dihubungkan ke wawasan</option>
            <option v-for="article in articleStore.mainArticles" :key="article.id" :value="article.id">
              {{ article.title }}{{ article.category?.name ? ` — ${article.category.name}` : '' }}
            </option>
          </select>
          <p class="mt-2 text-xs text-on-surface-variant">Hubungkan artikel teknis ini ke artikel wawasan yang relevan agar pengguna awam bisa menemukan keduanya.</p>
        </div>
      </template>
    </div>

    <!-- ── SPESIFIKASI TEKNIS ── -->
    <div v-if="isTechnicalArticle" class="editor-panel space-y-6" style="--editor-accent: rgb(var(--color-secondary))">
      <div class="editor-panel-header">
        <div>
          <p class="editor-label" style="color: rgb(var(--color-secondary))">LANGKAH 3 — METADATA TEKNIS</p>
          <h3 class="editor-panel-title">Spesifikasi Teknis</h3>
          <p class="text-sm text-on-surface-variant mt-1">Metadata khusus yang membedakan artikel teknis dari artikel wawasan.</p>
        </div>
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        <div>
          <label class="editor-field-label">Tingkat Kesulitan</label>
          <select v-model="form.difficultyLevel" class="form-input">
            <option value="">Tidak ditentukan</option>
            <option value="pemula">Pemula</option>
            <option value="menengah">Menengah</option>
            <option value="lanjutan">Lanjutan</option>
          </select>
        </div>
        <div>
          <label class="editor-field-label">Estimasi Waktu (menit)</label>
          <input v-model="form.timeRequiredMinutes" type="number" min="0" class="form-input" placeholder="Contoh: 120" />
          <p class="mt-1.5 text-xs text-on-surface-variant">Contoh: 120 = 2 jam.</p>
        </div>
      </div>

      <div>
        <label class="editor-field-label">Catatan Keselamatan / K3</label>
        <textarea v-model="form.safetyNotes" rows="3" class="form-input" placeholder="Contoh: Gunakan APD (masker, sarung tangan) saat menangani H₃PO₄. Pastikan ventilasi cukup..."></textarea>
      </div>

      <div class="editor-sub-panel">
        <div class="flex items-center justify-between mb-4">
          <label class="editor-field-label mb-0">Daftar Bahan</label>
          <button type="button" class="btn-add" @click="form.materialsList.push({ name: '', quantity: '', unit: '', note: '' })">
            <span class="material-symbols-outlined text-[16px]">add</span> Tambah Bahan
          </button>
        </div>
        <p v-if="form.materialsList.length === 0" class="text-sm text-on-surface-variant italic">Belum ada bahan.</p>
        <div v-for="(mat, idx) in form.materialsList" :key="`mat-${idx}`" class="grid gap-3 md:grid-cols-[2fr_1fr_1fr_2fr_auto] items-end mb-3">
          <input v-model="mat.name" type="text" class="form-input text-sm" placeholder="Nama bahan" />
          <input v-model="mat.quantity" type="text" class="form-input text-sm" placeholder="Jumlah" />
          <input v-model="mat.unit" type="text" class="form-input text-sm" placeholder="Satuan (kg, L)" />
          <input v-model="mat.note" type="text" class="form-input text-sm" placeholder="Catatan" />
          <button type="button" class="btn-remove" @click="form.materialsList.splice(idx, 1)">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      <div class="editor-sub-panel">
        <div class="flex items-center justify-between mb-4">
          <label class="editor-field-label mb-0">Daftar Alat</label>
          <button type="button" class="btn-add" @click="form.toolsList.push({ name: '', spec: '', purpose: '' })">
            <span class="material-symbols-outlined text-[16px]">add</span> Tambah Alat
          </button>
        </div>
        <p v-if="form.toolsList.length === 0" class="text-sm text-on-surface-variant italic">Belum ada alat.</p>
        <div v-for="(tool, idx) in form.toolsList" :key="`tool-${idx}`" class="grid gap-3 md:grid-cols-[2fr_2fr_2fr_auto] items-end mb-3">
          <input v-model="tool.name" type="text" class="form-input text-sm" placeholder="Nama alat" />
          <input v-model="tool.spec" type="text" class="form-input text-sm" placeholder="Spesifikasi" />
          <input v-model="tool.purpose" type="text" class="form-input text-sm" placeholder="Fungsi / kegunaan" />
          <button type="button" class="btn-remove" @click="form.toolsList.splice(idx, 1)">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── KONTEN ARTIKEL ── -->
    <div class="editor-panel">
      <div class="editor-panel-header mb-6">
        <div>
          <p class="editor-label">LANGKAH {{ isTechnicalArticle ? 4 : 3 }} — ISI ARTIKEL</p>
          <h3 class="editor-panel-title">{{ isMainArticle ? 'Pengetahuan Dasar' : 'Konten Artikel' }}</h3>
          <p class="text-sm text-on-surface-variant mt-1">
            {{ isMainArticle
              ? 'Artikel utama memakai format tetap: definisi, manfaat, alasan bernilai tinggi, dan ragam cara pengelolaan.'
              : form.articleMode === 'prosedur'
                ? 'Pecah menjadi section bertipe Prosedur per tahapan. Setiap section prosedur wajib disertai foto/video langkah tersebut.'
                : 'Pecah artikel menjadi sub-bab agar mudah dibaca.' }}
          </p>
        </div>
        <button v-if="!isMainArticle" type="button" class="btn-add" @click="addSectionRow">
          <span class="material-symbols-outlined text-[16px]">add</span> Tambah Section
        </button>
      </div>

      <div class="space-y-6">
        <div v-for="(section, index) in form.sections" :key="`section-${index}`" class="editor-sub-panel">
          <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div class="space-y-4">
              <div v-if="isMainArticle">
                <label class="editor-field-label">Bagian {{ index + 1 }}</label>
                <p class="font-bold text-on-surface">{{ section.title }}</p>
              </div>
              <div v-else class="grid gap-3" :class="isTechnicalArticle ? 'md:grid-cols-[auto_1fr]' : ''">
                <div v-if="isTechnicalArticle">
                  <label class="editor-field-label">Tipe Section</label>
                  <select v-model="section.section_type" class="form-input text-sm">
                    <option value="info">Info (Teks bebas)</option>
                    <option value="procedure">Prosedur (Langkah bernomor)</option>
                    <option value="tools">Alat & Bahan</option>
                    <option value="data_table">Tabel Data</option>
                    <option value="warning">Peringatan / Catatan</option>
                    <option value="formula">Rumus / Formula</option>
                    <option value="troubleshooting">Troubleshooting</option>
                  </select>
                </div>
                <div>
                  <label class="editor-field-label">Judul Section</label>
                  <input v-model="section.title" type="text" class="form-input" :placeholder="index === 0 ? 'Judul section utama (ex: Pendahuluan)' : 'Judul sub-bab'" />
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container p-2">
                <button v-for="item in inlineToolbarItems" :key="item.format" type="button" class="toolbar-btn" :class="{ italic: item.format === 'italic', underline: item.format === 'underline' }" :title="item.title" @click="applySectionFormat(index, item.format)">
                  {{ item.label }}
                </button>
                <span class="h-5 w-px bg-outline-variant/40 mx-1" />
                <button v-for="item in blockToolbarItems" :key="item.format" type="button" class="toolbar-btn px-3 text-xs" :title="item.title" @click="applySectionFormat(index, item.format)">
                  {{ item.label }}
                </button>
              </div>

              <textarea :ref="(el) => setSectionTextareaRef(el, index)" v-model="section.body_content" rows="8" class="form-input font-mono text-sm leading-relaxed" placeholder="Tulis isi paragraf di sini..."></textarea>

              <div v-if="form.articleMode === 'prosedur' && section.section_type === 'procedure'" class="text-xs font-semibold text-secondary">
                Section prosedur wajib memiliki foto atau video langkah ini sebelum dipublikasikan.
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <input v-model="section.image_path" type="text" class="form-input flex-1" placeholder="URL Gambar Langkah (Opsional)" />
                <label class="btn-secondary cursor-pointer whitespace-nowrap text-xs text-center flex items-center justify-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px]">upload</span> Upload Foto
                  <input type="file" class="hidden" accept="image/*" @change="handleSectionImageSelection($event, index)" />
                </label>
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <input v-model="section.video_path" type="text" class="form-input flex-1" placeholder="URL Video (Opsional)" />
                <label class="btn-secondary cursor-pointer whitespace-nowrap text-xs text-center flex items-center justify-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px]">upload</span> Upload MP4
                  <input type="file" class="hidden" accept=".mp4" @change="handleSectionVideoSelection($event, index)" />
                </label>
                <button v-if="!isMainArticle" type="button" class="btn-danger text-xs whitespace-nowrap" @click="removeSectionRow(index)">Hapus</button>
              </div>
            </div>

            <div class="rounded-xl bg-surface-container border border-outline-variant/20 p-4 overflow-y-auto max-h-[400px]">
              <p class="editor-label mb-3 border-b border-outline-variant/20 pb-2">Live Preview</p>
              <RichTextPreview :content="section.body_content" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── PRODUCT CARDS ── -->
    <div v-if="!isDetailArticle" class="editor-panel">
      <div class="editor-panel-header mb-6">
        <div>
          <p class="editor-label">POHON TURUNAN LIMBAH</p>
          <h3 class="editor-panel-title">Product Cards</h3>
          <p class="text-sm text-on-surface-variant mt-1">
            {{ form.articleMode === 'main'
              ? 'Produk turunan limbah ini, dikelompokkan berdasarkan cara pengelolaan.'
              : 'Daftar produk yang dipromosikan di artikel ini.' }}
          </p>
        </div>
        <button type="button" class="btn-add" @click="addProductCardRow">
          <span class="material-symbols-outlined text-[16px]">add</span> Tambah Card
        </button>
      </div>
      <div class="space-y-4">
        <div v-for="(item, index) in form.productCards" :key="`product-card-${index}`" class="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-start editor-sub-panel">
          <div class="space-y-4">
            <div>
              <label class="editor-field-label">Nama Produk</label>
              <input v-model="item.title" type="text" class="form-input" placeholder="Arang Tempurung" />
            </div>
            <div v-if="form.articleMode === 'main'">
              <label class="editor-field-label">Cara Pengelolaan</label>
              <input v-model="item.processingMethod" type="text" class="form-input" placeholder="Contoh: Dibakar (Karbonisasi)" />
              <p class="mt-1.5 text-xs text-on-surface-variant">Dipakai untuk mengelompokkan produk turunan di halaman artikel.</p>
            </div>
            <div>
              <label class="editor-field-label">Gambar Produk</label>
              <div class="flex gap-2">
                <input v-model="item.image" type="text" class="form-input flex-1" placeholder="/url-gambar.jpg" />
                <label class="btn-secondary cursor-pointer text-xs flex items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-[15px]">upload</span>
                  <input type="file" class="hidden" accept="image/*" @change="handleProductCardImageSelection($event, index)" />
                </label>
              </div>
            </div>
          </div>
          <div class="h-full flex flex-col">
            <label class="editor-field-label">Deskripsi Singkat</label>
            <textarea v-model="item.description" rows="4" class="form-input flex-1" placeholder="Jelaskan produk ini..."></textarea>
          </div>
          <div class="flex md:flex-col h-full justify-end">
            <button type="button" class="btn-danger text-xs" @click="removeProductCardRow(index)">Hapus</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SUMBER REFERENSI ── -->
    <div class="editor-panel">
      <div class="editor-panel-header mb-6">
        <div>
          <p class="editor-label">REFERENSI</p>
          <h3 class="editor-panel-title">Sumber Referensi</h3>
          <p class="text-sm text-on-surface-variant mt-1">
            Daftar jurnal atau artikel terkait.
            <span v-if="articleFamily === 'wawasan'" class="font-semibold text-primary">Wajib diisi minimal 1 sebelum artikel wawasan dipublikasikan.</span>
          </p>
        </div>
        <button type="button" class="btn-add" @click="addSourceRow">
          <span class="material-symbols-outlined text-[16px]">add</span> Tambah Sumber
        </button>
      </div>
      <div class="space-y-3">
        <div v-for="(source, index) in form.sources" :key="`source-${index}`" class="flex flex-col md:flex-row gap-3">
          <input v-model="source.title" type="text" class="form-input md:w-1/3" placeholder="Judul Referensi" />
          <input v-model="source.url" type="url" class="form-input flex-1" placeholder="https://link-jurnal.com" />
          <button type="button" class="btn-danger text-xs px-5" @click="removeSourceRow(index)">Hapus</button>
        </div>
      </div>
    </div>

    <!-- ── MEDIA GALERI ── -->
    <div class="editor-panel">
      <div class="editor-panel-header mb-6">
        <div>
          <p class="editor-label">MEDIA</p>
          <h3 class="editor-panel-title">Media Galeri</h3>
          <p class="text-sm text-on-surface-variant mt-1">
            Gambar atau lampiran global untuk artikel.
            <span v-if="articleFamily === 'wawasan'" class="font-semibold text-primary">Wajib menyertakan minimal 1 foto sebelum artikel wawasan dipublikasikan.</span>
          </p>
        </div>
        <button type="button" class="btn-add" @click="addMediaRow">
          <span class="material-symbols-outlined text-[16px]">add</span> Tambah Media
        </button>
      </div>
      <div class="space-y-3">
        <div v-for="(item, index) in form.media" :key="`${index}-${item.file_path}`" class="flex flex-col sm:flex-row gap-3 items-center">
          <input v-model="item.file_path" type="text" class="form-input flex-1" placeholder="URL File / Upload..." />
          <select v-model="item.media_type" class="form-input w-full sm:w-36">
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Dokumen</option>
          </select>
          <div class="flex w-full sm:w-auto gap-2">
            <label class="btn-secondary flex-1 sm:flex-none cursor-pointer text-xs flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[15px]">upload</span> Upload
              <input type="file" class="hidden" multiple @change="handleFileSelection($event, index)" />
            </label>
            <button type="button" class="btn-danger flex-1 sm:flex-none text-xs" @click="removeMediaRow(index)">Hapus</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ACTION BUTTONS ── -->
    <div class="flex flex-wrap items-center gap-3 px-2 py-6 border-t border-outline-variant/30">
      <button type="button" :disabled="loading" class="btn-primary" @click="submitForm">
        {{ loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Draft Baru' }}
      </button>

      <button v-if="canPublish && selectedArticle && selectedArticle.status !== 'published'" type="button" :disabled="loading" class="btn-publish" @click="$emit('publish', selectedArticle.id)">
        <span class="material-symbols-outlined text-[16px]">publish</span>
        Publish Artikel
      </button>

      <button v-if="canPublish && selectedArticle && selectedArticle.status !== 'revision'" type="button" :disabled="loading" class="btn-revision" @click="$emit('request-revision', selectedArticle.id)">
        <span class="material-symbols-outlined text-[16px]">rate_review</span>
        Tandai Revisi
      </button>

      <div v-if="canPublish && selectedArticle && articleStore.articleVersions.length > 0" class="flex min-w-[280px] flex-1 items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3">
        <div class="min-w-0 flex-1">
          <p class="editor-label mb-2">Publish Versi Spesifik</p>
          <select v-model="selectedVersionToPublish" class="form-input">
            <option value="" disabled>Pilih versi artikel</option>
            <option v-for="version in articleStore.articleVersions" :key="version.id" :value="version.version_number">
              Versi {{ version.version_number }} • {{ version.action }}
            </option>
          </select>
        </div>
        <button type="button" :disabled="loading || !selectedVersionToPublish" class="btn-primary" @click="publishSelectedVersion">
          Publish
        </button>
      </div>

      <div class="flex-1" />

      <button v-if="selectedArticle" type="button" :disabled="loading" class="btn-delete" @click="$emit('delete', selectedArticle.id)">
        <span class="material-symbols-outlined text-[16px]">delete</span>
        Hapus Artikel
      </button>
    </div>

  </div>
</template>

<style scoped>
/* ── Base panel ── */
.editor-panel {
  border: 1px solid var(--inner-border);
  border-radius: 16px;
  background: rgb(var(--color-surface-container-low));
  padding: 1.5rem;
}

@media (min-width: 1024px) {
  .editor-panel { padding: 2rem; }
}

.editor-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--inner-border);
  margin-bottom: 1.5rem;
}

.editor-panel-title {
  margin-top: 0.3rem;
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--inner-text);
}

.editor-label {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--inner-accent);
}

.editor-field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--inner-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.editor-sub-panel {
  border: 1px solid var(--inner-border);
  border-radius: 12px;
  background: rgb(var(--color-surface-container));
  padding: 1.25rem;
}

.editor-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--inner-border);
  border-radius: 999px;
  background: rgb(var(--color-surface-container));
  color: var(--inner-muted);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  white-space: nowrap;
}

/* ── Type family cards ── */
.type-family-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-radius: 14px;
  border: 2px solid var(--inner-border);
  background: rgb(var(--color-surface-container-low));
  padding: 1.25rem;
  text-align: left;
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  cursor: pointer;
  position: relative;
}

.type-family-card--idle:hover {
  border-color: rgb(var(--color-outline-variant));
  background: rgb(var(--color-surface-container));
  transform: translateY(-1px);
}

.type-family-card--wawasan-active {
  border-color: rgb(var(--color-primary) / 0.5);
  background: rgb(var(--color-primary) / 0.05);
  box-shadow: 0 4px 16px rgb(var(--color-primary) / 0.1);
}

.type-family-card--teknis-active {
  border-color: rgb(var(--color-secondary) / 0.5);
  background: rgb(var(--color-secondary) / 0.05);
  box-shadow: 0 4px 16px rgb(var(--color-secondary) / 0.1);
}

.type-family-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container));
  color: var(--inner-muted);
  transition: background 180ms, color 180ms;
}

.type-family-icon .material-symbols-outlined {
  font-size: 24px;
}

.type-icon--wawasan {
  border-color: rgb(var(--color-primary) / 0.25);
  background: rgb(var(--color-primary) / 0.08);
  color: rgb(var(--color-primary));
}

.type-icon--teknis {
  border-color: rgb(var(--color-secondary) / 0.25);
  background: rgb(var(--color-secondary) / 0.08);
  color: rgb(var(--color-secondary));
}

.type-tag {
  display: inline-block;
  border: 1px solid var(--inner-border);
  border-radius: 999px;
  background: rgb(var(--color-surface-container));
  color: var(--inner-muted);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
}

.type-tag--more {
  background: rgb(var(--color-secondary) / 0.1);
  border-color: rgb(var(--color-secondary) / 0.2);
  color: var(--inner-accent);
}

.type-check-icon {
  position: absolute;
  top: 12px;
  right: 12px;
}

.type-check-icon .material-symbols-outlined {
  font-size: 22px;
  font-variation-settings: 'FILL' 1;
}

/* ── Sub-type section ── */
.sub-type-section {
  padding-top: 1.25rem;
  border-top: 1px solid var(--inner-border);
  margin-top: 0.25rem;
}

.subtype-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-radius: 12px;
  border: 1.5px solid var(--inner-border);
  background: rgb(var(--color-surface-container-low));
  padding: 1rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
  color: var(--inner-text);
}

.subtype-card:hover {
  border-color: rgb(var(--color-outline-variant));
  background: rgb(var(--color-surface-container));
  transform: translateY(-1px);
}

.subtype-card--active {
  border-color: transparent;
  background: rgb(var(--color-surface-container));
}

.subtype-card--wawasan.subtype-card--active {
  border-color: rgb(var(--color-primary) / 0.4);
  background: rgb(var(--color-primary) / 0.06);
}

.subtype-card--teknis.subtype-card--active {
  border-color: rgb(var(--color-secondary) / 0.4);
  background: rgb(var(--color-secondary) / 0.06);
}

.subtype-card--wawasan.subtype-card--active .material-symbols-outlined {
  color: rgb(var(--color-primary));
}

.subtype-card--teknis.subtype-card--active .material-symbols-outlined {
  color: rgb(var(--color-secondary));
}

/* ── Form inputs ── */
.form-input {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container-lowest));
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  color: var(--inner-text);
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.form-input::placeholder { color: var(--inner-faint); }

.form-input:focus {
  border-color: var(--inner-accent);
  box-shadow: 0 0 0 3px rgb(var(--color-secondary) / 0.1);
}

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-primary));
  background: rgb(var(--color-primary));
  color: rgb(var(--color-on-primary));
  font-size: 0.88rem;
  font-weight: 800;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: opacity 150ms ease, transform 150ms ease;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-publish {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-primary-container));
  background: rgb(var(--color-primary-container));
  color: rgb(var(--color-on-primary-container));
  font-size: 0.88rem;
  font-weight: 800;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: opacity 150ms, transform 150ms;
  white-space: nowrap;
}
.btn-publish:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-publish:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-revision {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-secondary) / 0.3);
  background: rgb(var(--color-secondary) / 0.08);
  color: var(--inner-accent);
  font-size: 0.88rem;
  font-weight: 800;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: background 150ms, transform 150ms;
  white-space: nowrap;
}
.btn-revision:hover:not(:disabled) { background: rgb(var(--color-secondary) / 0.14); transform: translateY(-1px); }
.btn-revision:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-error) / 0.25);
  background: rgb(var(--color-error-container) / 0.15);
  color: rgb(var(--color-error));
  font-size: 0.88rem;
  font-weight: 800;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: background 150ms, transform 150ms;
  white-space: nowrap;
}
.btn-delete:hover:not(:disabled) { background: rgb(var(--color-error-container) / 0.3); transform: translateY(-1px); }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container));
  color: var(--inner-muted);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
  white-space: nowrap;
}
.btn-secondary:hover { background: rgb(var(--color-surface-container-high)); border-color: rgb(var(--color-outline-variant)); }

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-error) / 0.25);
  background: rgb(var(--color-error-container) / 0.12);
  color: rgb(var(--color-error));
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: background 150ms;
}
.btn-danger:hover { background: rgb(var(--color-error-container) / 0.25); }

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-secondary) / 0.3);
  background: rgb(var(--color-secondary) / 0.07);
  color: var(--inner-accent);
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  transition: background 150ms;
  white-space: nowrap;
}
.btn-add:hover { background: rgb(var(--color-secondary) / 0.14); }

.btn-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-error) / 0.2);
  background: transparent;
  color: rgb(var(--color-error));
  width: 36px;
  height: 36px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms;
}
.btn-remove:hover { background: rgb(var(--color-error-container) / 0.2); }

/* ── Toolbar ── */
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--inner-muted);
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.toolbar-btn:hover {
  background: rgb(var(--color-surface-container-high));
  color: var(--inner-text);
}

/* ── Select custom arrow ── */
select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23708778' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 1rem center;
  background-repeat: no-repeat;
  background-size: 1.2em 1.2em;
  padding-right: 2.5rem !important;
}

/* ── Transition ── */
.subtype-fade-enter-active,
.subtype-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.subtype-fade-enter-from,
.subtype-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
