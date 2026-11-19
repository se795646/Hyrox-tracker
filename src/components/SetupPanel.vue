<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useI18n } from '../composables/useI18n';
import { buildHyroxSegments, HYROX_STATIONS } from '../data/hyroxTemplates';
import type { HyroxConfig, WorkoutSession } from '../types/hyrox';
import { formatDurationMs } from '../utils/formatTime';

const props = defineProps<{
  history: WorkoutSession[];
  wakeLockSupported: boolean;
}>();

const emit = defineEmits<{
  start: [config: HyroxConfig];
}>();

const { locale, t, toggleLocale } = useI18n();

const config = reactive<HyroxConfig>({
  mode: 'full',
  division: 'mixed-doubles',
  gender: 'men',
  includeRoxzone: false,
  partnerNames: ['', ''],
  runDistanceMeters: 1000,
  selectedStationKeys: HYROX_STATIONS.map((s) => s.key),
  customRepeatCount: 1,
});

const isDoubles = computed(() => config.division === 'mixed-doubles');
const isCustomMode = computed(() => config.mode === 'custom');

function selectTeamType(type: 'solo' | 'doubles'): void {
  config.division = type === 'doubles' ? 'mixed-doubles' : 'open';
}

function toggleStation(key: string): void {
  const idx = config.selectedStationKeys.indexOf(key);
  if (idx >= 0) {
    config.selectedStationKeys.splice(idx, 1);
  } else {
    config.selectedStationKeys.push(key);
  }
}

function applyPreset(preset: 'all' | 'outdoor' | 'run-only'): void {
  if (preset === 'all') {
    config.selectedStationKeys = HYROX_STATIONS.map((s) => s.key);
    if (config.runDistanceMeters === 0) {
      config.runDistanceMeters = 1000;
    }
    config.customRepeatCount = 1;
    return;
  }
  if (preset === 'outdoor') {
    config.selectedStationKeys = HYROX_STATIONS.filter((s) => s.outdoorFriendly).map((s) => s.key);
    config.runDistanceMeters = 400;
    config.customRepeatCount = 1;
    return;
  }
  config.selectedStationKeys = [];
  if (config.runDistanceMeters === 0) {
    config.runDistanceMeters = 400;
  }
  config.customRepeatCount = 4;
}

const previewSegments = computed(() => buildHyroxSegments(config, locale.value));

const stationPreviewList = computed(() =>
  previewSegments.value.filter((seg) => seg.type === 'station'),
);

const canStart = computed(() => previewSegments.value.length > 0);

function formatHistoryTitle(item: WorkoutSession): string {
  const modeLabel =
    item.config.mode === 'full'
      ? t.value.setup.modeFull
      : item.config.mode === 'half'
        ? t.value.setup.modeHalf
        : t.value.setup.modeCustom;

  if (item.config.division === 'mixed-doubles') {
    return `${modeLabel} · ${t.value.setup.mixedLabel}`;
  }
  const genderLabel =
    item.config.gender === 'men' ? t.value.setup.menLabel : t.value.setup.womenLabel;
  const divLabel =
    item.config.division === 'pro' ? t.value.setup.proLabel : t.value.setup.openLabel;
  return `${modeLabel} · ${genderLabel} ${divLabel}`;
}

function handleStart(): void {
  if (!canStart.value) {
    return;
  }
  const p1 = config.partnerNames[0].trim() || t.value.setup.partnerOneDefault;
  const p2 = config.partnerNames[1].trim() || t.value.setup.partnerTwoDefault;
  emit('start', {
    ...config,
    selectedStationKeys: [...config.selectedStationKeys],
    partnerNames: [p1, p2],
  });
}
</script>

