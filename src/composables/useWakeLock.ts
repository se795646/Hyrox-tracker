import { onUnmounted, ref } from 'vue';

/**
 * 封裝 Screen Wake Lock API，於訓練進行中防止手機自動休眠鎖屏
 * 並在頁面從背景切回前景時自動重新申請喚醒鎖
 */
export function useWakeLock() {
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const isActive = ref(false);
  const errorMessage = ref<string | null>(null);

  let sentinel: WakeLockSentinel | null = null;
  let shouldKeepAwake = false;

  const handleRelease = () => {
    isActive.value = false;
    sentinel = null;
  };

  async function acquire(): Promise<void> {
    if (!isSupported) {
      errorMessage.value = '此瀏覽器不支援螢幕防休眠 (Wake Lock API)';
      return;
    }

    if (sentinel !== null) {
      return;
    }

    try {
      const nextSentinel = await navigator.wakeLock.request('screen');
      nextSentinel.addEventListener('release', handleRelease);
      sentinel = nextSentinel;
      isActive.value = true;
      errorMessage.value = null;
    } catch (err) {
      isActive.value = false;
      errorMessage.value =
        err instanceof Error ? `無法啟用防休眠：${err.message}` : '無法啟用防休眠';
    }
  }

  async function requestWakeLock(): Promise<void> {
    shouldKeepAwake = true;
    await acquire();
  }

  async function releaseWakeLock(): Promise<void> {
    shouldKeepAwake = false;
    if (sentinel !== null) {
      sentinel.removeEventListener('release', handleRelease);
      try {
        await sentinel.release();
      } finally {
        sentinel = null;
        isActive.value = false;
      }
    }
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && shouldKeepAwake && sentinel === null) {
      void acquire();
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    void releaseWakeLock();
  });

  return {
    isSupported,
    isActive,
    errorMessage,
    requestWakeLock,
    releaseWakeLock,
  };
}
