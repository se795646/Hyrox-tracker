import type { PartnerTurnRecord, SegmentType, WorkoutSession } from '../types/hyrox';

export interface HyroxRoundSummary {
  round: number;
  runMs: number | null;
  stationName: string;
  stationMs: number | null;
  roxzoneMs: number;
  turns: PartnerTurnRecord[];
}

export interface RunAnalytics {
  runDurations: number[];
  bestRunMs: number | null;
  avgRunMs: number | null;
  splitDiffMs: number | null; // 後半程平均 - 前半程平均（正值代表後半變慢）
}

export function sumDurationByType(session: WorkoutSession, type: SegmentType): number {
  return session.segments
    .filter((seg) => seg.type === type)
    .reduce((acc, seg) => acc + (seg.durationMs ?? 0), 0);
}

/**
 * 將分段列表整理為 Hyrox 核心「一趟跑步 + 一個站點」的輪次配對
 */
export function buildRoundSummaries(session: WorkoutSession): HyroxRoundSummary[] {
  const rounds: HyroxRoundSummary[] = [];
  let current: HyroxRoundSummary | null = null;

  for (const seg of session.segments) {
    if (seg.type === 'run') {
      if (current) {
        rounds.push(current);
      }
      current = {
        round: rounds.length + 1,
        runMs: seg.durationMs,
        stationName: '',
        stationMs: null,
        roxzoneMs: 0,
        turns: [],
      };
      continue;
    }

    if (!current) {
      current = {
        round: rounds.length + 1,
        runMs: null,
        stationName: '',
        stationMs: null,
        roxzoneMs: 0,
        turns: [],
      };
    }

    if (seg.type === 'roxzone') {
      current.roxzoneMs += seg.durationMs ?? 0;
    } else if (seg.type === 'station') {
      current.stationName = seg.name.replace(/^\d+\.\s*/, '');
      current.stationMs = seg.durationMs;
      current.turns = seg.turns ?? [];
    }
  }

  if (current) {
    rounds.push(current);
  }

  return rounds;
}

/**
 * 計算 1km 跑步配速穩定度：最快一趟、平均配速、前後半程配速差
 */
export function analyzeRunPacing(session: WorkoutSession): RunAnalytics {
  const runDurations = session.segments
    .filter((seg) => seg.type === 'run' && seg.durationMs !== null)
    .map((seg) => seg.durationMs as number);

  if (runDurations.length === 0) {
    return {
      runDurations: [],
      bestRunMs: null,
      avgRunMs: null,
      splitDiffMs: null,
    };
  }

  const bestRunMs = Math.min(...runDurations);
  const total = runDurations.reduce((a, b) => a + b, 0);
  const avgRunMs = Math.round(total / runDurations.length);

  let splitDiffMs: number | null = null;
  if (runDurations.length >= 2) {
    const mid = Math.floor(runDurations.length / 2);
    const firstHalf = runDurations.slice(0, mid);
    const secondHalf = runDurations.slice(mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    splitDiffMs = Math.round(secondAvg - firstAvg);
  }

  return {
    runDurations,
    bestRunMs,
    avgRunMs,
    splitDiffMs,
  };
}
