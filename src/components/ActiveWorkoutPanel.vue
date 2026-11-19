<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from '../composables/useI18n';
import type { PartnerTurnRecord, SegmentRecord, WorkoutSession } from '../types/hyrox';
import { formatDurationMs } from '../utils/formatTime';

const { t } = useI18n();

const props = defineProps<{
  session: WorkoutSession;
  currentSegment: SegmentRecord | null;
  nextSegment: SegmentRecord | null;
  currentTurn: PartnerTurnRecord | null;
  totalElapsedMs: number;
  currentSegmentElapsedMs: number;
  currentTurnElapsedMs: number;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  wakeLockError: string | null;
  isMuted: boolean;
}>();

const emit = defineEmits<{
  advance: [];
  switchPartner: [];
  abort: [];
  toggleMute: [];
  retryWakeLock: [];
}>();

const confirmAbortStep = ref(false);

const segmentTypeLabel = computed(() => {
  switch (props.currentSegment?.type) {
    case 'run':
      return t.value.active.segmentRun;
    case 'roxzone':
      return t.value.active.segmentRoxzone;
    case 'station':
      return t.value.active.segmentStation;
    default:
      return '';
  }
});

const progressText = computed(() => {
  const current = props.session.currentSegmentIndex + 1;
  const total = props.session.segments.length;
  return `${t.value.active.progressPrefix}${current} / ${total}${t.value.active.progressSuffix}`;
});

const isLastSegment = computed(
  () => props.session.currentSegmentIndex >= props.session.segments.length - 1,
);

const isMixedStation = computed(
  () =>
    props.session.config.division === 'mixed-doubles' &&
    props.currentSegment?.type === 'station' &&
    props.currentTurn !== null,
);

const nextPartnerName = computed(() => {
  if (!props.currentTurn) {
    return '';
  }
  const nextIndex = props.currentTurn.partnerIndex === 0 ? 1 : 0;
  return props.session.config.partnerNames[nextIndex];
});

const turnCount = computed(() => props.currentSegment?.turns?.length ?? 0);

function handleAdvance(): void {
  confirmAbortStep.value = false;
  emit('advance');
}

function handleAbortClick(): void {
  if (!confirmAbortStep.value) {
    confirmAbortStep.value = true;
    return;
  }
  confirmAbortStep.value = false;
  emit('abort');
}
</script>

<template>
  <section class="active-panel" aria-label="進行中的 Hyrox 計時器">
    <header class="status-bar">
      <div class="status-left">
        <button
          type="button"
          class="wake-badge"
          :class="{ active: props.wakeLockActive }"
          :aria-label="
            props.wakeLockActive
              ? '螢幕防休眠已啟用'
              : '螢幕防休眠未啟用，點擊重試'
          "
          @click="emit('retryWakeLock')"
        >
          <span class="dot" aria-hidden="true"></span>
          <span v-if="!props.wakeLockSupported">{{ t.active.wakeUnsupported }}</span>
          <span v-else-if="props.wakeLockActive">{{ t.active.wakeActive }}</span>
          <span v-else>{{ t.active.wakeInactive }}</span>
        </button>
        <span class="progress-pill">{{ progressText }}</span>
      </div>

      <button
        type="button"
        class="mute-btn"
        :aria-pressed="props.isMuted"
        :aria-label="props.isMuted ? t.active.soundOn : t.active.muted"
        @click="emit('toggleMute')"
      >
        {{ props.isMuted ? t.active.muted : t.active.soundOn }}
      </button>
    </header>

    <p v-if="props.wakeLockError" class="wake-error" role="status">
      {{ props.wakeLockError }}
    </p>

    <div class="total-clock-card">
      <span class="clock-label">{{ t.active.totalTime }}</span>
      <div class="total-time">{{ formatDurationMs(props.totalElapsedMs, false) }}</div>
    </div>

    <div
      v-if="props.currentSegment"
      class="current-card"
      :class="`type-${props.currentSegment.type}`"
    >
      <span class="type-tag">{{ segmentTypeLabel }}</span>
      <h1 class="segment-name">{{ props.currentSegment.name }}</h1>
      <p class="segment-spec">{{ props.currentSegment.targetSpec }}</p>

      <div class="segment-timer">
        {{ formatDurationMs(props.currentSegmentElapsedMs, true) }}
      </div>

      <div v-if="isMixedStation && props.currentTurn" class="turn-status-pill">
        <span>
          {{ t.active.currentPartner }}<strong>{{ props.currentTurn.partnerName }}</strong>
        </span>
        <span class="turn-sep">·</span>
        <span>{{ t.active.turnPrefix }}{{ formatDurationMs(props.currentTurnElapsedMs, false) }}</span>
        <span class="turn-sep">·</span>
        <span>{{ t.active.turnLabel }}{{ turnCount }}{{ t.active.turnUnit }}</span>
      </div>
    </div>

    <div class="next-preview">
      <span class="next-label">{{ t.active.nextLabel }}</span>
      <strong v-if="props.nextSegment">
        {{ props.nextSegment.name }} ({{ props.nextSegment.targetSpec }})
      </strong>
      <strong v-else>{{ t.active.lastSegmentHint }}</strong>
    </div>

    <div class="action-area">
      <button
        v-if="isMixedStation"
        type="button"
        class="handoff-btn"
        :aria-label="`${t.active.handoffPrefix}${nextPartnerName}`"
        @click="emit('switchPartner')"
      >
        <span class="handoff-main">{{ t.active.handoffPrefix }}{{ nextPartnerName }}</span>
        <span class="handoff-sub">{{ t.active.handoffSub }}</span>
      </button>

      <button
        type="button"
        class="split-btn"
        :aria-label="
          isLastSegment
            ? t.active.finishBtn
            : `${t.active.nextBtn} ${props.nextSegment?.name ?? ''}`
        "
        @click="handleAdvance"
      >
        <span class="split-btn-main">
          {{ isLastSegment ? t.active.finishBtn : t.active.nextBtn }}
        </span>
        <span v-if="props.nextSegment" class="split-btn-sub">
          {{ t.active.nextSubPrefix }}{{ props.nextSegment.name }}
        </span>
      </button>

      <div class="abort-row">
        <button
          type="button"
          class="abort-btn"
          :class="{ confirming: confirmAbortStep }"
          :aria-label="confirmAbortStep ? t.active.abortConfirmBtn : t.active.abortBtn"
          @click="handleAbortClick"
        >
          {{ confirmAbortStep ? t.active.abortConfirmBtn : t.active.abortBtn }}
        </button>

        <button
          v-if="confirmAbortStep"
          type="button"
          class="cancel-abort-btn"
          :aria-label="t.active.cancelBtn"
          @click="confirmAbortStep = false"
        >
          {{ t.active.cancelBtn }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.active-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: calc(100dvh - 2rem);
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.wake-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid #3f3f46;
  background: #18181b;
  color: #a1a1aa;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.wake-badge.active {
  border-color: rgba(34, 197, 94, 0.5);
  color: #4ade80;
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
}

