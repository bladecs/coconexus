<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import CommentComposer from '@/components/comments/CommentComposer.vue';
import CommentItem from '@/components/comments/CommentItem.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { useArticleStore } from '@/stores/articles';
import { useAuthStore } from '@/stores/auth';
import { resolveAssetUrl } from '@/lib/assets';
import { renderSimpleRichText } from '@/lib/richText';

const route = useRoute();
const articleStore = useArticleStore();
const authStore = useAuthStore();

const articleId = computed(() => Number(route.params.id));
const article = computed(() => articleStore.currentArticle);
const linkedProductCards = computed(() => article.value?.product_cards || []);
const isMainArticle = computed(() => article.value?.article_type !== 'detail');
const articleSections = computed(() => {
  const sections = article.value?.detail?.sections || [];

  if (sections.length) {
    return sections;
  }

  return article.value?.detail?.body_content
    ? [
        {
          title: 'Ringkasan',
          body_content: article.value.detail.body_content,
          video_path: null,
        },
      ]
    : [];
});
const articleSources = computed(() => article.value?.detail?.sources || []);
const mainSectionVideo = computed(() => {
  const sectionVideo = articleSections.value.find((section) => section.video_path)?.video_path;
  const mediaVideo = article.value?.media?.find((item) => item.media_type === 'video')?.file_path;
  return sectionVideo || mediaVideo || null;
});
const heroImage = computed(() => {
  const media = article.value?.media?.find((item) => item.media_type === 'image');
  return media?.file_path ? resolveAssetUrl(media.file_path) : null;
});

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

onMounted(loadArticle);
</script>