<template>
  <section class="setup-panel" aria-labelledby="setup-heading">
    <header class="panel-header">
      <div class="header-top-row">
        <p class="eyebrow">{{ t.setup.eyebrow }}</p>
        <button
          type="button"
          class="lang-btn"
          :aria-label="t.app.langToggleLabel"
          @click="toggleLocale"
        >
          {{ t.app.langButtonText }}
        </button>
      </div>
      <h1 id="setup-heading">{{ t.setup.heading }}</h1>
      <p class="subtitle">{{ t.setup.subtitle }}</p>
    </header>

    <div v-if="!props.wakeLockSupported" class="notice-banner" role="status">
      {{ t.setup.wakeLockWarning }}
    </div>

    <form class="config-form" @submit.prevent="handleStart">
      <fieldset class="option-group">
        <legend>{{ t.setup.modeLegend }}</legend>
        <div class="segmented-grid three-cols">
          <button
            type="button"
            class="seg-btn"
            :class="{ active: config.mode === 'full' }"
            :aria-pressed="config.mode === 'full'"
            @click="config.mode = 'full'"
          >
            <span class="seg-title">{{ t.setup.fullTitle }}</span>
            <span class="seg-desc">{{ t.setup.fullDesc }}</span>
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ active: config.mode === 'half' }"
            :aria-pressed="config.mode === 'half'"
            @click="config.mode = 'half'"
          >
            <span class="seg-title">{{ t.setup.halfTitle }}</span>
            <span class="seg-desc">{{ t.setup.halfDesc }}</span>
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ active: config.mode === 'custom' }"
            :aria-pressed="config.mode === 'custom'"
            @click="config.mode = 'custom'"
          >
            <span class="seg-title">{{ t.setup.customTitle }}</span>
            <span class="seg-desc">{{ t.setup.customDesc }}</span>
          </button>
        </div>
      </fieldset>

      <div v-if="isCustomMode" class="custom-box" :aria-label="t.setup.customBoxTitle">
        <div class="custom-header">
          <span>{{ t.setup.customBoxTitle }}</span>
          <div class="preset-row">
            <button type="button" class="preset-btn" @click="applyPreset('all')">
              {{ t.setup.presetAll }}
            </button>
            <button type="button" class="preset-btn" @click="applyPreset('outdoor')">
              {{ t.setup.presetOutdoor }}
            </button>
            <button type="button" class="preset-btn" @click="applyPreset('run-only')">
              {{ t.setup.presetRunOnly }}
            </button>
          </div>
        </div>

        <fieldset class="option-group">
          <legend>{{ t.setup.runDistanceLegend }}</legend>
          <div class="segmented-grid four-cols">
            <button
              v-for="dist in [0, 400, 800, 1000]"
              :key="dist"
              type="button"
              class="mini-btn"
              :class="{ active: config.runDistanceMeters === dist }"
              :aria-pressed="config.runDistanceMeters === dist"
              @click="config.runDistanceMeters = dist"
            >
              {{ dist === 0 ? t.setup.noRun : dist === 1000 ? '1km' : `${dist}m` }}
            </button>
          </div>
        </fieldset>

        <fieldset class="option-group">
          <legend>{{ t.setup.repeatLegend }}</legend>
          <div class="segmented-grid four-cols">
            <button
              v-for="count in [1, 2, 3, 4]"
              :key="count"
              type="button"
              class="mini-btn"
              :class="{ active: config.customRepeatCount === count }"
              :aria-pressed="config.customRepeatCount === count"
              @click="config.customRepeatCount = count"
            >
              {{ count }} {{ t.setup.roundUnit }}
            </button>
          </div>
        </fieldset>

        <fieldset class="option-group">
          <legend>{{ t.setup.selectStationsLegend }}</legend>
          <div class="station-chip-grid">
            <button
              v-for="st in HYROX_STATIONS"
              :key="st.key"
              type="button"
              class="station-chip"
              :class="{ active: config.selectedStationKeys.includes(st.key) }"
              :aria-pressed="config.selectedStationKeys.includes(st.key)"
              @click="toggleStation(st.key)"
            >
              {{ t.stations[st.key] ?? st.key }}
            </button>
          </div>
        </fieldset>
      </div>

      <fieldset class="option-group">
        <legend>{{ t.setup.teamLegend }}</legend>
        <div class="segmented-grid">
          <button
            type="button"
            class="seg-btn"
            :class="{ active: !isDoubles }"
            :aria-pressed="!isDoubles"
            @click="selectTeamType('solo')"
          >
            <span class="seg-title">{{ t.setup.soloTitle }}</span>
            <span class="seg-desc">{{ t.setup.soloDesc }}</span>
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ active: isDoubles }"
            :aria-pressed="isDoubles"
            @click="selectTeamType('doubles')"
          >
            <span class="seg-title">{{ t.setup.doublesTitle }}</span>
            <span class="seg-desc">{{ t.setup.doublesDesc }}</span>
          </button>
        </div>
      </fieldset>

      <fieldset v-if="!isDoubles" class="option-group">
        <legend>{{ t.setup.divisionLegend }}</legend>
        <div class="segmented-grid">
          <button
            type="button"
            class="seg-btn"
            :class="{ active: config.division === 'open' }"
            :aria-pressed="config.division === 'open'"
            @click="config.division = 'open'"
          >
            <span class="seg-title">{{ t.setup.openTitle }}</span>
            <span class="seg-desc">{{ t.setup.openDesc }}</span>
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ active: config.division === 'pro' }"
            :aria-pressed="config.division === 'pro'"
            @click="config.division = 'pro'"
          >
            <span class="seg-title">{{ t.setup.proTitle }}</span>
            <span class="seg-desc">{{ t.setup.proDesc }}</span>
          </button>
        </div>
      </fieldset>

      <fieldset v-if="isDoubles" class="option-group">
        <legend>{{ t.setup.partnersLegend }}</legend>
        <div class="segmented-grid">
          <div class="partner-input-wrap">
            <label for="partner-one" class="partner-label">{{ t.setup.partnerOneLabel }}</label>
            <input
              id="partner-one"
              v-model="config.partnerNames[0]"
              type="text"
              maxlength="16"
              class="partner-input"
              :placeholder="t.setup.partnerOneDefault"
            />
          </div>
          <div class="partner-input-wrap">
            <label for="partner-two" class="partner-label">{{ t.setup.partnerTwoLabel }}</label>
            <input
              id="partner-two"
              v-model="config.partnerNames[1]"
              type="text"
              maxlength="16"
              class="partner-input"
              :placeholder="t.setup.partnerTwoDefault"
            />
          </div>
        </div>
      </fieldset>

      <fieldset v-else class="option-group">
        <legend>{{ t.setup.genderLegend }}</legend>
        <div class="segmented-grid">
          <button
            type="button"
            class="seg-btn"
            :class="{ active: config.gender === 'men' }"
            :aria-pressed="config.gender === 'men'"
            @click="config.gender = 'men'"
          >
            <span class="seg-title">{{ t.setup.menTitle }}</span>
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ active: config.gender === 'women' }"
            :aria-pressed="config.gender === 'women'"
            @click="config.gender = 'women'"
          >
            <span class="seg-title">{{ t.setup.womenTitle }}</span>
          </button>
        </div>
      </fieldset>

      <div class="toggle-card">
        <div class="toggle-text">
          <label for="roxzone-toggle" class="toggle-title">{{ t.setup.roxzoneTitle }}</label>
          <p class="toggle-desc">{{ t.setup.roxzoneDesc }}</p>
        </div>
        <input
          id="roxzone-toggle"
          v-model="config.includeRoxzone"
          type="checkbox"
          class="toggle-checkbox"
        />
      </div>

      <section class="preview-box" :aria-label="t.setup.previewTitle">
        <div class="preview-header">
          <span>{{ t.setup.previewTitle }}</span>
          <span class="preview-count">
            {{ t.setup.previewCountPrefix }}{{ previewSegments.length
            }}{{ t.setup.previewCountSuffix }}
          </span>
        </div>
        <ul class="station-list">
          <li v-for="station in stationPreviewList" :key="station.id" class="station-item">
            <span class="station-name">{{ station.name }}</span>
            <span class="station-spec">{{ station.targetSpec }}</span>
          </li>
        </ul>
      </section>

      <button
        type="submit"
        class="primary-start-btn"
        :disabled="!canStart"
        :aria-label="t.setup.startBtn"
      >
        {{ canStart ? t.setup.startBtn : t.setup.startBtnDisabled }}
      </button>
    </form>

    <section v-if="props.history.length > 0" class="history-section" :aria-label="t.setup.historyTitle">
      <h2>{{ t.setup.historyTitle }} ({{ props.history.length }})</h2>
      <ul class="history-list">
        <li v-for="item in props.history.slice(0, 5)" :key="item.id" class="history-item">
          <div>
            <strong>{{ formatHistoryTitle(item) }}</strong>
            <span class="history-date">
              {{ item.startedAt ? new Date(item.startedAt).toLocaleString() : '' }}
            </span>
          </div>
          <span class="history-time">
            {{
              item.startedAt && item.endedAt
                ? formatDurationMs(item.endedAt - item.startedAt, false)
                : '--:--'
            }}
          </span>
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.setup-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lang-btn {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  border: 1px solid #3f3f46;
  background: #18181b;
  color: #e4e4e7;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #facc15;
}

