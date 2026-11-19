import { onUnmounted, ref } from 'vue';

/**
 * 封裝 Web Audio API 提示音，於使用者點擊開始時解鎖 AudioContext（相容 iOS Safari）
 */
export function useAudioCue() {
  const isMuted = ref(false);
  let audioCtx: AudioContext | null = null;

  function ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const AudioContextCtor = window.AudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextCtor();
    }

    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }

    return audioCtx;
  }

  function playTone(frequency: number, durationSec: number, delaySec = 0): void {
    if (isMuted.value) {
      return;
    }

    const ctx = ensureContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime + delaySec;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + durationSec);
  }

  function unlockAudio(): void {
    ensureContext();
  }

  function playSplitCue(): void {
    playTone(880, 0.12);
  }

  function playHandoffCue(): void {
    playTone(659.25, 0.08);
  }

  function playFinishCue(): void {
    playTone(880, 0.12, 0);
    playTone(1174.66, 0.22, 0.14);
  }

  function toggleMute(): void {
    isMuted.value = !isMuted.value;
  }

  onUnmounted(() => {
    if (audioCtx && audioCtx.state !== 'closed') {
      void audioCtx.close();
      audioCtx = null;
    }
  });

  return {
    isMuted,
    unlockAudio,
    playSplitCue,
    playHandoffCue,
    playFinishCue,
    toggleMute,
  };
}