<template>
  <main class="article-detail-page">
    <SiteNavbar variant="detail" />

    <section v-if="article" class="detail-shell">
      <article
        class="detail-hero"
        :style="heroImage ? { backgroundImage: `linear-gradient(90deg, rgba(31, 31, 31, .92), rgba(31, 31, 31, .56)), url(${heroImage})` } : undefined"
      >
        <div class="detail-hero__content">
          <p class="detail-kicker">{{ article.category?.name || 'Tanpa Kategori' }}</p>
          <h1>{{ article.title }}</h1>
          <p v-if="article.detail?.meta_description" class="detail-summary">
            {{ article.detail.meta_description }}
          </p>
          <div class="detail-meta">
            <span>Versi {{ article.version }}</span>
            <span>{{ article.media?.length || 0 }} lampiran</span>
            <StatusBadge :status="article.status" />
          </div>
        </div>
      </article>

      <div class="detail-layout">
        <aside class="reading-panel">
          <RouterLink to="/" class="back-link">Kembali ke katalog</RouterLink>
          <a href="#content">Ringkasan artikel</a>
          <a v-if="articleSections.length > 1" href="#sections">Section artikel</a>
          <a v-if="linkedProductCards.length" href="#related">Materi terkait</a>
          <a v-if="articleSources.length" href="#sources">Sumber</a>
          <a v-if="article.media?.length" href="#media">Media</a>
          <a href="#discussion">Diskusi</a>
        </aside>

        <div class="detail-main">
          <section id="content" class="content-panel">
            <div class="panel-heading">
              <div>
                <p class="detail-kicker">Ringkasan</p>
                <h2>{{ articleSections[0]?.title || 'Ringkasan Artikel' }}</h2>
              </div>
              <p>Baca inti materi sebelum masuk ke section lanjutan, sumber, lampiran, dan diskusi pembaca.</p>
            </div>
            <video
              v-if="mainSectionVideo"
              class="main-section-video"
              :src="resolveAssetUrl(mainSectionVideo)"
              controls
            />
            <div class="article-body" v-html="renderSimpleRichText(articleSections[0]?.body_content || '')"></div>
          </section>

          <section v-if="articleSections.length > 1" id="sections" class="section-stack">
            <article
              v-for="(section, index) in articleSections.slice(1)"
              :key="`${section.title}-${index}`"
              class="content-panel article-section-panel"
            >
              <div class="panel-heading">
                <div>
                  <p class="detail-kicker">Section {{ index + 2 }}</p>
                  <h2>{{ section.title }}</h2>
                </div>
                <p>Materi lanjutan yang dipisah agar pembaca bisa mengikuti alur artikel dengan lebih jelas.</p>
              </div>
              <video
                v-if="section.video_path"
                class="main-section-video"
                :src="resolveAssetUrl(section.video_path)"
                controls
              />
              <div class="article-body" v-html="renderSimpleRichText(section.body_content || '')"></div>
            </article>
          </section>

          <section v-if="isMainArticle && linkedProductCards.length" id="related" class="content-panel">
            <div class="panel-heading">
              <div>
                <p class="detail-kicker">Lanjutkan Belajar</p>
                <h2>Materi Terkait</h2>
              </div>
              <p>Artikel turunan yang membantu pembaca memahami produk atau proses lanjutan.</p>
            </div>
            <div class="related-list">
              <article v-for="productCard in linkedProductCards" :key="productCard.id" class="related-item">
                <h3>{{ productCard.title }}</h3>
                <p>{{ productCard.description }}</p>
                <RouterLink
                  v-if="productCard.linked_article?.id && productCard.linked_article?.status === 'published'"
                  :to="`/articles/${productCard.linked_article.id}`"
                >
                  Buka Detail
                </RouterLink>
                <span v-else>Segera tersedia</span>
              </article>
            </div>
          </section>

          <section v-if="article.media?.length" id="media" class="content-panel">
            <div class="panel-heading">
              <div>
                <p class="detail-kicker">Lampiran</p>
                <h2>Media Artikel</h2>
              </div>
              <p>Dokumentasi visual dan file pendukung yang terhubung dengan artikel ini.</p>
            </div>
            <div class="media-grid">
              <div v-for="media in article.media" :key="media.id" class="media-item">
                <img
                  v-if="media.media_type === 'image'"
                  :src="resolveAssetUrl(media.file_path)"
                  :alt="article.title"
                />
                <video v-else-if="media.media_type === 'video'" :src="resolveAssetUrl(media.file_path)" controls />
                <a v-else :href="resolveAssetUrl(media.file_path)" target="_blank" rel="noreferrer">
                  Buka Dokumen
                </a>
              </div>
            </div>
          </section>

          <section v-if="articleSources.length" id="sources" class="content-panel">
            <div class="panel-heading">
              <div>
                <p class="detail-kicker">Referensi</p>
                <h2>Sumber Artikel</h2>
              </div>
              <p>Link jurnal, file PDF, dan sumber rujukan yang dipakai dalam penyusunan materi.</p>
            </div>
            <div class="source-list">
              <a
                v-for="source in articleSources"
                :key="`${source.title}-${source.url || source.file_path}`"
                :href="source.source_type === 'pdf' ? resolveAssetUrl(source.file_path) : source.url"
                target="_blank"
                rel="noreferrer"
                class="source-item"
              >
                <span>{{ source.source_type === 'pdf' ? 'PDF' : 'LINK' }}</span>
                <strong>{{ source.title }}</strong>
              </a>
            </div>
          </section>

          <section id="discussion" class="content-panel discussion-panel">
            <div class="panel-heading">
              <div>
                <p class="detail-kicker">Diskusi Pembaca</p>
                <h2>Komentar</h2>
              </div>
              <p>Ruang untuk bertanya, menanggapi, atau menambahkan pengalaman dari praktik lapangan.</p>
            </div>
            <CommentComposer
              :article-id="article.id"
              :loading="articleStore.isSubmitting"
              :placeholder="authStore.isAuthenticated ? 'Bagikan pendapat Anda tentang artikel ini...' : 'Login terlebih dahulu untuk menulis komentar...'"
              @submit="handleCommentSubmit"
            />
            <div class="comment-list">
              <CommentItem
                v-for="comment in articleStore.comments"
                :key="comment.id"
                :comment="comment"
                :article-id="article.id"
                :loading="articleStore.isSubmitting"
                @reply="handleCommentSubmit"
                @delete="handleDeleteComment"
              />
              <div v-if="!articleStore.comments.length" class="empty-comment">
                Belum ada komentar. Jadilah yang pertama memulai diskusi.
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>

    <section v-else class="detail-empty">
      {{ articleStore.isLoading ? 'Memuat artikel...' : 'Artikel tidak ditemukan atau belum tersedia.' }}
    </section>

    <SiteFooter />
  </main>
</template>

<style scoped>
.article-detail-page {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(41, 41, 41, 0.9), rgba(31, 31, 31, 0.97)),
    url('@/assets/img/background.jpg') center top / cover fixed;
  color: #fff7f0;
}

.detail-shell {
  width: min(1440px, calc(100% - 48px));
  margin: 0 auto;
  padding: 118px 0 22px;
}

.detail-hero {
  display: flex;
  min-height: 520px;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(31, 31, 31, 0.92), rgba(31, 31, 31, 0.55)),
    url('@/assets/img/background.jpg') center / cover;
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.4);
  color: #fff8ef;
}

.detail-hero__content {
  max-width: 980px;
  padding: clamp(30px, 6vw, 70px);
}