h1 {
  margin: 0;
  font-size: 1.75rem;
  line-height: 1.2;
}

.subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #a1a1aa;
}

.notice-banner {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: rgba(250, 204, 21, 0.12);
  border: 1px solid rgba(250, 204, 21, 0.4);
  color: #fde047;
  font-size: 0.85rem;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-group {
  margin: 0;
  padding: 0;
  border: none;
}

.option-group legend {
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #d4d4d8;
}

.segmented-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
}

.segmented-grid.three-cols {
  grid-template-columns: repeat(3, 1fr);
}

.segmented-grid.four-cols {
  grid-template-columns: repeat(4, 1fr);
}

.custom-box {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  background: #141417;
  border: 1.5px solid #27272a;
}

.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
  font-weight: 700;
  color: #facc15;
}

.preset-row {
  display: flex;
  gap: 0.35rem;
}

.preset-btn {
  padding: 0.25rem 0.55rem;
  border-radius: 0.4rem;
  border: 1px solid #3f3f46;
  background: #18181b;
  color: #d4d4d8;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}

.mini-btn {
  padding: 0.55rem 0.4rem;
  border-radius: 0.55rem;
  border: 1.5px solid #27272a;
  background: #18181b;
  color: #e4e4e7;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.mini-btn.active {
  border-color: #facc15;
  background: rgba(250, 204, 21, 0.14);
  color: #facc15;
}

.station-chip-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.45rem;
}

