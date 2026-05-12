<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import { resolveAssetUrl } from '@/lib/assets';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const feedback = ref('');
const profileForm = reactive({
  full_name: '',
  bio: '',
});

const avatarPreviewUrl = computed(() => resolveAssetUrl(authStore.user?.profile?.avatar_url));
const profileInitial = computed(() =>
  (authStore.user?.profile?.full_name || authStore.user?.email || 'A').trim().charAt(0).toUpperCase()
);
const displayName = computed(() => authStore.user?.profile?.full_name || authStore.user?.email || 'Admin');

async function handleProfileUpdate() {
  feedback.value = '';

  try {
    await authStore.updateProfile(profileForm);
    feedback.value = 'Profil admin berhasil diperbarui.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleAvatarUpload(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  feedback.value = '';

  try {
    await authStore.uploadAvatar(file);
    feedback.value = 'Avatar admin berhasil diperbarui.';
  } catch (error) {
    feedback.value = error.message;
  }
}

onMounted(() => {
  profileForm.full_name = authStore.user?.profile?.full_name || '';
  profileForm.bio = authStore.user?.profile?.bio || '';
});
</script>

<template>
  <main class="inner-page admin-workspace px-5 pb-12 pt-32 text-stone-100 sm:px-8 lg:px-10">
    <SiteNavbar variant="admin" />

    <section class="mx-auto max-w-[1300px]">
      <header class="admin-ops-header">
        <div>
          <p class="admin-section-label">ACCOUNT / ADMIN PROFILE</p>
          <h1>Profil Operator</h1>
        </div>
      </header>

      <p v-if="feedback" class="mt-6 rounded-lg border border-[#ff7c35]/20 bg-[#ff7c35]/10 px-5 py-4 text-sm font-medium text-[#ffd1b8]">
        {{ feedback }}
      </p>

      <section class="admin-profile-console mt-6">
        <aside class="admin-profile-card">
          <div class="admin-profile-avatar">
            <img
              v-if="avatarPreviewUrl"
              :src="avatarPreviewUrl"
              alt="Avatar admin"
            />
            <span v-else>{{ profileInitial }}</span>
          </div>
          <h2>{{ displayName }}</h2>
          <p>{{ authStore.user?.email }}</p>
          <strong>{{ authStore.user?.role || 'admin' }}</strong>
          <label class="admin-secondary-action mt-5 cursor-pointer">
            Upload Avatar
            <input
              type="file"
              class="hidden"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              @change="handleAvatarUpload"
            />
          </label>
        </aside>

        <section class="admin-profile-form">
          <div class="admin-panel-heading">
            <div>
              <p class="admin-section-label">IDENTITY RECORD</p>
              <h2>Data Profil</h2>
            </div>
          </div>

          <div class="admin-form-grid">
            <label>
              <span>Nama Lengkap</span>
              <input
                v-model="profileForm.full_name"
                type="text"
                class="w-full px-4 py-3"
                placeholder="Nama lengkap"
              />
            </label>
            <label>
              <span>Bio Admin</span>
              <textarea
                v-model="profileForm.bio"
                rows="8"
                class="w-full px-4 py-3"
                placeholder="Bio admin"
              />
            </label>
            <button type="button" class="admin-primary-action" @click="handleProfileUpdate">
              Simpan Profil
            </button>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
