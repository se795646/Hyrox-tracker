/**
 * 將毫秒格式化為 MM:SS.d 或 HH:MM:SS.d
 */
export function formatDurationMs(ms: number | null, showTenths = true): string {
  if (ms === null || ms < 0) {
    return showTenths ? '00:00.0' : '00:00';
  }

  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const base = hours > 0 ? `${String(hours).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;

  return showTenths ? `${base}.${tenths}` : base;
}
