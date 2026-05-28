import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/lib/api';
import {
  getStoredToken,
  getStoredUser,
  removeStoredToken,
  removeStoredUser,
  setStoredToken,
  setStoredUser,
} from '@/lib/token';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getStoredToken());
  const user = ref(getStoredUser());
  const isLoading = ref(false);
  const authError = ref(null);

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isPengelola = computed(() => user.value?.role === 'pengelola');

  function setSession(sessionToken, sessionUser) {
    token.value = sessionToken;
    user.value = sessionUser;

    setStoredToken(sessionToken);
    setStoredUser(sessionUser);
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    authError.value = null;

    removeStoredToken();
    removeStoredUser();
  }

  async function login(credentials) {
    isLoading.value = true;
    authError.value = null;

    try {
      const { data } = await api.post('/auth/login', credentials);
      setSession(data.data.token, data.data.user);
      return data;
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(payload) {
    isLoading.value = true;
    authError.value = null;

    try {
      const { data } = await api.post('/auth/register', payload);
      return data;
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateProfile(payload) {
    isLoading.value = true;
    authError.value = null;

    try {
      const { data } = await api.put('/users/me/profile', payload);
      user.value = data.data.user;
      setStoredUser(data.data.user);
      return data;
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function uploadAvatar(file) {
    isLoading.value = true;
    authError.value = null;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/uploads/avatars/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      user.value = data.data.user;
      setStoredUser(data.data.user);
      return data;
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  function hydrate() {
    token.value = getStoredToken();
    user.value = getStoredUser();
  }

  function logout() {
    clearSession();
  }

  return {
    token,
    user,
    isLoading,
    authError,
    isAuthenticated,
    isAdmin,
    isPengelola,
    login,
    register,
    updateProfile,
    uploadAvatar,
    hydrate,
    logout,
    setSession,
    clearSession,
  };
});
