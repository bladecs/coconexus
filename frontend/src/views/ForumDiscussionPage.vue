<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import ForumCommentComposer from '@/components/comments/ForumCommentComposer.vue';
import ForumCommentItem from '@/components/comments/ForumCommentItem.vue';
import { useArticleStore } from '@/stores/articles';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const articleStore = useArticleStore();
const authStore = useAuthStore();
const pageNotice = ref('');
const isLoadingForum = ref(false);

const articleId = computed(() => Number(route.params.id));
const article = computed(() => articleStore.currentArticle);
const forum = computed(() => articleStore.currentForum);
const forumComments = computed(() => articleStore.forumComments);
const sourceComments = computed(() => forum.value?.source_comments || []);

async function loadForumPage() {
  pageNotice.value = '';

  if (!Number.isInteger(articleId.value) || articleId.value <= 0) {
    pageNotice.value = 'Artikel tidak valid.';
    return;
  }

  isLoadingForum.value = true;

  try {
    await articleStore.fetchPublishedArticleDetail(articleId.value);

    try {
      await articleStore.fetchActiveForum(articleId.value);
      if (forum.value?.id) {
        await articleStore.fetchForumComments(forum.value.id);
      }
    } catch (error) {
      articleStore.currentForum = null;
      articleStore.forumComments = [];
      pageNotice.value = error.message || 'Forum diskusi aktif belum tersedia.';
    }
  } finally {
    isLoadingForum.value = false;
  }
}

async function handleForumCommentSubmit(payload) {
  if (!forum.value?.id) {
    pageNotice.value = 'Forum diskusi aktif belum tersedia.';
    return;
  }

  try {
    const response = await articleStore.postForumComment(forum.value.id, payload);
    pageNotice.value = response?.message || 'Komentar forum berhasil dikirim.';
  } catch (error) {
    pageNotice.value = error.message;
  }
}

async function handleDeleteForumComment(commentId) {
  await articleStore.deleteComment(commentId, articleId.value);
  if (forum.value?.id) {
    await articleStore.fetchForumComments(forum.value.id);
  }
}

watch(
  () => route.params.id,
  async () => {
    await loadForumPage();
  }
);

onMounted(loadForumPage);
</script>

<template>
  <main class="forum-page">
    <SiteNavbar variant="detail" />
    <div class="md:ml-64 pt-14 md:pt-0">
    <section class="forum-shell">
      <div v-if="article" class="forum-hero">
        <div class="forum-hero__content">
          <p class="forum-kicker">Forum Diskusi</p>
          <h1>{{ forum?.title || `Forum untuk ${article.title}` }}</h1>
          <p class="forum-summary">
            {{ forum?.summary || 'Forum ini dibentuk moderator dari komentar terpilih untuk membuka ruang diskusi yang lebih terarah.' }}
          </p>

          <div class="forum-meta">
            <span>{{ article.title }}</span>
            <span>Forum aktif</span>
            <span>{{ forumComments.length }} komentar</span>
          </div>
        </div>
      </div>

      <div class="forum-layout">
        <aside class="forum-sidebar">
          <RouterLink :to="`/articles/${articleId}`" class="back-link">Kembali ke artikel</RouterLink>
          <a href="#forum-thread">Diskusi aktif</a>
          <a v-if="sourceComments.length" href="#forum-source">Komentar sumber</a>
          <a v-if="authStore.isAuthenticated" href="#forum-compose">Tulis komentar</a>
        </aside>

        <div class="forum-main">
          <section v-if="pageNotice" class="forum-alert">
            {{ pageNotice }}
          </section>

          <section v-if="isLoadingForum" class="forum-empty">
            Memuat forum diskusi...
          </section>

          <template v-else-if="forum">
            <section id="forum-compose" class="forum-panel">
              <div class="panel-heading">
                <div>
                  <p class="forum-kicker">Partisipasi</p>
                  <h2>Tulis Komentar Forum</h2>
                </div>
                <p>Tambahkan tanggapan, pengalaman, atau dokumen pendukung ke diskusi yang sudah divalidasi moderator.</p>
              </div>

              <ForumCommentComposer
                :forum-id="forum.id"
                :loading="articleStore.isSubmitting"
                placeholder="Sampaikan pendapat Anda pada forum ini..."
                submit-label="Kirim ke Forum"
                @submit="handleForumCommentSubmit"
              />
            </section>

            <section v-if="sourceComments.length" id="forum-source" class="forum-panel">
              <div class="panel-heading">
                <div>
                  <p class="forum-kicker">Komentar Sumber</p>
                  <h2>Dasar Pembentukan Forum</h2>
                </div>
                <p>Komentar berikut dipilih moderator sebagai sumber kurasi forum ini.</p>
              </div>

              <div class="source-list">
                <article v-for="item in sourceComments" :key="item.id" class="source-item">
                  <strong>#{{ item.comment_id }}</strong>
                  <div>
                    <p>{{ item.comment?.body || 'Komentar tidak tersedia' }}</p>
                  </div>
                </article>
              </div>
            </section>

            <section id="forum-thread" class="forum-panel">
              <div class="panel-heading">
                <div>
                  <p class="forum-kicker">Thread</p>
                  <h2>Diskusi Aktif</h2>
                </div>
                <p>Semua komentar forum yang sudah tampil langsung terhubung ke topik aktif artikel ini.</p>
              </div>

              <div v-if="forumComments.length" class="comment-list">
                <ForumCommentItem
                  v-for="comment in forumComments"
                  :key="comment.id"
                  :comment="comment"
                  :forum-id="forum.id"
                  :loading="articleStore.isSubmitting"
                  @reply="handleForumCommentSubmit"
                  @delete="handleDeleteForumComment"
                />
              </div>

              <div v-else class="forum-empty">
                Belum ada komentar forum. Jadilah yang pertama memulai diskusi.
              </div>
            </section>
          </template>

          <section v-else class="forum-empty">
            {{ pageNotice || 'Forum diskusi aktif belum tersedia untuk artikel ini.' }}
          </section>
        </div>
      </div>
    </section>

    <SiteFooter />
    </div>
  </main>
