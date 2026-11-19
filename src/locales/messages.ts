export type Locale = 'zh-TW' | 'en';

export interface Messages {
  app: {
    langToggleLabel: string;
    langButtonText: string;
  };
  stations: Record<string, string>;
  setup: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    wakeLockWarning: string;
    modeLegend: string;
    fullTitle: string;
    fullDesc: string;
    halfTitle: string;
    halfDesc: string;
    customTitle: string;
    customDesc: string;
    customBoxTitle: string;
    presetAll: string;
    presetOutdoor: string;
    presetRunOnly: string;
    runDistanceLegend: string;
    noRun: string;
    repeatLegend: string;
    roundUnit: string;
    selectStationsLegend: string;
    teamLegend: string;
    soloTitle: string;
    soloDesc: string;
    doublesTitle: string;
    doublesDesc: string;
    divisionLegend: string;
    openTitle: string;
    openDesc: string;
    proTitle: string;
    proDesc: string;
    partnersLegend: string;
    partnerOneLabel: string;
    partnerTwoLabel: string;
    partnerOneDefault: string;
    partnerTwoDefault: string;
    genderLegend: string;
    menTitle: string;
    womenTitle: string;
    roxzoneTitle: string;
    roxzoneDesc: string;
    previewTitle: string;
    previewCountPrefix: string;
    previewCountSuffix: string;
    startBtn: string;
    startBtnDisabled: string;
    historyTitle: string;
    mixedLabel: string;
    openLabel: string;
    proLabel: string;
    menLabel: string;
    womenLabel: string;
    modeFull: string;
    modeHalf: string;
    modeCustom: string;
  };
  active: {
    segmentRun: string;
    segmentRoxzone: string;
    segmentStation: string;
    wakeUnsupported: string;
    wakeActive: string;
    wakeInactive: string;
    muted: string;
    soundOn: string;
    totalTime: string;
    currentPartner: string;
    turnPrefix: string;
    turnLabel: string;
    turnUnit: string;
    nextLabel: string;
    lastSegmentHint: string;
    handoffPrefix: string;
    handoffSub: string;
    finishBtn: string;
    nextBtn: string;
    nextSubPrefix: string;
    abortBtn: string;
    abortConfirmBtn: string;
    cancelBtn: string;
    progressPrefix: string;
    progressSuffix: string;
  };
  summary: {
    finisherBadge: string;
    heading: string;
    clockCaption: string;
    runTotal: string;
    stationTotal: string;
    roxzoneTotal: string;
    paceTitle: string;
    paceBest: string;
    paceAvg: string;
    paceDiff: string;
    matrixTitle: string;
    roundPrefix: string;
    roundSuffix: string;
    runLabel: string;
    runIntervalFallback: string;
    roxSuffix: string;
    turnUnit: string;
    footerTagline: string;
    footerMotto: string;
    downloadPng: string;
    exportCsv: string;
    exportJson: string;
    backToSetup: string;
    kmUnit: string;
    stationsUnit: string;
    customPrefix: string;
    noRun: string;
    runSuffix: string;
    csvHeaders: [string, string, string, string, string, string];
  };
  template: {
    runName: string;
    runTogether: string;
    roxzoneTo: string;
    roxzoneIn: string;
    roxzoneOut: string;
    repsUnit: string;
    sledNote: string;
    wallBallMale: string;
    wallBallFemale: string;
  };
}