.detail-kicker {
  width: fit-content;
  margin: 0 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffb083;
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.2em;
  padding: 9px 14px;
  text-transform: uppercase;
}

.detail-hero h1 {
  margin: 0;
  font-size: clamp(2.8rem, 6.6vw, 6.4rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 0.96;
}

.detail-summary {
  max-width: 820px;
  margin: 24px 0 0;
  color: #efe7dc;
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  line-height: 1.7;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.detail-meta span,
.detail-meta :deep(span) {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  color: #fff8ef;
  font-size: 0.84rem;
  font-weight: 900;
  padding: 9px 13px;
}

.detail-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 22px;
  margin-top: 22px;
  align-items: start;
}

.reading-panel,
.content-panel,
.detail-empty {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(48, 48, 48, 0.94);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.32);
}

.reading-panel {
  position: sticky;
  top: 112px;
  display: grid;
  gap: 8px;
  padding: 12px;
}

.reading-panel a {
  border-radius: 8px;
  color: #fff7f0;
  font-weight: 900;
  padding: 13px 14px;
  text-decoration: none;
}

.reading-panel a:hover,
.reading-panel .back-link {
  background: rgba(255, 123, 51, 0.14);
}

.detail-main {
  display: grid;
  gap: 22px;
}

.section-stack {
  display: grid;
  gap: 22px;
}

.content-panel {
  padding: clamp(24px, 4vw, 46px);
}

.content-panel .detail-kicker {
  background: rgba(255, 123, 51, 0.14);
  color: #ffb083;
}

.panel-heading {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(320px, 0.42fr);
  gap: 30px;
  align-items: start;
  margin-bottom: 24px;
}

.panel-heading .detail-kicker {
  margin-bottom: 14px;
}

.panel-heading > p {
  margin: 34px 0 0;
  color: #d0c3ba;
  line-height: 1.7;
}

.content-panel h2 {
  margin: 0;
  font-size: clamp(1.9rem, 3.4vw, 3.35rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1;
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3) {
  color: #fff7f0;
  font-weight: 950;
  letter-spacing: 0;
}

.article-body :deep(p),
.article-body :deep(li) {
  color: #d0c3ba;
  font-size: 1.04rem;
  line-height: 1.95;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  padding-left: 1.25rem;
}

.main-section-video {
  width: 100%;
  max-height: 540px;
  margin-bottom: 26px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #202020;
  object-fit: cover;
}

.article-section-panel {
  position: relative;
  overflow: hidden;
}

.article-section-panel::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: #ff7c35;
  content: '';
}

.related-list,
.comment-list {
  display: grid;
  gap: 14px;
}

.related-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #383838;
  padding: 20px;
}

.related-item h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 950;
}

.related-item p {
  color: #d0c3ba;
  line-height: 1.7;
}

.related-item a,
.related-item span {
  color: #ffb083;
  font-weight: 900;
  text-decoration: none;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.media-item {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #383838;
}

.media-item img,
.media-item video {
  width: 100%;
  height: 230px;
  object-fit: cover;
}

.media-item a {
  display: grid;
  min-height: 120px;
  place-items: center;
  color: #ffb083;
  font-weight: 900;
}

.source-list {
  display: grid;
  gap: 12px;
}

.source-item {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #383838;
  color: #fff7f0;
  padding: 16px;
  text-decoration: none;
}

.source-item span {
  border: 1px solid rgba(255, 123, 51, 0.25);
  border-radius: 8px;
  color: #ffb083;
  font-size: 0.76rem;
  font-weight: 950;
  letter-spacing: 0.14em;
  padding: 9px 10px;
  text-align: center;
}

.source-item strong {
  overflow-wrap: anywhere;
}

.discussion-panel :deep(.premium-panel) {
  border-color: rgba(255, 255, 255, 0.1);
  background: #383838;
  box-shadow: none;
}

.comment-list {
  margin-top: 18px;
}

.empty-comment {
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  color: #d0c3ba;
  padding: 18px;
}

.detail-empty {
  width: min(820px, calc(100% - 32px));
  margin: 140px auto 32px;
  color: #d0c3ba;
  font-weight: 900;
  padding: 28px;
  text-align: center;
}

@media (max-width: 940px) {
  .detail-shell {
    padding-top: 268px;
  }

  .detail-layout,
  .panel-heading,
  .media-grid {
    grid-template-columns: 1fr;
  }

  .panel-heading > p {
    margin-top: 0;
  }

  .reading-panel {
    position: static;
  }
}

@media (max-width: 560px) {
  .detail-shell {
    width: calc(100% - 20px);
    padding-top: 280px;
  }

  .detail-hero {
    min-height: 460px;
  }
}
</style>
