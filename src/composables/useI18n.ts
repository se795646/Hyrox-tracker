import { computed, ref } from 'vue';
import { messages, type Locale, type Messages } from '../locales/messages';

const LOCALE_STORAGE_KEY = 'hyrox-tracker:locale:v1';

function detectInitialLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'zh-TW' || saved === 'en') {
      return saved;
    }
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
  }
  return 'zh-TW';
}

const currentLocale = ref<Locale>(detectInitialLocale());

export function useI18n() {
  const t = computed<Messages>(() => messages[currentLocale.value]);

  function setLocale(next: Locale): void {
    currentLocale.value = next;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next === 'zh-TW' ? 'zh-Hant' : 'en';
    }
  }

  function toggleLocale(): void {
    setLocale(currentLocale.value === 'zh-TW' ? 'en' : 'zh-TW');
  }

  return {
    locale: currentLocale,
    t,
    setLocale,
    toggleLocale,
  };
}
