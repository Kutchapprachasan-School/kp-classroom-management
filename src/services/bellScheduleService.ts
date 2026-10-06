// src/services/bellScheduleService.ts
// บริการจัดการโครงสร้างเวลาเรียนและระฆังโรงเรียน (School Bell Schedule)
// รองรับการตั้งค่าเวลาเข้าแถว, เวลาเรียน, ระยะเวลาต่อคาบ
// และโหมดการนับคาบพักเที่ยง (Mode A: Numbered Period vs Mode B: Skipped Break Slot)

export interface SchoolBellScheduleConfig {
  morningAssemblyStart: string;     // e.g. '07:45'
  morningAssemblyEnd: string;       // e.g. '08:15'
  firstPeriodStart: string;         // e.g. '08:30'
  periodDurationMinutes: number;    // e.g. 50 (45, 50, 60)
  totalPeriodsPerDay: number;       // e.g. 7 (6, 7, 8, 9)
  lunchBreakMode: 'NUMBERED_PERIOD' | 'SKIPPED_BREAK_SLOT'; // Mode A vs Mode B
  lunchBreakSlot: number;           // e.g. 4 (พักหลังคาบ 4) or 5 (คาบ 5 คือพักเที่ยง)
  lunchDurationMinutes: number;     // e.g. 50 (40, 50, 60)
}

export const BELL_SCHEDULE_STORAGE_KEY = 'kp_school_bell_schedule';
export const BELL_SCHEDULE_UPDATED_EVENT = 'kps-bell-schedule-updated';

export const DEFAULT_BELL_SCHEDULE_CONFIG: SchoolBellScheduleConfig = {
  morningAssemblyStart: '07:45',
  morningAssemblyEnd: '08:15',
  firstPeriodStart: '08:30',
  periodDurationMinutes: 50,
  totalPeriodsPerDay: 7,
  lunchBreakMode: 'NUMBERED_PERIOD',
  lunchBreakSlot: 4,
  lunchDurationMinutes: 50,
};

export interface BellScheduleTimelineItem {
  id: string;
  type: 'ASSEMBLY' | 'PERIOD' | 'LUNCH';
  periodNumber?: number;
  label: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isLunch: boolean;
}

