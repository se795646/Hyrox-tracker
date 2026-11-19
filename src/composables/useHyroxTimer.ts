import { computed, onUnmounted, ref } from 'vue';
import { buildHyroxSegments } from '../data/hyroxTemplates';
import type { HyroxConfig, PartnerTurnRecord, SegmentRecord, WorkoutSession } from '../types/hyrox';
import { useAudioCue } from './useAudioCue';
import { useI18n } from './useI18n';
import { useWakeLock } from './useWakeLock';

const ACTIVE_SESSION_KEY = 'hyrox-tracker:active-session:v1';
const HISTORY_KEY = 'hyrox-tracker:history:v1';

function loadStoredSession(): WorkoutSession | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as WorkoutSession;
  } catch {
    return null;
  }
}

function loadHistory(): WorkoutSession[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as WorkoutSession[];
  } catch {
    return [];
  }
}

function initSegmentTurnIfNeeded(
  segment: SegmentRecord | undefined,
  config: HyroxConfig,
  now: number,
  partnerIndex: 0 | 1 = 0,
): void {
  if (!segment || config.division !== 'mixed-doubles' || segment.type !== 'station') {
    return;
  }
  segment.turns = [
    {
      partnerIndex,
      partnerName: config.partnerNames[partnerIndex],
      startedAt: now,
      endedAt: null,
      durationMs: null,
    },
  ];
}

function closeActiveTurn(segment: SegmentRecord | undefined, now: number): void {
  if (!segment?.turns?.length) {
    return;
  }
  const activeTurn = segment.turns[segment.turns.length - 1];
  if (activeTurn && activeTurn.endedAt === null) {
    activeTurn.endedAt = now;
    activeTurn.durationMs = Math.max(0, now - activeTurn.startedAt);
  }
}