export const messages: Record<Locale, Messages> = {
  'zh-TW': {
    app: {
      langToggleLabel: '切換語言為英文',
      langButtonText: 'EN',
    },
    stations: {
      skierg: '滑雪機',
      'sled-push': '推雪橇',
      'sled-pull': '拉雪橇',
      'burpee-broad-jumps': '波比跳遠',
      rowing: '划船機',
      'farmers-carry': '農夫走路',
      'sandbag-lunges': '沙袋弓箭步',
      'wall-balls': '藥球投擲',
    },
    setup: {
      eyebrow: 'HYROX 即時訓練計時',
      heading: '準備開賽設定',
      subtitle: '專為手機當下紀錄設計：時間戳防漂移計時、自動螢幕防休眠、即時本地存檔。',
      wakeLockWarning: '目前瀏覽器不支援螢幕防休眠，建議手動關閉手機自動鎖屏以獲得最佳體驗。',
      modeLegend: '訓練距離 / 模式',
      fullTitle: '全程挑戰',
      fullDesc: '8 × 1km + 8 站',
      halfTitle: '半程模擬',
      halfDesc: '4 × 1km + 4 站',
      customTitle: '自訂課表',
      customDesc: '健身房 / 操場',
      customBoxTitle: '自訂課表設定',
      presetAll: '全選8站',
      presetOutdoor: '戶外操場',
      presetRunOnly: '純間歇跑',
      runDistanceLegend: '每輪跑步距離',
      noRun: '不跑',
      repeatLegend: '重複輪數',
      roundUnit: '輪',
      selectStationsLegend: '勾選站點 (缺器材可取消)',
      teamLegend: '訓練人數',
      soloTitle: '單人訓練',
      soloDesc: '個人獨立完成全部站點',
      doublesTitle: '雙人混雙',
      doublesDesc: '兩人同跑 · 站點換手計時',
      divisionLegend: '單人組別 (自動帶入官方負重)',
      openTitle: '標準組',
      openDesc: '一般賽制負重',
      proTitle: '進階組',
      proDesc: '高負重挑戰',
      partnersLegend: '混雙隊友名稱 (用於站點換手紀錄)',
      partnerOneLabel: '隊友 1',
      partnerTwoLabel: '隊友 2',
      partnerOneDefault: '隊友 1',
      partnerTwoDefault: '隊友 2',
      genderLegend: '性別規格',
      menTitle: '男子組',
      womenTitle: '女子組',
      roxzoneTitle: '獨立紀錄轉換區時間',
      roxzoneDesc: '區分進出站轉換時間（會增加換站點擊次數）',
      previewTitle: '站點規格預覽',
      previewCountPrefix: '共 ',
      previewCountSuffix: ' 段計時',
      startBtn: '開始計時',
      startBtnDisabled: '請至少選擇跑步距離或一個站點',
      historyTitle: '最近完賽紀錄',
      mixedLabel: '混合雙人組',
      openLabel: '標準組',
      proLabel: '進階組',
      menLabel: '男子',
      womenLabel: '女子',
      modeFull: '全程',
      modeHalf: '半程',
      modeCustom: '自訂',
    },
    active: {
      segmentRun: '跑步階段',
      segmentRoxzone: '轉換區',
      segmentStation: '訓練站點',
      wakeUnsupported: '防休眠不支援',
      wakeActive: '防休眠已啟用',
      wakeInactive: '防休眠未啟用 (點此重試)',
      muted: '靜音中',
      soundOn: '音效開啟',
      totalTime: '總計時',
      currentPartner: '目前上場：',
      turnPrefix: '本棒 ',
      turnLabel: '第 ',
      turnUnit: ' 棒',
      nextLabel: '下一段：',
      lastSegmentHint: '最後一段！完成後即結束計時',
      handoffPrefix: '換手輪替 → ',
      handoffSub: '記錄當前棒次時間並切換隊友',
      finishBtn: '完賽並儲存紀錄',
      nextBtn: '完成此段 → 下一站',
      nextSubPrefix: '下一站：',
      abortBtn: '放棄本次訓練',
      abortConfirmBtn: '確定放棄？再點一次清除紀錄',
      cancelBtn: '取消',
      progressPrefix: '第 ',
      progressSuffix: ' 段',
    },
    summary: {
      finisherBadge: 'HYROX 完賽紀錄',
      heading: 'Hyrox 完賽成績總覽',
      clockCaption: '總完賽時間',
      runTotal: '跑步總計',
      stationTotal: '關卡總計',
      roxzoneTotal: '轉換總計',
      paceTitle: '跑步配速走勢',
      paceBest: '最快',
      paceAvg: '平均',
      paceDiff: '後半',
      matrixTitle: '各輪配對明細（跑步 + 關卡）',
      roundPrefix: '第',
      roundSuffix: '輪',
      runLabel: '跑步',
      runIntervalFallback: '跑步間歇',
      roxSuffix: '轉換',
      turnUnit: '棒',
      footerTagline: 'HYROX 即時訓練紀錄',
      footerMotto: '堅持完賽',
      downloadPng: '下載完賽成績卡 (PNG)',
      exportCsv: '匯出 CSV 表格',
      exportJson: '匯出 JSON',
      backToSetup: '返回設定頁面',
      kmUnit: '公里',
      stationsUnit: '站',
      customPrefix: '自訂課表',
      noRun: '純站點',
      runSuffix: '跑步',
      csvHeaders: ['序號', '類型', '分段名稱', '目標規格', '耗時', '混雙換手明細'],
    },
    template: {
      runName: '跑步',
      runTogether: '兩人同跑',
      roxzoneTo: '轉換區 → ',
      roxzoneIn: '進站轉換',
      roxzoneOut: '出站轉換',
      repsUnit: '下',
      sledNote: '含雪橇',
      wallBallMale: '男3.0m',
      wallBallFemale: '女2.7m',
    },
  },
  en: {
    app: {
      langToggleLabel: 'Switch language to Traditional Chinese',
      langButtonText: '繁中',
    },
    stations: {
      skierg: 'SkiErg',
      'sled-push': 'Sled Push',
      'sled-pull': 'Sled Pull',
      'burpee-broad-jumps': 'Burpee Broad Jumps',
      rowing: 'Rowing',
      'farmers-carry': 'Farmers Carry',
      'sandbag-lunges': 'Sandbag Lunges',
      'wall-balls': 'Wall Balls',
    },
    setup: {
      eyebrow: 'HYROX LIVE TRACKER',
      heading: 'Workout Setup',
      subtitle:
        'Built for live phone tracking: drift-free timestamp clock, screen wake lock & instant local save.',
      wakeLockWarning:
        'Wake Lock API is not supported in this browser. Please disable auto-lock manually.',
      modeLegend: 'Distance / Mode',
      fullTitle: 'Full',
      fullDesc: '8 × 1km + 8 Stations',
      halfTitle: 'Half',
      halfDesc: '4 × 1km + 4 Stations',
      customTitle: 'Custom',
      customDesc: 'Gym / Track',
      customBoxTitle: 'Custom Workout Builder',
      presetAll: 'All 8',
      presetOutdoor: 'Outdoor',
      presetRunOnly: 'Run Only',
      runDistanceLegend: 'Run Distance per Round',
      noRun: 'No Run',
      repeatLegend: 'Repeat Rounds',
      roundUnit: 'Rounds',
      selectStationsLegend: 'Select Stations',
      teamLegend: 'Team Format',
      soloTitle: 'Solo',
      soloDesc: 'Individual workout',
      doublesTitle: 'Mixed Doubles',
      doublesDesc: 'Run together · Partner handoff',
      divisionLegend: 'Division (Official Weights)',
      openTitle: 'Open',
      openDesc: 'Standard weights',
      proTitle: 'Pro',
      proDesc: 'Heavy weights',
      partnersLegend: 'Partner Names (for station handoffs)',
      partnerOneLabel: 'Partner 1',
      partnerTwoLabel: 'Partner 2',
      partnerOneDefault: 'Partner 1',
      partnerTwoDefault: 'Partner 2',
      genderLegend: 'Gender Spec',
      menTitle: 'Men',
      womenTitle: 'Women',
      roxzoneTitle: 'Track Roxzone Separately',
      roxzoneDesc: 'Split transition time in & out of stations',
      previewTitle: 'Station Preview',
      previewCountPrefix: '',
      previewCountSuffix: ' segments total',
      startBtn: 'Start Workout',
      startBtnDisabled: 'Select a run distance or at least 1 station',
      historyTitle: 'Recent Workouts',
      mixedLabel: 'Mixed Doubles',
      openLabel: 'Open',
      proLabel: 'Pro',
      menLabel: 'Men',
      womenLabel: 'Women',
      modeFull: 'Full',
      modeHalf: 'Half',
      modeCustom: 'Custom',
    },
    active: {
      segmentRun: 'RUNNING',
      segmentRoxzone: 'ROXZONE',
      segmentStation: 'WORKOUT STATION',
      wakeUnsupported: 'Wake Lock N/A',
      wakeActive: 'Wake Lock ON',
      wakeInactive: 'Wake Lock OFF (Retry)',
      muted: 'Muted',
      soundOn: 'Sound ON',
      totalTime: 'TOTAL TIME',
      currentPartner: 'Active: ',
      turnPrefix: 'Turn ',
      turnLabel: 'Turn #',
      turnUnit: '',
      nextLabel: 'Next: ',
      lastSegmentHint: 'Final segment! Tap below to finish',
      handoffPrefix: 'Switch Partner → ',
      handoffSub: 'Log current turn & handoff',
      finishBtn: 'Finish & Save',
      nextBtn: 'Complete → Next Segment',
      nextSubPrefix: 'Next: ',
      abortBtn: 'Abort Workout',
      abortConfirmBtn: 'Confirm Abort? Tap again to clear',
      cancelBtn: 'Cancel',
      progressPrefix: 'Segment ',
      progressSuffix: '',
    },
    summary: {
      finisherBadge: 'HYROX FINISHER',
      heading: 'Hyrox Workout Summary',
      clockCaption: 'OFFICIAL RACE CLOCK',
      runTotal: 'RUN TOTAL',
      stationTotal: 'STATIONS',
      roxzoneTotal: 'ROXZONE',
      paceTitle: 'RUN PACING TREND',
      paceBest: 'Best',
      paceAvg: 'Avg',
      paceDiff: '2nd Half',
      matrixTitle: 'ROUND MATRIX (RUN + STATION)',
      roundPrefix: 'R',
      roundSuffix: '',
      runLabel: 'RUN',
      runIntervalFallback: 'Run Interval',
      roxSuffix: 'ROX',
      turnUnit: 'turns',
      footerTagline: 'HYROX LIVE TRACKER',
      footerMotto: 'NO EXCUSES.',
      downloadPng: 'Download Finisher Card (PNG)',
      exportCsv: 'Export CSV',
      exportJson: 'Export JSON',
      backToSetup: 'Back to Setup',
      kmUnit: 'KM',
      stationsUnit: 'STATIONS',
      customPrefix: 'CUSTOM',
      noRun: 'NO RUN',
      runSuffix: 'RUN',
      csvHeaders: ['#', 'Type', 'Segment', 'Target Spec', 'Duration', 'Partner Turns'],
    },
    template: {
      runName: 'Run',
      runTogether: 'Run together',
      roxzoneTo: 'Roxzone → ',
      roxzoneIn: 'In-transition',
      roxzoneOut: 'Out-transition',
      repsUnit: 'reps',
      sledNote: 'incl. sled',
      wallBallMale: 'M 3.0m',
      wallBallFemale: 'W 2.7m',
    },
  },
};
