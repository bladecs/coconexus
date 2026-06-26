import { ref } from 'vue';

// Module-level ref — shared across all useChatWidget() calls
const isOpen = ref(false);

export function useChatWidget() {
  function open() { isOpen.value = true; }
  function close() { isOpen.value = false; }
  function toggle() { isOpen.value = !isOpen.value; }
  return { isOpen, open, close, toggle };
}
