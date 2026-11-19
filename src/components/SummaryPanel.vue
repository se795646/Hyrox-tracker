<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '../composables/useI18n';
import type { WorkoutSession } from '../types/hyrox';
import { downloadCsvReport, downloadResultCardImage } from '../utils/exportResultCard';
import { formatDurationMs } from '../utils/formatTime';
import { analyzeRunPacing, buildRoundSummaries, sumDurationByType } from '../utils/hyroxAnalytics';

const { locale, t } = useI18n();

const props = defineProps<{
  session: WorkoutSession;
}>();

const emit = defineEmits<{
  done: [];
}>();

const totalMs = computed(() => {
  if (props.session.startedAt === null || props.session.endedAt === null) {
    return 0;
  }
  return Math.max(0, props.session.endedAt - props.session.startedAt);
});

const totalRunMs = computed(() => sumDurationByType(props.session, 'run'));
const totalStationMs = computed(() => sumDurationByType(props.session, 'station'));
const totalRoxzoneMs = computed(() => sumDurationByType(props.session, 'roxzone'));

const rounds = computed(() => buildRoundSummaries(props.session));
const runAnalytics = computed(() => analyzeRunPacing(props.session));

const maxRunMs = computed(() => Math.max(...runAnalytics.value.runDurations, 1));

const isMixedDoubles = computed(() => props.session.config.division === 'mixed-doubles');

const divisionTitle = computed(() => {
  if (isMixedDoubles.value) {
    return `${t.value.setup.mixedLabel} · ${props.session.config.partnerNames[0]} & ${props.session.config.partnerNames[1]}`;
  }
  const genderLabel =
    props.session.config.gender === 'men' ? t.value.setup.menLabel : t.value.setup.womenLabel;
  const divLabel =
    props.session.config.division === 'pro' ? t.value.setup.proLabel : t.value.setup.openLabel;
  return `${genderLabel} ${divLabel}`;
});

const distanceTag = computed(() => {
  if (props.session.config.mode === 'full') {
    return `8 ${t.value.summary.kmUnit} + 8 ${t.value.summary.stationsUnit}`;
  }
  if (props.session.config.mode === 'half') {
    return `4 ${t.value.summary.kmUnit} + 4 ${t.value.summary.stationsUnit}`;
  }
  const runLabel =
    props.session.config.runDistanceMeters > 0
      ? `${props.session.config.runDistanceMeters}m ${t.value.summary.runSuffix}`
      : t.value.summary.noRun;
  const stationCount = props.session.segments.filter((s) => s.type === 'station').length;
  return `${t.value.summary.customPrefix} · ${runLabel} · ${stationCount} ${t.value.summary.stationsUnit}`;
});

const dateLabel = computed(() => {
  if (!props.session.startedAt) {
    return '';
  }
  const date = new Date(props.session.startedAt);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
});

const splitDiffLabel = computed(() => {
  const diff = runAnalytics.value.splitDiffMs;
  if (diff === null) {
    return '--';
  }
  const sign = diff >= 0 ? '+' : '-';
  return `${sign}${formatDurationMs(Math.abs(diff), false)}/km`;
});

const partnerStats = computed(() => {
  if (!isMixedDoubles.value) {
    return [];
  }
  const totals: [number, number] = [0, 0];
  const counts: [number, number] = [0, 0];

  for (const seg of props.session.segments) {
    for (const turn of seg.turns ?? []) {
      totals[turn.partnerIndex] += turn.durationMs ?? 0;
      counts[turn.partnerIndex] += 1;
    }
  }

  const totalPartnerMs = totals[0] + totals[1];
  return {
    p1: {
      name: props.session.config.partnerNames[0],
      durationMs: totals[0],
      turns: counts[0],
      percent: totalPartnerMs > 0 ? Math.round((totals[0] / totalPartnerMs) * 100) : 50,
    },
    p2: {
      name: props.session.config.partnerNames[1],
      durationMs: totals[1],
      turns: counts[1],
      percent: totalPartnerMs > 0 ? Math.round((totals[1] / totalPartnerMs) * 100) : 50,
    },
  };
});

function getRunBarHeight(ms: number): string {
  const pct = Math.max(22, Math.round((ms / maxRunMs.value) * 100));
  return `${Math.min(100, pct)}%`;
}

