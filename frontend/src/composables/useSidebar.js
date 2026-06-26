import { ref } from 'vue';

const isCollapsed = ref(false);

export function useSidebar() {
  function toggle() {
    isCollapsed.value = !isCollapsed.value;
    // Set data attribute on <html> so CSS can adjust page margins globally
    if (isCollapsed.value) {
      document.documentElement.dataset.sidebar = 'collapsed';
    } else {
      delete document.documentElement.dataset.sidebar;
    }
  }
  return { isCollapsed, toggle };
}