.progress-pill {
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: #27272a;
  font-size: 0.78rem;
  font-weight: 600;
  color: #e4e4e7;
}

.mute-btn {
  min-height: 2.5rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1px solid #3f3f46;
  background: #18181b;
  color: #e4e4e7;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.wake-error {
  margin: 0;
  font-size: 0.78rem;
  color: #fca5a5;
}

.total-clock-card {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  background: #18181b;
  border: 1px solid #27272a;
}

.clock-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #a1a1aa;
}

.total-time {
  font-size: 1.6rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #f4f4f5;
}

.current-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 1rem 0.9rem;
  border-radius: 1rem;
  background: #18181b;
  border: 2px solid #27272a;
}

.current-card.type-run {
  border-color: #38bdf8;
}

.current-card.type-station {
  border-color: #facc15;
}

.current-card.type-roxzone {
  border-color: #a78bfa;
}

.type-tag {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #a1a1aa;
  margin-bottom: 0.3rem;
}

.segment-name {
  margin: 0;
  font-size: clamp(1.35rem, 5.5vw, 1.85rem);
  line-height: 1.2;
}

.segment-spec {
  margin: 0.3rem 0 0.75rem;
  font-size: clamp(0.9rem, 3.8vw, 1.05rem);
  font-weight: 600;
  color: #facc15;
}

.segment-timer {
  font-size: clamp(2.4rem, 11vw, 3.4rem);
  font-weight: 900;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.turn-status-pill {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.4);
  font-size: 0.85rem;
  color: #e0f2fe;
}

.turn-status-pill strong {
  color: #38bdf8;
}

.turn-sep {
  opacity: 0.5;
}

.handoff-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  width: 100%;
  min-height: 3.85rem;
  padding: 0.65rem 1rem;
  border: 2px solid #38bdf8;
  border-radius: 0.9rem;
  background: rgba(56, 189, 248, 0.16);
  color: #e0f2fe;
  cursor: pointer;
  touch-action: manipulation;
}

.handoff-btn:active {
  transform: scale(0.985);
}

.handoff-main {
  font-size: 1.15rem;
  font-weight: 800;
  color: #38bdf8;
}

.handoff-sub {
  font-size: 0.78rem;
  color: #bae6fd;
}

.next-preview {
  padding: 0.7rem 1rem;
  border-radius: 0.75rem;
  background: #18181b;
  font-size: 0.88rem;
  color: #d4d4d8;
  text-align: center;
}

.next-label {
  color: #a1a1aa;
}

.action-area {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
}

.split-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  min-height: 5rem;
  padding: 0.85rem 1rem;
  border: none;
  border-radius: 1rem;
  background: #facc15;
  color: #09090b;
  cursor: pointer;
  touch-action: manipulation;
}

.split-btn:active {
  transform: scale(0.985);
}

.split-btn-main {
  font-size: 1.35rem;
  font-weight: 900;
}

.split-btn-sub {
  font-size: 0.85rem;
  font-weight: 700;
  opacity: 0.85;
}

.abort-row {
  display: flex;
  gap: 0.5rem;
}

.abort-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #3f3f46;
  background: transparent;
  color: #a1a1aa;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.abort-btn.confirming {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

.cancel-abort-btn {
  padding: 0.75rem 1.1rem;
  border-radius: 0.75rem;
  border: 1px solid #3f3f46;
  background: #27272a;
  color: #f4f4f5;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