function exportJson(): void {
  const blob = new Blob([JSON.stringify(props.session, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.session.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="summary-panel" aria-labelledby="summary-heading">
    <article class="race-arch-card">
      <div class="hazard-stripe" aria-hidden="true"></div>

      <div class="card-inner">
        <header class="arch-header">
          <span class="finisher-badge">{{ t.summary.finisherBadge }}</span>
          <span class="arch-meta">{{ distanceTag }} · {{ dateLabel }}</span>
        </header>

        <div class="hero-block">
          <p class="division-text">{{ divisionTitle }}</p>
          <h1 id="summary-heading" class="sr-only">{{ t.summary.heading }}</h1>
          <div class="total-clock">{{ formatDurationMs(totalMs, true) }}</div>
          <span class="clock-caption">{{ t.summary.clockCaption }}</span>
        </div>

        <div class="triple-grid" :aria-label="t.summary.clockCaption">
          <div class="metric-box">
            <span class="accent-line accent-run" aria-hidden="true"></span>
            <span class="metric-label">{{ t.summary.runTotal }}</span>
            <strong class="metric-value">{{ formatDurationMs(totalRunMs, false) }}</strong>
          </div>
          <div class="metric-box">
            <span class="accent-line accent-station" aria-hidden="true"></span>
            <span class="metric-label">{{ t.summary.stationTotal }}</span>
            <strong class="metric-value">{{ formatDurationMs(totalStationMs, false) }}</strong>
          </div>
          <div class="metric-box">
            <span class="accent-line accent-rox" aria-hidden="true"></span>
            <span class="metric-label">{{ t.summary.roxzoneTotal }}</span>
            <strong class="metric-value">{{ formatDurationMs(totalRoxzoneMs, false) }}</strong>
          </div>
        </div>

        <section class="pace-card" :aria-label="t.summary.paceTitle">
          <div class="pace-header">
            <span class="pace-title">{{ t.summary.paceTitle }}</span>
            <span class="pace-stats">
              {{ t.summary.paceBest }} {{ formatDurationMs(runAnalytics.bestRunMs, false) }} ·
              {{ t.summary.paceAvg }} {{ formatDurationMs(runAnalytics.avgRunMs, false) }} ·
              {{ t.summary.paceDiff }} {{ splitDiffLabel }}
            </span>
          </div>
          <div class="pace-bars" aria-hidden="true">
            <div
              v-for="(ms, idx) in runAnalytics.runDurations"
              :key="`run-${idx}`"
              class="pace-col"
            >
              <div class="pace-bar-wrap">
                <div
                  class="pace-bar"
                  :class="{ 'is-best': ms === runAnalytics.bestRunMs }"
                  :style="{ height: getRunBarHeight(ms) }"
                ></div>
              </div>
              <span class="pace-round">{{ idx + 1 }}</span>
            </div>
          </div>
        </section>

        <section
          v-if="isMixedDoubles && !Array.isArray(partnerStats)"
          class="partner-card"
          :aria-label="t.setup.partnersLegend"
        >
          <div class="partner-labels">
            <span class="p1-text">
              {{ partnerStats.p1.name }} {{ formatDurationMs(partnerStats.p1.durationMs, false) }} ({{
                partnerStats.p1.turns
              }}{{ t.summary.turnUnit }})
            </span>
            <span class="p2-text">
              {{ partnerStats.p2.name }} {{ formatDurationMs(partnerStats.p2.durationMs, false) }} ({{
                partnerStats.p2.turns
              }}{{ t.summary.turnUnit }})
            </span>
          </div>
          <div class="partner-bar-track" aria-hidden="true">
            <div class="partner-bar-p1" :style="{ width: `${partnerStats.p1.percent}%` }"></div>
          </div>
        </section>

        <section class="matrix-section" :aria-label="t.summary.matrixTitle">
          <h2 class="matrix-title">{{ t.summary.matrixTitle }}</h2>
          <ul class="round-list">
            <li v-for="item in rounds" :key="item.round" class="round-row">
              <div class="round-main">
                <span class="round-badge">
                  {{ t.summary.roundPrefix }}{{ item.round }}{{ t.summary.roundSuffix }}
                </span>
                <span v-if="item.runMs !== null" class="round-run">
                  {{ t.summary.runLabel }} {{ formatDurationMs(item.runMs, false) }}
                </span>
                <span v-if="item.roxzoneMs > 0" class="round-rox">
                  +{{ formatDurationMs(item.roxzoneMs, false) }}
                </span>
                <span class="round-station-name">
                  {{ item.stationName || t.summary.runIntervalFallback }}
                </span>
                <strong v-if="item.stationMs !== null" class="round-station-time">
                  {{ formatDurationMs(item.stationMs, false) }}
                </strong>
              </div>
              <div v-if="item.turns.length > 0" class="round-turns">
                {{
                  item.turns
                    .map((tItem) => `${tItem.partnerName} ${formatDurationMs(tItem.durationMs, false)}`)
                    .join(' → ')
                }}
              </div>
            </li>
          </ul>
        </section>

        <footer class="arch-footer">
          <span>{{ t.summary.footerTagline }}</span>
          <strong>{{ t.summary.footerMotto }}</strong>
        </footer>
      </div>

      <div class="hazard-stripe" aria-hidden="true"></div>
    </article>

    <div class="summary-actions">
      <button
        type="button"
        class="primary-export-btn"
        :aria-label="t.summary.downloadPng"
        @click="downloadResultCardImage(props.session, locale)"
      >
        {{ t.summary.downloadPng }}
      </button>

      <div class="secondary-actions">
        <button
          type="button"
          class="export-btn"
          :aria-label="t.summary.exportCsv"
          @click="downloadCsvReport(props.session, locale)"
        >
          {{ t.summary.exportCsv }}
        </button>
        <button
          type="button"
          class="export-btn"
          :aria-label="t.summary.exportJson"
          @click="exportJson"
        >
          {{ t.summary.exportJson }}
        </button>
      </div>

      <button type="button" class="done-btn" :aria-label="t.summary.backToSetup" @click="emit('done')">
        {{ t.summary.backToSetup }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.race-arch-card {
  border-radius: 1rem;
  border: 2px solid #27272a;
  background: #111113;
  overflow: hidden;
}

.hazard-stripe {
  height: 8px;
  background: repeating-linear-gradient(
    -45deg,
    #facc15,
    #facc15 10px,
    #18181b 10px,
    #18181b 20px
  );
}

.card-inner {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.arch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.finisher-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 0.25rem;
  background: #facc15;
  color: #09090b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.arch-meta {
  font-size: 0.72rem;
  font-weight: 700;
  color: #a1a1aa;
}

.hero-block {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.division-text {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #d4d4d8;
}

.total-clock {
  font-size: clamp(2.8rem, 13vw, 4rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: #f4f4f0;
}

.clock-caption {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #71717a;
}

.triple-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.metric-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.6rem 0.65rem;
  border-radius: 0.6rem;
  background: #18181b;
  border: 1px solid #27272a;
}

.accent-line {
  width: 1.1rem;
  height: 3px;
}

.accent-run {
  background: #38bdf8;
}

.accent-station {
  background: #facc15;
}

.accent-rox {
  background: #a78bfa;
}

.metric-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: #a1a1aa;
}

.metric-value {
  font-size: 1.05rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #f4f4f0;
}

.pace-card {
  padding: 0.75rem;
  border-radius: 0.65rem;
  background: #18181b;
  border: 1px solid #27272a;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.pace-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.pace-title {
  font-size: 0.72rem;
  font-weight: 800;
  color: #38bdf8;
}

.pace-stats {
  font-size: 0.68rem;
  color: #a1a1aa;
  font-variant-numeric: tabular-nums;
}

.pace-bars {
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  height: 3.1rem;
}

.pace-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  height: 100%;
}

.pace-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.pace-bar {
  width: 100%;
  border-radius: 2px;
  background: #2563eb;
}

.pace-bar.is-best {
  background: #facc15;
}

.pace-round {
  font-size: 0.62rem;
  color: #71717a;
  font-weight: 700;
}

.partner-card {
  padding: 0.65rem 0.75rem;
  border-radius: 0.65rem;
  background: #18181b;
  border: 1px solid rgba(56, 189, 248, 0.35);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.partner-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.74rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.p1-text {
  color: #38bdf8;
}

.p2-text {
  color: #f472b6;
}

.partner-bar-track {
  height: 8px;
  border-radius: 999px;
  background: #f472b6;
  overflow: hidden;
}

.partner-bar-p1 {
  height: 100%;
  background: #38bdf8;
}

.matrix-section {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.matrix-title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 800;
  color: #f4f4f0;
  letter-spacing: 0.04em;
}

.round-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 0.65rem;
  background: #18181b;
  border: 1px solid #27272a;
}

.round-row {
  padding: 0.55rem 0.7rem;
  border-bottom: 1px solid #27272a;
}

.round-row:last-child {
  border-bottom: none;
}

.round-main {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
}

.round-badge {
  padding: 0.12rem 0.38rem;
  border-radius: 0.25rem;
  background: #27272a;
  color: #facc15;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
}

.round-run {
  color: #38bdf8;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.round-rox {
  color: #a78bfa;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.round-station-name {
  margin-left: auto;
  color: #e4e4e7;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.round-station-time {
  color: #facc15;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.round-turns {
  margin-top: 0.25rem;
  padding-left: 2.1rem;
  font-size: 0.7rem;
  color: #93c5fd;
  font-variant-numeric: tabular-nums;
}

.arch-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: #71717a;
  padding-top: 0.2rem;
}

.arch-footer strong {
  color: #facc15;
  letter-spacing: 0.06em;
}

.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.secondary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.primary-export-btn {
  padding: 1rem;
  border: none;
  border-radius: 0.85rem;
  background: #facc15;
  color: #09090b;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
}

.export-btn,
.done-btn {
  padding: 0.85rem;
  border-radius: 0.85rem;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
}

.export-btn {
  border: 1px solid #3f3f46;
  background: #18181b;
  color: #f4f4f5;
}

.done-btn {
  border: 1px solid #27272a;
  background: #27272a;
  color: #e4e4e7;
}
</style>