export function useHyroxTimer() {
  const wakeLock = useWakeLock();
  const audioCue = useAudioCue();
  const { locale } = useI18n();

  const session = ref<WorkoutSession | null>(loadStoredSession());
  const history = ref<WorkoutSession[]>(loadHistory());
  const nowTimestamp = ref<number>(Date.now());

  let tickTimer: number | null = null;

  function startTicker(): void {
    if (tickTimer !== null || typeof window === 'undefined') {
      return;
    }
    nowTimestamp.value = Date.now();
    tickTimer = window.setInterval(() => {
      nowTimestamp.value = Date.now();
    }, 100);
  }

  function stopTicker(): void {
    if (tickTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function persistActiveSession(next: WorkoutSession | null): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    if (next === null) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(next));
    }
  }

  function saveToHistory(completedSession: WorkoutSession): void {
    const updated = [completedSession, ...history.value].slice(0, 30);
    history.value = updated;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }
  }

  if (session.value?.status === 'running') {
    startTicker();
    void wakeLock.requestWakeLock();
  }

  const currentSegment = computed<SegmentRecord | null>(() => {
    if (!session.value) {
      return null;
    }
    return session.value.segments[session.value.currentSegmentIndex] ?? null;
  });

  const nextSegment = computed<SegmentRecord | null>(() => {
    if (!session.value) {
      return null;
    }
    return session.value.segments[session.value.currentSegmentIndex + 1] ?? null;
  });

  const currentTurn = computed<PartnerTurnRecord | null>(() => {
    const turns = currentSegment.value?.turns;
    if (!turns || turns.length === 0) {
      return null;
    }
    return turns[turns.length - 1] ?? null;
  });

  const totalElapsedMs = computed<number>(() => {
    if (!session.value || session.value.startedAt === null) {
      return 0;
    }
    const end = session.value.endedAt ?? nowTimestamp.value;
    return Math.max(0, end - session.value.startedAt);
  });

  const currentSegmentElapsedMs = computed<number>(() => {
    const seg = currentSegment.value;
    if (!seg || seg.startedAt === null) {
      return 0;
    }
    const end = seg.endedAt ?? nowTimestamp.value;
    return Math.max(0, end - seg.startedAt);
  });

  const currentTurnElapsedMs = computed<number>(() => {
    const turn = currentTurn.value;
    if (!turn) {
      return 0;
    }
    const end = turn.endedAt ?? nowTimestamp.value;
    return Math.max(0, end - turn.startedAt);
  });

  const completedSegmentsCount = computed<number>(() => {
    if (!session.value) {
      return 0;
    }
    return session.value.segments.filter((seg) => seg.endedAt !== null).length;
  });

  async function startWorkout(config: HyroxConfig): Promise<void> {
    audioCue.unlockAudio();

    const now = Date.now();
    const segments = buildHyroxSegments(config, locale.value);
    if (segments[0]) {
      segments[0].startedAt = now;
      initSegmentTurnIfNeeded(segments[0], config, now, 0);
    }

    const nextSession: WorkoutSession = {
      id: `hyrox-${now}`,
      config,
      status: 'running',
      startedAt: now,
      endedAt: null,
      currentSegmentIndex: 0,
      segments,
    };

    session.value = nextSession;
    persistActiveSession(nextSession);
    startTicker();
    audioCue.playSplitCue();
    await wakeLock.requestWakeLock();
  }

  function switchPartner(): void {
    const current = session.value;
    const seg = currentSegment.value;
    if (
      !current ||
      current.status !== 'running' ||
      current.config.division !== 'mixed-doubles' ||
      !seg ||
      seg.type !== 'station'
    ) {
      return;
    }

    const now = Date.now();
    const turns = seg.turns ?? [];
    const lastTurn = turns[turns.length - 1];
    closeActiveTurn(seg, now);

    const nextPartnerIndex: 0 | 1 = lastTurn?.partnerIndex === 0 ? 1 : 0;
    turns.push({
      partnerIndex: nextPartnerIndex,
      partnerName: current.config.partnerNames[nextPartnerIndex],
      startedAt: now,
      endedAt: null,
      durationMs: null,
    });
    seg.turns = turns;

    persistActiveSession(current);
    audioCue.playHandoffCue();
  }

  async function advanceSegment(): Promise<void> {
    const current = session.value;
    if (!current || current.status !== 'running') {
      return;
    }

    const now = Date.now();
    const idx = current.currentSegmentIndex;
    const activeSeg = current.segments[idx];

    if (activeSeg && activeSeg.startedAt !== null) {
      closeActiveTurn(activeSeg, now);
      activeSeg.endedAt = now;
      activeSeg.durationMs = Math.max(0, now - activeSeg.startedAt);
    }

    const nextIdx = idx + 1;
    const hasNext = nextIdx < current.segments.length;

    if (hasNext) {
      const nextSeg = current.segments[nextIdx];
      if (nextSeg) {
        nextSeg.startedAt = now;
        initSegmentTurnIfNeeded(nextSeg, current.config, now, 0);
      }
      current.currentSegmentIndex = nextIdx;
      persistActiveSession(current);
      audioCue.playSplitCue();
      return;
    }

    current.status = 'completed';
    current.endedAt = now;
    stopTicker();
    persistActiveSession(current);
    saveToHistory(structuredClone(current));
    audioCue.playFinishCue();
    await wakeLock.releaseWakeLock();
  }

  async function abortWorkout(): Promise<void> {
    stopTicker();
    session.value = null;
    persistActiveSession(null);
    await wakeLock.releaseWakeLock();
  }

  function resetToSetup(): void {
    stopTicker();
    session.value = null;
    persistActiveSession(null);
  }

  onUnmounted(() => {
    stopTicker();
  });

  return {
    session,
    history,
    currentSegment,
    nextSegment,
    currentTurn,
    totalElapsedMs,
    currentSegmentElapsedMs,
    currentTurnElapsedMs,
    completedSegmentsCount,
    wakeLock,
    audioCue,
    startWorkout,
    switchPartner,
    advanceSegment,
    abortWorkout,
    resetToSetup,
  };
}
