<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { useChatWidget } from '@/composables/useChatWidget';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const { isOpen, open, close } = useChatWidget();
const isEnabled = ref(false);
const welcomeMessage = ref('Halo! Ada yang bisa saya bantu?');
const configLoaded = ref(false);
const loading = ref(false);
const input = ref('');
const messagesEl = ref(null);

const messages = ref([]);

async function loadConfig() {
  try {
    const res = await fetch(`${API_BASE}/chatbot/config`);
    const json = await res.json();
    if (res.ok && json.data) {
      isEnabled.value = json.data.is_enabled;
      welcomeMessage.value = json.data.welcome_message || 'Halo! Ada yang bisa saya bantu?';
    }
  } catch {
    // silent
  } finally {
    configLoaded.value = true;
  }
}

async function scrollToBottom() {
  await nextTick();
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
}

async function sendMessage(text) {
  const msg = (text ?? input.value).trim();
  if (!msg || loading.value) return;

  input.value = '';
  messages.value.push({ role: 'user', text: msg });
  await scrollToBottom();

  loading.value = true;

  const history = messages.value
    .slice(0, -1)
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, text: m.text }));

  try {
    const res = await fetch(`${API_BASE}/chatbot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan.');
    messages.value.push({
      role: 'assistant',
      text: json.message,
      articles: json.articles_used || [],
    });
  } catch (err) {
    messages.value.push({ role: 'assistant', text: `Maaf, terjadi kesalahan: ${err.message}` });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}

function askAboutArticle(title) {
  sendMessage(`Ceritakan lebih lanjut tentang "${title}"`);
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function renderText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

watch(isOpen, (val) => {
  if (val && messages.value.length === 0) {
    messages.value.push({ role: 'assistant', text: welcomeMessage.value });
  }
  if (val) scrollToBottom();
});

onMounted(loadConfig);
</script>

<template>
  <div v-if="configLoaded && isEnabled" aria-live="polite">

    <!-- Chat panel -->
    <Transition name="chat-pop">
      <div v-if="isOpen" class="chat-widget-root" role="dialog" aria-label="Asisten COCONEXUS">

        <!-- Header -->
        <header class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">
              <span class="material-symbols-outlined">smart_toy</span>
            </div>
            <div>
              <p class="chat-header-name">Asisten COCONEXUS</p>
              <p class="chat-header-sub">Berbasis Groq AI</p>
            </div>
          </div>
          <button class="chat-close-btn" aria-label="Tutup" @click="close()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <!-- Messages -->
        <div ref="messagesEl" class="chat-messages">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="chat-message"
            :class="msg.role === 'user' ? 'chat-message--user' : 'chat-message--assistant'"
          >
            <div class="chat-bubble" v-html="renderText(msg.text)" />

            <!-- Article reference buttons -->
            <div v-if="msg.articles && msg.articles.length" class="chat-refs">
              <span class="material-symbols-outlined text-xs opacity-60">auto_stories</span>
              <span class="chat-refs-label">Tanya lebih lanjut:</span>
              <button
                v-for="a in msg.articles"
                :key="a.id"
                class="chat-ref-btn"
                :disabled="loading"
                @click="askAboutArticle(a.title)"
              >
                {{ a.title }}
              </button>
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="loading" class="chat-message chat-message--assistant">
            <div class="chat-bubble chat-bubble--typing">
              <span /><span /><span />
            </div>
          </div>
        </div>

        <!-- Input area -->
        <footer class="chat-footer">
          <textarea
            v-model="input"
            rows="1"
            class="chat-input"
            placeholder="Ketik pertanyaan Anda..."
            :disabled="loading"
            @keydown="handleKeydown"
          />
          <button
            class="chat-send-btn"
            :disabled="!input.trim() || loading"
            aria-label="Kirim"
            @click="sendMessage()"
          >
            <span class="material-symbols-outlined">send</span>
          </button>
        </footer>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.chat-widget-root {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  width: min(360px, calc(100vw - 3rem));
  background: rgb(var(--color-surface-container-low));
  border: 1px solid rgb(var(--color-outline-variant) / 0.4);
  border-radius: 1.25rem;
  box-shadow: 0 12px 48px rgb(0 0 0 / 0.15);
  display: flex;
  flex-direction: column;
  max-height: min(560px, calc(100vh - 8rem));
  overflow: hidden;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-primary));
  color: rgb(var(--color-on-primary));
  flex-shrink: 0;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: rgb(var(--color-on-primary) / 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-avatar .material-symbols-outlined {
  font-size: 1.25rem;
  color: rgb(var(--color-on-primary));
}

.chat-header-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: rgb(var(--color-on-primary));
  line-height: 1.2;
}

.chat-header-sub {
  font-size: 0.75rem;
  color: rgb(var(--color-on-primary) / 0.7);
}

.chat-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgb(var(--color-on-primary) / 0.8);
  display: flex;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: color 0.15s;
}

.chat-close-btn:hover {
  color: rgb(var(--color-on-primary));
}

.chat-close-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  scroll-behavior: smooth;
}

.chat-message {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.chat-message--user {
  align-items: flex-end;
}

.chat-message--assistant {
  align-items: flex-start;
}

.chat-bubble {
  max-width: 80%;
  padding: 0.625rem 0.875rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  line-height: 1.55;
  word-break: break-word;
}

.chat-message--user .chat-bubble {
  background: rgb(var(--color-secondary));
  color: rgb(var(--color-on-secondary));
  border-bottom-right-radius: 0.25rem;
}

.chat-message--assistant .chat-bubble {
  background: rgb(var(--color-surface-container));
  color: rgb(var(--color-on-surface));
  border-bottom-left-radius: 0.25rem;
}

/* Typing indicator */
.chat-bubble--typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.75rem 1rem;
}

.chat-bubble--typing span {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: rgb(var(--color-on-surface-variant));
  animation: typing-bounce 1.2s infinite;
}

.chat-bubble--typing span:nth-child(2) { animation-delay: 0.2s; }
.chat-bubble--typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-5px); opacity: 1; }
}

/* Article ref buttons */
.chat-refs {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding-left: 0.25rem;
  max-width: 90%;
}

.chat-refs-label {
  font-size: 0.6875rem;
  color: rgb(var(--color-on-surface-variant));
  white-space: nowrap;
  align-self: center;
}

.chat-ref-btn {
  font-size: 0.6875rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  background: transparent;
  color: rgb(var(--color-secondary));
  border: 1px solid rgb(var(--color-secondary) / 0.5);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  transition: background 0.15s, color 0.15s;
  font-weight: 600;
}

.chat-ref-btn:hover:not(:disabled) {
  background: rgb(var(--color-secondary));
  color: rgb(var(--color-on-secondary));
}

.chat-ref-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Footer / Input */
.chat-footer {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgb(var(--color-outline-variant) / 0.3);
  background: rgb(var(--color-surface-container-low));
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  background: rgb(var(--color-background));
  border: 1.5px solid rgb(var(--color-outline-variant) / 0.5);
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(var(--color-on-surface));
  resize: none;
  outline: none;
  max-height: 100px;
  overflow-y: auto;
  transition: border-color 0.15s;
  field-sizing: content;
  min-height: 2.25rem;
}

.chat-input:focus {
  border-color: rgb(var(--color-secondary));
}

.chat-input::placeholder {
  color: rgb(var(--color-on-surface-variant) / 0.5);
}

.chat-input:disabled {
  opacity: 0.5;
}

.chat-send-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: rgb(var(--color-secondary));
  color: rgb(var(--color-on-secondary));
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s, transform 0.15s;
}

.chat-send-btn:hover:not(:disabled) {
  transform: scale(1.08);
}

.chat-send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.chat-send-btn .material-symbols-outlined {
  font-size: 1.125rem;
}

/* Transition */
.chat-pop-enter-active,
.chat-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chat-pop-enter-from,
.chat-pop-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
</style>
