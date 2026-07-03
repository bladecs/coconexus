<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import ForumCommentComposer from '@/components/comments/ForumCommentComposer.vue';
import ForumCommentItem from '@/components/comments/ForumCommentItem.vue';
import { useArticleStore } from '@/stores/articles';
import { useAuthStore } from '@/stores/auth';
import bgImage from '@/assets/img/background.jpg';

const route        = useRoute();
const articleStore = useArticleStore();
const authStore    = useAuthStore();
const pageNotice   = ref('');
const isLoading    = ref(false);

const articleId    = computed(() => Number(route.params.id));
const article      = computed(() => articleStore.currentArticle);
const forum        = computed(() => articleStore.currentForum);
const forumComments = computed(() => articleStore.forumComments);
const sourceComments = computed(() => forum.value?.source_comments || []);

async function loadForumPage() {
  pageNotice.value = '';
  if (!Number.isInteger(articleId.value) || articleId.value <= 0) {
    pageNotice.value = 'Artikel tidak valid.';
    return;
  }
  isLoading.value = true;
  try {
    await articleStore.fetchPublishedArticleDetail(articleId.value);
    try {
      await articleStore.fetchActiveForum(articleId.value);
      if (forum.value?.id) await articleStore.fetchForumComments(forum.value.id);
    } catch (err) {
      articleStore.currentForum = null;
      articleStore.forumComments = [];
      pageNotice.value = err.message || 'Forum diskusi aktif belum tersedia.';
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleForumCommentSubmit(payload) {
  if (!forum.value?.id) { pageNotice.value = 'Forum diskusi aktif belum tersedia.'; return; }
  try {
    const r = await articleStore.postForumComment(forum.value.id, payload);
    pageNotice.value = r?.message || 'Komentar forum berhasil dikirim.';
  } catch (err) { pageNotice.value = err.message; }
}

async function handleDeleteForumComment(commentId) {
  await articleStore.deleteComment(commentId, articleId.value);
  if (forum.value?.id) await articleStore.fetchForumComments(forum.value.id);
}

watch(() => route.params.id, loadForumPage);
onMounted(loadForumPage);
</script>

<template>
  <div class="min-h-screen bg-background">
    <SiteNavbar />
    <div class="md:ml-64 pt-14 md:pt-0">

      <!-- ── Hero ── -->
      <div class="relative overflow-hidden min-h-[280px] sm:min-h-[320px] flex items-end">
        <!-- Background image with overlay -->
        <div
          class="absolute inset-0 bg-cover bg-center"
          :style="`background-image: url('${bgImage}')`"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <!-- Hero content -->
        <div class="relative z-10 w-full px-4 sm:px-8 pb-8 pt-12">
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-xs text-white/60 font-semibold mb-4">
            <RouterLink to="/" class="hover:text-white/90 transition-colors">Beranda</RouterLink>
            <span class="material-symbols-outlined" style="font-size:13px">chevron_right</span>
            <RouterLink to="/forum" class="hover:text-white/90 transition-colors">Forum</RouterLink>
            <span class="material-symbols-outlined" style="font-size:13px">chevron_right</span>
            <span class="text-white/80">Diskusi</span>
          </div>

          <!-- Kicker -->
          <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold text-white/90 uppercase tracking-widest mb-4">
            <span class="material-symbols-outlined" style="font-size:13px;font-variation-settings:'FILL' 1">forum</span>
            Forum Diskusi
          </div>

          <h1 v-if="article" class="font-display text-2xl sm:text-4xl font-black text-white leading-tight mb-3 max-w-3xl">
            {{ forum?.title || `Forum: ${article.title}` }}
          </h1>
          <p v-if="forum?.summary" class="text-sm sm:text-base text-white/75 max-w-2xl leading-relaxed mb-5">
            {{ forum.summary }}
          </p>

          <!-- Meta pills -->
          <div v-if="article" class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white/90">
              <span class="material-symbols-outlined" style="font-size:12px">article</span>
              {{ article.title?.slice(0, 50) }}{{ article.title?.length > 50 ? '…' : '' }}
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-xs font-bold text-emerald-200">
              <span class="material-symbols-outlined" style="font-size:12px;font-variation-settings:'FILL' 1">verified</span>
              Forum Aktif
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white/90">
              <span class="material-symbols-outlined" style="font-size:12px">chat</span>
              {{ forumComments.length }} komentar
            </span>
          </div>
        </div>
      </div>

      <!-- ── Body ── -->
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex flex-col lg:flex-row gap-6 items-start">

          <!-- ── Sidebar ── -->
          <aside class="lg:w-56 flex-shrink-0 lg:sticky lg:top-6">
            <nav class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 space-y-1">
              <RouterLink
                :to="`/articles/${articleId}`"
                class="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-primary/8 hover:text-primary transition-colors"
              >
                <span class="material-symbols-outlined" style="font-size:17px">arrow_back</span>
                Kembali ke Artikel
              </RouterLink>

              <div class="h-px bg-outline-variant/30 mx-2 my-1" />

              <a
                href="#forum-thread"
                class="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span class="material-symbols-outlined" style="font-size:17px">chat</span>
                Diskusi Aktif
              </a>
              <a
                v-if="sourceComments.length"
                href="#forum-source"
                class="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span class="material-symbols-outlined" style="font-size:17px">bookmark</span>
                Komentar Sumber
              </a>
              <a
                v-if="authStore.isAuthenticated"
                href="#forum-compose"
                class="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span class="material-symbols-outlined" style="font-size:17px">edit</span>
                Tulis Komentar
              </a>

              <!-- Stats card -->
              <div v-if="forum" class="mt-3 pt-3 border-t border-outline-variant/30 px-3 space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-on-surface-variant">Total komentar</span>
                  <span class="font-bold text-on-surface">{{ forumComments.length }}</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-on-surface-variant">Sumber kurasi</span>
                  <span class="font-bold text-on-surface">{{ sourceComments.length }}</span>
                </div>
              </div>
            </nav>
          </aside>

          <!-- ── Main content ── -->
          <div class="flex-1 min-w-0 space-y-6">

            <!-- Notice banner -->
            <div
              v-if="pageNotice"
              class="flex items-start gap-3 px-4 py-3 rounded-2xl border border-secondary/20 bg-secondary/8 text-sm text-secondary"
            >
              <span class="material-symbols-outlined flex-shrink-0 mt-0.5" style="font-size:18px">info</span>
              {{ pageNotice }}
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
              <div class="w-10 h-10 rounded-full border-4 border-outline-variant border-t-primary animate-spin" />
              <p class="text-sm">Memuat forum diskusi…</p>
            </div>

            <template v-else-if="forum">

              <!-- Compose -->
              <section id="forum-compose" class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden">
                <div class="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/30 bg-surface-container/60">
                  <span class="material-symbols-outlined text-primary" style="font-size:20px;font-variation-settings:'FILL' 1">edit_note</span>
                  <div>
                    <h2 class="font-display text-base font-bold text-on-surface">Tulis Komentar</h2>
                    <p class="text-xs text-on-surface-variant">Bagikan pendapat atau pengalaman Anda di forum ini</p>
                  </div>
                </div>
                <div class="p-5">
                  <ForumCommentComposer
                    :forum-id="forum.id"
                    :loading="articleStore.isSubmitting"
                    placeholder="Sampaikan pendapat Anda pada forum ini…"
                    submit-label="Kirim ke Forum"
                    @submit="handleForumCommentSubmit"
                  />
                </div>
              </section>

              <!-- Source comments -->
              <section v-if="sourceComments.length" id="forum-source" class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden">
                <div class="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/30 bg-surface-container/60">
                  <span class="material-symbols-outlined text-secondary" style="font-size:20px;font-variation-settings:'FILL' 1">bookmark</span>
                  <div>
                    <h2 class="font-display text-base font-bold text-on-surface">Dasar Pembentukan Forum</h2>
                    <p class="text-xs text-on-surface-variant">Komentar yang dipilih moderator sebagai sumber kurasi</p>
                  </div>
                </div>
                <div class="p-5 space-y-3">
                  <div
                    v-for="item in sourceComments"
                    :key="item.id"
                    class="flex gap-4 p-4 rounded-xl border border-secondary/15 bg-secondary/5"
                  >
                    <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-secondary/15">
                      <span class="material-symbols-outlined text-secondary" style="font-size:15px;font-variation-settings:'FILL' 1">format_quote</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold text-secondary mb-1">#{{ item.comment_id }}</p>
                      <p class="text-sm text-on-surface leading-relaxed">{{ item.comment?.body || 'Komentar tidak tersedia' }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Thread -->
              <section id="forum-thread" class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden">
                <div class="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 bg-surface-container/60">
                  <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary" style="font-size:20px;font-variation-settings:'FILL' 1">chat</span>
                    <div>
                      <h2 class="font-display text-base font-bold text-on-surface">Diskusi Aktif</h2>
                      <p class="text-xs text-on-surface-variant">{{ forumComments.length }} komentar dalam forum ini</p>
                    </div>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    <span class="material-symbols-outlined" style="font-size:11px;font-variation-settings:'FILL' 1">circle</span>
                    Live
                  </span>
                </div>

                <div v-if="forumComments.length" class="p-5 space-y-4">
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

                <div v-else class="flex flex-col items-center justify-center py-16 gap-4 text-on-surface-variant">
                  <span class="material-symbols-outlined text-5xl text-outline-variant">chat_bubble_outline</span>
                  <p class="text-sm font-medium">Belum ada komentar. Jadilah yang pertama memulai diskusi!</p>
                  <a href="#forum-compose" class="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                    Tulis komentar
                    <span class="material-symbols-outlined" style="font-size:14px">arrow_downward</span>
                  </a>
                </div>
              </section>

            </template>

            <!-- No forum state -->
            <div v-else-if="!isLoading" class="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
              <span class="material-symbols-outlined text-6xl text-outline-variant">forum</span>
              <p class="text-sm font-medium text-center max-w-xs">
                {{ pageNotice || 'Forum diskusi aktif belum tersedia untuk artikel ini.' }}
              </p>
              <RouterLink
                :to="`/articles/${articleId}`"
                class="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                <span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>
                Kembali ke artikel
              </RouterLink>
            </div>

          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  </div>
</template>
