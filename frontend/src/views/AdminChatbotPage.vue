<script setup>
import { onMounted, ref } from 'vue';
import SiteNavbar from '@/components/layout/SiteNavbar.vue';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const loading = ref(true);
const saving = ref(false);
const testing = ref(false);
const feedback = ref({ text: '', type: '' });

const form = ref({
  api_key: '',
  api_key_masked: '',
  model: 'llama-3.3-70b-versatile',
  system_prompt: '',
  temperature: 0.7,
  max_tokens: 1024,
  max_context_articles: 3,
  is_enabled: false,
  welcome_message: '',
});

const MODEL_OPTIONS = [
  { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B Versatile (Recommended)' },
  { value: 'llama-3.1-8b-instant', label: 'LLaMA 3.1 8B Instant (Cepat & Hemat)' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Konteks Panjang)' },
  { value: 'gemma2-9b-it', label: 'Gemma 2 9B (Google, Ringan)' },
];

const showApiKey = ref(false);
const apiKeyInput = ref('');
const apiKeyChanged = ref(false);

function showFeedback(text, type = 'success') {
  feedback.value = { text, type };
  setTimeout(() => { feedback.value.text = ''; }, 5000);
}

async function authFetch(url, options = {}) {
  const token = localStorage.getItem('coconexus_access_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

async function loadSettings() {
  loading.value = true;
  try {
    const res = await authFetch(`${API_BASE}/admin/chatbot/settings`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    const data = json.data;
    form.value.api_key_masked = data.api_key_masked || '';
    form.value.model = data.model || 'gemini-2.0-flash';
    form.value.system_prompt = data.system_prompt || '';
    form.value.temperature = Number(data.temperature) || 0.7;
    form.value.max_tokens = Number(data.max_tokens) || 1024;
    form.value.max_context_articles = Number(data.max_context_articles) || 3;
    form.value.is_enabled = Boolean(data.is_enabled);
    form.value.welcome_message = data.welcome_message || '';
  } catch (err) {
    showFeedback(err.message || 'Gagal memuat pengaturan.', 'error');
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  saving.value = true;
  try {
    const payload = {
      model: form.value.model,
      system_prompt: form.value.system_prompt,
      temperature: form.value.temperature,
      max_tokens: form.value.max_tokens,
      max_context_articles: form.value.max_context_articles,
      is_enabled: form.value.is_enabled,
      welcome_message: form.value.welcome_message,
    };
    if (apiKeyChanged.value || !form.value.api_key_masked) {
      payload.api_key = apiKeyInput.value;
    }
    const res = await authFetch(`${API_BASE}/admin/chatbot/settings`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    apiKeyChanged.value = false;
    apiKeyInput.value = '';
    showFeedback('Pengaturan chatbot berhasil disimpan.');
    await loadSettings();
  } catch (err) {
    showFeedback(err.message || 'Gagal menyimpan pengaturan.', 'error');
  } finally {
    saving.value = false;
  }
}

async function testConnection() {
  testing.value = true;
  try {
    const res = await authFetch(`${API_BASE}/admin/chatbot/test`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    showFeedback(`Koneksi berhasil! Respons: "${json.response}"`);
  } catch (err) {
    showFeedback(err.message || 'Koneksi gagal.', 'error');
  } finally {
    testing.value = false;
  }
}

const DEFAULT_SYSTEM_PROMPT = `Kamu adalah asisten Knowledge Management System COCONEXUS, platform pengetahuan pengolahan limbah kelapa. Bantu pengguna dengan informasi akurat seputar pengolahan limbah kelapa berdasarkan artikel yang tersedia. Jawab dalam Bahasa Indonesia yang jelas dan ramah. Jika informasi tidak tersedia di basis pengetahuan, katakan dengan jujur.`;

onMounted(loadSettings);
</script>

<template>
  <SiteNavbar variant="admin" />
  <main class="inner-page px-5 pb-12 pt-32 text-on-surface sm:px-8 lg:px-10">
    <section class="mx-auto max-w-4xl">

      <!-- Header -->
      <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="admin-section-label">AI ASSISTANT</p>
          <h1 class="mt-2 text-4xl font-black text-on-surface">Chatbot AI (Groq)</h1>
          <p class="mt-2 text-sm text-on-surface-variant">
            Konfigurasi asisten AI yang tersambung dengan basis pengetahuan artikel COCONEXUS.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Enable / Disable toggle -->
          <button
            type="button"
            class="chatbot-toggle-btn"
            :class="form.is_enabled ? 'chatbot-toggle-btn--on' : 'chatbot-toggle-btn--off'"
            @click="form.is_enabled = !form.is_enabled"
          >
            <span class="material-symbols-outlined text-base leading-none">
              {{ form.is_enabled ? 'smart_toy' : 'smart_toy' }}
            </span>
            {{ form.is_enabled ? 'Chatbot Aktif' : 'Chatbot Nonaktif' }}
          </button>
        </div>
      </div>

      <!-- Feedback -->
      <div
        v-if="feedback.text"
        class="mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium"
        :class="feedback.type === 'error'
          ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
          : 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300'"
      >
        <span class="material-symbols-outlined text-base">
          {{ feedback.type === 'error' ? 'error' : 'check_circle' }}
        </span>
        {{ feedback.text }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant border-t-secondary" />
      </div>

      <form v-else @submit.prevent="saveSettings" class="flex flex-col gap-6">

        <!-- API Key -->
        <div class="chatbot-panel">
          <div class="chatbot-panel-header">
            <span class="material-symbols-outlined">key</span>
            <h2>API Key Gemini</h2>
          </div>
          <div class="chatbot-panel-body">
            <p class="mb-4 text-sm text-on-surface-variant">
              Dapatkan API key gratis di
              <a href="https://console.groq.com/keys" target="_blank" class="text-secondary underline">
                Groq Console
              </a>.
              API key disimpan terenkripsi di server.
            </p>

            <div class="flex gap-3">
              <div class="relative flex-1">
                <input
                  v-if="apiKeyChanged || !form.api_key_masked"
                  v-model="apiKeyInput"
                  :type="showApiKey ? 'text' : 'password'"
                  placeholder="Masukkan API key baru..."
                  class="chatbot-input w-full pr-10"
                  autocomplete="off"
                />
                <div v-else class="chatbot-input flex items-center gap-2 text-on-surface-variant">
                  <span class="material-symbols-outlined text-base">lock</span>
                  {{ form.api_key_masked }}
                </div>

                <button
                  v-if="apiKeyChanged || !form.api_key_masked"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  @click="showApiKey = !showApiKey"
                >
                  <span class="material-symbols-outlined text-base leading-none">
                    {{ showApiKey ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>

              <button
                type="button"
                class="chatbot-action-btn"
                @click="apiKeyChanged = true; apiKeyInput = ''"
              >
                {{ apiKeyChanged ? 'Batal' : 'Ganti Key' }}
              </button>

              <button
                type="button"
                class="chatbot-action-btn chatbot-action-btn--test"
                :disabled="testing"
                @click="testConnection"
              >
                <span v-if="testing" class="mr-1 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span class="material-symbols-outlined text-base leading-none" v-else>wifi</span>
                Test
              </button>
            </div>
          </div>
        </div>

        <!-- Model & Parameters -->
        <div class="chatbot-panel">
          <div class="chatbot-panel-header">
            <span class="material-symbols-outlined">tune</span>
            <h2>Model & Parameter</h2>
          </div>
          <div class="chatbot-panel-body grid gap-5 sm:grid-cols-2">
            <!-- Model -->
            <div class="sm:col-span-2">
              <label class="chatbot-label">Model Groq</label>
              <select v-model="form.model" class="chatbot-input w-full">
                <option v-for="opt in MODEL_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Temperature -->
            <div>
              <label class="chatbot-label">
                Temperature
                <span class="ml-1 font-bold text-secondary">{{ form.temperature }}</span>
              </label>
              <input
                v-model.number="form.temperature"
                type="range"
                min="0" max="1" step="0.05"
                class="w-full accent-secondary"
              />
              <div class="mt-1 flex justify-between text-xs text-on-surface-variant">
                <span>Deterministik (0)</span>
                <span>Kreatif (1)</span>
              </div>
            </div>

            <!-- Max Tokens -->
            <div>
              <label class="chatbot-label">Panjang Respons Maks (token)</label>
              <input
                v-model.number="form.max_tokens"
                type="number"
                min="256" max="8192" step="256"
                class="chatbot-input w-full"
              />
              <p class="mt-1 text-xs text-on-surface-variant">512 – 2048 cocok untuk percakapan.</p>
            </div>

            <!-- Max Context Articles -->
            <div>
              <label class="chatbot-label">
                Artikel Konteks Maks
                <span class="ml-1 font-bold text-secondary">{{ form.max_context_articles }}</span>
              </label>
              <input
                v-model.number="form.max_context_articles"
                type="range"
                min="0" max="8" step="1"
                class="w-full accent-secondary"
              />
              <p class="mt-1 text-xs text-on-surface-variant">
                Jumlah artikel relevan yang dikirim sebagai konteks ke Gemini per pesan.
              </p>
            </div>
          </div>
        </div>

        <!-- System Prompt -->
        <div class="chatbot-panel">
          <div class="chatbot-panel-header">
            <span class="material-symbols-outlined">edit_note</span>
            <h2>Instruksi Sistem (System Prompt)</h2>
          </div>
          <div class="chatbot-panel-body">
            <p class="mb-3 text-sm text-on-surface-variant">
              Instruksi yang menentukan perilaku dan kepribadian chatbot. Artikel relevan akan ditambahkan
              secara otomatis setelah prompt ini.
            </p>
            <textarea
              v-model="form.system_prompt"
              rows="6"
              class="chatbot-input w-full resize-y font-mono text-sm"
              :placeholder="DEFAULT_SYSTEM_PROMPT"
            />
            <button
              type="button"
              class="mt-2 text-xs text-secondary hover:underline"
              @click="form.system_prompt = DEFAULT_SYSTEM_PROMPT"
            >
              Gunakan prompt default
            </button>
          </div>
        </div>

        <!-- Welcome Message -->
        <div class="chatbot-panel">
          <div class="chatbot-panel-header">
            <span class="material-symbols-outlined">waving_hand</span>
            <h2>Pesan Sambutan</h2>
          </div>
          <div class="chatbot-panel-body">
            <label class="chatbot-label">Pesan yang muncul saat widget dibuka</label>
            <textarea
              v-model="form.welcome_message"
              rows="3"
              class="chatbot-input w-full"
              placeholder="Halo! Ada yang bisa saya bantu seputar pengolahan limbah kelapa?"
            />
          </div>
        </div>

        <!-- Save -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <div
            v-if="!form.is_enabled"
            class="mr-auto flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300"
          >
            <span class="material-symbols-outlined text-base">warning</span>
            Chatbot nonaktif — widget tidak akan muncul ke pengguna.
          </div>

          <button
            type="submit"
            class="chatbot-save-btn"
            :disabled="saving"
          >
            <span v-if="saving" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span class="material-symbols-outlined text-base leading-none" v-else>save</span>
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.chatbot-panel {
  background: var(--inner-panel);
  border: 1px solid var(--inner-border);
  border-radius: 1rem;
  overflow: hidden;
}

.chatbot-panel-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--inner-border);
  background: rgb(var(--color-surface-container) / 0.5);
}

.chatbot-panel-header .material-symbols-outlined {
  font-size: 1.25rem;
  color: rgb(var(--color-secondary));
}

.chatbot-panel-header h2 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--inner-text);
}

.chatbot-panel-body {
  padding: 1.5rem;
}

.chatbot-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--inner-muted);
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chatbot-input {
  background: rgb(var(--color-background));
  border: 1.5px solid var(--inner-border);
  border-radius: 0.625rem;
  padding: 0.625rem 0.875rem;
  color: var(--inner-text);
  font-size: 0.9375rem;
  transition: border-color 0.15s;
  outline: none;
}

.chatbot-input:focus {
  border-color: rgb(var(--color-secondary));
}

.chatbot-input::placeholder {
  color: rgb(var(--color-on-surface-variant) / 0.5);
}

.chatbot-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--inner-border);
  background: transparent;
  color: var(--inner-text);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}

.chatbot-action-btn:hover {
  background: rgb(var(--color-surface-container));
}

.chatbot-action-btn--test {
  border-color: rgb(var(--color-secondary) / 0.5);
  color: rgb(var(--color-secondary));
}

.chatbot-action-btn--test:hover {
  background: rgb(var(--color-secondary) / 0.08);
}

.chatbot-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chatbot-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.125rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.chatbot-toggle-btn--on {
  background: rgb(var(--color-primary));
  color: rgb(var(--color-on-primary));
  border-color: rgb(var(--color-primary));
}

.chatbot-toggle-btn--off {
  background: transparent;
  color: var(--inner-muted);
  border-color: var(--inner-border);
}

.chatbot-save-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  border-radius: 0.75rem;
  background: rgb(var(--color-secondary));
  color: rgb(var(--color-on-secondary));
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}

.chatbot-save-btn:hover {
  opacity: 0.9;
}

.chatbot-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
