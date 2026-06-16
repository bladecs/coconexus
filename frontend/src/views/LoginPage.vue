<script setup>
import { onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAdminStore } from '@/stores/admin';
import backgroundImage from '@/assets/img/background.jpg';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();

const form = reactive({
  email: '',
  password: '',
});

const feedback = ref('');
const isReady = ref(false);

onMounted(() => {
  requestAnimationFrame(() => {
    isReady.value = true;
  });
});

async function handleSubmit() {
  feedback.value = '';

  try {
    await authStore.login(form);
    // Preload admin stats so dashboard shows immediately after redirect
    if (authStore.isAdmin) {
      console.log('[login] preloading admin stats before redirect');
      try {
        await adminStore.fetchDashboardStats();
        console.log('[login] admin stats preloaded', adminStore.dashboardStats);
      } catch (err) {
        console.warn('[login] failed to preload admin stats:', err);
      }
    }
    const redirectTarget =
      typeof route.query.redirect === 'string'
        ? route.query.redirect
        : authStore.isAdmin
          ? '/admin'
          : '/';

    router.push(redirectTarget);
  } catch (error) {
    feedback.value = error.message;
  }
}
</script>

<template>
  <main
    class="relative isolate min-h-screen overflow-hidden bg-[#f3ede7] bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <div class="absolute inset-0">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_30%),linear-gradient(135deg,_rgba(2,21,142,0.82),_rgba(170,102,23,0.72))]" />
      <div class="absolute -left-24 top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div class="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-200/10 blur-3xl" />
    </div>

    <div class="relative z-10 grid min-h-screen lg:grid-cols-5">
      <section
        class="auth-hero flex items-center px-6 py-14 text-white lg:col-span-3 lg:px-12 xl:px-20"
        :class="{ 'is-ready': isReady }"
      >
        <div class="max-w-2xl">
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-white/70">
            Welcome Back
          </p>
          <h1 class="mt-5 text-4xl font-bold leading-tight md:text-5xl">
            Masuk kembali ke COCONEXUS dan lanjutkan aktivitas Anda bersama komunitas pembelajaran yang aktif.
          </h1>
          <p class="mt-6 max-w-xl text-base leading-8 text-white/80 md:text-lg">
            Baca artikel terbaru, ikuti diskusi komunitas, dan lanjutkan pengalaman belajar kolaboratif dengan
            tampilan yang lebih bersih dan nyaman digunakan.
          </p>

          <div class="mt-10 grid gap-4 text-sm text-white/80 sm:grid-cols-2">
            <div class="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p class="font-semibold text-white">Akses cepat</p>
              <p class="mt-2 leading-7">
                Setelah login, Anda bisa langsung kembali ke halaman yang relevan dan melanjutkan aktivitas.
              </p>
            </div>
            <div class="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p class="font-semibold text-white">Aman dan konsisten</p>
              <p class="mt-2 leading-7">
                Token autentikasi tetap memakai store yang sama, jadi perubahan ini hanya memperbarui tampilan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="flex items-center px-4 py-8 sm:px-6 lg:col-span-2 lg:px-10 xl:px-12">
        <div
          class="auth-card w-full rounded-[2rem] bg-white p-6 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:p-8 xl:p-10"
          :class="{ 'is-ready': isReady }"
        >
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
          <p class="mt-3 text-base leading-7 text-slate-500">
            Gunakan akun yang sudah terdaftar untuk melanjutkan aktivitas Anda di COCONEXUS.
          </p>

          <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
            <div class="auth-item" :class="{ 'is-ready': isReady }" style="--delay: 0.18s;">
              <label class="mb-2 block text-sm font-semibold text-slate-800" for="email">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1f3bb3] focus:bg-white focus:ring-4 focus:ring-[#1f3bb3]/10"
                placeholder="nama@email.com"
              />
            </div>

            <div class="auth-item" :class="{ 'is-ready': isReady }" style="--delay: 0.26s;">
              <label class="mb-2 block text-sm font-semibold text-slate-800" for="password">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1f3bb3] focus:bg-white focus:ring-4 focus:ring-[#1f3bb3]/10"
                placeholder="Masukkan password"
              />
            </div>

            <p
              v-if="feedback"
              class="auth-item rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              :class="{ 'is-ready': isReady }"
              style="--delay: 0.34s;"
            >
              {{ feedback }}
            </p>

            <button
              type="submit"
              :disabled="authStore.isLoading"
              class="auth-item w-full rounded-full bg-[#1f3bb3] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#18339d] disabled:cursor-not-allowed disabled:opacity-60"
              :class="{ 'is-ready': isReady }"
              style="--delay: 0.38s;"
            >
              {{ authStore.isLoading ? 'Memproses...' : 'Login' }}
            </button>

            <div
              class="auth-item flex items-center gap-4 pt-2"
              :class="{ 'is-ready': isReady }"
              style="--delay: 0.44s;"
            >
              <span class="h-px flex-1 bg-slate-200" />
              <span class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Akun baru</span>
              <span class="h-px flex-1 bg-slate-200" />
            </div>

            <p
              class="auth-item text-center text-sm text-slate-500"
              :class="{ 'is-ready': isReady }"
              style="--delay: 0.5s;"
            >
              Belum punya akun?
              <RouterLink to="/register" class="font-semibold text-slate-900 transition hover:text-[#1f3bb3]">
                Sign up di sini
              </RouterLink>
            </p>
          </form>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-hero {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s ease,
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.auth-card {
  opacity: 0;
  transform: translateX(36px) scale(0.98);
  transition:
    opacity 0.75s ease,
    transform 0.75s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.45s ease;
}

.auth-item {
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity 0.55s ease,
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--delay, 0s);
}

.is-ready {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .auth-hero,
  .auth-card,
  .auth-item {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