export const addMinutesToTimeStr = (timeStr: string, minutesToAdd: number): string => {
  const [hStr, mStr] = (timeStr || '08:00').split(':');
  const totalMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0) + minutesToAdd;
  const wrappedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrappedMinutes / 60);
  const m = wrappedMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const calculateMinutesDifference = (startTime: string, endTime: string): number => {
  const [sh, sm] = (startTime || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
  const [eh, em] = (endTime || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 1440;
  return diff;
};

export const generateBellScheduleTimeline = (
  config: SchoolBellScheduleConfig
): BellScheduleTimelineItem[] => {
  const items: BellScheduleTimelineItem[] = [];

  // 1. Morning Assembly Slot
  const assemblyDuration = calculateMinutesDifference(
    config.morningAssemblyStart,
    config.morningAssemblyEnd
  );
  items.push({
    id: 'slot-assembly',
    type: 'ASSEMBLY',
    periodNumber: 0,
    label: 'เข้าแถวเคารพธงชาติ & โฮมรูม',
    timeRange: `${config.morningAssemblyStart} - ${config.morningAssemblyEnd}`,
    startTime: config.morningAssemblyStart,
    endTime: config.morningAssemblyEnd,
    durationMinutes: assemblyDuration > 0 ? assemblyDuration : 30,
    isLunch: false,
  });

  // 2. Periods & Lunch Generation
  let currentTime = config.firstPeriodStart;

  if (config.lunchBreakMode === 'NUMBERED_PERIOD') {
    // Mode A: Numbered Period (e.g. Period 4 -> Period 5 Lunch -> Period 6)
    const lunchPeriodNum = Math.min(config.lunchBreakSlot + 1, config.totalPeriodsPerDay);

    for (let p = 1; p <= config.totalPeriodsPerDay; p++) {
      if (p === lunchPeriodNum) {
        const endTime = addMinutesToTimeStr(currentTime, config.lunchDurationMinutes);
        items.push({
          id: `slot-period-${p}-lunch`,
          type: 'LUNCH',
          periodNumber: p,
          label: `คาบที่ ${p} (พักกลางวัน)`,
          timeRange: `${currentTime} - ${endTime}`,
          startTime: currentTime,
          endTime,
          durationMinutes: config.lunchDurationMinutes,
          isLunch: true,
        });
        currentTime = endTime;
      } else {
        const endTime = addMinutesToTimeStr(currentTime, config.periodDurationMinutes);
        items.push({
          id: `slot-period-${p}`,
          type: 'PERIOD',
          periodNumber: p,
          label: `คาบที่ ${p}`,
          timeRange: `${currentTime} - ${endTime}`,
          startTime: currentTime,
          endTime,
          durationMinutes: config.periodDurationMinutes,
          isLunch: false,
        });
        currentTime = endTime;
      }
    }
  } else {
    // Mode B: Skipped Break Slot (e.g. Period 4 -> [Lunch Break] -> Period 5)
    const breakAfter = Math.min(config.lunchBreakSlot, config.totalPeriodsPerDay);

    for (let p = 1; p <= config.totalPeriodsPerDay; p++) {
      const endTime = addMinutesToTimeStr(currentTime, config.periodDurationMinutes);
      items.push({
        id: `slot-period-${p}`,
        type: 'PERIOD',
        periodNumber: p,
        label: `คาบที่ ${p}`,
        timeRange: `${currentTime} - ${endTime}`,
        startTime: currentTime,
        endTime,
        durationMinutes: config.periodDurationMinutes,
        isLunch: false,
      });
      currentTime = endTime;

      if (p === breakAfter) {
        const lunchEndTime = addMinutesToTimeStr(currentTime, config.lunchDurationMinutes);
        items.push({
          id: 'slot-lunch-break',
          type: 'LUNCH',
          periodNumber: undefined,
          label: 'พักกลางวัน (ไม่นับคาบ)',
          timeRange: `${currentTime} - ${lunchEndTime}`,
          startTime: currentTime,
          endTime: lunchEndTime,
          durationMinutes: config.lunchDurationMinutes,
          isLunch: true,
        });
        currentTime = lunchEndTime;
      }
    }
  }

  return items;
};

class BellScheduleService {
  private cache: SchoolBellScheduleConfig | null = null;

  public getConfig(): SchoolBellScheduleConfig {
    if (this.cache) return this.cache;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(BELL_SCHEDULE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.cache = { ...DEFAULT_BELL_SCHEDULE_CONFIG, ...parsed };
          return this.cache!;
        }
      } catch (e) {
        console.warn('Failed to parse bell schedule from localStorage:', e);
      }
    }

    this.cache = { ...DEFAULT_BELL_SCHEDULE_CONFIG };
    return this.cache;
  }

  public saveConfig(config: SchoolBellScheduleConfig): boolean {
    this.cache = { ...config };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(BELL_SCHEDULE_STORAGE_KEY, JSON.stringify(config));
        window.dispatchEvent(new CustomEvent(BELL_SCHEDULE_UPDATED_EVENT, { detail: config }));
        return true;
      } catch (e) {
        console.error('Failed to save bell schedule to localStorage:', e);
        return false;
      }
    }
    return true;
  }

  public resetToDefault(): SchoolBellScheduleConfig {
    this.saveConfig(DEFAULT_BELL_SCHEDULE_CONFIG);
    return { ...DEFAULT_BELL_SCHEDULE_CONFIG };
  }

  public getTimeline(): BellScheduleTimelineItem[] {
    return generateBellScheduleTimeline(this.getConfig());
  }

  public getTeachingPeriods(): BellScheduleTimelineItem[] {
    return this.getTimeline().filter((t) => t.type === 'PERIOD');
  }
}

export const bellScheduleService = new BellScheduleService();
