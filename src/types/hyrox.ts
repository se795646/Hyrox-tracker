export type DivisionType = 'open' | 'pro' | 'mixed-doubles';
export type GenderType = 'men' | 'women';
export type WorkoutMode = 'full' | 'half' | 'custom';
export type SegmentType = 'run' | 'station' | 'roxzone';
export type WorkoutStatus = 'idle' | 'running' | 'completed';

export interface HyroxConfig {
  mode: WorkoutMode;
  division: DivisionType;
  gender: GenderType;
  includeRoxzone: boolean;
  partnerNames: [string, string];
  runDistanceMeters: number;
  selectedStationKeys: string[];
  customRepeatCount: number;
}

export interface PartnerTurnRecord {
  partnerIndex: 0 | 1;
  partnerName: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number | null;
}

export interface SegmentRecord {
  id: string;
  order: number;
  type: SegmentType;
  name: string;
  targetSpec: string;
  startedAt: number | null;
  endedAt: number | null;
  durationMs: number | null;
  turns?: PartnerTurnRecord[];
}

export interface WorkoutSession {
  id: string;
  config: HyroxConfig;
  status: WorkoutStatus;
  startedAt: number | null;
  endedAt: number | null;
  currentSegmentIndex: number;
  segments: SegmentRecord[];
}
