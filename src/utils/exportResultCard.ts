import { messages, type Locale } from '../locales/messages';
import type { WorkoutSession } from '../types/hyrox';
import { formatDurationMs } from './formatTime';
import { analyzeRunPacing, buildRoundSummaries, sumDurationByType } from './hyroxAnalytics';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

function drawHazardStripe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = '#18181b';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#facc15';
  const step = 20;
  for (let i = -h; i < w + h; i += step) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + 10, y + h);
    ctx.lineTo(x + i + 10 + h, y);
    ctx.lineTo(x + i + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function getDivisionLabel(session: WorkoutSession, locale: Locale): string {
  const dict = messages[locale];
  if (session.config.division === 'mixed-doubles') {
    return `${dict.setup.mixedLabel} · ${session.config.partnerNames[0]} & ${session.config.partnerNames[1]}`;
  }
  const genderLabel =
    session.config.gender === 'men' ? dict.setup.menLabel : dict.setup.womenLabel;
  const divLabel =
    session.config.division === 'pro' ? dict.setup.proLabel : dict.setup.openLabel;
  return `${genderLabel} ${divLabel}`;
}

function formatDateLabel(timestamp: number | null): string {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function formatDiffLabel(diffMs: number | null): string {
  if (diffMs === null) {
    return '--';
  }
  const sign = diffMs >= 0 ? '+' : '-';
  return `${sign}${formatDurationMs(Math.abs(diffMs), false)}/km`;
}

/**
 * 產生「Hyrox 賽場計時牆 + 8-Round 配對分析」高解析度 PNG 成績單
 */
export function downloadResultCardImage(
  session: WorkoutSession,
  locale: Locale = 'zh-TW',
): void {
  const dict = messages[locale];
  const scale = 2;
  const width = 640;
  const outerPad = 16;
  const cardX = outerPad;
  const cardY = outerPad;
  const cardW = width - outerPad * 2;
  const innerPad = 24;
  const contentW = cardW - innerPad * 2;

  const isMixed = session.config.division === 'mixed-doubles';
  const rounds = buildRoundSummaries(session);
  const runStats = analyzeRunPacing(session);

  const stripeH = 10;
  const headerH = 56;
  const heroH = 148;
  const tripleStatsH = 74;
  const paceCardH = 112;
  const partnerH = isMixed ? 72 : 0;
  const roundRowH = 44;
  const roundsBlockH = 38 + rounds.length * roundRowH + 12;
  const footerH = 46;

  const cardH =
    stripeH +
    headerH +
    heroH +
    tripleStatsH +
    paceCardH +
    partnerH +
    roundsBlockH +
    footerH +
    stripeH +
    48;
  const height = cardH + outerPad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.scale(scale, scale);

  // 背景
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);

  // 主卡片外框
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.fillStyle = '#111113';
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.clip();

  // 頂部工業風賽道警示條
  drawHazardStripe(ctx, cardX, cardY, cardW, stripeH);

  let y = cardY + stripeH + 18;

  // Header：完賽徽章 + 距離日期
  drawRoundedRect(ctx, cardX + innerPad, y, 134, 26, 4);
  ctx.fillStyle = '#facc15';
  ctx.fill();
  ctx.fillStyle = '#09090b';
  ctx.font = '900 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(dict.summary.finisherBadge, cardX + innerPad + 12, y + 17);

  let kmText = `8 ${dict.summary.kmUnit} + 8 ${dict.summary.stationsUnit}`;
  if (session.config.mode === 'half') {
    kmText = `4 ${dict.summary.kmUnit} + 4 ${dict.summary.stationsUnit}`;
  } else if (session.config.mode === 'custom') {
    const runLabel =
      session.config.runDistanceMeters > 0
        ? `${session.config.runDistanceMeters}m ${dict.summary.runSuffix}`
        : dict.summary.noRun;
    const stationCount = session.segments.filter((s) => s.type === 'station').length;
    kmText = `${dict.summary.customPrefix} · ${runLabel} · ${stationCount} ${dict.summary.stationsUnit}`;
  }
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '700 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${kmText}  ·  ${formatDateLabel(session.startedAt)}`, cardX + cardW - innerPad, y + 17);
  ctx.textAlign = 'left';

  y += headerH - 12;

  // 組別與超大電子計時總時間
  ctx.fillStyle = '#d4d4d8';
  ctx.font = '700 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(getDivisionLabel(session, locale), cardX + innerPad, y + 12);

  const totalMs =
    session.startedAt !== null && session.endedAt !== null
      ? Math.max(0, session.endedAt - session.startedAt)
      : 0;
  ctx.fillStyle = '#f4f4f0';
  ctx.font = '900 78px system-ui, -apple-system, sans-serif';
  ctx.fillText(formatDurationMs(totalMs, true), cardX + innerPad, y + 90);

  ctx.fillStyle = '#71717a';
  ctx.font = '700 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(dict.summary.clockCaption, cardX + innerPad, y + 114);

  y += heroH - 10;

  // 三格核心數據（跑步 / 關卡 / 轉換）
  const runMs = sumDurationByType(session, 'run');
  const stationMs = sumDurationByType(session, 'station');
  const roxzoneMs = sumDurationByType(session, 'roxzone');

  const boxGap = 10;
  const boxW = (contentW - boxGap * 2) / 3;
  const statBoxes = [
    { label: dict.summary.runTotal, value: formatDurationMs(runMs, false), accent: '#38bdf8' },
    {
      label: dict.summary.stationTotal,
      value: formatDurationMs(stationMs, false),
      accent: '#facc15',
    },
    {
      label: dict.summary.roxzoneTotal,
      value: formatDurationMs(roxzoneMs, false),
      accent: '#a78bfa',
    },
  ];

  statBoxes.forEach((box, idx) => {
    const bx = cardX + innerPad + idx * (boxW + boxGap);
    drawRoundedRect(ctx, bx, y, boxW, 64, 10);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = box.accent;
    ctx.fillRect(bx + 12, y + 12, 18, 3);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(box.label, bx + 12, y + 30);

    ctx.fillStyle = '#f4f4f0';
    ctx.font = '800 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(box.value, bx + 12, y + 54);
  });

  y += tripleStatsH + 8;

  // 跑步配速走勢卡 (Run Pace Trend)
  drawRoundedRect(ctx, cardX + innerPad, y, contentW, paceCardH - 12, 10);
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(dict.summary.paceTitle, cardX + innerPad + 14, y + 22);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `${dict.summary.paceBest} ${formatDurationMs(runStats.bestRunMs, false)}  ·  ${dict.summary.paceAvg} ${formatDurationMs(runStats.avgRunMs, false)}  ·  ${dict.summary.paceDiff} ${formatDiffLabel(runStats.splitDiffMs)}`,
    cardX + cardW - innerPad - 14,
    y + 22,
  );
  ctx.textAlign = 'left';

  if (runStats.runDurations.length > 0) {
    const maxRun = Math.max(...runStats.runDurations, 1);
    const barAreaX = cardX + innerPad + 14;
    const barAreaW = contentW - 28;
    const barGap = 8;
    const rBarW = (barAreaW - barGap * (runStats.runDurations.length - 1)) / runStats.runDurations.length;
    const maxBarH = 38;
    const barBottom = y + 76;

    runStats.runDurations.forEach((ms, i) => {
      const h = Math.max(10, Math.round((ms / maxRun) * maxBarH));
      const rx = barAreaX + i * (rBarW + barGap);
      const ry = barBottom - h;
      const isBest = ms === runStats.bestRunMs;

      drawRoundedRect(ctx, rx, ry, rBarW, h, 3);
      ctx.fillStyle = isBest ? '#facc15' : '#2563eb';
      ctx.fill();

      ctx.fillStyle = '#71717a';
      ctx.font = '600 10px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`R${i + 1}`, rx + rBarW / 2, barBottom + 14);
    });
    ctx.textAlign = 'left';
  }

  y += paceCardH;

  // 混雙分工進度條
  if (isMixed) {
    const totals: [number, number] = [0, 0];
    const counts: [number, number] = [0, 0];
    for (const seg of session.segments) {
      for (const turn of seg.turns ?? []) {
        totals[turn.partnerIndex] += turn.durationMs ?? 0;
        counts[turn.partnerIndex] += 1;
      }
    }
    const sumPartner = totals[0] + totals[1];
    const p1Ratio = sumPartner > 0 ? totals[0] / sumPartner : 0.5;

    drawRoundedRect(ctx, cardX + innerPad, y, contentW, 58, 10);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `${session.config.partnerNames[0]}  ${formatDurationMs(totals[0], false)} (${counts[0]} ${dict.summary.turnUnit})`,
      cardX + innerPad + 14,
      y + 22,
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = '#f472b6';
    ctx.fillText(
      `${session.config.partnerNames[1]}  ${formatDurationMs(totals[1], false)} (${counts[1]} ${dict.summary.turnUnit})`,
      cardX + cardW - innerPad - 14,
      y + 22,
    );
    ctx.textAlign = 'left';

    const pBarX = cardX + innerPad + 14;
    const pBarY = y + 34;
    const pBarW = contentW - 28;
    drawRoundedRect(ctx, pBarX, pBarY, pBarW, 10, 5);
    ctx.fillStyle = '#f472b6';
    ctx.fill();
    drawRoundedRect(ctx, pBarX, pBarY, Math.max(10, pBarW * p1Ratio), 10, 5);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    y += partnerH;
  }

  // 8-Round 賽道配對表 (R1 ~ R8)
  ctx.fillStyle = '#f4f4f0';
  ctx.font = '800 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(dict.summary.matrixTitle, cardX + innerPad, y + 14);
  y += 26;

  drawRoundedRect(ctx, cardX + innerPad, y, contentW, rounds.length * roundRowH + 10, 10);
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.stroke();

  rounds.forEach((item, idx) => {
    const ry = y + 5 + idx * roundRowH;
    const midY = ry + 27;

    // Round Badge
    drawRoundedRect(ctx, cardX + innerPad + 12, ry + 10, 40, 24, 5);
    ctx.fillStyle = '#27272a';
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.font = '800 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${dict.summary.roundPrefix}${item.round}${dict.summary.roundSuffix}`,
      cardX + innerPad + 32,
      midY - 1,
    );
    ctx.textAlign = 'left';

    // Run 時間
    if (item.runMs !== null) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `${dict.summary.runLabel} ${formatDurationMs(item.runMs, false)}`,
        cardX + innerPad + 62,
        midY,
      );
    }

    // Roxzone 若有則顯示小字
    if (item.roxzoneMs > 0) {
      ctx.fillStyle = '#a78bfa';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `+${formatDurationMs(item.roxzoneMs, false)} ${dict.summary.roxSuffix}`,
        cardX + innerPad + 154,
        midY,
      );
    }

    // Station 名稱與時間
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e4e4e7';
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      item.stationName || dict.summary.runIntervalFallback,
      cardX + cardW - innerPad - (item.stationMs !== null ? 82 : 14),
      midY,
    );

    if (item.stationMs !== null) {
      ctx.fillStyle = '#facc15';
      ctx.font = '800 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(formatDurationMs(item.stationMs, false), cardX + cardW - innerPad - 14, midY);
    }
    ctx.textAlign = 'left';

    if (idx < rounds.length - 1) {
      ctx.strokeStyle = '#27272a';
      ctx.beginPath();
      ctx.moveTo(cardX + innerPad + 12, ry + roundRowH);
      ctx.lineTo(cardX + cardW - innerPad - 12, ry + roundRowH);
      ctx.stroke();
    }
  });

  y += rounds.length * roundRowH + 24;

  // Footer
  ctx.fillStyle = '#71717a';
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(dict.summary.footerTagline, cardX + innerPad, y + 14);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#facc15';
  ctx.font = '900 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(dict.summary.footerMotto, cardX + cardW - innerPad, y + 14);
  ctx.textAlign = 'left';

  // 底部工業風賽道警示條
  drawHazardStripe(ctx, cardX, cardY + cardH - stripeH, cardW, stripeH);
  ctx.restore();

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.id}-hyrox-card.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 匯出含 UTF-8 BOM 的 CSV 試算表，確保 Excel 開啟中文不亂碼
 */
export function downloadCsvReport(session: WorkoutSession, locale: Locale = 'zh-TW'): void {
  const headers = messages[locale].summary.csvHeaders;
  const rows = session.segments.map((seg) => {
    const turnText =
      seg.turns && seg.turns.length > 0
        ? seg.turns
            .map((t) => `${t.partnerName} (${formatDurationMs(t.durationMs, false)})`)
            .join(' -> ')
        : '';

    return [
      String(seg.order),
      seg.type,
      seg.name,
      seg.targetSpec,
      formatDurationMs(seg.durationMs, true),
      turnText,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  const csvContent = `\uFEFF${[headers.join(','), ...rows].join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${session.id}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
