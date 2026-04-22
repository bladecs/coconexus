<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useArticleStore } from '@/stores/articles';
import { useAuthStore } from '@/stores/auth';
import CommentComposer from '@/components/comments/CommentComposer.vue';
import CommentItem from '@/components/comments/CommentItem.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { resolveAssetUrl } from '@/lib/assets';
import { renderSimpleRichText } from '@/lib/richText';

const route = useRoute();
const articleStore = useArticleStore();
const authStore = useAuthStore();

const articleId = computed(() => Number(route.params.id));
const article = computed(() => articleStore.currentArticle);
const linkedProductCards = computed(() => article.value?.product_cards || []);
const isMainArticle = computed(() => article.value?.article_type !== 'detail');

async function loadArticle() {
  if (!Number.isInteger(articleId.value) || articleId.value <= 0) {
    return;
  }

  await articleStore.fetchPublishedArticleDetail(articleId.value);
}

async function handleCommentSubmit(payload) {
  await articleStore.postComment(articleId.value, payload);
}

async function handleDeleteComment(commentId) {
  await articleStore.deleteComment(commentId, articleId.value);
}

watch(
  () => route.params.id,
  async () => {
    await loadArticle();
  }
);

onMounted(async () => {
  await loadArticle();
});
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-12 text-stone-100">
    <RouterLink
      to="/"
      class="inline-flex rounded-full border border-white/12 bg-[#303030] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-[#3b3b3b]"
    >
      Kembali ke Daftar Artikel
    </RouterLink>

    <section v-if="article" class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <article class="rounded-[2rem] border border-white/10 bg-[#303030]/95 p-8 shadow-soft">
        <div class="flex flex-wrap items-center gap-3">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffb084]">
            {{ article.category?.name || 'Tanpa Kategori' }}
          </p>
          <StatusBadge :status="article.status" />
        </div>

        <h1 class="mt-5 text-4xl font-bold leading-tight text-stone-50">
          {{ article.title }}
        </h1>

        <div class="mt-6 flex flex-wrap items-center gap-5 text-sm text-stone-400">
          <span>
            Penulis:
            <strong class="text-stone-100">
              {{ article.author?.profile?.full_name || article.author?.email }}
            </strong>
          </span>
          <span>Versi {{ article.version }}</span>
        </div>

        <p v-if="article.detail?.meta_description" class="mt-8 rounded-3xl bg-[#3b312d] p-5 text-sm leading-7 text-stone-200">
          {{ article.detail.meta_description }}
        </p>

        <div class="mt-8 max-w-none whitespace-pre-line text-base leading-8 text-stone-200">
          <div v-html="renderSimpleRichText(article.detail?.body_content || '')"></div>
        </div>

        <div v-if="isMainArticle && linkedProductCards.length" class="mt-12">
          <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
                Produk Turunan
              </p>
              <h2 class="mt-2 text-2xl font-bold text-stone-50">
                Lanjutkan penelusuran dari artikel utama ini
              </h2>
            </div>

            <p class="max-w-xl text-sm leading-7 text-stone-400">
              Setiap card di bawah ini mewakili produk turunan dari topik utama. Jika artikel detailnya sudah tersedia,
              pengguna bisa langsung membuka penjelasan lanjutan dari sini.
            </p>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="productCard in linkedProductCards"
              :key="productCard.id"
              class="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#383838] shadow-soft"
            >
              <div
                v-if="productCard.image"
                class="h-44 w-full bg-[#2b2b2b]"
              >
                <img
                  :src="resolveAssetUrl(productCard.image)"
                  :alt="productCard.title"
                  class="h-full w-full object-cover"
                />
              </div>
              <div
                v-else
                class="flex h-44 items-center justify-center bg-gradient-to-br from-[#3b312d] to-[#303030] px-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#ffb084]"
              >
                {{ productCard.title }}
              </div>

              <div class="p-5">
                <div class="flex items-start justify-between gap-3">
                  <h3 class="text-lg font-bold text-stone-50">
                    {{ productCard.title }}
                  </h3>
                  <span
                    class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    :class="
                      productCard.linked_article?.id && productCard.linked_article?.status === 'published'
                        ? 'bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-500/20'
                        : 'bg-white/8 text-stone-300 ring-1 ring-white/10'
                    "
                  >
                    {{
                      productCard.linked_article?.id && productCard.linked_article?.status === 'published'
                        ? 'Tersedia'
                        : 'Segera'
                    }}
                  </span>
                </div>

                <p class="mt-3 text-sm leading-7 text-stone-300">
                  {{ productCard.description }}
                </p>

                <div class="mt-5">
                  <RouterLink
                    v-if="productCard.linked_article?.id && productCard.linked_article?.status === 'published'"
                    :to="`/articles/${productCard.linked_article.id}`"
                    class="inline-flex rounded-full bg-[#ff7c35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e86f2f]"
                  >
                    Buka Detail Produk
                  </RouterLink>

                  <div
                    v-else
                    class="inline-flex rounded-full border border-white/12 bg-[#303030] px-4 py-2 text-sm font-semibold text-stone-400"
                  >
                    Artikel detail belum tersedia
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div v-if="article.media?.length" class="mt-10 space-y-4">
          <h2 class="text-lg font-bold text-stone-100">Lampiran Media</h2>
          <div class="grid gap-4 md:grid-cols-2">
            <div
              v-for="media in article.media"
              :key="media.id"
              class="rounded-3xl border border-white/8 bg-[#383838] p-5"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb084]">
                {{ media.media_type }}
              </p>
              <img
                v-if="media.media_type === 'image'"
                :src="resolveAssetUrl(media.file_path)"
                :alt="article.title"
                class="mt-3 h-56 w-full rounded-2xl object-cover"
              />
              <video
                v-else-if="media.media_type === 'video'"
                :src="resolveAssetUrl(media.file_path)"
                controls
                class="mt-3 h-56 w-full rounded-2xl bg-black object-cover"
              />
              <a
                v-else
                :href="resolveAssetUrl(media.file_path)"
                target="_blank"
                rel="noreferrer"
                class="mt-3 inline-flex rounded-full bg-[#ff7c35] px-4 py-2 text-sm font-semibold text-white"
              >
                Buka Dokumen
              </a>
              <p class="mt-3 break-all text-xs text-stone-400">{{ media.file_path }}</p>
            </div>
          </div>
        </div>
      </article>

      <aside class="space-y-6">
        <section class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
            Diskusi Pembaca
          </p>
          <h2 class="mt-2 text-2xl font-bold text-stone-50">
            Komentar Bersarang
          </h2>
          <p class="mt-3 text-sm leading-7 text-stone-400">
            Pengguna yang login dapat menulis komentar baru atau membalas komentar yang sudah ada.
          </p>
        </section>

        <CommentComposer
          :article-id="article.id"
          :loading="articleStore.isSubmitting"
          :placeholder="authStore.isAuthenticated ? 'Bagikan pendapat Anda tentang artikel ini...' : 'Login terlebih dahulu untuk menulis komentar...'"
          @submit="handleCommentSubmit"
        />

        <section class="space-y-4">
          <CommentItem
            v-for="comment in articleStore.comments"
            :key="comment.id"
            :comment="comment"
            :article-id="article.id"
            :loading="articleStore.isSubmitting"
            @reply="handleCommentSubmit"
            @delete="handleDeleteComment"
          />

          <div
            v-if="!articleStore.comments.length"
            class="rounded-3xl border border-dashed border-white/15 bg-[#303030] p-6 text-sm leading-7 text-stone-300 shadow-soft"
          >
            Belum ada komentar. Jadilah yang pertama memulai diskusi.
          </div>
        </section>
      </aside>
    </section>

    <section
      v-else
      class="mt-6 rounded-[2rem] border border-dashed border-white/15 bg-[#303030] p-8 text-sm leading-7 text-stone-300 shadow-soft"
    >
      {{ articleStore.isLoading ? 'Memuat artikel...' : 'Artikel tidak ditemukan atau belum tersedia.' }}
    </section>
  </main>
</template>