.station-chip {
  padding: 0.55rem 0.65rem;
  border-radius: 0.55rem;
  border: 1.5px solid #27272a;
  background: #18181b;
  color: #a1a1aa;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.station-chip.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.14);
  color: #e0f2fe;
}

.partner-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.75rem;
  background: #18181b;
  border: 1.5px solid #27272a;
}

.partner-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #a1a1aa;
}

.partner-input {
  width: 100%;
  border: none;
  background: transparent;
  color: #f4f4f5;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0;
}

.partner-input:focus {
  outline: none;
}

.seg-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  border: 1.5px solid #27272a;
  background: #18181b;
  color: #f4f4f5;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background-color 0.15s;
}

.seg-btn.active {
  border-color: #facc15;
  background: rgba(250, 204, 21, 0.12);
}

.seg-title {
  font-weight: 700;
  font-size: 0.98rem;
}

.seg-desc {
  font-size: 0.78rem;
  color: #a1a1aa;
}

.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  background: #18181b;
  border: 1.5px solid #27272a;
}

.toggle-title {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
}

.toggle-desc {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: #a1a1aa;
}

.toggle-checkbox {
  width: 1.4rem;
  height: 1.4rem;
  accent-color: #facc15;
  cursor: pointer;
}

.preview-box {
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  background: #18181b;
  border: 1px solid #27272a;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.65rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #d4d4d8;
}

.preview-count {
  color: #facc15;
}

.station-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.station-item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.station-name {
  color: #f4f4f5;
}

.station-spec {
  color: #a1a1aa;
  font-variant-numeric: tabular-nums;
}

.primary-start-btn {
  width: 100%;
  padding: 1.15rem;
  border: none;
  border-radius: 0.9rem;
  background: #facc15;
  color: #09090b;
  font-size: 1.15rem;
  font-weight: 800;
  cursor: pointer;
}

.primary-start-btn:active {
  transform: scale(0.99);
}

.primary-start-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.history-section {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #27272a;
}

.history-section h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.9rem;
  border-radius: 0.75rem;
  background: #18181b;
  border: 1px solid #27272a;
}

.history-item strong {
  display: block;
  font-size: 0.9rem;
}

.history-date {
  font-size: 0.75rem;
  color: #a1a1aa;
}

.history-time {
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #facc15;
}
</style>
