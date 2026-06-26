import { ref } from 'vue';

const STORAGE_KEY = 'coconexus-theme';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {}
}

// Apply immediately on module load (singleton, runs once)
const _initial = getInitialTheme();
applyTheme(_initial);

export const isDark = ref(_initial);

export function useTheme() {
  return {
    isDark,
    toggleTheme() {
      isDark.value = !isDark.value;
      applyTheme(isDark.value);
    },
  };
}
