<script setup lang="ts">
import ActiveWorkoutPanel from './components/ActiveWorkoutPanel.vue';
import SetupPanel from './components/SetupPanel.vue';
import SummaryPanel from './components/SummaryPanel.vue';
import { useHyroxTimer } from './composables/useHyroxTimer';

const {
  session,
  history,
  currentSegment,
  nextSegment,
  currentTurn,
  totalElapsedMs,
  currentSegmentElapsedMs,
  currentTurnElapsedMs,
  wakeLock,
  audioCue,
  startWorkout,
  switchPartner,
  advanceSegment,
  abortWorkout,
  resetToSetup,
} = useHyroxTimer();
</script>

<template>
  <main class="app-shell">
    <SetupPanel
      v-if="!session"
      :history="history"
      :wake-lock-supported="wakeLock.isSupported"
      @start="startWorkout"
    />

    <ActiveWorkoutPanel
      v-else-if="session.status === 'running'"
      :session="session"
      :current-segment="currentSegment"
      :next-segment="nextSegment"
      :current-turn="currentTurn"
      :total-elapsed-ms="totalElapsedMs"
      :current-segment-elapsed-ms="currentSegmentElapsedMs"
      :current-turn-elapsed-ms="currentTurnElapsedMs"
      :wake-lock-active="wakeLock.isActive.value"
      :wake-lock-supported="wakeLock.isSupported"
      :wake-lock-error="wakeLock.errorMessage.value"
      :is-muted="audioCue.isMuted.value"
      @advance="advanceSegment"
      @switch-partner="switchPartner"
      @abort="abortWorkout"
      @toggle-mute="audioCue.toggleMute"
      @retry-wake-lock="wakeLock.requestWakeLock"
    />

    <SummaryPanel
      v-else-if="session.status === 'completed'"
      :session="session"
      @done="resetToSetup"
    />
  </main>
</template>

<style scoped>
.app-shell {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100dvh;
}
</style>
