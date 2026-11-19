import { messages, type Locale } from '../locales/messages';
import type { DivisionType, GenderType, HyroxConfig, SegmentRecord } from '../types/hyrox';

export interface StationTemplate {
  key: string;
  outdoorFriendly: boolean;
  getSpec: (division: DivisionType, gender: GenderType, locale: Locale) => string;
}

export const HYROX_STATIONS: readonly StationTemplate[] = [
  {
    key: 'skierg',
    outdoorFriendly: false,
    getSpec: () => '1,000m',
  },
  {
    key: 'sled-push',
    outdoorFriendly: false,
    getSpec: (division, gender, locale) => {
      const note = messages[locale].template.sledNote;
      if (division === 'mixed-doubles') {
        return `50m · 152kg (${note})`;
      }
      if (division === 'pro') {
        return gender === 'men' ? `50m · 202kg (${note})` : `50m · 152kg (${note})`;
      }
      return gender === 'men' ? `50m · 152kg (${note})` : `50m · 102kg (${note})`;
    },
  },
  {
    key: 'sled-pull',
    outdoorFriendly: false,
    getSpec: (division, gender, locale) => {
      const note = messages[locale].template.sledNote;
      if (division === 'mixed-doubles') {
        return `50m · 103kg (${note})`;
      }
      if (division === 'pro') {
        return gender === 'men' ? `50m · 153kg (${note})` : `50m · 103kg (${note})`;
      }
      return gender === 'men' ? `50m · 103kg (${note})` : `50m · 78kg (${note})`;
    },
  },
  {
    key: 'burpee-broad-jumps',
    outdoorFriendly: true,
    getSpec: () => '80m',
  },
  {
    key: 'rowing',
    outdoorFriendly: false,
    getSpec: () => '1,000m',
  },
  {
    key: 'farmers-carry',
    outdoorFriendly: true,
    getSpec: (division, gender) => {
      if (division === 'mixed-doubles') {
        return '200m · 2×24kg';
      }
      if (division === 'pro') {
        return gender === 'men' ? '200m · 2×32kg' : '200m · 2×24kg';
      }
      return gender === 'men' ? '200m · 2×24kg' : '200m · 2×16kg';
    },
  },
  {
    key: 'sandbag-lunges',
    outdoorFriendly: true,
    getSpec: (division, gender) => {
      if (division === 'mixed-doubles') {
        return '100m · 20kg';
      }
      if (division === 'pro') {
        return gender === 'men' ? '100m · 30kg' : '100m · 20kg';
      }
      return gender === 'men' ? '100m · 20kg' : '100m · 10kg';
    },
  },
  {
    key: 'wall-balls',
    outdoorFriendly: true,
    getSpec: (division, gender, locale) => {
      const tpl = messages[locale].template;
      if (division === 'mixed-doubles') {
        return `100 ${tpl.repsUnit} · 6kg (${tpl.wallBallMale} / ${tpl.wallBallFemale})`;
      }
      if (division === 'pro') {
        return gender === 'men' ? `100 ${tpl.repsUnit} · 9kg` : `100 ${tpl.repsUnit} · 6kg`;
      }
      return gender === 'men' ? `100 ${tpl.repsUnit} · 6kg` : `100 ${tpl.repsUnit} · 4kg`;
    },
  },
];

function formatDistanceSpec(meters: number, isMixed: boolean, locale: Locale): string {
  const formatted = meters === 1000 ? '1,000m' : `${meters}m`;
  return isMixed ? `${formatted} (${messages[locale].template.runTogether})` : formatted;
}

/**
 * 依據訓練設定與語系產生標準化或自訂的 Hyrox 分段佇列
 */
export function buildHyroxSegments(config: HyroxConfig, locale: Locale = 'zh-TW'): SegmentRecord[] {
  const dict = messages[locale];
  const isMixed = config.division === 'mixed-doubles';
  const runDist = config.mode === 'custom' ? config.runDistanceMeters : 1000;

  let baseStations: StationTemplate[] = [];
  if (config.mode === 'full') {
    baseStations = [...HYROX_STATIONS];
  } else if (config.mode === 'half') {
    baseStations = HYROX_STATIONS.slice(0, 4);
  } else {
    const selectedSet = new Set(config.selectedStationKeys);
    baseStations = HYROX_STATIONS.filter((st) => selectedSet.has(st.key));
  }

  const repeatCount = config.mode === 'custom' ? Math.max(1, config.customRepeatCount) : 1;
  const segments: SegmentRecord[] = [];
  let order = 1;

  if (config.mode === 'custom' && baseStations.length === 0) {
    if (runDist <= 0) {
      return [];
    }
    for (let r = 1; r <= repeatCount; r++) {
      segments.push({
        id: `run-${r}`,
        order: order++,
        type: 'run',
        name: `${dict.template.runName} ${r}`,
        targetSpec: formatDistanceSpec(runDist, isMixed, locale),
        startedAt: null,
        endedAt: null,
        durationMs: null,
      });
    }
    return segments;
  }

  const expandedStations: StationTemplate[] = [];
  for (let r = 0; r < repeatCount; r++) {
    expandedStations.push(...baseStations);
  }

  expandedStations.forEach((station, index) => {
    const roundNumber = index + 1;
    const stationLabel = dict.stations[station.key] ?? station.key;

    if (runDist > 0) {
      segments.push({
        id: `run-${roundNumber}`,
        order: order++,
        type: 'run',
        name: `${dict.template.runName} ${roundNumber}`,
        targetSpec: formatDistanceSpec(runDist, isMixed, locale),
        startedAt: null,
        endedAt: null,
        durationMs: null,
      });
    }

    if (config.includeRoxzone && runDist > 0) {
      segments.push({
        id: `roxzone-in-${roundNumber}`,
        order: order++,
        type: 'roxzone',
        name: `${dict.template.roxzoneTo}${stationLabel}`,
        targetSpec: dict.template.roxzoneIn,
        startedAt: null,
        endedAt: null,
        durationMs: null,
      });
    }

    segments.push({
      id: `station-${station.key}-${roundNumber}`,
      order: order++,
      type: 'station',
      name: `${roundNumber}. ${stationLabel}`,
      targetSpec: station.getSpec(config.division, config.gender, locale),
      startedAt: null,
      endedAt: null,
      durationMs: null,
    });

    const hasNextRun = index < expandedStations.length - 1 && runDist > 0;
    if (config.includeRoxzone && hasNextRun) {
      segments.push({
        id: `roxzone-out-${roundNumber}`,
        order: order++,
        type: 'roxzone',
        name: `${dict.template.roxzoneTo}${dict.template.runName} ${roundNumber + 1}`,
        targetSpec: dict.template.roxzoneOut,
        startedAt: null,
        endedAt: null,
        durationMs: null,
      });
    }
  });

  return segments;
}