</template>

<style scoped>
.forum-page { min-height: 100vh; }

.forum-shell {
  width: min(1200px, calc(100% - 48px));
  margin: 0 auto;
  padding: 28px 0 40px;
}

/* Forum hero always shows the editorial dark image – looks good in both modes */
.forum-hero {
  display: flex;
  min-height: 340px;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(31, 31, 31, 0.92), rgba(31, 31, 31, 0.55)),
    url('@/assets/img/background.jpg') center / cover;
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.4);
}

.forum-hero__content {
  max-width: 960px;
  padding: clamp(30px, 6vw, 70px);
}

.forum-kicker {
  width: fit-content;
  margin: 0 0 16px;
  border-radius: 999px;
  background: rgba(148,74,35,.12);
  color: #944a23;
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.2em;
  padding: 9px 14px;
  text-transform: uppercase;
}

/* kicker inside the hero always stays orange-on-dark */
.forum-hero .forum-kicker {
  background: rgba(255, 255, 255, 0.12);
  color: #ffb083;
}

.forum-hero h1 {
  margin: 0;
  font-size: clamp(2.3rem, 5vw, 4.6rem);
  font-weight: 950;
  line-height: 0.98;
  color: #fff8ef;
}

.forum-summary {
  max-width: 800px;
  margin: 18px 0 0;
  color: #efe7dc;
  font-size: 1.04rem;
  line-height: 1.8;
}

.forum-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.forum-meta span {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  color: #fff8ef;
  font-size: 0.84rem;
  font-weight: 900;
  padding: 9px 13px;
}

.forum-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 22px;
  margin-top: 22px;
  align-items: start;
}

.forum-sidebar,
.forum-panel,
.forum-empty,
.forum-alert {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
}

.forum-sidebar {
  position: sticky;
  top: 24px;
  display: grid;
  gap: 8px;
  padding: 12px;
}

.forum-sidebar a {
  border-radius: 8px;
  color: #0d1c2e;
  font-weight: 900;
  padding: 13px 14px;
  text-decoration: none;
  transition: background .15s;
}

.forum-sidebar a:hover,
.forum-sidebar .back-link {
  background: rgba(0,53,39,.08);
  color: #003527;
}

.forum-main {
  display: grid;
  gap: 22px;
}

.forum-panel {
  padding: clamp(24px, 4vw, 42px);
}

.panel-heading {
  display: grid;
  grid-template-columns: minmax(0, 0.76fr) minmax(280px, 0.42fr);
  gap: 28px;
  align-items: start;
  margin-bottom: 22px;
}

.panel-heading h2 {
  margin: 0;
  font-size: clamp(1.7rem, 3vw, 2.9rem);
  font-weight: 950;
  line-height: 1;
  color: #0d1c2e;
}

.panel-heading > p {
  margin: 34px 0 0;
  color: #404944;
  line-height: 1.7;
}

.source-list,
.comment-list {
  display: grid;
  gap: 14px;
}

.source-item {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8f9ff;
  padding: 16px;
}

.source-item strong { color: #944a23; }

.source-item p {
  margin: 0;
  color: #404944;
  line-height: 1.65;
}

.forum-alert,
.forum-empty {
  padding: 18px;
  color: #404944;
}

.forum-alert {
  border-color: rgba(148,74,35,.2);
  background: rgba(148,74,35,.06);
  color: #7a3519;
}

@media (max-width: 940px) {
  .forum-layout,
  .panel-heading {
    grid-template-columns: 1fr;
  }

  .panel-heading > p { margin-top: 0; }
  .forum-sidebar { position: static; }
}

@media (max-width: 560px) {
  .forum-shell { width: calc(100% - 20px); }
  .forum-hero { min-height: 300px; }
}
</style>
